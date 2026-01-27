// services/adminNotificationService.js
import db from '../config/db.js';

// Create an admin notification
const createAdminNotification = async (type, title, message, userId = null, additionalData = null) => {
    try {
        // First try with additional_data column
        let sql = `
            INSERT INTO admin_notifications (type, title, message, user_id, additional_data, created_at, is_read)
            VALUES (?, ?, ?, ?, ?, NOW(), 0)
        `;
        
        let values = [
            type, 
            title, 
            message, 
            userId, 
            additionalData ? JSON.stringify(additionalData) : null
        ];

        try {
            const [result] = await db.execute(sql, values);
            console.log(`✅ Admin notification created: ${title}`);
            return result.insertId;
        } catch (columnError) {
            // If additional_data column doesn't exist, try without it
            if (columnError.code === 'ER_BAD_FIELD_ERROR') {
                console.log('⚠️ additional_data column not found, creating notification without it...');
                sql = `
                    INSERT INTO admin_notifications (type, title, message, user_id, created_at, is_read)
                    VALUES (?, ?, ?, ?, NOW(), 0)
                `;
                values = [type, title, message, userId];
                
                const [result] = await db.execute(sql, values);
                console.log(`✅ Admin notification created (without additional_data): ${title}`);
                return result.insertId;
            } else {
                throw columnError;
            }
        }
    } catch (error) {
        console.error('❌ Error creating admin notification:', error);
        throw error;
    }
};

// Send quote acceptance notification to admin
const sendQuoteAcceptanceNotificationToAdmin = async (userId, userName, companyId, companyName, quoteId, amount) => {
    try {
        const title = `Quote #${quoteId} Accepted`;
        const message = `${userName} has accepted a quote from ${companyName} for Quote #${quoteId}. Amount: ${amount}`;
        
        const additionalData = {
            quote_id: quoteId,
            user_id: userId,
            user_name: userName,
            company_id: companyId,
            company_name: companyName,
            amount: amount,
            action_type: 'quote_accepted'
        };
        
        await createAdminNotification('quote', title, message, userId, additionalData);
        console.log(`✅ Quote acceptance notification sent to admin for quote ${quoteId}`);
    } catch (error) {
        console.error('❌ Error sending quote acceptance notification to admin:', error);
        throw error;
    }
};

// Send quote rejection notification to admin
const sendQuoteRejectionNotificationToAdmin = async (userId, userName, companyId, companyName, quoteId) => {
    try {
        const title = `Quote #${quoteId} Rejected`;
        const message = `${userName} has rejected a quote from ${companyName} for Quote #${quoteId}`;
        
        const additionalData = {
            quote_id: quoteId,
            user_id: userId,
            user_name: userName,
            company_id: companyId,
            company_name: companyName,
            action_type: 'quote_rejected'
        };
        
        await createAdminNotification('quote', title, message, userId, additionalData);
        console.log(`✅ Quote rejection notification sent to admin for quote ${quoteId}`);
    } catch (error) {
        console.error('❌ Error sending quote rejection notification to admin:', error);
        throw error;
    }
};

// Send new quote request notification to admin
const sendNewQuoteRequestNotificationToAdmin = async (userId, userName, quoteId, origin, destination) => {
    try {
        const title = `New Quote Request #${quoteId}`;
        const message = `${userName} has submitted a new quote request from ${origin} to ${destination}`;
        
        const additionalData = {
            quote_id: quoteId,
            user_id: userId,
            user_name: userName,
            origin: origin,
            destination: destination,
            action_type: 'quote_requested'
        };
        
        await createAdminNotification('quote', title, message, userId, additionalData);
        console.log(`✅ New quote request notification sent to admin for quote ${quoteId}`);
    } catch (error) {
        console.error('❌ Error sending new quote request notification to admin:', error);
        throw error;
    }
};

