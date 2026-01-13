import { broadcastNotification, broadcastToRole, NOTIFICATION_EVENTS } from '../routes/realTimeNotificationRoutes.js';
import db from '../config/db.js';

class RealTimeNotificationService {
  
  // Admin Panel Notifications
  async notifyNewUserRegistration(userData) {
    try {
      const data = {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        created_at: userData.created_at
      };

      // Broadcast to all admin users
      broadcastToRole(NOTIFICATION_EVENTS.ADMIN.NEW_USER_REGISTRATION, data, 'admin');
      
      console.log('✅ New user registration notification sent');
    } catch (error) {
      console.error('Error sending new user registration notification:', error);
    }
  }

  async notifyNewCompanyRegistration(companyData) {
    try {
      const data = {
        id: companyData.id,
        name: companyData.name,
        email: companyData.email,
        company_name: companyData.company_name,
        created_at: companyData.created_at
      };

      broadcastToRole(NOTIFICATION_EVENTS.ADMIN.NEW_COMPANY_REGISTRATION, data, 'admin');
      console.log('✅ New company registration notification sent');
    } catch (error) {
      console.error('Error sending new company registration notification:', error);
    }
  }

  async notifyNewQuoteRequest(quoteData) {
    try {
      // Get user details
      const [userRows] = await db.execute(
        'SELECT name FROM users WHERE id = ?',
        [quoteData.user_id]
      );

      const data = {
        quote_id: quoteData.id,
        user_id: quoteData.user_id,
        user_name: userRows[0]?.name || 'Unknown User',
        service_type: quoteData.service_type,
        pickup_location: quoteData.pickup_location,
        delivery_location: quoteData.delivery_location,
        budget: quoteData.budget,
        created_at: quoteData.created_at
      };

      // Notify admins
      broadcastToRole(NOTIFICATION_EVENTS.ADMIN.NEW_QUOTE_REQUEST, data, 'admin');
      
      // Notify relevant companies (members)
      broadcastToRole(NOTIFICATION_EVENTS.MEMBER.NEW_QUOTE_ASSIGNED, data, 'company');
      
      console.log('✅ New quote request notifications sent');
    } catch (error) {
      console.error('Error sending new quote request notification:', error);
    }
  }

  async notifyQuoteStatusChange(quoteId, newStatus, changedBy, additionalData = {}) {
    try {
      // Get quote details
      const [quoteRows] = await db.execute(`
        SELECT q.*, u.name as user_name, c.name as company_name, c.id as company_id
        FROM quotes q
        LEFT JOIN users u ON q.user_id = u.id
        LEFT JOIN users c ON q.selected_company_id = c.id
        WHERE q.id = ?
      `, [quoteId]);

      if (quoteRows.length === 0) {
        console.error('Quote not found for status change notification');
        return;
      }

      const quote = quoteRows[0];
      const data = {
        quote_id: quoteId,
        user_id: quote.user_id,
        company_id: quote.company_id,
        user_name: quote.user_name,
        company_name: quote.company_name,
        old_status: quote.status,
        new_status: newStatus,
        changed_by: changedBy,
        amount: quote.budget,
        service_type: quote.service_type,
        ...additionalData
      };

      // Only notify admin for certain status changes that require admin oversight
      // Don't notify admin for normal user-company interactions like acceptance
      const adminNotificationStatuses = ['rejected', 'running', 'closed'];
      if (adminNotificationStatuses.includes(newStatus)) {
        broadcastToRole(NOTIFICATION_EVENTS.ADMIN.QUOTE_STATUS_CHANGED, data, 'admin');
      }

      // Notify user based on status
      switch (newStatus) {
        case 'approved':
          broadcastNotification(NOTIFICATION_EVENTS.USER.QUOTE_STATUS_APPROVED, data, [quote.user_id]);
          break;
        case 'rejected':
          broadcastNotification(NOTIFICATION_EVENTS.USER.QUOTE_STATUS_REJECTED, data, [quote.user_id]);
          break;
        case 'running':
          broadcastNotification(NOTIFICATION_EVENTS.USER.QUOTE_STATUS_RUNNING, data, [quote.user_id]);
          broadcastNotification(NOTIFICATION_EVENTS.USER.WORK_STARTED, data, [quote.user_id]);
          break;
        case 'closed':
          broadcastNotification(NOTIFICATION_EVENTS.USER.QUOTE_STATUS_CLOSED, data, [quote.user_id]);
          broadcastNotification(NOTIFICATION_EVENTS.USER.WORK_COMPLETED, data, [quote.user_id]);
          break;
      }

      // Notify company if relevant
      if (quote.company_id) {
        broadcastNotification(NOTIFICATION_EVENTS.MEMBER.QUOTE_STATUS_UPDATE, data, [quote.company_id]);
      }

      console.log(`✅ Quote status change notifications sent for quote ${quoteId}: ${newStatus}`);
    } catch (error) {
      console.error('Error sending quote status change notification:', error);
    }
  }

