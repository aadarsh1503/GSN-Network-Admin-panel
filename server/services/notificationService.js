// services/notificationService.js
import db from '../config/db.js';

// Create a notification in the database
const createNotification = async (targetRole, title, message, imageUrl = null, targetAudience = 'users') => {
    try {
        const sql = `
            INSERT INTO notifications (target_role, title, message, image, target_audience, created_at)
            VALUES (?, ?, ?, ?, ?, NOW())
        `;
        
        const [result] = await db.execute(sql, [targetRole, title, message, imageUrl, targetAudience]);
        return result.insertId;
    } catch (error) {
        console.error('Error creating notification:', error);
        throw error;
    }
};

// Create a user-specific notification record
const createUserNotification = async (userId, notificationId) => {
    try {
        const sql = `
            INSERT INTO user_notifications (user_id, notification_id, is_read)
            VALUES (?, ?, 0)
        `;
        
        await db.execute(sql, [userId, notificationId]);
    } catch (error) {
        console.error('Error creating user notification:', error);
        throw error;
    }
};

// Send quote acceptance notification to company
const sendQuoteAcceptanceNotificationToCompany = async (companyId, userName, quoteId) => {
    try {
        console.log(`🔍 DEBUG: sendQuoteAcceptanceNotificationToCompany called with:`, {
            companyId,
            userName,
            quoteId,
            timestamp: new Date().toISOString()
        });
        
        const title = 'Quote Accepted!';
        const message = `Great news! ${userName} has accepted your quote for Quote #${quoteId}. You can now proceed with the shipment arrangements.`;
        
        // Create user-specific notification (not general)
        const notificationId = await createNotification('user_specific', title, message, null, 'companies');
        
        console.log(`🔍 DEBUG: Created notification ID: ${notificationId}`);
        
        // Create user-specific notification record for the company
        await createUserNotification(companyId, notificationId);
        
        console.log(`🔍 DEBUG: Quote acceptance notification sent to company ${companyId} for quote ${quoteId}`);
    } catch (error) {
        console.error('Error sending quote acceptance notification:', error);
        throw error;
    }
};

// Send quote rejection notification to company
const sendQuoteRejectionNotificationToCompany = async (companyId, userName, quoteId) => {
    try {
        const title = 'Quote Not Selected';
        const message = `${userName} has decided not to proceed with your quote for Quote #${quoteId}. Thank you for your participation. We encourage you to continue responding to other quote requests.`;
        
        // Create user-specific notification (not general)
        const notificationId = await createNotification('user_specific', title, message, null, 'companies');
        
        // Create user-specific notification record for the company
        await createUserNotification(companyId, notificationId);
        
        console.log(`Quote rejection notification sent to company ${companyId} for quote ${quoteId}`);
    } catch (error) {
        console.error('Error sending quote rejection notification:', error);
        throw error;
    }
};

// Send status update notification to user
const sendStatusUpdateNotificationToUser = async (userId, quoteId, status) => {
    try {
        const title = 'Quote Status Update';
        const message = `Your quote #${quoteId} status has been updated to: ${status.charAt(0).toUpperCase() + status.slice(1)}`;
        
        // Create user-specific notification (not general)
        const notificationId = await createNotification('user_specific', title, message, null, 'users');
        
        // Create user-specific notification record
        await createUserNotification(userId, notificationId);
        
        console.log(`Status update notification sent to user ${userId} for quote ${quoteId}`);
    } catch (error) {
        console.error('Error sending status update notification:', error);
        throw error;
    }
};

// Send dispute status update notification to user
const sendDisputeStatusUpdateNotificationToUser = async (userId, disputeId, status, companyName) => {
    try {
        const title = 'Dispute Status Update';
        const message = `Your dispute #${disputeId} against ${companyName} has been updated to: ${status.charAt(0).toUpperCase() + status.slice(1)}`;
        
        // Create user-specific notification (not general)
        const notificationId = await createNotification('user_specific', title, message, null, 'users');
        
        // Create user-specific notification record
        await createUserNotification(userId, notificationId);
        
        console.log(`Dispute status update notification sent to user ${userId} for dispute ${disputeId}`);
    } catch (error) {
        console.error('Error sending dispute status update notification:', error);
        throw error;
    }
};

// Send dispute response notification to user
const sendDisputeResponseNotificationToUser = async (userId, disputeId, companyName) => {
    try {
        const title = 'New Dispute Response';
        const message = `${companyName} has responded to your dispute #${disputeId}. Please check your dispute details for more information.`;
        
        // Create user-specific notification (not general)
        const notificationId = await createNotification('user_specific', title, message, null, 'users');
        
        // Create user-specific notification record
        await createUserNotification(userId, notificationId);
        
        console.log(`Dispute response notification sent to user ${userId} for dispute ${disputeId}`);
    } catch (error) {
        console.error('Error sending dispute response notification:', error);
        throw error;
    }
};

// Send quote response notification to user (when business responds to quote)
const sendQuoteResponseNotificationToUser = async (userId, companyName, quoteId, price, transitTime) => {
    try {
        const title = 'New Quote Response';
        const message = `${companyName} has responded to your Quote #${quoteId} with a price of ${price} and transit time of ${transitTime}. Please review and respond.`;
        
        // Create user-specific notification (not general)
        const notificationId = await createNotification('user_specific', title, message, null, 'users');
        
        // Create user-specific notification record
        await createUserNotification(userId, notificationId);
        
        console.log(`Quote response notification sent to user ${userId} for quote ${quoteId}`);
    } catch (error) {
        console.error('Error sending quote response notification:', error);
        throw error;
    }
};

export {
    createNotification,
    createUserNotification,
    sendQuoteAcceptanceNotificationToCompany,
    sendQuoteRejectionNotificationToCompany,
    sendStatusUpdateNotificationToUser,
    sendDisputeStatusUpdateNotificationToUser,
    sendDisputeResponseNotificationToUser,
    sendQuoteResponseNotificationToUser
};