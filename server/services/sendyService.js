// services/sendyService.js
import fetch from 'node-fetch';

const SENDY_URL = process.env.SENDY_URL || 'https://send.alzyara.com';
const SENDY_API_KEY = process.env.SENDY_API_KEY;

// Sendy List IDs for different user types
const SENDY_LISTS = {
    all: process.env.SENDY_LIST_ALL_USERS,
    users: process.env.SENDY_LIST_REGULAR_USERS,
    companies: process.env.SENDY_LIST_COMPANY_MEMBERS,
    business_owners: process.env.SENDY_LIST_BUSINESS_OWNERS,
    subscribers: process.env.SENDY_LIST_ACTIVE_SUBSCRIBERS
};

// Default list for backward compatibility
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

// Get the appropriate Sendy list ID based on user type
const getSendyListForUserType = (userType) => {
    const listId = SENDY_LISTS[userType];
    if (!listId) {
        console.warn(`⚠️ No Sendy list found for user type: ${userType}, using default list`);
        return SENDY_LIST_ID;
    }
    console.log(`📋 Using Sendy list for ${userType}: ${listId}`);
    return listId;
};

// Send targeted campaign to specific Sendy list based on user type
const sendBulkEmailViaSendy = async (users, subject, htmlContent, userType = 'all') => {
    try {
        console.log(`📧 Processing ${users.length} users for targeted Sendy campaign to ${userType} list...`);
        
        // Get the appropriate list ID for this user type
        const targetListId = getSendyListForUserType(userType);
        
        if (!targetListId) {
            return { success: false, message: `No Sendy list configured for user type: ${userType}` };
        }
        
        console.log(`📋 Target list for ${userType}: ${targetListId}`);
        
        // Step 1: Add selected users to the target Sendy list
        console.log(`👥 Adding ${users.length} users to ${userType} Sendy list...`);
        const subscriptionResults = await addUsersToSendyList(users, targetListId);
        
        console.log(`📊 Subscription results:`, subscriptionResults);
        
        if (subscriptionResults.successful === 0) {
            return { 
                success: false, 
                message: `Failed to add any users to ${userType} Sendy list. Cannot send campaign to empty list.`,
                subscriptionResults 
            };
        }
        
        // Step 2: Wait for Sendy to process the subscriptions
        console.log('⏳ Waiting for Sendy to process subscriptions...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Step 3: Send campaign to the target list (now has users)
        console.log(`📨 Sending campaign to ${userType} list (${targetListId}) with ${subscriptionResults.successful} users...`);
        const campaignResult = await sendSendyCampaignToList(subject, htmlContent, targetListId);
        
        return {
            success: campaignResult.success,
            message: campaignResult.success 
                ? `Campaign sent successfully to ${userType} list! Added ${subscriptionResults.successful} users to both ${userType} list and All Users list, then sent campaign.`
                : campaignResult.message,
            targetListId,
            userType,
            totalUsers: users.length,
            subscriptionResults
        };
    } catch (error) {
        console.error('Error in targeted Sendy campaign:', error);
        return { success: false, message: 'Failed to send targeted campaign via Sendy' };
    }
};

// Add users to a specific Sendy list AND the "All Users" list
const addUsersToSendyList = async (users, listId) => {
    const results = {
        successful: 0,
        failed: 0,
        alreadySubscribed: 0,
        errors: []
    };

    console.log(`📧 Adding ${users.length} users to Sendy list ${listId} AND All Users list...`);

    // Get the All Users list ID
    const allUsersListId = SENDY_LISTS.all;

    // Process users one by one to avoid overwhelming the server
    for (const user of users) {
        try {
            console.log(`📧 Adding ${user.email} to target list ${listId}...`);
            
            // Add to specific target list
            const targetResult = await addUserToSendyList(user.email, user.name, listId);
            
            // Also add to "All Users" list (if it's different from target list)
            let allUsersResult = { success: true, message: 'Same as target list' };
            if (listId !== allUsersListId && allUsersListId) {
                console.log(`📧 Also adding ${user.email} to All Users list ${allUsersListId}...`);
                allUsersResult = await addUserToSendyList(user.email, user.name, allUsersListId);
            }
            
            // Consider it successful if at least the target list addition worked
            if (targetResult.success) {
                if (targetResult.message && targetResult.message.includes('Already subscribed')) {
                    results.alreadySubscribed++;
                    console.log(`ℹ️ ${user.email} already in target list`);
                } else {
                    results.successful++;
                    console.log(`✅ ${user.email} added to target list`);
                }
                
                // Log All Users list result
                if (listId !== allUsersListId && allUsersListId) {
                    if (allUsersResult.success) {
                        console.log(`✅ ${user.email} also added to All Users list`);
                    } else {
                        console.log(`⚠️ ${user.email} failed to add to All Users list: ${allUsersResult.message}`);
                    }
                }
            } else {
                results.failed++;
                results.errors.push({
                    email: user.email,
                    error: targetResult.message
                });
                console.log(`❌ ${user.email} failed: ${targetResult.message}`);
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

    console.log(`📊 List addition results: ${results.successful} successful, ${results.alreadySubscribed} already subscribed, ${results.failed} failed`);
    return results;
};

// Add a single user to a specific Sendy list using public subscription endpoint
const addUserToSendyList = async (email, name, listId) => {
    try {
        console.log(`📧 Adding ${email} to list ${listId} using public endpoint...`);
        
        const params = new URLSearchParams();
        params.append('email', email);
        params.append('list', listId);
        if (name) {
            params.append('name', name);
        }
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
        console.log(`📧 Public subscription response for ${email}:`, result);
        
        // Check if the response contains success indicators
        if (result.includes("You're subscribed!") || result.includes('subscribed')) {
            return { success: true, message: 'Successfully added to list' };
        } else if (result.includes('Already subscribed')) {
            return { success: true, message: 'Already subscribed to list' };
        } else if (result.includes('Invalid email')) {
            return { success: false, message: 'Invalid email address' };
        } else if (result.includes('List does not exist')) {
            return { success: false, message: 'List does not exist' };
        } else {
            return { success: false, message: result };
        }
    } catch (error) {
        console.error('Error adding user to Sendy list:', error);
        return { success: false, message: 'Failed to add to list' };
    }
};

// Send campaign to specific Sendy list
const sendSendyCampaignToList = async (subject, htmlContent, listId, fromName = 'GSN Network', fromEmail = 'info@gulfstarnetwork.com', replyTo = 'info@gulfstarnetwork.com') => {
    try {
        const formData = new FormData();
        formData.append('api_key', SENDY_API_KEY);
        formData.append('from_name', fromName);
        formData.append('from_email', fromEmail);
        formData.append('reply_to', replyTo);
        formData.append('subject', subject);
        formData.append('html_text', htmlContent);
        formData.append('list_ids', listId);
        formData.append('send_campaign', '1'); // Send immediately

        const response = await fetch(`${SENDY_URL}/api/campaigns/create.php`, {
            method: 'POST',
            body: formData
        });

        const result = await response.text();
        console.log(`📧 Campaign response for list ${listId}:`, result);
        
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
    sendSendyCampaignToList,
    addUsersToSendyList,
    addUserToSendyList,
    getSendyListForUserType,
    getSendySubscriberCount,
    SENDY_LISTS,
    SENDY_LIST_ID,
    SENDY_URL
};