// services/messageService.js
import db from '../config/db.js';

// Create a system message (from system to user)
const createSystemMessage = async (receiverId, subject, message, quoteId = null) => {
    try {
        // Check if receiver is admin - if so, create admin notification instead
        const [receiverCheck] = await db.execute('SELECT role FROM users WHERE id = ?', [receiverId]);
        
        if (receiverCheck.length > 0 && receiverCheck[0].role === 'admin') {
            // Don't send system messages to admin - they should get notifications instead
            console.log(`Skipping system message to admin user ${receiverId}: ${subject}`);
            return null;
        }
        
        // Use system user ID (1) or create a dedicated system user
        const systemUserId = 1; // You can create a dedicated system user in your database
        
        const sql = `
            INSERT INTO messages (
                sender_id, receiver_id, subject, message, quote_id, 
                is_read, created_at
            ) VALUES (?, ?, ?, ?, ?, 0, NOW())
        `;

        const [result] = await db.execute(sql, [systemUserId, receiverId, subject, message, quoteId]);
        
        console.log(`System message sent to user ${receiverId}: ${subject}`);
        return result.insertId;
    } catch (error) {
        console.error('Error creating system message:', error);
        throw error;
    }
};

// Send quote acceptance message to company
const sendQuoteAcceptanceMessage = async (companyId, userName, quoteId) => {
    try {
        const subject = `Quote #${quoteId} Accepted!`;
        const message = `Great news! ${userName} has accepted your quote for Quote #${quoteId}. 

You can now proceed with the shipment arrangements. Please contact the customer to finalize the details.

Next Steps:
1. Review the quote details
2. Contact the customer
3. Arrange shipment logistics
4. Update the quote status as needed

Thank you for your prompt response!`;

        await createSystemMessage(companyId, subject, message, quoteId);
        console.log(`Quote acceptance message sent to company ${companyId} for quote ${quoteId}`);
    } catch (error) {
        console.error('Error sending quote acceptance message:', error);
        throw error;
    }
};

// Send quote rejection message to company
const sendQuoteRejectionMessage = async (companyId, userName, quoteId) => {
    try {
        const subject = `Quote #${quoteId} Not Selected`;
        const message = `${userName} has decided not to proceed with your quote for Quote #${quoteId}.

Thank you for your participation. We encourage you to continue responding to other quote requests.

Tips for Future Quotes:
- Competitive pricing
- Clear terms and conditions
- Fast response time
- Detailed service inclusions

Keep up the good work!`;

        await createSystemMessage(companyId, subject, message, quoteId);
        console.log(`Quote rejection message sent to company ${companyId} for quote ${quoteId}`);
    } catch (error) {
        console.error('Error sending quote rejection message:', error);
        throw error;
    }
};

// Send status update message to user
const sendStatusUpdateMessage = async (userId, quoteId, status) => {
    try {
        const subject = `Quote #${quoteId} Status Update`;
        const statusMessages = {
            'pending': 'Your quote is pending and waiting for responses from freight forwarders.',
            'running': 'Your quote is now active! You have accepted a quote and the shipment process is underway.',
            'closed': 'Your quote has been closed. Thank you for using our service.'
        };

        const message = `Your quote #${quoteId} status has been updated to: ${status.toUpperCase()}

${statusMessages[status] || 'Your quote status has been updated.'}

You can view the full details of your quote in the My Quotes section.`;

        await createSystemMessage(userId, subject, message, quoteId);
        console.log(`Status update message sent to user ${userId} for quote ${quoteId}`);
    } catch (error) {
        console.error('Error sending status update message:', error);
        throw error;
    }
};

// Send quote response message to user (when business responds to quote)
const sendQuoteResponseMessage = async (userId, companyName, quoteId, price, transitTime) => {
    try {
        const subject = `New Quote Response - Quote #${quoteId}`;
        const message = `You have received a new quote response for Quote #${quoteId}!

Company: ${companyName}
Price: ${price}
Transit Time: ${transitTime}

Please review the quote details and decide whether to accept or reject this offer.

You can view all quote responses in your My Quotes section.`;

        await createSystemMessage(userId, subject, message, quoteId);
        console.log(`Quote response message sent to user ${userId} for quote ${quoteId}`);
    } catch (error) {
        console.error('Error sending quote response message:', error);
        throw error;
    }
};

export {
    createSystemMessage,
    sendQuoteAcceptanceMessage,
    sendQuoteRejectionMessage,
    sendStatusUpdateMessage,
    sendQuoteResponseMessage
};