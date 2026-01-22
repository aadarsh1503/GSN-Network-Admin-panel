// services/sendyService.js
import fetch from 'node-fetch';

const SENDY_URL = process.env.SENDY_URL || 'https://send.alzyara.com';
const SENDY_API_KEY = process.env.SENDY_API_KEY;
const SENDY_LIST_ID = process.env.SENDY_LIST_ID;

// Subscribe a user to Sendy list using public endpoint
const subscribeToSendyPublic = async (email, name = '') => {
    try {
        const params = new URLSearchParams();
        params.append('email', email);
        params.append('name', name);
        params.append('list', SENDY_LIST_ID);
        params.append('subform', 'yes');
        params.append('hp', ''); // Honeypot field

        const response = await fetch(`${SENDY_URL}/subscribe`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params
        });

        const result = await response.text();
        
        // Check if the response contains success indicators
        if (result.includes("You're subscribed!") || result.includes('subscribed')) {
            return { success: true, message: 'Successfully subscribed to newsletter' };
        } else if (result.includes('Already subscribed')) {
            return { success: true, message: 'Already subscribed to newsletter' };
        } else {
            return { success: false, message: 'Subscription failed' };
        }
    } catch (error) {
        console.error('Error subscribing to Sendy:', error);
        return { success: false, message: 'Failed to subscribe to newsletter' };
    }
};

// Send campaign through Sendy API
const sendSendyCampaign = async (subject, htmlContent, fromName = 'GSN Network', fromEmail = 'info@gulfstarnetwork.com', replyTo = 'info@gulfstarnetwork.com') => {
    try {
        const formData = new FormData();
        formData.append('api_key', SENDY_API_KEY);
        formData.append('from_name', fromName);
        formData.append('from_email', fromEmail);
        formData.append('reply_to', replyTo);
        formData.append('subject', subject);
        formData.append('html_text', htmlContent);
        formData.append('list_ids', SENDY_LIST_ID);
        formData.append('send_campaign', '1'); // Send immediately

        const response = await fetch(`${SENDY_URL}/api/campaigns/create.php`, {
            method: 'POST',
            body: formData
        });

        const result = await response.text();
        
        if (result === 'Campaign created and sent') {
            return { success: true, message: 'Campaign sent successfully through Sendy' };
        } else if (result.includes('Campaign created')) {
            return { success: true, message: 'Campaign created successfully in Sendy' };
        } else {
            return { success: false, message: result };
        }
    } catch (error) {
        console.error('Error sending Sendy campaign:', error);
        return { success: false, message: 'Failed to send campaign through Sendy' };
    }
};

// Add subscribers to Sendy and send campaign
const sendBulkEmailViaSendy = async (users, subject, htmlContent) => {
    try {
        console.log(`📧 Processing ${users.length} users for Sendy campaign...`);
        
        // Step 1: Add all users to Sendy list using the API
        console.log('📝 Adding users to Sendy list...');
        const subscriptionResults = await bulkSubscribeToSendy(users);
        
        console.log(`📊 Subscription results:`, subscriptionResults);

        // Step 2: Wait a moment for Sendy to process the subscriptions
        console.log('⏳ Waiting for Sendy to process subscriptions...');
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Step 3: Send the campaign
        console.log(`📨 Sending campaign via Sendy...`);
        const campaignResult = await sendSendyCampaign(subject, htmlContent);
        
        return {
            success: campaignResult.success,
            message: campaignResult.success 
                ? `Campaign sent successfully! Added ${subscriptionResults.successful} users to list and sent campaign.`
                : campaignResult.message,
            subscriptionResults,
            totalUsers: users.length
        };
    } catch (error) {
        console.error('Error in bulk email via Sendy:', error);
        return { success: false, message: 'Failed to send bulk email via Sendy' };
    }
};

// Get subscriber count from Sendy
const getSendySubscriberCount = async () => {
    try {
        const formData = new FormData();
        formData.append('api_key', SENDY_API_KEY);
        formData.append('list_id', SENDY_LIST_ID);

        const response = await fetch(`${SENDY_URL}/api/subscribers/active-subscriber-count.php`, {
            method: 'POST',
            body: formData
        });

        const result = await response.text();
        
        // If it's a number, return it, otherwise return 0
        const count = parseInt(result);
        return isNaN(count) ? 0 : count;
    } catch (error) {
        console.error('Error getting Sendy subscriber count:', error);
        return 0;
    }
};

// Bulk subscribe users to Sendy using public endpoint
const bulkSubscribeToSendy = async (users) => {
    const results = {
        successful: 0,
        failed: 0,
        alreadySubscribed: 0,
        errors: []
    };

    // Process users one by one to avoid overwhelming the server
    for (const user of users) {
        try {
            console.log(`📧 Adding ${user.email} to Sendy list...`);
            const result = await subscribeToSendyPublic(user.email, user.name);
            
            if (result.success) {
                if (result.message.includes('Already subscribed')) {
                    results.alreadySubscribed++;
                    console.log(`ℹ️ ${user.email} already subscribed`);
                } else {
                    results.successful++;
                    console.log(`✅ ${user.email} subscribed successfully`);
                }
            } else {
                results.failed++;
                results.errors.push({
                    email: user.email,
                    error: result.message
                });
                console.log(`❌ ${user.email} failed: ${result.message}`);
            }
            
            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
            results.failed++;
            results.errors.push({
                email: user.email,
                error: error.message
            });
            console.log(`❌ ${user.email} error: ${error.message}`);
        }
    }

    return results;
};

// Unsubscribe a user from Sendy list
const unsubscribeFromSendy = async (email) => {
    try {
        const formData = new FormData();
        formData.append('api_key', SENDY_API_KEY);
        formData.append('email', email);
        formData.append('list_id', SENDY_LIST_ID);
        formData.append('boolean', 'true');

        const response = await fetch(`${SENDY_URL}/api/subscribers/delete.php`, {
            method: 'POST',
            body: formData
        });

        const result = await response.text();
        
        if (result === '1') {
            return { success: true, message: 'Successfully unsubscribed' };
        } else {
            return { success: false, message: result };
        }
    } catch (error) {
        console.error('Error unsubscribing from Sendy:', error);
        return { success: false, message: 'Failed to unsubscribe' };
    }
};

export {
    subscribeToSendyPublic,
    bulkSubscribeToSendy,
    unsubscribeFromSendy,
    sendSendyCampaign,
    sendBulkEmailViaSendy,
    getSendySubscriberCount,
    SENDY_LIST_ID,
    SENDY_URL
};