# Sendy + AWS SES Troubleshooting Guide

## 🚨 **Most Likely Issue: AWS SES Sandbox Mode**

If your Sendy is using AWS SES, the **#1 reason** campaigns get stuck in "Sending" is:

### **AWS SES Sandbox Restrictions:**
- ✅ Can send emails to **verified addresses only**
- ❌ **Cannot send to unverified addresses**
- ❌ **Cannot send to general public**
- 📧 **Limited to 200 emails per day**
- ⏱️ **Maximum 1 email per second**

## 🔍 **How to Check AWS SES Status**

### **Method 1: Check Sendy Settings**
1. Login to your Sendy admin panel
2. Go to **Settings** → **Email Service Provider**
3. Look for AWS SES configuration
4. Check if it shows **"Sandbox"** or **"Production"**

### **Method 2: Check AWS Console**
1. Login to AWS Console
2. Go to **Simple Email Service (SES)**
3. Check **Sending Statistics**
4. Look for **"Sandbox"** notification at top

### **Method 3: Check Email Addresses**
1. In AWS SES Console
2. Go to **Verified Identities**
3. Check if recipient emails are verified
4. Look for **"Verified"** status

## 🚀 **Solutions Based on SES Status**

### **If in Sandbox Mode:**

#### **Option 1: Request Production Access (Recommended)**
1. In AWS SES Console
2. Click **"Request production access"**
3. Fill out the form:
   - **Use case**: Email marketing/notifications
   - **Website URL**: Your website
   - **Process description**: Describe your email campaigns
   - **Compliance**: Confirm you follow best practices
4. **Wait 24-48 hours** for approval

#### **Option 2: Verify Test Email Addresses**
For immediate testing:
1. In AWS SES Console
2. Go to **Verified Identities**
3. Click **"Create Identity"**
4. Add test email addresses
5. Verify via email confirmation

### **If in Production Mode:**

#### **Check Sending Limits:**
1. **Daily sending quota**: Check if exceeded
2. **Sending rate**: Check if too fast
3. **Bounce/complaint rates**: Must be low

#### **Check Email Reputation:**
1. **Bounce rate**: Must be < 5%
2. **Complaint rate**: Must be < 0.1%
3. **Suppression list**: Check for blocked emails

## 📧 **Sendy + AWS SES Configuration Check**

### **Required Sendy Settings:**
```
AWS Access Key ID: [Your AWS Key]
AWS Secret Access Key: [Your AWS Secret]
AWS SES Region: [e.g., us-east-1, eu-west-1]
```

### **Common Configuration Issues:**
1. **Wrong AWS region** - Must match SES setup
2. **Invalid credentials** - Keys expired or wrong
3. **Insufficient permissions** - IAM policy issues
4. **Rate limiting** - Sending too fast for SES limits

## 🛠️ **Diagnostic Steps**

### **Step 1: Check Sendy Error Logs**
1. Access your server via FTP/SSH
2. Check Sendy installation folder
3. Look for error logs or debug files
4. Search for AWS SES errors

### **Step 2: Test AWS SES Directly**
Create a simple test to verify SES is working:

```php
<?php
// Test AWS SES connection
require 'vendor/autoload.php';
use Aws\Ses\SesClient;

$client = SesClient::factory([
    'version' => 'latest',
    'region' => 'us-east-1', // Your region
    'credentials' => [
        'key' => 'YOUR_AWS_KEY',
        'secret' => 'YOUR_AWS_SECRET'
    ]
]);

try {
    $result = $client->sendEmail([
        'Source' => 'info@gulfstarnetwork.com',
        'Destination' => [
            'ToAddresses' => ['test@example.com']
        ],
        'Message' => [
            'Subject' => ['Data' => 'Test Email'],
            'Body' => ['Text' => ['Data' => 'This is a test']]
        ]
    ]);
    echo "Email sent successfully!";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>
```

### **Step 3: Check AWS SES Sending Statistics**
1. AWS Console → SES → Sending Statistics
2. Look for:
   - **Sends**: Should increase when campaigns run
   - **Bounces**: Should be low
   - **Complaints**: Should be very low
   - **Delivery Delays**: Check for issues

## 🎯 **Most Common Solutions**

### **Solution 1: Move Out of Sandbox**
- **Request production access** from AWS
- **Usually approved within 24-48 hours**
- **Allows sending to any email address**

### **Solution 2: Verify Email Addresses**
- **Add recipient emails** to verified identities
- **Confirm verification** via email
- **Test with verified addresses only**

### **Solution 3: Check Sending Limits**
- **Daily quota**: Increase if needed
- **Sending rate**: Reduce if hitting limits
- **Monitor usage** in AWS console

### **Solution 4: Fix Configuration**
- **Verify AWS credentials** in Sendy
- **Check AWS region** matches SES setup
- **Update IAM permissions** if needed

## 📊 **How to Verify the Fix**

### **After Making Changes:**
1. **Create test campaign** in Sendy
2. **Send to verified email address**
3. **Monitor AWS SES statistics**
4. **Check email delivery**
5. **Verify campaign status** changes to "Sent"

### **Success Indicators:**
- ✅ AWS SES shows increased "Sends"
- ✅ Campaign status changes from "Sending" to "Sent"
- ✅ Emails arrive in recipient inboxes
- ✅ No errors in Sendy or AWS logs

## 🚨 **Emergency Workaround**

If you need to send emails immediately:

### **Use SMTP Instead of SES:**
1. In Sendy settings
2. Switch from AWS SES to SMTP
3. Use your current SMTP settings:
   ```
   Host: smtp.titan.email
   Port: 465
   Username: root@khaleeji.app
   Password: [Your password]
   ```

This bypasses AWS SES issues temporarily.

## 📞 **Contact Points**

### **If AWS SES Issues:**
- **AWS Support**: For production access requests
- **Sendy Support**: For configuration help
- **Hosting Provider**: For server-level issues

### **If Still Stuck:**
The combination of **AWS SES sandbox mode** + **missing cron job** is likely causing your campaigns to get stuck in "Sending" status.

**Priority order:**
1. **Check AWS SES sandbox status** (most likely cause)
2. **Request production access** if in sandbox
3. **Set up proper cron job** for campaign processing
4. **Verify Sendy configuration** with AWS credentials