// Send quote response notification to admin
const sendQuoteResponseNotificationToAdmin = async (userId, userName, companyId, companyName, quoteId, price, transitTime) => {
    try {
        const title = `New Quote Response #${quoteId}`;
        const message = `${companyName} has submitted a response to Quote #${quoteId} from ${userName}. Price: $${price}, Transit Time: ${transitTime}`;
        
        const additionalData = {
            quote_id: quoteId,
            user_id: userId,
            user_name: userName,
            company_id: companyId,
            company_name: companyName,
            price: price,
            transit_time: transitTime,
            action_type: 'quote_response_submitted'
        };
        
        await createAdminNotification('quote', title, message, userId, additionalData);
        console.log(`✅ Quote response notification sent to admin for quote ${quoteId}`);
    } catch (error) {
        console.error('❌ Error sending quote response notification to admin:', error);
        throw error;
    }
};

// Send dispute notification to admin
const sendDisputeNotificationToAdmin = async (userId, userName, disputeId, companyName, reason) => {
    try {
        const title = `New Dispute #${disputeId}`;
        const message = `${userName} has filed a dispute against ${companyName}. Reason: ${reason}`;
        
        const additionalData = {
            dispute_id: disputeId,
            user_id: userId,
            user_name: userName,
            company_name: companyName,
            reason: reason,
            action_type: 'dispute_filed'
        };
        
        await createAdminNotification('dispute', title, message, userId, additionalData);
        console.log(`✅ Dispute notification sent to admin for dispute ${disputeId}`);
    } catch (error) {
        console.error('❌ Error sending dispute notification to admin:', error);
        throw error;
    }
};

// Send ticket notification to admin
const sendTicketNotificationToAdmin = async (userId, userName, ticketId, subject, priority) => {
    try {
        const title = `New Support Ticket #${ticketId}`;
        const message = `${userName} has submitted a new support ticket: ${subject}`;
        
        const additionalData = {
            ticket_id: ticketId,
            user_id: userId,
            user_name: userName,
            subject: subject,
            priority: priority,
            action_type: 'ticket_created'
        };
        
        await createAdminNotification('ticket', title, message, userId, additionalData);
        console.log(`✅ Ticket notification sent to admin for ticket ${ticketId}`);
    } catch (error) {
        console.error('❌ Error sending ticket notification to admin:', error);
        throw error;
    }
};

// Send user registration notification to admin
const sendUserRegistrationNotificationToAdmin = async (userId, userName, userRole, userEmail) => {
    try {
        const title = `New ${userRole.charAt(0).toUpperCase() + userRole.slice(1)} Registration`;
        const message = `${userName} (${userEmail}) has registered as a ${userRole}`;
        
        const additionalData = {
            user_id: userId,
            user_name: userName,
            user_role: userRole,
            user_email: userEmail,
            action_type: 'user_registered'
        };
        
        await createAdminNotification('registration', title, message, userId, additionalData);
        console.log(`✅ User registration notification sent to admin for user ${userId}`);
    } catch (error) {
        console.error('❌ Error sending user registration notification to admin:', error);
        throw error;
    }
};

// Send subscription payment proof notification to admin
const sendSubscriptionPaymentProofNotificationToAdmin = async (userId, userName, planName, planPrice, transactionId, requestId) => {
    try {
        const title = `New Subscription Payment Proof Submitted`;
        const message = `${userName} has submitted payment proof for ${planName} subscription (₹${planPrice}). Transaction ID: ${transactionId}. Please review and approve/reject the request.`;
        
        const additionalData = {
            user_id: userId,
            user_name: userName,
            plan_name: planName,
            plan_price: planPrice,
            transaction_id: transactionId,
            request_id: requestId,
            action_type: 'subscription_payment_proof_submitted'
        };
        
        await createAdminNotification('subscription', title, message, userId, additionalData);
        console.log(`✅ Subscription payment proof notification sent to admin for request ${requestId}`);
    } catch (error) {
        console.error('❌ Error sending subscription payment proof notification to admin:', error);
        throw error;
    }
};

export {
    createAdminNotification,
    sendQuoteAcceptanceNotificationToAdmin,
    sendQuoteRejectionNotificationToAdmin,
    sendNewQuoteRequestNotificationToAdmin,
    sendQuoteResponseNotificationToAdmin,
    sendDisputeNotificationToAdmin,
    sendTicketNotificationToAdmin,
    sendUserRegistrationNotificationToAdmin,
    sendSubscriptionPaymentProofNotificationToAdmin
};