// services/sendyService.js - Fixed version with SSL support
import fetch from 'node-fetch';
import FormData from 'form-data';
import https from 'https';

// Create multiple SSL agent configurations to try different approaches
const createSSLAgent = () => {
    // Try different SSL configurations
    const configs = [
        {
            rejectUnauthorized: false,
            secureProtocol: 'TLSv1_2_method',
            ciphers: 'ALL'
        },
        {
            rejectUnauthorized: false,
            secureProtocol: 'TLSv1_method'
        },
        {
            rejectUnauthorized: false
        }
    ];
    
    // Return the first configuration for now
    return new https.Agent(configs[0]);
};

const agent = createSSLAgent();

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
            body: params,
            agent: agent
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
        console.log(`📧 Creating Sendy campaign with subject: ${subject}`);
        
        const formData = new FormData();
        formData.append('api_key', SENDY_API_KEY);
        formData.append('from_name', fromName);
        formData.append('from_email', fromEmail);
        formData.append('reply_to', replyTo);
        formData.append('subject', subject);
        formData.append('html_text', htmlContent);
        formData.append('list_ids', SENDY_LIST_ID);
        formData.append('brand_id', '22'); // Correct Brand ID
        formData.append('send_campaign', '1'); // Send immediately

        console.log(`📧 Sending to Sendy API: ${SENDY_URL}/api/campaigns/create.php`);
        
        const response = await fetch(`${SENDY_URL}/api/campaigns/create.php`, {
            method: 'POST',
            body: formData,
            headers: formData.getHeaders(),
            agent: agent
        });

        const result = await response.text();
        console.log(`📧 Sendy API response:`, result);
        
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
        console.log('Available lists:', SENDY_LISTS);
        console.log('Default list ID:', SENDY_LIST_ID);
        return SENDY_LIST_ID;
    }
    console.log(`📋 Using Sendy list for ${userType}: ${listId}`);
    return listId;
};

