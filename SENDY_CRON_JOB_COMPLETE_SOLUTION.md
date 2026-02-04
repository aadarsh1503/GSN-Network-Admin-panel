# Sendy "Sending" Status Issue - Complete Solution

## Problem Summary
- Campaigns from your application: Stuck in "Sending" status ❌
- Campaigns from Sendy admin: Work fine and show "Sent" ✅
- This indicates: **Sendy cron job is not running**

## Root Cause
Sendy requires a cron job to run `scheduled.php` every minute to process campaigns created via API. Manual campaigns in Sendy admin bypass this requirement.

## Immediate Actions Required

### Step 1: Contact Hosting Provider (URGENT)
Send this exact message to your hosting provider (alzyara.com):

```
Subject: URGENT - Sendy Cron Job Setup Required

Hello,

My Sendy installation at https://send.alzyara.com needs a cron job to process email campaigns.

ISSUE: Campaigns created via API are stuck in "Sending" status and never send emails.

REQUIRED CRON JOB:
* * * * * /usr/bin/php /path/to/sendy/scheduled.php > /dev/null 2>&1

Please:
1. Set up this cron job to run every minute
2. Ensure correct PHP path (might be /usr/local/bin/php or /opt/php/bin/php)
3. Verify file permissions on scheduled.php
4. Confirm the correct path to your Sendy installation

This is critical for my email marketing system to function.

Please respond with confirmation once set up.

Thank you!
```

### Step 2: Alternative Cron Job Formats
If the above doesn't work, ask them to try these variations:

```bash
# Option 1 (most common)
* * * * * /usr/bin/php /home/username/public_html/sendy/scheduled.php

# Option 2 (alternative PHP path)
* * * * * /usr/local/bin/php /home/username/public_html/sendy/scheduled.php

# Option 3 (with full path)
* * * * * php /var/www/html/sendy/scheduled.php

# Option 4 (with wget alternative)
* * * * * wget -O - https://send.alzyara.com/scheduled.php >/dev/null 2>&1
```

### Step 3: Verify Cron Job Setup
Ask your hosting provider to confirm:

1. **Cron job is active** and running every minute
2. **PHP path is correct** for your server
3. **File permissions** are set properly (755 for scheduled.php)
4. **No error logs** in cron execution
5. **Sendy path** is correct on the server

## Technical Details

### Why Manual Campaigns Work
- Sendy admin panel has built-in processing
- Bypasses the cron job requirement
- Processes campaigns immediately

### Why API Campaigns Don't Work
- API creates campaigns in "pending" state
- Requires cron job to process and send
- Without cron job, they stay "Sending" forever

### What the Cron Job Does
- Runs every minute
- Checks for pending campaigns
- Processes email sending in batches
- Updates campaign status from "Sending" to "Sent"
- Handles bounces and unsubscribes

## Expected Timeline

### After Cron Job Setup:
1. **Immediate**: New campaigns will start processing
2. **1-2 minutes**: Existing "Sending" campaigns should start sending
3. **5-10 minutes**: All pending campaigns should complete

### Verification Steps:
1. Create a test campaign from your app
2. Should show "Sending" initially (normal)
3. Within 1-2 minutes, emails should start arriving
4. Campaign status should change to "Sent" when complete

## Backup Solutions

### If Hosting Provider Can't Help:
1. **Switch to SMTP** temporarily for urgent emails
2. **Use manual campaigns** in Sendy admin for important sends
3. **Consider different hosting** that supports cron jobs properly

### If Cron Jobs Are Restricted:
Some hosting providers offer:
- **Scheduled tasks** instead of cron jobs
- **Web-based cron services** (like cron-job.org)
- **WordPress cron** if you have WordPress installed

## Common Hosting Provider Responses

### "We don't support cron jobs"
- Ask about "scheduled tasks" or "task scheduler"
- Request web-based alternatives
- Consider upgrading hosting plan

### "Cron job is set up but not working"
- Ask for cron job execution logs
- Verify PHP path and file permissions
- Test with wget alternative

### "Need more details"
- Provide your Sendy installation path
- Share this documentation
- Request technical support escalation

## Final Notes

This is a **server configuration issue**, not a code problem. Your application is working correctly - it's creating campaigns successfully. The issue is purely that Sendy needs server-level cron job support to process these campaigns.

Once the cron job is set up, all your "Sending" campaigns should start processing immediately, and future campaigns will work perfectly.