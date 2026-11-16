# Gulf Star Network (GSN) — Project Profile & Referral System Blueprint

> **Document Purpose:** This file is the single source of truth for the GSN platform architecture and the planned Referral & Rewards System. It is derived from a direct review of all existing source code, controllers, routes, services, database scripts, UI components, and configuration files. No assumptions have been invented; every claim here is backed by what was found in the codebase.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [Current Architecture](#3-current-architecture)
4. [Database Schema — Existing Tables](#4-database-schema--existing-tables)
5. [Entity Types & Roles](#5-entity-types--roles)
6. [Registration & Authentication Flow](#6-registration--authentication-flow)
7. [Existing Referral Code Foundation](#7-existing-referral-code-foundation)
8. [Subscription & Payment Model](#8-subscription--payment-model)
9. [Notification & Email Infrastructure](#9-notification--email-infrastructure)
10. [Referral & Rewards — Business Model](#10-referral--rewards--business-model)
11. [Referral Eligibility Matrix](#11-referral-eligibility-matrix)
12. [Unique Referral Code Generation Strategy](#12-unique-referral-code-generation-strategy)
13. [Proposed Database Schema — Referral & Rewards Tables](#13-proposed-database-schema--referral--rewards-tables)
14. [Referral Lifecycle & Reward Distribution Workflow](#14-referral-lifecycle--reward-distribution-workflow)
15. [API Endpoint Specifications](#15-api-endpoint-specifications)
16. [Frontend Integration Requirements](#16-frontend-integration-requirements)
17. [Security, Fraud Prevention & Validation Rules](#17-security-fraud-prevention--validation-rules)
18. [Implementation Plan — Files to Modify & Create](#18-implementation-plan--files-to-modify--create)
19. [Risks, Assumptions & Dependencies](#19-risks-assumptions--dependencies)
20. [Testing Requirements](#20-testing-requirements)

---

## 1. Project Overview

**Gulf Star Network (GSN)** is a B2B freight-forwarding and logistics marketplace serving three categories of members: regular users (freight professionals), business users (premium individuals / business owners), and company members (logistics companies). The platform is built for the Gulf/Middle-East logistics industry.

Core platform capabilities confirmed in code:

| Feature | Status |
|---|---|
| Multi-role user registration (user / business / company / admin) | ✅ Live |
| JWT authentication with role-based authorization | ✅ Live |
| Subscription plans with bank-transfer and PayPal payment flows | ✅ Live |
| Quote submission, response, acceptance, and dispute workflow | ✅ Live |
| Real-time WebSocket notifications | ✅ Live |
| Email queue (Nodemailer + Titan SMTP) | ✅ Live |
| Sendy newsletter integration (segmented lists per role) | ✅ Live |
| Admin panel for user/subscription/quote management | ✅ Live |
| Company branch and member management | ✅ Live |
| Invoicing (subscription invoices + transaction invoices) | ✅ Live |
| Cloudinary image/document storage | ✅ Live |
| Geo/country detection proxy | ✅ Live |
| Referral code column on `users` table | ✅ Present (partial) |
| Referral code field on registration form | ✅ Present (partial) |
| Referral reward processing | ❌ Not implemented |

---

## 2. Technology Stack

### Backend

| Layer | Technology |
|---|---|
| Runtime | Node.js (ES Modules — `"type": "module"`) |
| Framework | Express 5 |
| Database | MySQL 8 via `mysql2/promise` (connection pool) |
| Authentication | JWT (`jsonwebtoken`) with 8-hour expiry |
| Password hashing | `bcryptjs` |
| File storage | Cloudinary (images, payment proofs) |
| Email | Nodemailer over Titan SMTP + AWS SES (optional) |
| Email queue | Custom in-memory async queue (`emailQueue.js`) |
| Newsletter | Sendy (self-hosted) with segmented lists |
| Real-time | WebSocket via `ws` library |
| Environment | dotenv |

### Frontend

| Layer | Technology |
|---|---|
| Framework | React 19 (Vite + rolldown-vite) |
| Routing | React Router DOM 7 |
| Styling | Tailwind CSS 4 + Bootstrap 5 |
| UI components | Headless UI, Lucide React, React Icons |
| Toast notifications | `react-hot-toast` + `react-toastify` |
| Charts | Recharts |
| PDF/QR | jsPDF, html2canvas, qrcode |
| HTTP client | Custom `api.js` utility (axios-style wrapper over fetch) |
| Phone input | `react-phone-input-2` |

### Infrastructure

- **Database host:** Remote MySQL server (`92.112.181.224`)
- **Frontend hosting:** Vercel (`client/build/vercel.json` present)
- **Backend:** Node.js server (port 5000, configurable via `PORT` env var)
- **Uploads:** Cloudinary CDN

---

## 3. Current Architecture

### Directory Structure

```
GSN NETWORK/
├── server/                         ← Express API server
│   ├── config/
│   │   ├── db.js                   ← MySQL connection pool
│   │   └── cloudinary.js           ← Cloudinary config + multer
│   ├── controllers/                ← Route handler logic (31 files)
│   ├── middleware/
│   │   ├── authMiddleware.js       ← JWT protect() + authorize()
│   │   └── optionalAuth.js
│   ├── routes/                     ← Express routers (37 files)
│   ├── services/                   ← Business logic services (21 files)
│   ├── utils/
│   │   ├── dbRetry.js              ← DB query with retry logic
│   │   ├── adminUtils.js           ← Admin email helpers
│   │   └── hashPassword.js
│   ├── migrations/                 ← Migration scripts (4 files)
│   └── index.js                    ← App entry, all routes mounted
└── client/                         ← React frontend
    └── src/
        ├── App.jsx                 ← Router, route definitions
        ├── contexts/               ← React contexts (5 files)
        ├── layouts/                ← Role-specific layout wrappers (4)
        ├── pages/                  ← Page components by role/feature
        ├── components/             ← Reusable UI components
        ├── companyPages/           ← Company-specific pages (39 files)
        ├── services/               ← (unused — API calls live in utils/api.js)
        └── utils/
            ├── api.js              ← Centralized API request utility
            └── userRoleUtils.js    ← Role badge/icon helpers
```

### Request Flow

```
Client (React)
  └─► api.js (attaches Bearer token from localStorage)
        └─► Express routes (index.js mounts all routers)
              └─► authMiddleware.js (protect + authorize)
                    └─► Controller function
                          └─► MySQL (via db.js pool)
                                └─► Returns JSON response
```

### Route Prefixes

| Prefix | Domain |
|---|---|
| `/api/user` | Auth, registration, user management |
| `/api/company` | Company profile, branches, members |
| `/api/business` | Business profile, quotes, messages |
| `/api/subscriptions` | Plans, activation, bank transfer |
| `/api/admin` | Admin panel, notifications, emails |
| `/api/admin-panel` | Subscriptions, quotes, invoices admin |
| `/api/quotes` | Quote CRUD |
| `/api/quote-responses` | Company quote responses |
| `/api/user-quotes` | User-facing quote management |
| `/api/notifications` | In-app notifications |
| `/api/messages` | Messaging system |
| `/api/invoices` | Company subscription invoices |
| `/api/payments` | Payment management |
| `/api/disputes` | Dispute management |
| `/api/bank-details` | Bank detail CRUD |
| `/api/geo` | Public country detection (no auth) |

---

## 4. Database Schema — Existing Tables

Derived from all `DESCRIBE`, `SHOW COLUMNS`, and query scripts found in the codebase.

### `users` (central entity — all roles live here)

| Column | Type | Notes |
|---|---|---|
| `id` | INT AUTO_INCREMENT PK | |
| `name` | VARCHAR | |
| `email` | VARCHAR UNIQUE | |
| `phone` | VARCHAR | |
| `password` | VARCHAR | bcrypt hash |
| `role` | ENUM(`user`,`business`,`company`,`admin`) | |
| `category` | VARCHAR | Required for business/company |
| `country` | VARCHAR | |
| `status` | TINYINT | 1=active, 0=inactive/pending |
| `is_blacklisted` | TINYINT | 1=blacklisted |
| `referral_code` | VARCHAR | Format: `GSN{id}{id padded 4}` |
| `logo` | VARCHAR | Cloudinary URL |
| `owner_name` | VARCHAR | Business owners |
| `website` | VARCHAR | |
| `company_address` | VARCHAR | |
| `city` | VARCHAR | |
| `state` | VARCHAR | |
| `facebook`, `twitter`, `linkedin`, `instagram` | VARCHAR | Social links |
| `created_at` | TIMESTAMP | |

### `membership_plans`

| Column | Type | Notes |
|---|---|---|
| `id` | INT PK | |
| `name` | VARCHAR | e.g. "Professional", "Enterprise" |
| `price` | DECIMAL | USD |
| `duration_months` | INT | Plan duration |
| `features` | JSON | Feature list |
| `is_active` | TINYINT | |
| `description` | TEXT | |

### `user_subscriptions`

| Column | Type | Notes |
|---|---|---|
| `id` | INT PK | |
| `user_id` | INT FK → users | |
| `plan_id` | INT FK → membership_plans | |
| `start_date` | DATE | |
| `end_date` | DATE | |
| `status` | ENUM(`active`,`expired`,`cancelled`) | |
| `payment_status` | ENUM | |
| `payment_method` | VARCHAR | `paypal`, `bank_transfer` |
| `amount_paid` | DECIMAL | |
| `transaction_id` | VARCHAR | |

### `subscription_requests`

| Column | Type | Notes |
|---|---|---|
| `id` | INT PK | |
| `user_id` | INT FK → users | |
| `plan_id` | INT FK → membership_plans | |
| `transaction_id` | VARCHAR | |
| `payment_method` | VARCHAR | |
| `payment_proof_url` | VARCHAR | Cloudinary |
| `status` | ENUM(`pending`,`approved`,`rejected`) | Admin reviews |
| `plan_name`, `plan_price` | VARCHAR/DECIMAL | Denormalized backup |
| `paypal_order_id`, `paypal_payer_id` | VARCHAR | |
| `proration_applied` | TINYINT | |
| `proration_details` | JSON | |
| `is_upgrade` | TINYINT | |
| `old_subscription_id` | INT | |

### `invoices` (subscription invoices)

| Column | Type |
|---|---|
| `id` | INT PK |
| `subscription_id` | INT FK |
| `user_id` | INT FK |
| `invoice_number` | VARCHAR UNIQUE (`INV-{ts}-{random}`) |
| `amount`, `tax_amount`, `total_amount` | DECIMAL |
| `status` | ENUM(`paid`, etc.) |
| `due_date` | DATE |
| `plan_name_backup`, `plan_description_backup` | VARCHAR |
| `subscription_start_date_backup`, `subscription_end_date_backup` | DATE |

### `transaction_invoices` (quote payment invoices)

| Column | Type |
|---|---|
| `id` | INT PK |
| `invoice_number` | VARCHAR (`TXN-INV-{year}-{ts}{random}`) |
| `quote_id` | INT FK |
| `user_id` | INT FK |
| `company_id` | INT FK |
| `amount`, `service_fee`, `total_amount` | DECIMAL |
| `status` | ENUM(`paid`, etc.) |
| `payment_date` | DATETIME |

### `transactions`

| Column | Type |
|---|---|
| `id` | INT PK |
| `user_id` | INT FK |
| `subscription_id` | INT FK (nullable) |
| `amount` | DECIMAL |
| `status` | VARCHAR |

### `quotes`

| Column | Type |
|---|---|
| `id` | INT PK |
| `user_id` | INT FK |
| `status` | ENUM(`pending`,`approved`,`running`,`closed`,`rejected`) |
| `departure_country`, `arrival_country` | VARCHAR |
| `product_description` | TEXT |
| `created_at` | TIMESTAMP |

### `quote_responses`

| Column | Type |
|---|---|
| `id` | INT PK |
| `quote_id` | INT FK |
| `company_id` | INT FK |
| `price` | DECIMAL |
| `transit_time` | VARCHAR |
| `status` | ENUM(`pending`,`accepted`,`rejected`) |

### `user_quote_status`

| Column | Type |
|---|---|
| `id` | INT PK |
| `quote_id` | INT FK |
| `response_id` | INT FK |
| `status` | ENUM(`accepted`, etc.) |

### `notifications`, `user_notifications`

| Column | Type |
|---|---|
| `notifications.id` | INT PK |
| `notifications.target_role` | VARCHAR |
| `notifications.title`, `message` | VARCHAR/TEXT |
| `notifications.target_audience` | VARCHAR |
| `user_notifications.user_id` | INT FK |
| `user_notifications.notification_id` | INT FK |
| `user_notifications.is_read` | TINYINT |

### `admin_notifications`

| Column | Type |
|---|---|
| `id` | INT PK |
| `type` | ENUM(`registration`,`quote`,`ticket`,`general`,`dispute`,`subscription`) |
| `title`, `message` | VARCHAR/TEXT |
| `user_id` | INT FK (nullable) |
| `additional_data` | JSON |
| `is_read` | BOOLEAN |

### `company_branches`, `company_members`

| Column | Notes |
|---|---|
| `company_id` | FK → users |
| Branch/member details | name, address, contact |

### `support_tickets`, `reviews`, `messages`, `disputes`, `password_reset_tokens`, `email_history`, `email_notifications`, `admin_toast_seen`

> All have `user_id` FK referencing the `users` table with CASCADE delete where set up.

---

## 5. Entity Types & Roles

GSN uses a **single `users` table** for all entity types, differentiated by the `role` column.

```
role = 'user'     → Individual freight professional / Regular Member
role = 'business' → Premium individual / Business Owner
role = 'company'  → Logistics company / Company Member
role = 'admin'    → Platform administrator (not a referral participant)
```

### Key Behavioral Differences

| Attribute | user | business | company |
|---|---|---|---|
| Auto-activated on register | ✅ | ❌ (admin approval) | ❌ (admin approval) |
| Has subscription plan | ❌ (free tier) | ❌ (implied free tier) | ✅ (paid subscription) |
| Submits quotes | ✅ | ✅ | ❌ |
| Responds to quotes | ❌ | ✅ (limited) | ✅ |
| Has referral_code in DB | ✅ (auto-generated) | ✅ (auto-generated) | ✅ (auto-generated) |
| Dashboard | `/user/dashboard` | `/business/dashboard` | `/company` (dashboard) |

---

## 6. Registration & Authentication Flow

### Registration (`POST /api/user/register`)

```
Client sends: { name, email, phone, password, role, category, country, referralCode }
                                                                           ↑
                                                            Accepted but not processed
                                                            beyond storing it (as of now)

1. Validate required fields
2. Check duplicate email
3. bcrypt hash password
4. INSERT INTO users (... referral_code = NULL)
5. Generate referral_code = 'GSN{id}{id padded 4}' → UPDATE users
6. Send welcome message (in-app)
7. Queue registration emails (non-blocking)
8. Create admin_notification
9. Send real-time WebSocket notification
10. Return JWT token (users only) or pending status (business/company)
```

**Current referral code format found in code:**
```
GSN{userId}{String(userId).padStart(4, '0')}
```
Example: User ID 42 → `GSN420042`

**Critical gap identified:** The `referralCode` received from the registration form is accepted in `req.body` but is **never validated, stored as a relationship, or used to trigger any reward**. The field is accepted and silently ignored after user creation.

### Login (`POST /api/user/login`)

```
1. Find user by email
2. Compare bcrypt password
3. Check status = 1 (active) and is_blacklisted = 0
4. Return JWT (8h) + user object
```

### Auth Middleware (`protect`)

```
Reads: Authorization: Bearer <token>
Verifies JWT → extracts decoded.id
Queries: SELECT id, name, email, role, status, is_blacklisted FROM users WHERE id = ?
Attaches: req.user = { id, name, email, role, status, is_blacklisted }
Checks: status = 1 AND is_blacklisted = 0
```

### Authorization

```javascript
authorize('admin')      // Admin-only
authorize('company')    // Company-only
authorize('business')   // Business-only
authorize('user')       // Regular user only
```

---

## 7. Existing Referral Code Foundation

### What Already Exists

| Item | Location | Status |
|---|---|---|
| `referral_code` column on `users` | DB | ✅ Present |
| Code generation at registration | `userController.js:registerUser` | ✅ Present |
| Backfill script for existing users | `server/update_referral_codes.js` | ✅ Present |
| `referralCode` field on register form | `RegisterPage.jsx` | ✅ Present (UI input exists) |
| Code display on Company Dashboard | `CompanyDashboard.jsx:ReferralCard` | ✅ Present (display only) |
| Referral code accepted in register endpoint | `userController.js:registerUser` | ✅ Accepted in req.body |
| Referral relationship tracking | — | ❌ Missing |
| Referral validation (entity type check) | — | ❌ Missing |
| Reward calculation | — | ❌ Missing |
| Reward wallet/credits | — | ❌ Missing |
| Referral history API | — | ❌ Missing |
| Referral emails | EMAIL_SYSTEM_AUDIT.md confirms missing | ❌ Missing |

### Current Referral Code Algorithm (actual code)

```javascript
// In userController.js registerUser:
const generatedReferralCode = `GSN${newUserId}${String(newUserId).padStart(4, '0')}`;
```

**Problem with current algorithm:**
- Predictable and sequential (ID-based).
- For IDs < 10000 the code is only 11 characters.
- Not cryptographically random — easily guessable.
- Does not encode entity type, so type-checking is impossible from the code alone.

---

## 8. Subscription & Payment Model

Companies pay for membership plans via:
1. **Bank transfer** — Upload payment proof → Admin reviews → Admin approves → Subscription activated
2. **PayPal** — PayPal order created → Submitted as subscription request → Admin reviews → Approved

All payments go through `subscription_requests` (pending state) before becoming active `user_subscriptions`.

**Reward integration point:** When admin approves a subscription (`approveSubscriptionRequest`), that is the ideal trigger for company referral rewards — the referred company has completed a qualifying paid action.

---

## 9. Notification & Email Infrastructure

### In-App Notifications
- `notifications` table + `user_notifications` join table
- `notificationService.js` handles creation
- Real-time delivery via WebSocket (`realTimeNotificationService.js`)
- Admin notifications via `admin_notifications` table

### Email Queue
- `emailQueue.js` — custom async queue, non-blocking
- `registrationEmailService.js` — registration lifecycle emails
- `subscriptionEmailService.js` — subscription lifecycle emails
- `quoteEmailService.js` — quote lifecycle emails
- `ticketEmailService.js` — support ticket emails
- SMTP: Titan Email (Nodemailer) at `smtp.titan.email:465`

### Confirmed Missing: Referral Emails
The `EMAIL_SYSTEM_AUDIT.md` (present in the project root) explicitly identifies:
> **Referral Acknowledgment Email — ❌ MISSING**

---

## 10. Referral & Rewards — Business Model

### Platform Context

GSN is a **subscription-funded B2B marketplace**. Revenue comes from:
1. Company membership subscriptions ($99–$199/month confirmed in codebase).
2. Potential transaction-level service fees (field exists in `transaction_invoices.service_fee`).

### Recommended Reward Mechanism: **Credit Wallet (Subscription Discount Credits)**

**Why credits over cash/points/commissions:**

| Mechanism | Fit for GSN |
|---|---|
| Cash payouts | ❌ Requires payment processor integration for outbound payments. No existing outbound payment infrastructure. |
| Discount on next subscription | ✅ Works within existing subscription approval flow. Admin already manually approves subscriptions. |
| Platform credits (wallet balance) | ✅ Clean, auditable, extensible. Credits reduce next subscription invoice amount. |
| Points system | ⚠️ Requires points-to-value conversion layer, adds complexity with no direct revenue tie. |
| Commission | ❌ Requires regulatory compliance for financial instruments. |

**Decision: Wallet Credits (USD value) that reduce the referrer's next subscription payment.**

For `user` and `business` roles (no subscription), credits can accumulate for:
- Future feature unlocks (e.g., extra quote submissions).
- Admin-issued reward adjustments.
- Documented for future monetization.

### How the Referral Program Creates Value

```
For the REFERRER:
  → Earns wallet credits for each successful referral
  → Credits applied automatically to reduce next subscription cost
  → Recognized in a referral leaderboard/dashboard

For the REFERRED entity:
  → Receives a one-time welcome discount on first subscription (if applicable)
  → Gains entry to the GSN network through a trusted connection

For the PLATFORM:
  → Organic, trusted growth through existing members
  → Lower customer acquisition cost vs. paid advertising
  → Network effects: more quality members → more quote activity → more revenue
```

### Who Funds the Rewards

- Rewards are funded from **subscription revenue** (platform absorbs cost).
- Admin controls reward amounts via configurable `referral_reward_rules` table.
- Admin can activate/deactivate rewards, change amounts per entity type, set expiry.

### Reward Amounts (configurable defaults)

| Referrer Type | Qualifying Event | Referrer Reward | Referred Reward |
|---|---|---|---|
| `company` refers `company` | Referred company's subscription approved by admin | $20 wallet credit | $10 off first subscription |
| `business` refers `business` | Referred business account approved by admin | $15 wallet credit | $0 (business has no subscription currently) |
| `user` refers `user` | Referred user account activated | $5 wallet credit | $0 (users have no subscription currently) |

> **Configurable:** Admin can change these amounts in the admin panel via `referral_reward_rules`.

### Reward Payout Triggers (per entity type)

| Entity Type | Trigger Event | Admin Approval Required |
|---|---|---|
| `company` | Admin approves referred company's **first subscription** | Automatic after subscription approval |
| `business` | Admin **activates** referred business account (`status = 1`) | Automatic after account activation |
| `user` | Referred user **registers** (status = 1 immediately) | Automatic (users auto-activate) |

### Reward Limits & Expiry

| Rule | Default Value | Configurable |
|---|---|---|
| Max referrals per referrer | 50 per year | ✅ |
| Credit expiry | 12 months from issue | ✅ |
| Max credit balance | $500 | ✅ |
| Reward per referral | See table above | ✅ |
| Self-referral | Blocked at API level | — |
| Same IP double referral | Flagged for admin review | — |

---

## 11. Referral Eligibility Matrix

This matrix is enforced **on the backend** by comparing `referrer.role` with `referred.role` at reward processing time.

```
✅ = Allowed
❌ = Blocked (HTTP 400 with specific error message)
```

| Referrer ↓ \ Referred → | user | business | company | admin |
|---|---|---|---|---|
| **user** | ✅ | ❌ | ❌ | ❌ |
| **business** | ❌ | ✅ | ❌ | ❌ |
| **company** | ❌ | ❌ | ✅ | ❌ |
| **admin** | — | — | — | — |

### How It Is Enforced

```javascript
// In referral validation logic (backend):
if (referrer.role !== referred.role) {
  return res.status(400).json({
    message: `Cross-entity referrals are not permitted. 
              A ${referrer.role} can only refer another ${referrer.role}.`,
    code: 'CROSS_ENTITY_REFERRAL'
  });
}
```

The frontend only shows same-type referral links and uses referral codes with an entity-type prefix as an additional soft indicator. However, **the backend is the authoritative gatekeeper**.

---

## 12. Unique Referral Code Generation Strategy

### Current Problem

The existing code:
```javascript
`GSN${newUserId}${String(newUserId).padStart(4, '0')}`
// GSN1200120001 → For user 1200120001 this breaks the format
// For user 42: GSN420042 → predictable
```

- Sequential, ID-based → easily guessable.
- No entity-type prefix → type cannot be inferred from code.
- Collision-prone for high IDs.

### Proposed New Format

```
{PREFIX}-{RANDOM6}-{CHECKSUM2}
```

| Segment | Description | Example |
|---|---|---|
| `PREFIX` | 3-char entity type prefix | `USR`, `BIZ`, `CMP` |
| `RANDOM6` | 6-char cryptographically random alphanumeric (uppercase) | `X7KQ9A` |
| `CHECKSUM2` | 2-char mod-36 checksum of RANDOM6 | `3F` |

**Full examples:**
```
USR-X7KQ9A-3F    ← Regular user referral code
BIZ-M4PR2X-7C   ← Business referral code
CMP-9AZTQ8-1D   ← Company referral code
```

**Prefix Map:**
```javascript
const ROLE_PREFIX = {
  user:     'USR',
  business: 'BIZ',
  company:  'CMP'
};
```

**Generation Algorithm:**
```javascript
import crypto from 'crypto';

function generateReferralCode(role) {
  const prefix = ROLE_PREFIX[role] || 'USR';
  const random = crypto.randomBytes(4)
    .toString('base64url')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 6)
    .padEnd(6, '0');
  
  // Simple checksum: sum of char codes mod 36, converted to base36
  const checksum = Array.from(random)
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % 1296; // 36^2
  const checksumStr = checksum.toString(36).toUpperCase().padStart(2, '0');
  
  return `${prefix}-${random}-${checksumStr}`;
}
```

**Uniqueness guarantee:** After generation, check DB for collision:
```javascript
let code, existing;
do {
  code = generateReferralCode(role);
  [existing] = await db.execute('SELECT id FROM users WHERE referral_code = ?', [code]);
} while (existing.length > 0);
```

**Migration for existing users:** The existing `GSN{id}{padded}` codes remain valid (backward compatible). New registrations get the new format. A migration script updates existing users' codes to the new format.

**Entity type validation from code prefix:**
```javascript
function getRoleFromCode(code) {
  const prefix = code.split('-')[0];
  return { USR: 'user', BIZ: 'business', CMP: 'company' }[prefix] || null;
}
```

This allows the backend to fast-reject cross-entity referrals simply by parsing the referral code prefix before even querying the database.

---

## 13. Proposed Database Schema — Referral & Rewards Tables

### Table: `referrals`

Tracks every referral relationship.

```sql
CREATE TABLE referrals (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  referral_code    VARCHAR(20) NOT NULL,          -- Code that was used
  referrer_id      INT NOT NULL,                  -- Who shared the code
  referred_id      INT NOT NULL,                  -- Who used the code
  referrer_role    ENUM('user','business','company') NOT NULL,
  referred_role    ENUM('user','business','company') NOT NULL,
  status           ENUM('pending','qualified','rewarded','rejected','expired')
                   NOT NULL DEFAULT 'pending',
  rejection_reason VARCHAR(255),
  registered_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,  -- When referred registered
  qualified_at     TIMESTAMP NULL,               -- When qualifying event occurred
  rewarded_at      TIMESTAMP NULL,               -- When reward was issued
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_referral_referrer
    FOREIGN KEY (referrer_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_referral_referred
    FOREIGN KEY (referred_id) REFERENCES users(id) ON DELETE CASCADE,
  
  UNIQUE KEY unique_referred (referred_id),      -- One referral per user (can only be referred once)
  INDEX idx_referrer_id (referrer_id),
  INDEX idx_referral_code (referral_code),
  INDEX idx_status (status)
);
```

### Table: `referral_reward_rules`

Admin-configurable reward amounts per entity type and trigger.

```sql
CREATE TABLE referral_reward_rules (
  id                    INT AUTO_INCREMENT PRIMARY KEY,
  entity_type           ENUM('user','business','company') NOT NULL,
  referrer_credit_usd   DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  referred_discount_usd DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  qualifying_event      ENUM('registration','account_activation','subscription_approved')
                        NOT NULL,
  max_referrals_per_year INT NOT NULL DEFAULT 50,
  max_wallet_balance    DECIMAL(10,2) NOT NULL DEFAULT 500.00,
  is_active             TINYINT(1) NOT NULL DEFAULT 1,
  created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  UNIQUE KEY unique_entity_type (entity_type)
);

-- Default seed data:
INSERT INTO referral_reward_rules 
  (entity_type, referrer_credit_usd, referred_discount_usd, qualifying_event, max_referrals_per_year)
VALUES
  ('user',     5.00,  0.00, 'registration',           50),
  ('business', 15.00, 0.00, 'account_activation',     50),
  ('company',  20.00, 10.00,'subscription_approved',  50);
```

### Table: `referral_wallet`

Each entity's credit balance (one row per user, across all roles).

```sql
CREATE TABLE referral_wallet (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  user_id        INT NOT NULL UNIQUE,
  balance_usd    DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  lifetime_earned DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  lifetime_used  DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_wallet_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Table: `referral_reward_transactions`

Immutable audit log of every credit issued, used, or expired.

```sql
CREATE TABLE referral_reward_transactions (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  referral_id      INT,                               -- FK to referrals (nullable for manual admin credits)
  user_id          INT NOT NULL,                      -- Wallet owner
  type             ENUM('credit','debit','expiry','admin_adjustment') NOT NULL,
  amount_usd       DECIMAL(10,2) NOT NULL,
  balance_after    DECIMAL(10,2) NOT NULL,            -- Snapshot of balance after transaction
  description      VARCHAR(500),
  trigger_event    VARCHAR(100),                      -- e.g. 'subscription_approved', 'registration'
  trigger_ref_id   INT,                               -- e.g. subscription_request.id or user.id
  expires_at       TIMESTAMP NULL,                    -- When this credit expires (NULL = never)
  status           ENUM('active','used','expired') NOT NULL DEFAULT 'active',
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_rrt_referral
    FOREIGN KEY (referral_id) REFERENCES referrals(id) ON DELETE SET NULL,
  CONSTRAINT fk_rrt_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  
  INDEX idx_user_id (user_id),
  INDEX idx_referral_id (referral_id),
  INDEX idx_expires_at (expires_at),
  INDEX idx_type (type)
);
```

### Referral Code Change on `users` Table

The `referral_code` column already exists. Only format changes:
```sql
ALTER TABLE users MODIFY COLUMN referral_code VARCHAR(20) UNIQUE;

-- Update existing codes with migration script
-- (server/migrations/upgrade_referral_codes.js)
```

### Entity Relationship Diagram

```
users
  ├── referrals (as referrer_id) ──────────────────────────────────┐
  ├── referrals (as referred_id — UNIQUE, one per user) ───────────┘
  ├── referral_wallet (1:1)
  └── referral_reward_transactions (1:many)

referrals
  └── referral_reward_rules (entity_type soft-link)

referral_reward_rules
  └── admin manages directly

referral_reward_transactions
  ├── referrals (FK referral_id)
  └── users (FK user_id)
```

---

## 14. Referral Lifecycle & Reward Distribution Workflow

### Phase 1 — Code Sharing

```
1. Entity (user/business/company) logs in
2. Views their referral code on their dashboard
3. Copies code or shares invite link:
   https://khaleeji.app/register?ref=CMP-9AZTQ8-1D
   (or /user-register?ref=USR-X7KQ9A-3F)
4. Frontend pre-fills referral code field on registration page
   based on query parameter
```

### Phase 2 — Registration with Referral Code

```
New entity registers:
  POST /api/user/register
  Body: { ..., referralCode: "CMP-9AZTQ8-1D" }

Backend validation steps:
  1. Parse prefix from referral code → infer expected entity type
  2. Validate code format (regex: ^(USR|BIZ|CMP)-[A-Z0-9]{6}-[A-Z0-9]{2}$
     OR legacy: ^GSN\d+$)
  3. Look up users WHERE referral_code = ?
  4. If not found → 400 "Invalid referral code"
  5. If referrer.role ≠ registering entity's role → 400 "Cross-entity referral not permitted"
  6. If referrer.id = new user's id → 400 "Self-referral not permitted"
  7. After user creation → INSERT INTO referrals (status = 'pending')
```

### Phase 3 — Qualifying Event Detection

```
Event A — user role:
  registerUser() → role = 'user' → status auto-set to 1
  → Immediately trigger: processReferralReward(referredId, 'registration')

Event B — business role:
  Admin calls activateUser() → sets status = 1
  → Trigger: processReferralReward(referredId, 'account_activation')

Event C — company role:
  Admin calls approveSubscriptionRequest() → subscription activated
  → Trigger: processReferralReward(referredId, 'subscription_approved', subscriptionRequestId)
```

### Phase 4 — Reward Processing (`processReferralReward`)

```javascript
// Idempotent: checks referrals.status before processing
async function processReferralReward(referredId, triggerEvent, triggerRefId = null) {
  // 1. Find referral record for this referred user
  const referral = await db.execute(
    'SELECT * FROM referrals WHERE referred_id = ? AND status = "pending"', [referredId]
  );
  if (!referral) return; // No referral or already processed

  // 2. Fetch reward rule for this entity type
  const rule = await db.execute(
    'SELECT * FROM referral_reward_rules WHERE entity_type = ? AND is_active = 1',
    [referral.referrer_role]
  );
  if (!rule || rule.referrer_credit_usd === 0) return;

  // 3. Check referrer annual limit
  const yearlyCount = COUNT(referrals WHERE referrer_id = ? AND status = 'rewarded' AND YEAR = current year);
  if (yearlyCount >= rule.max_referrals_per_year) {
    UPDATE referrals SET status = 'rejected', rejection_reason = 'annual_limit_exceeded'
    return;
  }

  // 4. Check referrer wallet cap
  const wallet = referral_wallet WHERE user_id = referrer_id;
  if (wallet.balance_usd + rule.referrer_credit_usd > rule.max_wallet_balance) {
    // Issue partial credit up to cap, or reject
  }

  // 5. DATABASE TRANSACTION — atomic
  BEGIN TRANSACTION;
    // a) Mark referral as rewarded
    UPDATE referrals SET status = 'rewarded', qualified_at = NOW(), rewarded_at = NOW()
    
    // b) Credit referrer wallet
    UPDATE referral_wallet SET balance_usd = balance_usd + ?, lifetime_earned = lifetime_earned + ?
    INSERT INTO referral_reward_transactions (type='credit', amount, trigger_event, trigger_ref_id, expires_at)
    
    // c) If referred_discount_usd > 0 → create a pending discount credit for referred entity
    INSERT INTO referral_reward_transactions (user_id = referred_id, type='credit', amount = discount, ...)
    UPSERT referral_wallet for referred entity
  COMMIT;

  // 6. Send notifications (in-app + email) — non-blocking
  await sendReferralRewardNotification(referrerId, amount);
}
```

### Phase 5 — Credit Redemption

```
When company submits subscription request:
  → Backend checks referral_wallet.balance_usd for user
  → If balance > 0: offer to apply credits as discount
  → On admin approval: 
      debit referral_wallet
      INSERT referral_reward_transactions (type='debit')
      Reduce subscription invoice amount accordingly
```

### Phase 6 — Credit Expiry (Cron Job)

```
Daily cron (node-cron or setInterval):
  SELECT * FROM referral_reward_transactions 
  WHERE type='credit' AND status='active' AND expires_at < NOW()
  
  For each expired credit:
    UPDATE referral_reward_transactions SET status='expired'
    UPDATE referral_wallet SET balance_usd = balance_usd - amount
    INSERT INTO referral_reward_transactions (type='expiry', ...)
    Send notification to user
```

---

## 15. API Endpoint Specifications

### New Route File: `server/routes/referralRoutes.js`

Mount in `index.js`:
```javascript
import referralRoutes from './routes/referralRoutes.js';
app.use('/api/referrals', referralRoutes);
```

---

### `GET /api/referrals/my-code`
**Access:** Any authenticated user  
**Purpose:** Get own referral code and stats

**Response:**
```json
{
  "referralCode": "CMP-9AZTQ8-1D",
  "shareLink": "https://khaleeji.app/register?ref=CMP-9AZTQ8-1D",
  "totalReferrals": 12,
  "totalRewarded": 8,
  "pendingReferrals": 4,
  "walletBalance": 160.00,
  "lifetimeEarned": 240.00
}
```

---

### `GET /api/referrals/history`
**Access:** Any authenticated user  
**Purpose:** List all referrals made by this user

**Query params:** `?page=1&limit=20&status=rewarded`

**Response:**
```json
{
  "referrals": [
    {
      "id": 5,
      "referredName": "Al Noor Logistics",
      "referredRole": "company",
      "status": "rewarded",
      "rewardAmount": 20.00,
      "registeredAt": "2026-09-15T10:23:00Z",
      "rewardedAt": "2026-09-22T14:00:00Z"
    }
  ],
  "pagination": { "total": 12, "page": 1, "totalPages": 1 }
}
```

---

### `GET /api/referrals/wallet`
**Access:** Any authenticated user  
**Purpose:** Get wallet balance and recent transactions

**Response:**
```json
{
  "balance": 160.00,
  "lifetimeEarned": 240.00,
  "lifetimeUsed": 80.00,
  "transactions": [
    {
      "id": 12,
      "type": "credit",
      "amount": 20.00,
      "description": "Referral reward: Al Noor Logistics joined",
      "triggerEvent": "subscription_approved",
      "createdAt": "2026-09-22T14:00:00Z",
      "expiresAt": "2027-09-22T14:00:00Z",
      "status": "active"
    }
  ]
}
```

---

### `POST /api/referrals/validate-code`
**Access:** Public (called during registration)  
**Purpose:** Validate a referral code before form submission

**Request:**
```json
{ "referralCode": "CMP-9AZTQ8-1D", "registrantRole": "company" }
```

**Response (valid):**
```json
{ "valid": true, "referrerName": "Gulf Cargo Ltd", "referrerRole": "company" }
```

**Response (cross-entity):**
```json
{ "valid": false, "code": "CROSS_ENTITY_REFERRAL",
  "message": "This referral code is for company registrations only." }
```

**Response (not found):**
```json
{ "valid": false, "code": "INVALID_CODE", "message": "Referral code not found." }
```

---

### `POST /api/referrals/apply-credits` *(internal / subscription flow)*
**Access:** Authenticated user + company role  
**Purpose:** Apply wallet credits to a subscription request

**Request:**
```json
{ "subscriptionRequestId": 42, "creditsToApply": 20.00 }
```

**Response:**
```json
{
  "applied": true,
  "creditsApplied": 20.00,
  "remainingBalance": 140.00,
  "newSubscriptionCost": 79.00
}
```

---

### `GET /api/referrals/admin/all` *(Admin)*
**Access:** `admin` role  
**Purpose:** View all referrals across platform

**Query params:** `?page=1&limit=50&status=pending&role=company`

---

### `GET /api/referrals/admin/rules` *(Admin)*
**Access:** `admin` role  
**Purpose:** Get reward configuration rules

---

### `PUT /api/referrals/admin/rules/:entityType` *(Admin)*
**Access:** `admin` role  
**Purpose:** Update reward amounts/limits

**Request:**
```json
{
  "referrerCreditUsd": 25.00,
  "referredDiscountUsd": 10.00,
  "maxReferralsPerYear": 100,
  "isActive": true
}
```

---

### `POST /api/referrals/admin/adjust-wallet` *(Admin)*
**Access:** `admin` role  
**Purpose:** Manual admin credit/debit adjustment

**Request:**
```json
{
  "userId": 55,
  "type": "credit",
  "amount": 10.00,
  "description": "Goodwill credit for referral processing delay"
}
```

---

## 16. Frontend Integration Requirements

### Components to Create

```
client/src/
  pages/
    Referrals/
      ReferralDashboard.jsx         ← Main referral page (tabbed: code + history + wallet)
      ReferralHistory.jsx           ← Referral list with status badges
      ReferralWallet.jsx            ← Balance + transaction history
  components/
    Referral/
      ReferralCodeCard.jsx          ← Shareable code + copy + QR code button
      ReferralStats.jsx             ← Stats cards: total, rewarded, pending, earned
      ReferralWalletBadge.jsx       ← Mini wallet balance shown in nav/sidebar
```

### Components to Modify

```
client/src/
  components/Login/RegisterPage.jsx
    → Read `?ref=` query param on mount, pre-fill referralCode field
    → Call /api/referrals/validate-code on blur of referral field
    → Show inline validation: "Valid referral from [Name]" or "Invalid code"
    → Show cross-entity error if role mismatch

  companyPages/CompanyDashboard/CompanyDashboard.jsx
    → Replace existing simple ReferralCard with full ReferralCodeCard component
    → Add wallet balance to dashboard metrics

  pages/UserDashboard/UserDashboard.jsx
    → Add ReferralCodeCard + mini stats

  pages/BusinessDashboard/BusinessDashboard.jsx  (pages/BusinessDashboard)
    → Add ReferralCodeCard + mini stats

  layouts/CompanyLayout.jsx / UserLayout.jsx / BusinessLayout.jsx
    → Add wallet balance indicator in sidebar

  pages/SubscriptionPage.jsx
    → Show wallet balance with option to apply credits
    → "Apply $20.00 credits" checkbox before payment submission

  client/src/App.jsx
    → Add routes:
        /company/referrals
        /user/referrals
        /business/referrals
        /admin/referrals-management
```

### Admin Panel Components to Create

```
client/src/pages/Admin/
  AdminReferrals.jsx          ← All referrals table + filter + status management
  AdminReferralRules.jsx      ← Edit reward rules per entity type
  AdminReferralWallets.jsx    ← View and adjust user wallets
```

### URL Share Links by Role

```javascript
// In ReferralCodeCard.jsx:
const getRegisterPath = (role) => {
  if (role === 'user')     return '/user-register';
  if (role === 'business') return '/register';  // pre-select Business
  if (role === 'company')  return '/register';  // pre-select Company
};

const shareLink = `${window.location.origin}${getRegisterPath(user.role)}?ref=${referralCode}`;
```

---

## 17. Security, Fraud Prevention & Validation Rules

### Backend Validations (all server-side)

| Rule | Implementation |
|---|---|
| Self-referral blocked | `referrer_id !== referred_id` check before INSERT |
| Cross-entity referral blocked | `referrer.role === referred.role` check |
| Duplicate referral blocked | `UNIQUE KEY unique_referred (referred_id)` on `referrals` table |
| Already rewarded idempotency | `WHERE status = 'pending'` before processing |
| Wallet cap enforcement | `wallet.balance + credit <= max_wallet_balance` |
| Annual limit check | COUNT(rewarded referrals in current year) |
| Invalid referral code | DB lookup; not found → ignore silently OR return validation error |
| Reward rule inactive | `WHERE is_active = 1` before processing |
| DB transaction atomicity | `BEGIN/COMMIT/ROLLBACK` wrapping all wallet + referral updates |

### Fraud Prevention

| Scenario | Mitigation |
|---|---|
| Fake account created just to refer | `business`/`company` accounts require admin approval before reward triggers |
| Same person creates multiple accounts | Email uniqueness constraint on `users.email` prevents this |
| Referral code shared publicly and misused | Cross-entity role check ensures only same-type registrants qualify |
| Replay attack (reward processed twice) | `UNIQUE KEY unique_referred` + idempotency check on `referrals.status` |
| Admin-level manipulation | All wallet changes are recorded in `referral_reward_transactions` with `admin_adjustment` type |
| Credit theft | Credits tied to `user_id`, not transferable |
| IP-based abuse | Log IP at registration; flag multiple accounts from same IP for admin review (enhancement) |

### Audit Logging

Every reward credit, debit, expiry, and adjustment is recorded immutably in `referral_reward_transactions` with:
- `user_id` (who)
- `type` (what)
- `amount_usd` (how much)
- `balance_after` (snapshot)
- `description` (why)
- `trigger_event` + `trigger_ref_id` (what caused it)
- `created_at` (when)

---

## 18. Implementation Plan — Files to Modify & Create

### Phase 1 — Database (Priority: Critical)

| # | Action | File |
|---|---|---|
| 1 | Create migration script | `server/migrations/add_referral_tables.js` |
| 2 | Creates: `referrals`, `referral_reward_rules`, `referral_wallet`, `referral_reward_transactions` | ^ |
| 3 | Seed default `referral_reward_rules` rows | ^ |
| 4 | Alter `users.referral_code` to VARCHAR(20) UNIQUE | ^ |
| 5 | Migrate existing referral codes to new format | `server/migrations/upgrade_referral_codes.js` |

### Phase 2 — Backend Service (Priority: Critical)

| # | Action | File |
|---|---|---|
| 6 | Create referral code generation utility | `server/utils/referralCodeUtils.js` |
| 7 | Create referral processing service | `server/services/referralService.js` |
| 8 | Create referral email service | `server/services/referralEmailService.js` |

### Phase 3 — Backend Controller & Routes (Priority: High)

| # | Action | File |
|---|---|---|
| 9 | Create referral controller | `server/controllers/referralController.js` |
| 10 | Create referral routes | `server/routes/referralRoutes.js` |
| 11 | Mount referral routes | **Modify** `server/index.js` |

### Phase 4 — Integrate Reward Triggers (Priority: High)

| # | Action | File to Modify |
|---|---|---|
| 12 | Call `processReferralReward` for `user` registrations | **Modify** `server/controllers/userController.js:registerUser` |
| 13 | Call `processReferralReward` for `business` activation | **Modify** `server/controllers/adminPanelController.js:activateUser` |
| 14 | Call `processReferralReward` for `company` subscription approval | **Modify** `server/controllers/subscriptionController.js:approveSubscriptionRequest` |
| 15 | Update referral code generation to new format | **Modify** `server/controllers/userController.js:registerUser` |
| 16 | Add credit application option to subscription activation | **Modify** `server/controllers/subscriptionController.js:activateSubscription` |

### Phase 5 — Frontend Pages (Priority: High)

| # | Action | File |
|---|---|---|
| 17 | Create ReferralCodeCard component | `client/src/components/Referral/ReferralCodeCard.jsx` |
| 18 | Create ReferralStats component | `client/src/components/Referral/ReferralStats.jsx` |
| 19 | Create ReferralWalletBadge component | `client/src/components/Referral/ReferralWalletBadge.jsx` |
| 20 | Create ReferralDashboard page | `client/src/pages/Referrals/ReferralDashboard.jsx` |
| 21 | Create ReferralHistory component | `client/src/pages/Referrals/ReferralHistory.jsx` |
| 22 | Create ReferralWallet component | `client/src/pages/Referrals/ReferralWallet.jsx` |

### Phase 6 — Frontend Modifications (Priority: High)

| # | Action | File to Modify |
|---|---|---|
| 23 | Pre-fill referral code from `?ref=` URL param + inline validation | **Modify** `client/src/components/Login/RegisterPage.jsx` |
| 24 | Add referral code pre-fill to user registration page | **Modify** `client/src/components/Login/UserRegisterPage.jsx` (if separate) |
| 25 | Upgrade ReferralCard on Company Dashboard | **Modify** `client/src/companyPages/CompanyDashboard/CompanyDashboard.jsx` |
| 26 | Add referral section to User Dashboard | **Modify** `client/src/pages/UserDashboard/UserDashboard.jsx` |
| 27 | Add referral section to Business Dashboard | **Modify** `client/src/pages/BusinessDashboard/BusinessDashboard.jsx` |
| 28 | Add wallet credit option to subscription flow | **Modify** `client/src/pages/SubscriptionPage.jsx` |
| 29 | Add referral routes to App.jsx | **Modify** `client/src/App.jsx` |

### Phase 7 — Admin Panel (Priority: Medium)

| # | Action | File |
|---|---|---|
| 30 | Create AdminReferrals page | `client/src/pages/Admin/AdminReferrals.jsx` |
| 31 | Create AdminReferralRules page | `client/src/pages/Admin/AdminReferralRules.jsx` |
| 32 | Add admin routes to App.jsx | **Modify** `client/src/App.jsx` |

### Phase 8 — Credit Expiry Cron (Priority: Medium)

| # | Action | File |
|---|---|---|
| 33 | Create credit expiry cron service | `server/services/referralExpiryService.js` |
| 34 | Initialize cron on server startup | **Modify** `server/index.js` |

### Phase 9 — Email Notifications (Priority: Medium)

| # | Action | File |
|---|---|---|
| 35 | Add referral reward email templates | `server/services/referralEmailService.js` |
| 36 | Queue referral emails after reward processing | Called from `referralService.js` |

---

## 19. Risks, Assumptions & Dependencies

### Risks

| Risk | Severity | Mitigation |
|---|---|---|
| DB migration breaks existing `referral_code` column (if NOT NULL) | High | Check column nullable before altering; run migration in transaction |
| Reward double-processing if `approveSubscriptionRequest` is called twice | High | `UNIQUE KEY unique_referred` prevents duplicate referrals; `status = 'pending'` guard |
| Legacy referral codes (`GSN42...`) break new validation regex | Medium | Support both formats: `^(USR\|BIZ\|CMP)-[A-Z0-9]{6}-[A-Z0-9]{2}$` OR `^GSN\d+$` |
| Performance: wallet queries on every subscription approval | Low | Wallet table indexed on `user_id`; single-row lookup is fast |
| Credit expiry cron job timing | Low | Run daily at off-peak hours; idempotent expiry logic |

### Assumptions

| Assumption | Rationale |
|---|---|
| `business` role users do NOT have a subscription system currently | No subscription routes authorize `business` role; `getMySubscription` returns empty for them |
| Rewards for `user` and `business` roles accumulate but cannot be redeemed immediately | No subscription to apply them to; tracked for future feature |
| Cross-entity referrals from `admin` role are not applicable | Admins are not members; no referral incentive |
| The existing `referral_code` column on `users` is nullable | Based on `update_referral_codes.js` checking for `IS NULL` records |
| No outbound payment system exists | Confirmed: no Stripe/PayPal payout routes in codebase |

### Dependencies

| Dependency | Used By |
|---|---|
| `db.js` pool | All new tables and queries |
| `authMiddleware.js` `protect`/`authorize` | All new routes |
| `subscriptionController.js:approveSubscriptionRequest` | Company referral reward trigger |
| `adminPanelController.js:activateUser` | Business referral reward trigger |
| `userController.js:registerUser` | User referral reward trigger + new code generation |
| `notificationService.js` | Referral reward in-app notifications |
| `emailQueue.js` | Referral email queueing |
| `dbRetry.js` | Resilient DB queries in referral service |

---

## 20. Testing Requirements

### Unit / Integration Tests (Backend)

| Scenario | Expected Outcome |
|---|---|
| Register with valid same-type referral code | Referral record created with status=pending |
| Register with cross-entity code (company code, but registering as user) | 400 error: CROSS_ENTITY_REFERRAL |
| Register with non-existent referral code | Code silently ignored OR validation error (depends on endpoint) |
| Self-referral attempt | 400 error: SELF_REFERRAL |
| Same user registered twice with same referral code | UNIQUE KEY blocks second referral record |
| User referral reward trigger on registration | Wallet credited $5, reward transaction created |
| Business referral reward trigger on activation | Wallet credited $15, reward transaction created |
| Company referral reward trigger on subscription approval | Wallet credited $20, reward transaction created |
| Reward rule set to is_active=0 | No reward issued |
| Annual referral limit exceeded | Referral status=rejected, rejection_reason=annual_limit_exceeded |
| Wallet cap reached | Reward either partially issued or rejected with cap_exceeded reason |
| DB transaction atomicity — simulate failure mid-transaction | No partial state; either all or nothing |
| Referral code generation collision | Retry loop produces unique code |
| Legacy code format (GSN42...) accepted | Backward-compatible validation passes |
| Admin adjusts wallet manually | Transaction recorded with type=admin_adjustment |

### Frontend Tests

| Scenario | Expected Outcome |
|---|---|
| `?ref=CMP-9AZTQ8-1D` in URL on /register | Referral code field pre-filled |
| Blur referral code field with valid code | Green validation tick + referrer name shown |
| Blur referral code field with cross-entity code | Red error message shown inline |
| Copy referral code button | Clipboard write triggered, toast shown |
| Share link generated correctly | Contains full URL with `?ref=` param |
| Wallet balance shown on subscription page | Balance displayed with checkbox to apply |

---

## Summary of Key Decisions

| Decision | Rationale |
|---|---|
| Single `users` table for all roles | Existing architecture — no separate entity tables |
| Credits (USD wallet) as reward mechanism | Best fit for subscription-based monetization; no outbound payment infrastructure |
| Admin-configurable reward rules table | Avoids hardcoded amounts; allows business rule changes without code deploys |
| Unique referral code with role prefix | Enables fast entity-type validation without DB lookup |
| `UNIQUE KEY unique_referred` | Prevents duplicate referral tracking for the same registered user |
| Reward trigger on qualifying event (not just signup) | Prevents fraudulent accounts from generating rewards |
| DB transaction wrapping wallet + referral updates | Ensures no partial reward state in the event of failure |
| Backward compatibility with legacy codes | Existing `GSN{id}...` codes remain valid; no forced migration breaks live users |

---

*This document was generated from a full review of the GSN Network codebase as of October 2026.*  
*Authors: Kiro AI — based on source code at `d:\GSN NETWORK`*  
*Next step: Implementation can begin from Phase 1 (database migration) following this blueprint.*