// Send targeted campaign to specific Sendy list based on user type
const sendBulkEmailViaSendy = async (users, subject, htmlContent, userType = 'all') => {
    try {
        console.log(`📧 Processing ${users.length} users for Sendy campaign to ${userType} list...`);
        
        // Get the appropriate list ID for this user type
        const targetListId = getSendyListForUserType(userType);
        
        if (!targetListId) {
            console.log(`❌ No Sendy list configured for user type: ${userType}`);
            return { success: false, message: `No Sendy list configured for user type: ${userType}` };
        }
        
        console.log(`📋 Target list for ${userType}: ${targetListId}`);
        
        // SENDY-ONLY APPROACH: Create campaign directly for the target list
        // This bypasses the 404 API issue and focuses on campaign creation
        console.log(`🚀 Creating Sendy campaign for ${userType} list...`);
        console.log(`📧 Campaign will be sent to existing subscribers in the ${userType} list`);
        
        // Add debugging for campaign creation
        console.log(`🔧 Campaign details:`);
        console.log(`   Subject: ${subject}`);
        console.log(`   Target List: ${targetListId}`);
        console.log(`   User Type: ${userType}`);
        console.log(`   HTML Content Length: ${htmlContent.length} characters`);
        console.log(`   Selected Users: ${users.length} (for reference only)`);
        
        const campaignResult = await sendSendyCampaignToListImmediate(subject, htmlContent, targetListId);
        
        console.log(`📧 Sendy campaign result:`, campaignResult);
        
        if (campaignResult.success) {
            // Create success response focused on Sendy
            return {
                success: true,
                message: `Sendy campaign created successfully for ${userType} list!`,
                details: {
                    targetListId,
                    userType,
                    selectedUsers: users.length,
                    campaignStatus: 'Created and Sending',
                    deliveryNote: 'Campaign will be delivered to existing subscribers in the Sendy list',
                    statusNote: 'Campaign will show "Sending" status initially - this is normal Sendy behavior'
                },
                campaignResult,
                method: 'sendy_direct'
            };
        } else {
            return {
                success: false,
                message: `Sendy campaign creation failed: ${campaignResult.message}`,
                details: {
                    targetListId,
                    userType,
                    selectedUsers: users.length,
                    error: campaignResult.message
                },
                campaignResult,
                method: 'sendy_direct'
            };
        }
    } catch (error) {
        console.error('❌ Error in Sendy campaign creation:', error);
        return { 
            success: false, 
            message: 'Failed to create Sendy campaign', 
            error: error.message,
            method: 'sendy_direct'
        };
        console.error('❌ Error in targeted Sendy campaign:', error);
        return { success: false, message: 'Failed to send targeted campaign via Sendy', error: error.message };
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
            
            // Use API endpoint only (more reliable and works with our SSL fix)
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
            await new Promise(resolve => setTimeout(resolve, 300));
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

// Add a single user to a specific Sendy list using API endpoint
const addUserToSendyList = async (email, name, listId) => {
    try {
        console.log(`📧 Adding ${email} to list ${listId} using API endpoint...`);
        
        const formData = new FormData();
        formData.append('api_key', SENDY_API_KEY);
        formData.append('email', email);
        formData.append('list', listId);
        if (name) {
            formData.append('name', name);
        }
        formData.append('boolean', 'true');

        const response = await fetch(`${SENDY_URL}/api/subscribers/add.php`, {
            method: 'POST',
            body: formData,
            headers: formData.getHeaders(),
            agent: agent
        });

        const result = await response.text();
        console.log(`📧 API subscription response for ${email}:`, result);
        
        // Check Sendy API responses
        if (result === '1') {
            return { success: true, message: 'Successfully added to list' };
        } else if (result === 'Already subscribed') {
            return { success: true, message: 'Already subscribed to list' };
        } else if (result === 'Invalid email address') {
            return { success: false, message: 'Invalid email address' };
        } else if (result === 'List does not exist') {
            return { success: false, message: 'List does not exist' };
        } else if (result === 'Invalid API key') {
            return { success: false, message: 'Invalid API key' };
        } else {
            return { success: false, message: `API error: ${result}` };
        }
    } catch (error) {
        console.error('Error adding user to Sendy list via API:', error);
        return { success: false, message: 'Failed to add to list via API' };
    }
};

// Fallback method using public subscription endpoint
const addUserToSendyListPublic = async (email, name, listId) => {
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
            body: params,
            agent: agent
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
        console.error('Error adding user to Sendy list via public endpoint:', error);
        return { success: false, message: 'Failed to add to list' };
    }
};

// Send campaign to specific Sendy list with immediate processing
// Send campaign to specific Sendy list with immediate processing
export const sendSendyCampaignToListImmediate = async (subject, htmlContent, listId, fromName = 'GSN Network', fromEmail = 'info@gulfstarnetwork.com', replyTo = 'info@gulfstarnetwork.com', sendImmediately = true) => {
    try {
        console.log(`📧 Creating Sendy campaign for list ${listId}...`);
        console.log(`📧 Campaign details: Subject="${subject}", From="${fromEmail}"`);
        console.log(`📧 Using brand_id: 22 (correct brand ID)`);
        console.log(`📧 Using list_ids: ${listId}`);
        
        const formData = new FormData();
        formData.append('api_key', SENDY_API_KEY);
        formData.append('from_name', fromName);
        formData.append('from_email', fromEmail);
        formData.append('reply_to', replyTo);
        formData.append('title', subject); // Title is required by the API
        formData.append('subject', subject);
        formData.append('html_text', htmlContent);
        formData.append('list_ids', listId);
        formData.append('brand_id', '22'); // Correct brand ID
        
        // Send campaign immediately (1) or save as draft (0)
        formData.append('send_campaign', sendImmediately ? '1' : '0'); 
        
        // Enable tracking
        formData.append('track_opens', '1');
        formData.append('track_clicks', '1');
        
        // Optional parameters for better deliverability
        formData.append('query_string', ''); // Empty query string
        
        console.log(`📧 Sending campaign request to: ${SENDY_URL}/api/campaigns/create.php`);

        const response = await fetch(`${SENDY_URL}/api/campaigns/create.php`, {
            method: 'POST',
            body: formData,
            headers: formData.getHeaders(),
            agent: agent
        });

        const result = await response.text();
        console.log(`📧 Sendy API response: "${result}"`);
        
        // Handle all possible Sendy API responses according to official documentation
        if (result === 'Campaign created and now sending') {
            console.log('✅ Campaign created and now sending');
            
            if (sendImmediately) {
                // Trigger scheduled.php to ensure immediate processing
                console.log('🚀 Triggering Sendy scheduled.php for immediate processing...');
                
                for (let i = 0; i < 3; i++) {
                    try {
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        
                        const triggerResponse = await fetch(`${SENDY_URL}/scheduled.php`, {
                            method: 'GET',
                            headers: {
                                'User-Agent': 'Mozilla/5.0 (compatible; SendyCron/1.0)'
                            },
                            agent: agent
                        });
                        
                        console.log(`📧 Trigger attempt ${i + 1} status: ${triggerResponse.status}`);
                        
                        if (triggerResponse.status === 200) {
                            console.log(`✅ Trigger ${i + 1} successful`);
                        }
                    } catch (triggerError) {
                        console.log(`⚠️ Trigger attempt ${i + 1} failed: ${triggerError.message}`);
                    }
                }
            }
            
            return { 
                success: true, 
                message: 'Campaign created and now sending'
            };
        } else if (result === 'Campaign created') {
            console.log('✅ Campaign created as draft');
            return { 
                success: true, 
                message: 'Campaign created as draft'
            };
        } else if (result === 'Campaign scheduled') {
            console.log('✅ Campaign scheduled successfully');
            return { 
                success: true, 
                message: 'Campaign scheduled successfully'
            };
        } else if (result.includes('Error:')) {
            console.log(`❌ Sendy API error: ${result}`);
            
            // Handle specific errors
            if (result.includes('Brand ID not passed')) {
                console.log('❌ Brand ID issue - using brand_id: 22');
            } else if (result.includes('List or segment ID(s) not passed')) {
                console.log(`❌ List ID issue - using list_ids: ${listId}`);
            } else if (result.includes('Invalid API key')) {
                console.log('❌ API key issue - check SENDY_API_KEY in .env');
            }
            
            return { success: false, message: result };
        } else {
            console.log(`⚠️ Unexpected Sendy response: "${result}"`);
            return { success: false, message: `Unexpected response: ${result}` };
        }
    } catch (error) {
        console.error('❌ Error sending Sendy campaign:', error);
        return { success: false, message: 'Failed to send campaign through Sendy' };
    }
};

// Get subscriber count from specific Sendy list
const getSendyListSubscriberCount = async (listId) => {
    try {
        const response = await fetch(`${SENDY_URL}/api/subscribers/active-subscriber-count.php`, {
            method: 'POST',
            body: new URLSearchParams({
                'api_key': SENDY_API_KEY,
                'list_id': listId
            }),
            agent: agent
        });

        const result = await response.text();
        
        // If it's a number, return it, otherwise return 0
        const count = parseInt(result);
        return isNaN(count) ? 0 : count;
    } catch (error) {
        console.error('Error getting Sendy list subscriber count:', error);
        return 0;
    }
};

// Get subscriber count from default Sendy list (for backward compatibility)
const getSendySubscriberCount = async () => {
    return await getSendyListSubscriberCount(SENDY_LIST_ID);
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
            body: formData,
            agent: agent
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
    addUsersToSendyList,
    addUserToSendyList,
    addUserToSendyListPublic,
    getSendyListForUserType,
    getSendySubscriberCount,
    getSendyListSubscriberCount,
    SENDY_LISTS,
    SENDY_LIST_ID,
    SENDY_URL
};