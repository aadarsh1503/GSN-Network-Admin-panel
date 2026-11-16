# GSN — Quote Rewards Quick Reference

## Coupon Code Format
```
QRC-CMP00842-A3F9   ← Company (quote #842)
QRC-USR00842-B7K2   ← User
QRC-BIZ00842-C3D1   ← Business
```
**Prefix map:** `CMP` = company · `USR` = user · `BIZ` = business  
**Format:** `QRC-{PREFIX}{5-digit quote ID}-{4-char random}`

---

## Quote Flow + Reward Triggers

```
Quote submitted      → pending
Admin approves       → approved
Company responds     → approved
User accepts         → payment_pending
User uploads proof   → payment_uploaded
Company VERIFIES ✅  → approved    ← TRIGGER A (partial credit)
Company → RUNNING    → running
Company CLOSES ✅    → closed      ← TRIGGER B (credit + coupon)
```

---

## Rewards Per Completed Transaction

| Event | Company | User / Business |
|---|---|---|
| **A** — Payment verified | +$10 credit | +$5 credit |
| **B** — Quote closed | +$10 credit + **coupon** | +$5 credit + **coupon** |
| **TOTAL** | **$20 + 1 coupon** | **$10 + 1 coupon** |

Coupon = **10% off next subscription** (max $50, expires 6 months)

---

## Coupon States
```
active → used (redeemed at subscription payment)
active → expired (daily cron, expires_at < NOW)
active → revoked (admin only)
```

---

## 3 New DB Tables

| Table | Purpose |
|---|---|
| `quote_reward_rules` | Admin-configurable amounts per trigger |
| `quote_reward_coupons` | Issued coupon codes + status |
| `quote_rewards` | Audit log, idempotency guard |

Wallet reuses **`referral_wallet`** + **`referral_reward_transactions`** from PROFILE.md.

---

## Where Reward Hooks Go (2 lines of code each)

**`paymentRoutes.js`** — inside `PUT /verify-enhanced`, after `createTransactionInvoice`:
```js
processQuoteReward('payment_verified', quoteId, userId, companyId, price)
  .catch(err => console.error('Reward error:', err));
```

**`companyQuoteController.js`** — inside `updateQuoteStatus`, when `status === 'closed'`:
```js
processQuoteReward('quote_closed', quoteId, quoteInfo.user_id, companyId)
  .catch(err => console.error('Reward error:', err));
```

---

## Fraud Guards

- Reward only fires if payment was **verified** first (no reward for fake closures)
- `UNIQUE KEY (quote_id, trigger_event)` prevents double rewards
- Coupon only redeemable by the person it was issued to
- Role prefix on coupon blocks cross-role redemption

---

## Files to Create

```
server/migrations/add_quote_reward_tables.js
server/utils/quoteCouponUtils.js
server/services/quoteRewardService.js
server/controllers/quoteRewardController.js
server/routes/quoteRewardRoutes.js
client/src/pages/Rewards/RewardsDashboard.jsx
client/src/pages/Admin/AdminRewardRules.jsx
```

## Files to Modify

```
server/index.js                          → mount /api/quote-rewards
server/routes/paymentRoutes.js           → hook at verify-enhanced
server/controllers/companyQuoteController.js → hook at status=closed
server/controllers/subscriptionController.js → accept couponCode
client/src/pages/SubscriptionPage.jsx    → coupon input + discount preview
client/src/App.jsx                       → add reward routes
```

---

> Full details → `QUOTE_REWARDS_WORKFLOW.md` · Architecture → `PROFILE.md`