  async notifyUserAcceptsQuote(quoteId, selectedCompanyId, rejectedCompanyIds = []) {
    try {
      // Get quote and company details
      const [quoteRows] = await db.execute(`
        SELECT q.*, u.name as user_name
        FROM quotes q
        LEFT JOIN users u ON q.user_id = u.id
        WHERE q.id = ?
      `, [quoteId]);

      const [companyRows] = await db.execute(
        'SELECT id, name FROM users WHERE id = ?',
        [selectedCompanyId]
      );

      if (quoteRows.length === 0 || companyRows.length === 0) {
        console.error('Quote or company not found for acceptance notification');
        return;
      }

      const quote = quoteRows[0];
      const selectedCompany = companyRows[0];

      // Notify selected company
      const acceptedData = {
        quote_id: quoteId,
        user_id: quote.user_id,
        company_id: selectedCompanyId,
        user_name: quote.user_name,
        company_name: selectedCompany.name,
        amount: quote.budget,
        service_type: quote.service_type
      };

      broadcastNotification(NOTIFICATION_EVENTS.MEMBER.USER_ACCEPTS_QUOTE, acceptedData, [selectedCompanyId]);

      // Notify rejected companies
      if (rejectedCompanyIds.length > 0) {
        const rejectedData = {
          quote_id: quoteId,
          user_id: quote.user_id,
          user_name: quote.user_name,
          reason: 'User selected another quote'
        };

        rejectedCompanyIds.forEach(companyId => {
          broadcastNotification(NOTIFICATION_EVENTS.MEMBER.USER_REJECTS_QUOTE, {
            ...rejectedData,
            company_id: companyId
          }, [companyId]);
        });
      }

      console.log(`✅ Quote acceptance notifications sent for quote ${quoteId}`);
    } catch (error) {
      console.error('Error sending quote acceptance notification:', error);
    }
  }

  async notifyNewQuoteResponse(quoteResponseData) {
    try {
      // Get quote and user details
      const [quoteRows] = await db.execute(`
        SELECT q.*, u.name as user_name, c.name as company_name
        FROM quotes q
        LEFT JOIN users u ON q.user_id = u.id
        LEFT JOIN users c ON c.id = ?
        WHERE q.id = ?
      `, [quoteResponseData.company_id, quoteResponseData.quote_id]);

      if (quoteRows.length === 0) {
        console.error('Quote not found for response notification');
        return;
      }

      const quote = quoteRows[0];
      const data = {
        quote_id: quoteResponseData.quote_id,
        user_id: quote.user_id,
        company_id: quoteResponseData.company_id,
        company_name: quote.company_name,
        amount: quoteResponseData.price,
        delivery_time: quoteResponseData.delivery_time,
        message: quoteResponseData.message
      };

      // Notify user
      broadcastNotification(NOTIFICATION_EVENTS.USER.MEMBER_QUOTE_RESPONSE, data, [quote.user_id]);

      console.log(`✅ New quote response notification sent for quote ${quoteResponseData.quote_id}`);
    } catch (error) {
      console.error('Error sending quote response notification:', error);
    }
  }

