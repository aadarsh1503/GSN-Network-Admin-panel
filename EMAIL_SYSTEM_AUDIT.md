# GSN Network - Email System Audit

## Summary

| Category | Implemented | Missing |
|----------|-------------|---------|
| Registration Emails | ✅ 9 types | - |
| Subscription Emails | ✅ 6 types | ❌ Renewal Reminder, Expiry Alert |
| Quote Emails | ✅ 8 types | - |
| Ticket/Support Emails | ✅ 3 types | - |
| Password Reset | ✅ 1 type | - |
| Email Verification | ✅ 1 type | - |
| **Certificate Email** | ❌ MISSING | - |
| **Invitation Email** | ❌ MISSING | - |
| **Referral Acknowledgment** | ❌ MISSING | - |

---

## ✅ IMPLEMENTED EMAILS

### 1. Registration Emails (`registrationEmailService.js`)

| # | Email Type | Trigger | Recipient |
|---|-----------|---------|-----------|
| 1 | `userWelcome` | User registers | Regular User |
| 2 | `businessWelcome` | Business registers | Business User |
| 3 | `companyWelcomePending` | Company registers | Company User |
| 4 | `adminNewUserNotification` | Any new registration | All Admins |
| 5 | `companyApproved` | Admin approves company | Company User |
| 6 | `adminCompanyApprovalNotification` | Admin approves company | Admin |
| 7 | `accountDeactivated` | Admin deactivates account | User/Company |
| 8 | `accountBlacklisted` | Admin blacklists account | User/Company |
| 9 | `accountUnblacklisted` | Admin removes from blacklist | User/Company |

---

### 2. Subscription Emails (`subscriptionEmailService.js`)

| # | Email Type | Trigger | Recipient |
|---|-----------|---------|-----------|
| 1 | `adminNewPaymentProof` | Company submits payment proof | All Admins |
| 2 | `companyPaymentSubmitted` | Company submits payment proof | Company |
| 3 | `companyPaymentApproved` | Admin approves payment | Company |
| 4 | `adminPaymentApproved` | Admin approves payment | Admin (confirmation) |
| 5 | `companyPaymentRejected` | Admin rejects payment | Company |
| 6 | `adminPaymentRejected` | Admin rejects payment | Admin (audit log) |

---

### 3. Quote Emails (`quoteEmailService.js` + `emailService.js`)

| # | Email Type | Trigger | Recipient |
|---|-----------|---------|-----------|
| 1 | Quote Request Confirmation | User submits quote | User/Business |
| 2 | New Quote Available | Quote submitted | All Companies |
| 3 | Quote Response Received | Company responds | User/Business |
| 4 | Quote Accepted (User) | User accepts quote | User |
| 5 | Quote Accepted (Company) | User accepts quote | Company |
| 6 | Quote Rejected | User rejects quote | Company |
| 7 | Quote Status Update | Company updates status | User |
| 8 | Thank You (Acceptance) | User accepts quote | User |

---

### 4. Support Ticket Emails (`ticketEmailService.js`)

| # | Email Type | Trigger | Recipient |
|---|-----------|---------|-----------|
| 1 | `ticket_created` | New ticket submitted | Admin / Company |
| 2 | `ticket_response` | Admin/Company responds | Ticket Creator |
| 3 | `ticket_status_update` | Status changes | Ticket Creator |

---

### 5. Password Reset (`passwordResetService.js`)

| # | Email Type | Trigger | Recipient |
|---|-----------|---------|-----------|
| 1 | Password Reset Link | User requests reset | User (all roles) |

---

### 6. Email Verification (`emailVerificationService.js`)

| # | Email Type | Trigger | Recipient |
|---|-----------|---------|-----------|
| 1 | Email Verification | Business user registers | Business User |

---

## ❌ MISSING EMAILS (Not Implemented)

### 1. Invitation Email
- **What it should do:** Admin sends invitation to potential Company/Business users
- **Trigger:** Admin manually sends invite from panel
- **Recipient:** Invited person's email
- **Status:** No service, no controller, no route exists

---

### 2. Certificate Email
- **What it should do:** Send membership certificate to approved Company/Business users
- **Trigger:** Account approved OR subscription activated
- **Recipient:** Company/Business user
- **Status:** Certificate page exists on frontend (`MyCertificatePage.jsx`) but no email sending logic

---

### 3. Subscription Renewal Reminder
- **What it should do:** Remind company before subscription expires
- **Trigger:** Cron job — 7 days, 3 days, 1 day before expiry
- **Recipient:** Company user
- **Status:** No cron job, no reminder service exists

---

### 4. Subscription Expiry Alert
- **What it should do:** Notify company when subscription has expired
- **Trigger:** Cron job — on expiry date
- **Recipient:** Company user
- **Status:** No cron job, no expiry alert service exists

---

### 5. Referral Acknowledgment Email
- **What it should do:** Thank user who referred someone + notify new user about referral
- **Trigger:** New user registers with referral code
- **Recipient:** Referrer + New User
- **Status:** Referral code field exists in registration but no email logic

---

## Email Infrastructure

| Component | Status |
|-----------|--------|
| SMTP (Nodemailer) | ✅ Configured via `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS` |
| Email History Logging | ✅ `email_history` table |
| Email Notifications Logging | ✅ `email_notifications` table |
| Cron Jobs for Reminders | ❌ Not implemented |
| Invitation System | ❌ Not implemented |
| Certificate Email | ❌ Not implemented |
| Referral Email | ❌ Not implemented |
