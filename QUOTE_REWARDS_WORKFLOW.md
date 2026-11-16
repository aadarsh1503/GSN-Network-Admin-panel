# GSN Network — Quote Rewards Workflow
## Reward Coupons & Credits for Approved & Processed Quotes

> **Purpose:** This document defines the complete workflow for issuing rewards to companies and users when a freight quote is successfully approved and processed (payment verified). It covers every stage of the quote lifecycle, where rewards are triggered, how coupon codes are generated, and what the admin controls.
>
> **Reference inspiration:** [IFN Family](https://ifnfamily.com) — a comparable freight network that rewards members for active quote exchange and network participation through a loyalty/points system.
>
> **Do not modify:** `PROFILE.md` — this file is the blueprint for the referral & registration rewards. This document covers the **quote transaction reward layer** specifically.

---

## Table of Contents

1. [Overview — Why Quote-Based Rewards](#1-overview--why-quote-based-rewards)
2. [Quote Lifecycle — Existing Flow (Confirmed from Code)](#2-quote-lifecycle--existing-flow-confirmed-from-code)
3. [Reward Trigger Points in the Quote Lifecycle](#3-reward-trigger-points-in-the-quote-lifecycle)
4. [Reward Coupon Code Design](#4-reward-coupon-code-design)
5. [Who Gets Rewarded and How Much](#5-who-gets-rewarded-and-how-much)
6. [Database Schema — Quote Rewards Extension](#6-database-schema--quote-rewards-extension)
7. [Complete Workflow — Step by Step](#7-complete-workflow--step-by-step)
8. [Coupon Code Redemption Flow](#8-coupon-code-redemption-flow)
9. [API Endpoints Required](#9-api-endpoints-required)
10. [Frontend Integration](#10-frontend-integration)
11. [Admin Controls](#11-admin-controls)
12. [Fraud & Abuse Prevention](#12-fraud--abuse-prevention)
13. [Files to Modify & Create](#13-files-to-modify--create)
14. [Reward Rules Summary Table](#14-reward-rules-summary-table)

---

## 1. Overview — Why Quote-Based Rewards

### Platform Context (confirmed from codebase)

GSN is a freight-forwarding marketplace. The core activity that generates value is:

```
User/Business submits a quote request
      ↓
Companies respond with pricing
      ↓
User accepts one response
      ↓
User uploads payment proof
      ↓
Company verifies payment
      ↓
Quote moves to "approved" → work begins
      ↓
Company marks quote as "running" → "closed"
```

### The Business Case for Quote Rewards

| Why Reward Quotes? | Outcome |
|---|---|
| Companies are incentivized to respond quickly and competitively | More quote responses per request → better pricing for users |
| Users are incentivized to complete the full payment flow | Fewer abandoned quotes, more completed transactions |
| Both parties earn reward credits on a successful deal | Sticky retention, repeat business |
| Mirrors IFN's "Business Exchange Drive" model | Active participation recognized and rewarded |

### IFN Reference Model

IFN's model (from site review):
> *"Our Business Exchange Drive incentivizes members to actively share cargo and business opportunities within the network. Active participation is recognized and rewarded."*
> *"Earn loyalty points through platform engagement, business exchange, and network participation. Redeem them for membership upgrades and conference access."*

**GSN Adaptation:** Instead of generic loyalty points, GSN issues **USD wallet credits + one-time coupon codes** tied to specific completed quote transactions. Credits reduce future subscription costs. Coupon codes can be applied to upcoming subscription renewals.

---

## 2. Quote Lifecycle — Existing Flow (Confirmed from Code)

This is the exact flow found in the codebase. Every status transition is real — not assumed.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        QUOTE STATUS FLOW (from DB + code)                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  User/Business                                                              │
│  submits quote                                                              │
│       │                                                                     │
│       ▼                                                                     │
│  quotes.status = 'pending'                                                  │
│       │                                                                     │
│       ▼  (Admin approves quote - updateQuoteStatusAdmin)                    │
│  quotes.status = 'approved'  ◄── Companies can now see & respond           │
│       │                                                                     │
│       ▼  (User accepts a company's response - acceptQuoteResponse)          │
│  quotes.status = 'payment_pending'  [if bank details attached]              │
│       │                        OR                                           │
│  quotes.status = 'approved'         [if no payment required]               │
│       │                                                                     │
│       ▼  (User uploads payment proof - POST /api/payments/upload-proof)     │
│  quotes.status = 'payment_uploaded'                                         │
│       │                                                                     │
│       ▼  (Company verifies payment - PUT /api/payments/verify-enhanced/:id) │
│  quotes.status = 'approved'  ◄── Transaction invoice created automatically  │
│       │                          (createTransactionInvoice called here)      │
│       ▼  (Company updates status - companyQuoteController.updateQuoteStatus) │
│  quotes.status = 'running'   ◄── Active shipment in progress                │
│       │                                                                      │
│       ▼                                                                      │
│  quotes.status = 'closed'    ◄── ✅ FULLY PROCESSED — PRIMARY REWARD POINT  │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Key Status Values (confirmed ENUM in DB)

```
pending          → Submitted, waiting for admin
approved         → Admin-cleared OR payment verified; companies can respond/work begins
payment_pending  → User accepted, payment required
payment_uploaded → User uploaded proof, waiting company verification
running          → Shipment actively in progress
closed           → Shipment complete ✅
rejected         → Rejected at any stage
```

### Key Tables Involved (confirmed from code)

| Table | Role |
|---|---|
| `quotes` | Main quote record, carries `status` |
| `quote_responses` | Company's price offer for a quote |
| `user_quote_status` | Acceptance record; links user + quote + company response |
| `payment_proofs` | Uploaded payment files |
| `payment_verifications` | Company's verification decision |
| `transaction_invoices` | Auto-created on payment verification (`TXN-INV-...`) |

---

## 3. Reward Trigger Points in the Quote Lifecycle

There are **two** meaningful trigger points. Both are backed by existing code hooks.

### Trigger Point A — Payment Verified (`quote.status → 'approved'` via payment verification)

**Where in code:** `paymentRoutes.js` → `PUT /api/payments/verify-enhanced/:verificationId`

```javascript
// This already happens at this exact point:
if (verification_status === 'verified') {
  await db.execute('UPDATE quotes SET status = "approved" ...');
  await createTransactionInvoice({ ... }); // ← Invoice is created here
  
  // ✅ ADD REWARD HOOK HERE ← 
  // await processQuoteReward('payment_verified', quoteId, userId, companyId, price);
}
```

**Why this is a good trigger:**
- Real money has moved (payment proof verified by company).
- `createTransactionInvoice` already runs here — reward follows same event.
- Idempotent: transaction invoice creation already prevents duplication.

---

### Trigger Point B — Quote Closed (`quote.status → 'closed'`)

**Where in code:** `companyQuoteController.js` → `updateQuoteStatus`

```javascript
// Company sets status to 'closed'
await db.execute('UPDATE quotes SET status = ? WHERE id = ?', ['closed', quoteId]);

// ✅ ADD REWARD HOOK HERE ←
// await processQuoteReward('quote_closed', quoteId, userId, companyId);
```

**Why this is the PRIMARY trigger (recommended):**
- Confirms the full service was delivered, not just payment received.
- Mirrors IFN's model: reward for completed business exchange.
- Reduces disputes about incomplete deliveries earning rewards.

### Decision: Use BOTH Triggers, Different Reward Amounts

```
Payment Verified  →  PARTIAL reward (50%) issued immediately as credit
Quote Closed      →  REMAINING reward (50%) issued, plus coupon code generated
```

This structure incentivizes both payment completion AND delivery completion.

---

## 4. Reward Coupon Code Design

### Format

```
QRC-{ENTITYPREFIX}{QUOTEREF}-{RANDOMSUFFIX}

Examples:
  QRC-CMP00842-A3F9   ← Company reward for quote #842
  QRC-USR00842-B7K2   ← User/Business reward for quote #842
  QRC-ADM00001-X1Y9   ← Admin-issued manual coupon
```

| Segment | Description | Length |
|---|---|---|
| `QRC` | Fixed prefix (Quote Reward Code) | 3 chars |
| `-` | Separator | 1 char |
| `CMP`/`USR`/`BIZ` | Entity type prefix | 3 chars |
| `{5-digit quote ID}` | Zero-padded quote reference | 5 chars |
| `-` | Separator | 1 char |
| `{RANDOM4}` | 4-char alphanumeric random suffix | 4 chars |

**Total length: 17 characters** (compact, readable, type-identifiable)

### Generation Algorithm

```javascript
import crypto from 'crypto';

const ROLE_PREFIX = { user: 'USR', business: 'BIZ', company: 'CMP', admin: 'ADM' };

function generateQuoteCouponCode(role, quoteId) {
  const prefix = ROLE_PREFIX[role] || 'USR';
  const quotePart = String(quoteId).padStart(5, '0');
  
  // 4-char cryptographic random suffix (uppercase alphanumeric)
  const random = crypto.randomBytes(3)
    .toString('base64url')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 4)
    .padEnd(4, '0');
  
  return `QRC-${prefix}${quotePart}-${random}`;
}

// Example: generateQuoteCouponCode('company', 842) → 'QRC-CMP00842-A3F9'
```

### Coupon Properties

| Property | Value | Configurable |
|---|---|---|
| Type | Subscription discount (% or fixed USD) | ✅ |
| Default value | 10% off next subscription renewal | ✅ |
| Max USD equivalent | $50 per coupon | ✅ |
| Expiry | 6 months from issue date | ✅ |
| Single-use | Yes (redeemed once, status → 'used') | — |
| Stackable | No (one coupon per subscription payment) | ✅ |
| Applicable to | Subscription renewals only | ✅ |

---

## 5. Who Gets Rewarded and How Much

### At Payment Verification (Trigger A — 50% of total reward)

| Recipient | Role | Reward Type | Amount |
|---|---|---|---|
| Company | Delivered the quote | Wallet credit | $10 |
| User / Business | Completed payment | Wallet credit | $5 |

### At Quote Closed (Trigger B — 50% of total reward + Coupon)

| Recipient | Role | Reward Type | Amount |
|---|---|---|---|
| Company | Closed the transaction | Wallet credit + **Coupon code** | $10 + 10% off next subscription |
| User / Business | Received service | Wallet credit + **Coupon code** | $5 + 10% off (if subscribed) |

### Total Reward Per Completed Quote Transaction

| Entity | Total Credits | Coupon |
|---|---|---|
| Company | $20 wallet credit | 1× `QRC-CMP...` coupon code |
| User | $10 wallet credit | 1× `QRC-USR...` coupon code |
| Business | $10 wallet credit | 1× `QRC-BIZ...` coupon code |

> All amounts are **admin-configurable** via `quote_reward_rules` table (described in section 6).

### Visual Summary

```
Quote Lifecycle              Company Reward          User/Business Reward
─────────────────────        ──────────────────      ────────────────────
submit quote                 —                       —
quote approved (admin)       —                       —
company responds             —                       —
user accepts response        —                       —
payment proof uploaded       —                       —
payment VERIFIED ────────►   +$10 wallet credit      +$5 wallet credit
                             [Trigger A fired]        [Trigger A fired]
company marks RUNNING        —                       —
company marks CLOSED  ────►  +$10 wallet credit      +$5 wallet credit
                             + QRC-CMP coupon issued  + QRC-USR coupon issued
                             [Trigger B fired]        [Trigger B fired]
─────────────────────────────────────────────────────────────────────────
TOTAL PER TRANSACTION        $20 credit + 1 coupon   $10 credit + 1 coupon
```

---

## 6. Database Schema — Quote Rewards Extension

> These tables extend the existing schema without modifying any existing table.
> Existing `referral_wallet` and `referral_reward_transactions` tables from `PROFILE.md` are **reused** — the wallet is shared across both referral credits and quote credits.

### Table: `quote_reward_rules`

Admin-configurable reward amounts for quote-based rewards.

```sql
CREATE TABLE quote_reward_rules (
  id                          INT AUTO_INCREMENT PRIMARY KEY,
  trigger_event               ENUM('payment_verified', 'quote_closed') NOT NULL,
  company_credit_usd          DECIMAL(10,2) NOT NULL DEFAULT 10.00,
  user_credit_usd             DECIMAL(10,2) NOT NULL DEFAULT 5.00,
  company_coupon_discount_pct DECIMAL(5,2)  NOT NULL DEFAULT 0.00, -- % off subscription
  user_coupon_discount_pct    DECIMAL(5,2)  NOT NULL DEFAULT 0.00,
  company_coupon_enabled      TINYINT(1)    NOT NULL DEFAULT 0,    -- 1 = issue coupon
  user_coupon_enabled         TINYINT(1)    NOT NULL DEFAULT 0,
  coupon_expiry_days          INT           NOT NULL DEFAULT 180,  -- 6 months
  max_coupon_usd_value        DECIMAL(10,2) NOT NULL DEFAULT 50.00,
  is_active                   TINYINT(1)    NOT NULL DEFAULT 1,
  created_at                  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at                  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY unique_trigger (trigger_event)
);

-- Default seed:
INSERT INTO quote_reward_rules
  (trigger_event, company_credit_usd, user_credit_usd,
   company_coupon_discount_pct, user_coupon_discount_pct,
   company_coupon_enabled, user_coupon_enabled, coupon_expiry_days)
VALUES
  ('payment_verified', 10.00, 5.00,  0.00, 0.00, 0, 0, 180),
  ('quote_closed',     10.00, 5.00, 10.00, 10.00, 1, 1, 180);
```

---

### Table: `quote_reward_coupons`

Tracks all issued coupon codes.

```sql
CREATE TABLE quote_reward_coupons (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  coupon_code     VARCHAR(20) NOT NULL UNIQUE,     -- QRC-CMP00842-A3F9
  quote_id        INT NOT NULL,
  issued_to       INT NOT NULL,                    -- FK → users.id (recipient)
  issued_to_role  ENUM('user','business','company') NOT NULL,
  trigger_event   ENUM('payment_verified','quote_closed','admin_manual') NOT NULL,
  discount_type   ENUM('percentage','fixed_usd') NOT NULL DEFAULT 'percentage',
  discount_value  DECIMAL(10,2) NOT NULL,          -- e.g. 10.00 = 10%
  max_usd_value   DECIMAL(10,2) NOT NULL DEFAULT 50.00,
  status          ENUM('active','used','expired','revoked') NOT NULL DEFAULT 'active',
  used_at         TIMESTAMP NULL,
  used_on_subscription_request_id INT NULL,        -- FK → subscription_requests.id
  expires_at      TIMESTAMP NOT NULL,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_coupon_user
    FOREIGN KEY (issued_to) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_coupon_quote
    FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE,

  INDEX idx_coupon_code  (coupon_code),
  INDEX idx_issued_to    (issued_to),
  INDEX idx_quote_id     (quote_id),
  INDEX idx_status       (status),
  INDEX idx_expires_at   (expires_at)
);
```

---

### Table: `quote_rewards`

Audit log linking a completed quote to every reward issued from it.

```sql
CREATE TABLE quote_rewards (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  quote_id          INT NOT NULL,
  trigger_event     ENUM('payment_verified','quote_closed') NOT NULL,
  company_id        INT NOT NULL,                  -- FK → users.id
  user_id           INT NOT NULL,                  -- FK → users.id (quote submitter)
  company_credit    DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  user_credit       DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  company_coupon_id INT NULL,                      -- FK → quote_reward_coupons.id
  user_coupon_id    INT NULL,                      -- FK → quote_reward_coupons.id
  status            ENUM('processed','failed','skipped') NOT NULL DEFAULT 'processed',
  skip_reason       VARCHAR(255) NULL,             -- e.g. 'reward_rule_inactive'
  processed_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_qr_quote   FOREIGN KEY (quote_id)   REFERENCES quotes(id)  ON DELETE CASCADE,
  CONSTRAINT fk_qr_company FOREIGN KEY (company_id) REFERENCES users(id)   ON DELETE CASCADE,
  CONSTRAINT fk_qr_user    FOREIGN KEY (user_id)    REFERENCES users(id)   ON DELETE CASCADE,
  CONSTRAINT fk_qr_ccoupon FOREIGN KEY (company_coupon_id)
                            REFERENCES quote_reward_coupons(id) ON DELETE SET NULL,
  CONSTRAINT fk_qr_ucoupon FOREIGN KEY (user_coupon_id)
                            REFERENCES quote_reward_coupons(id) ON DELETE SET NULL,

  UNIQUE KEY unique_quote_trigger (quote_id, trigger_event),  -- prevent double-reward
  INDEX idx_company_id (company_id),
  INDEX idx_user_id    (user_id)
);
```

### Relationship to Existing Wallet Tables (from PROFILE.md)

```
quote_rewards
  ├── triggers INSERT into referral_wallet         (upsert balance)
  └── triggers INSERT into referral_reward_transactions (audit log, type='credit')

quote_reward_coupons
  └── on redemption: INSERT into referral_reward_transactions (type='debit')
                     UPDATE subscription_requests.amount_paid (discounted)
```

The **wallet is shared** — referral credits and quote credits accumulate in the same `referral_wallet`. The `trigger_event` field in `referral_reward_transactions` distinguishes the source.

---

## 7. Complete Workflow — Step by Step

### Step 1 — Quote Submitted

```
Actor:  User or Business
Action: POST /api/quotes (or /api/user-quotes)
Status: quotes.status = 'pending'
Reward: None
```

---

### Step 2 — Quote Approved by Admin

```
Actor:  Admin
Action: PUT /api/admin-panel/quotes/:id/status (body: { status: 'approved' })
Status: quotes.status = 'approved'
Reward: None
Note:   Companies can now see and respond to the quote
```

---

### Step 3 — Company Submits Quote Response

```
Actor:  Company
Action: POST /api/quote-responses (or enhanced quote response endpoint)
Tables: quote_responses INSERT
        (optional) quote_response_bank_details INSERT (if bank details attached)
Status: quotes.status unchanged ('approved')
Reward: None
Note:   Company may attach bank details requiring payment proof from user
```

---

### Step 4 — User Accepts a Quote Response

```
Actor:  User or Business
Action: POST /api/user-quotes/accept-response
        Body: { quoteId, quoteResponseId, companyId }
Tables: user_quote_status INSERT (status='accepted')
        quote_responses UPDATE (status='accepted')
        quote_responses UPDATE (all others for this quote → status='rejected')
Status: quotes.status = 'payment_pending'  [if bank details attached]
     OR quotes.status = 'approved'         [if no payment required]
Reward: None
Note:   Emails sent to both user and company (already implemented)
        Real-time WebSocket notification sent (already implemented)
```

---

### Step 5 — User Uploads Payment Proof

```
Actor:  User or Business
Action: POST /api/payments/upload-proof
        Body: { quote_id, payment_date, payment_notes }
        File: payment_proof (image/PDF)
Tables: payment_proofs INSERT
        payment_verifications INSERT (verification_status='pending')
Status: quotes.status = 'payment_uploaded'
Reward: None
```

---

### Step 6 — Company Verifies Payment ✅ TRIGGER A

```
Actor:  Company
Action: PUT /api/payments/verify-enhanced/:verificationId
        Body: { verification_status: 'verified', company_notes: '...' }

EXISTING FLOW (already in code):
  ├── UPDATE payment_verifications SET verification_status='verified'
  ├── UPDATE user_quote_status SET payment_verification_status='verified'
  ├── UPDATE quotes SET status='approved'
  ├── UPDATE quote_responses SET status='approved'
  └── createTransactionInvoice({ quoteId, userId, companyId, amount, serviceFee=0 })
        → transaction_invoices INSERT (TXN-INV-... invoice number)

  ⬇ ADD NEW HOOK HERE (non-blocking, after existing logic):
  └── processQuoteReward('payment_verified', quoteId, userId, companyId, price)

NEW REWARD FLOW (to add):
  ├── Check quote_rewards WHERE quote_id=? AND trigger_event='payment_verified'
  │   → If exists: SKIP (idempotent guard)
  ├── Fetch quote_reward_rules WHERE trigger_event='payment_verified' AND is_active=1
  ├── UPSERT referral_wallet for company (+$10 credit)
  ├── INSERT referral_reward_transactions (company, type='credit', trigger='payment_verified')
  ├── UPSERT referral_wallet for user/business (+$5 credit)
  ├── INSERT referral_reward_transactions (user, type='credit', trigger='payment_verified')
  ├── INSERT quote_rewards (status='processed')
  └── Send in-app notifications to company and user (non-blocking)

Status after: quotes.status = 'approved'
Transaction invoice: Created (TXN-INV-...)
Wallet credits: Company +$10 | User/Business +$5
Coupon codes: NOT issued yet (issued at quote_closed)
```

---

### Step 7 — Company Marks Quote as "Running"

```
Actor:  Company
Action: PUT /api/company-quotes/:quoteId/status
        Body: { status: 'running' }
Tables: quotes UPDATE (status='running')
        messages INSERT (status update message sent to user)
        admin_notifications INSERT
Status: quotes.status = 'running'
Reward: None
Note:   Existing email notification sent to user (already implemented)
```

---

### Step 8 — Company Marks Quote as "Closed" ✅ TRIGGER B (PRIMARY)

```
Actor:  Company
Action: PUT /api/company-quotes/:quoteId/status
        Body: { status: 'closed' }

EXISTING FLOW (already in code):
  ├── UPDATE quotes SET status='closed'
  ├── INSERT messages (status update to user)
  └── INSERT admin_notifications

  ⬇ ADD NEW HOOK HERE (non-blocking, after existing logic):
  └── processQuoteReward('quote_closed', quoteId, userId, companyId, price)

NEW REWARD FLOW (to add):
  ├── Check quote_rewards WHERE quote_id=? AND trigger_event='quote_closed'
  │   → If exists: SKIP (idempotent guard)
  ├── Check payment was verified first (payment_verifications.verification_status='verified')
  │   → If not verified: INSERT quote_rewards(status='skipped', reason='payment_not_verified')
  │   → STOP (do not reward unverified quote closures)
  ├── Fetch quote_reward_rules WHERE trigger_event='quote_closed' AND is_active=1
  │
  │   FOR COMPANY:
  ├── UPSERT referral_wallet for company (+$10 credit)
  ├── INSERT referral_reward_transactions (company, type='credit', trigger='quote_closed')
  ├── IF company_coupon_enabled=1:
  │     code = generateQuoteCouponCode('company', quoteId)
  │     INSERT quote_reward_coupons (issued_to=companyId, discount=10%, expires=+6months)
  │
  │   FOR USER / BUSINESS:
  ├── UPSERT referral_wallet for user (+$5 credit)
  ├── INSERT referral_reward_transactions (user, type='credit', trigger='quote_closed')
  ├── IF user_coupon_enabled=1:
  │     code = generateQuoteCouponCode(user.role, quoteId)
  │     INSERT quote_reward_coupons (issued_to=userId, discount=10%, expires=+6months)
  │
  ├── INSERT quote_rewards (
  │     quote_id, trigger_event='quote_closed',
  │     company_id, user_id,
  │     company_credit=10, user_credit=5,
  │     company_coupon_id, user_coupon_id,
  │     status='processed'
  │   )
  └── Send notifications (in-app + email) — non-blocking

Status after: quotes.status = 'closed'
Wallet credits: Company +$10 | User/Business +$5
Coupon codes: Company receives QRC-CMP... | User receives QRC-USR.../QRC-BIZ...
```

---

### Step 9 — Coupon Code Delivery

```
Delivery channels (all non-blocking):

A. In-app notification:
   "🎉 Your quote #842 has been completed! You've earned $10 in wallet credits
    and a 10% discount coupon: QRC-CMP00842-A3F9 (valid for 6 months)"

B. Email notification:
   Subject: "Your GSN Reward — Quote #842 Complete!"
   Body: Reward summary + coupon code + redemption instructions

C. Dashboard display:
   Coupon visible in Referral/Rewards dashboard under "My Coupons" tab
```

---

### Step 10 — Coupon Redemption (at Subscription Renewal)

```
Actor:  Company (or User if subscribed)
Action: POST /api/subscriptions/activate
        Body: { planId, paymentMethod, couponCode: 'QRC-CMP00842-A3F9' }

Flow:
  ├── Validate coupon: SELECT * FROM quote_reward_coupons
  │   WHERE coupon_code=? AND issued_to=? AND status='active' AND expires_at > NOW()
  ├── If not found/expired: 400 'Invalid or expired coupon'
  ├── If already used:      400 'Coupon already redeemed'
  ├── Calculate discount:
  │     plan.price = $99
  │     discount_pct = 10%
  │     discount_amount = min(99 × 0.10, max_usd_value) = min($9.90, $50) = $9.90
  │     final_price = $99 - $9.90 = $89.10
  ├── Store in subscription_requests (coupon_code, discount_applied)
  ├── On admin approval:
  │     UPDATE quote_reward_coupons SET status='used', used_at=NOW(),
  │           used_on_subscription_request_id=?
  │     INSERT referral_reward_transactions (type='debit', description='Coupon QRC-... redeemed')
  └── Invoice shows: Original $99 - Coupon discount $9.90 = Total $89.10
```

---

## 8. Coupon Code Redemption Flow

```
┌─────────────────────────────────────────────────────────────┐
│                   COUPON REDEMPTION STATES                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  quote_reward_coupons.status:                               │
│                                                             │
│  'active'   ──►  coupon valid, not yet used                 │
│      │                                                      │
│      ▼  user applies coupon during subscription payment     │
│  [validation check: not expired, issued_to = current user]  │
│      │                                                      │
│      ▼  admin approves subscription_request                 │
│  'used'     ──►  coupon consumed, discount applied          │
│                                                             │
│  OR:                                                        │
│  'active'   ──►  expires_at < NOW() (daily cron)            │
│  'expired'  ──►  coupon no longer redeemable                │
│                                                             │
│  OR:                                                        │
│  'revoked'  ──►  admin manually revokes (fraud/error)       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Validation Rules at Redemption

```
1. coupon_code must exist in quote_reward_coupons
2. issued_to must equal req.user.id  (cannot use someone else's coupon)
3. status must be 'active'
4. expires_at must be > NOW()
5. Only one coupon per subscription_request
6. coupon_code prefix must match user's role:
     QRC-CMP... → only redeemable by 'company' role
     QRC-USR... → only redeemable by 'user' role
     QRC-BIZ... → only redeemable by 'business' role
```

---

## 9. API Endpoints Required

### New: `server/routes/quoteRewardRoutes.js`

Mount in `index.js`:
```javascript
import quoteRewardRoutes from './routes/quoteRewardRoutes.js';
app.use('/api/quote-rewards', quoteRewardRoutes);
```

---

#### `GET /api/quote-rewards/my-coupons`
**Access:** Any authenticated user  
**Purpose:** Get all coupons issued to this user

```json
// Response:
{
  "coupons": [
    {
      "id": 12,
      "couponCode": "QRC-CMP00842-A3F9",
      "quoteId": 842,
      "discountType": "percentage",
      "discountValue": 10.00,
      "maxUsdValue": 50.00,
      "status": "active",
      "expiresAt": "2027-04-22T00:00:00Z",
      "createdAt": "2026-10-22T10:30:00Z"
    }
  ],
  "activeCoupons": 2,
  "usedCoupons": 3,
  "expiredCoupons": 1
}
```

---

#### `POST /api/quote-rewards/validate-coupon`
**Access:** Any authenticated user  
**Purpose:** Validate a coupon code before applying it

```json
// Request:
{ "couponCode": "QRC-CMP00842-A3F9", "planPrice": 99.00 }

// Response (valid):
{
  "valid": true,
  "discountAmount": 9.90,
  "finalPrice": 89.10,
  "expiresAt": "2027-04-22T00:00:00Z"
}

// Response (invalid):
{ "valid": false, "reason": "Coupon has expired" }
```

---

#### `GET /api/quote-rewards/reward-history`
**Access:** Any authenticated user  
**Purpose:** Get all quote rewards (credits) received

```json
// Response:
{
  "rewards": [
    {
      "quoteId": 842,
      "triggerEvent": "quote_closed",
      "creditAmount": 10.00,
      "couponCode": "QRC-CMP00842-A3F9",
      "processedAt": "2026-10-22T10:30:00Z"
    }
  ]
}
```

---

#### `GET /api/quote-rewards/admin/all`
**Access:** `admin` role  
**Purpose:** View all quote rewards across the platform

**Query:** `?page=1&limit=50&status=processed&role=company`

---

#### `GET /api/quote-rewards/admin/rules`
**Access:** `admin` role  
**Purpose:** Get current reward configuration

---

#### `PUT /api/quote-rewards/admin/rules/:triggerEvent`
**Access:** `admin` role  
**Purpose:** Update reward amounts/coupon settings

```json
// Request (body):
{
  "companyCreditUsd": 15.00,
  "userCreditUsd": 7.50,
  "companyCouponDiscountPct": 15.00,
  "userCouponDiscountPct": 10.00,
  "companyCouponEnabled": true,
  "userCouponEnabled": true,
  "couponExpiryDays": 180,
  "isActive": true
}
```

---

#### `POST /api/quote-rewards/admin/issue-coupon`
**Access:** `admin` role  
**Purpose:** Manually issue a coupon to a user

```json
// Request:
{
  "userId": 55,
  "quoteId": 842,
  "discountType": "percentage",
  "discountValue": 15.00,
  "reason": "Goodwill gesture for service delay"
}
```

---

#### `PUT /api/quote-rewards/admin/revoke-coupon/:id`
**Access:** `admin` role  
**Purpose:** Revoke a coupon (fraud/error)

---

### Modified Endpoints

#### `PUT /api/payments/verify-enhanced/:verificationId` *(existing)*
Add after existing logic:
```javascript
// Non-blocking reward trigger
processQuoteReward('payment_verified', verification.quote_id,
                   verification.user_id, companyId, price)
  .catch(err => console.error('Reward processing failed:', err));
```

#### `PUT /api/company-quotes/:quoteId/status` *(existing)*
Add after existing logic when `status === 'closed'`:
```javascript
// Non-blocking reward trigger
processQuoteReward('quote_closed', quoteId,
                   quoteInfo.user_id, companyId)
  .catch(err => console.error('Reward processing failed:', err));
```

#### `POST /api/subscriptions/activate` *(existing)*
Add coupon code application:
```javascript
// Accept optional couponCode in request body
const { planId, paymentMethod, couponCode } = req.body;
// Validate + store coupon discount details in subscription_requests
```

---

## 10. Frontend Integration

### New Pages

```
client/src/pages/Rewards/
  RewardsDashboard.jsx     ← Tabbed: Wallet Balance | Coupons | History
  MyCoupons.jsx            ← Coupon cards with status, countdown, copy button
  QuoteRewardHistory.jsx   ← Quote rewards + referral rewards combined list

client/src/pages/Admin/
  AdminQuoteRewards.jsx    ← All quote rewards table + filter + manual issue
  AdminRewardRules.jsx     ← Edit reward rules for both quote triggers
  AdminCoupons.jsx         ← All coupons + revoke control
```

### Modified Components

```
client/src/pages/SubscriptionPage.jsx
  → Add "Apply Coupon Code" input field before payment step
  → Show real-time discount preview: "Coupon applied: -$9.90 → Total: $89.10"
  → Call /api/quote-rewards/validate-coupon on input change

client/src/companyPages/CompanyDashboard/CompanyDashboard.jsx
  → Add "Earned Coupons" mini-section below existing ReferralCard
  → Show active coupon count badge: "🎫 2 active coupons"

client/src/pages/UserDashboard/UserDashboard.jsx
  → Add "Rewards" metric card: wallet balance + coupon count

client/src/pages/BusinessDashboard/BusinessDashboard.jsx
  → Same as UserDashboard addition

client/src/App.jsx
  → Add routes:
      /company/rewards
      /user/rewards
      /business/rewards
      /admin/quote-rewards
      /admin/reward-rules
      /admin/coupons
```

### Coupon Display — UI Pattern

```
┌─────────────────────────────────────────────────────┐
│  🎫  YOUR REWARD COUPON                             │
│                                                     │
│  Quote #842 — Gulf Cargo Ltd                        │
│  ─────────────────────────────────────────────────  │
│  Code:  [ QRC-CMP00842-A3F9 ]  [📋 Copy]           │
│                                                     │
│  Discount:  10% off next subscription               │
│  Max value: up to $50                               │
│  Valid until: April 22, 2027  (6 months)            │
│                                                     │
│  Status:  ● Active                                  │
│                                                     │
│  [ Apply to Subscription ]                          │
└─────────────────────────────────────────────────────┘
```

---

## 11. Admin Controls

### What the Admin Can Do

| Action | UI Location | API Endpoint |
|---|---|---|
| Enable/disable quote rewards entirely | Admin → Reward Rules | `PUT /api/quote-rewards/admin/rules/:event` |
| Change credit amounts per trigger | Admin → Reward Rules | Same |
| Change coupon discount percentage | Admin → Reward Rules | Same |
| Change coupon expiry period | Admin → Reward Rules | Same |
| Enable/disable coupon issuance | Admin → Reward Rules | Same |
| View all issued rewards | Admin → Quote Rewards | `GET /api/quote-rewards/admin/all` |
| Manually issue a coupon | Admin → Coupons | `POST /api/quote-rewards/admin/issue-coupon` |
| Revoke a coupon | Admin → Coupons | `PUT /api/quote-rewards/admin/revoke-coupon/:id` |
| View all coupons (filter by status) | Admin → Coupons | `GET /api/quote-rewards/admin/all` |
| Adjust a user's wallet manually | Admin → Referral Wallets (from PROFILE.md) | `POST /api/referrals/admin/adjust-wallet` |

---

## 12. Fraud & Abuse Prevention

| Scenario | Prevention Mechanism |
|---|---|
| Company marks quote "closed" without doing the work | Reward only triggers if `payment_verifications.verification_status = 'verified'` first |
| Admin approves quote as "closed" without payment | Same guard — payment verification is prerequisite |
| Duplicate reward for same quote + trigger | `UNIQUE KEY (quote_id, trigger_event)` on `quote_rewards` table |
| User applies another person's coupon | `issued_to = req.user.id` validation at redemption |
| User applies company coupon (role mismatch) | Prefix-role check: `QRC-CMP...` rejects if `user.role ≠ 'company'` |
| Fake quotes created to harvest rewards | Quotes must pass admin approval (`approved` status) before companies can respond; payment must be verified |
| Admin bypass (manual closure without payment) | `skip_reason` logged in `quote_rewards` if payment not verified; notification to super-admin |
| Expired coupon used | `expires_at < NOW()` checked at redemption; daily cron marks them `expired` |
| Coupon used twice | `status = 'active'` check at redemption; `UPDATE ... SET status='used'` on redemption |

---

## 13. Files to Modify & Create

### New Files

| File | Purpose |
|---|---|
| `server/migrations/add_quote_reward_tables.js` | Creates `quote_reward_rules`, `quote_reward_coupons`, `quote_rewards`; seeds default rules |
| `server/utils/quoteCouponUtils.js` | `generateQuoteCouponCode(role, quoteId)` function |
| `server/services/quoteRewardService.js` | `processQuoteReward(event, quoteId, userId, companyId)` — core reward logic with DB transaction |
| `server/services/quoteRewardEmailService.js` | Email templates: reward notification to company + user |
| `server/controllers/quoteRewardController.js` | Handlers for all `/api/quote-rewards` endpoints |
| `server/routes/quoteRewardRoutes.js` | Express router for quote reward routes |
| `client/src/pages/Rewards/RewardsDashboard.jsx` | Main rewards page (tabbed) |
| `client/src/pages/Rewards/MyCoupons.jsx` | Coupon card list |
| `client/src/pages/Rewards/QuoteRewardHistory.jsx` | Reward history |
| `client/src/pages/Admin/AdminQuoteRewards.jsx` | Admin rewards management |
| `client/src/pages/Admin/AdminRewardRules.jsx` | Admin rule configuration |
| `client/src/pages/Admin/AdminCoupons.jsx` | Admin coupon management |

### Existing Files to Modify

| File | Change |
|---|---|
| `server/index.js` | Mount `quoteRewardRoutes` at `/api/quote-rewards` |
| `server/routes/paymentRoutes.js` | Add `processQuoteReward('payment_verified', ...)` call inside `PUT /verify-enhanced` handler, after `createTransactionInvoice` succeeds |
| `server/controllers/companyQuoteController.js` | Add `processQuoteReward('quote_closed', ...)` call inside `updateQuoteStatus` when `status === 'closed'` |
| `server/controllers/subscriptionController.js` | Accept optional `couponCode` in `activateSubscription`; validate and store discount |
| `server/controllers/subscriptionController.js` | Apply coupon discount on `approveSubscriptionRequest` — mark coupon as `used`, adjust invoice |
| `client/src/App.jsx` | Add reward page routes for all three roles + admin |
| `client/src/pages/SubscriptionPage.jsx` | Add coupon code input + discount preview |
| `client/src/companyPages/CompanyDashboard/CompanyDashboard.jsx` | Add reward summary to dashboard |
| `client/src/pages/UserDashboard/UserDashboard.jsx` | Add reward metric card |
| `client/src/pages/BusinessDashboard/BusinessDashboard.jsx` | Add reward metric card |

---

## 14. Reward Rules Summary Table

### Configured via `quote_reward_rules` table (admin editable)

| Trigger | Who | Credit | Coupon Enabled | Coupon % | Coupon Max $ | Expiry |
|---|---|---|---|---|---|---|
| `payment_verified` | Company | $10 | No | — | — | — |
| `payment_verified` | User/Business | $5 | No | — | — | — |
| `quote_closed` | Company | $10 | **Yes** | 10% | $50 | 6 months |
| `quote_closed` | User/Business | $5 | **Yes** | 10% | $50 | 6 months |

**Combined per completed transaction:**

| Role | Total Wallet Credits | Coupons Received |
|---|---|---|
| Company | **$20** (A: $10 + B: $10) | 1× `QRC-CMP...` (10% off subscription) |
| User | **$10** (A: $5 + B: $5) | 1× `QRC-USR...` (10% off, when applicable) |
| Business | **$10** (A: $5 + B: $5) | 1× `QRC-BIZ...` (10% off, when applicable) |

---

*This document was created from a full review of the GSN Network codebase (quote flow, payment routes, company quote controller, user quote controller, enhanced quote controller) and guided by the IFN Family freight network model.*  
*`PROFILE.md` was not modified. This is a standalone companion document for the quote-based reward layer.*  
*Next step: Begin with `server/migrations/add_quote_reward_tables.js`, then `quoteRewardService.js`.*