  async notifyNewMessage(messageData) {
    try {
      const data = {
        message_id: messageData.id,
        sender_id: messageData.sender_id,
        receiver_id: messageData.receiver_id,
        sender_name: messageData.sender_name,
        message: messageData.message,
        quote_id: messageData.quote_id
      };

      // Determine receiver role and send appropriate notification
      const [receiverRows] = await db.execute(
        'SELECT role FROM users WHERE id = ?',
        [messageData.receiver_id]
      );

      if (receiverRows.length > 0) {
        const receiverRole = receiverRows[0].role;
        
        let eventType;
        switch (receiverRole) {
          case 'admin':
            eventType = NOTIFICATION_EVENTS.ADMIN.NEW_MESSAGE;
            break;
          case 'company':
            eventType = NOTIFICATION_EVENTS.MEMBER.NEW_MESSAGE;
            break;
          case 'user':
            eventType = NOTIFICATION_EVENTS.USER.NEW_MESSAGE;
            break;
        }

        if (eventType) {
          broadcastNotification(eventType, data, [messageData.receiver_id]);
        }
      }

      console.log(`✅ New message notification sent`);
    } catch (error) {
      console.error('Error sending new message notification:', error);
    }
  }

  async notifyDisputeRaised(disputeData) {
    try {
      const data = {
        dispute_id: disputeData.id,
        quote_id: disputeData.quote_id,
        raised_by: disputeData.raised_by,
        reason: disputeData.reason,
        description: disputeData.description
      };

      // Notify admins
      broadcastToRole(NOTIFICATION_EVENTS.ADMIN.DISPUTE_RAISED, data, 'admin');

      // Notify involved parties
      if (disputeData.company_id) {
        broadcastNotification(NOTIFICATION_EVENTS.MEMBER.DISPUTE_INVOLVING_MEMBER, data, [disputeData.company_id]);
      }
      if (disputeData.user_id) {
        broadcastNotification(NOTIFICATION_EVENTS.USER.DISPUTE_UPDATE, data, [disputeData.user_id]);
      }

      console.log(`✅ Dispute raised notifications sent for dispute ${disputeData.id}`);
    } catch (error) {
      console.error('Error sending dispute raised notification:', error);
    }
  }

  async notifySupportTicketRaised(ticketData) {
    try {
      const data = {
        ticket_id: ticketData.id,
        user_id: ticketData.user_id,
        subject: ticketData.subject,
        priority: ticketData.priority,
        category: ticketData.category
      };

      // Notify admins
      broadcastToRole(NOTIFICATION_EVENTS.ADMIN.SUPPORT_TICKET_RAISED, data, 'admin');

      console.log(`✅ Support ticket raised notification sent for ticket ${ticketData.id}`);
    } catch (error) {
      console.error('Error sending support ticket raised notification:', error);
    }
  }

  async notifyTicketStatusUpdate(ticketId, newStatus, updatedBy) {
    try {
      // Get ticket details
      const [ticketRows] = await db.execute(
        'SELECT * FROM support_tickets WHERE id = ?',
        [ticketId]
      );

      if (ticketRows.length === 0) {
        console.error('Ticket not found for status update notification');
        return;
      }

      const ticket = ticketRows[0];
      const data = {
        ticket_id: ticketId,
        user_id: ticket.user_id,
        subject: ticket.subject,
        old_status: ticket.status,
        new_status: newStatus,
        updated_by: updatedBy
      };

      // Notify admins
      broadcastToRole(NOTIFICATION_EVENTS.ADMIN.TICKET_STATUS_UPDATE, data, 'admin');

      // Notify ticket owner
      const [userRows] = await db.execute(
        'SELECT role FROM users WHERE id = ?',
        [ticket.user_id]
      );

      if (userRows.length > 0) {
        const userRole = userRows[0].role;
        let eventType;
        
        switch (userRole) {
          case 'company':
            eventType = NOTIFICATION_EVENTS.MEMBER.SUPPORT_TICKET_INVOLVING;
            break;
          case 'user':
            eventType = NOTIFICATION_EVENTS.USER.SUPPORT_TICKET_UPDATE;
            break;
        }

        if (eventType) {
          broadcastNotification(eventType, data, [ticket.user_id]);
        }
      }

      console.log(`✅ Ticket status update notifications sent for ticket ${ticketId}`);
    } catch (error) {
      console.error('Error sending ticket status update notification:', error);
    }
  }

  // Utility method to get active connections count
  async getActiveConnectionsCount() {
    // This would need to be implemented based on how you store active connections
    // For now, return a placeholder
    return 0;
  }
}

export default new RealTimeNotificationService();