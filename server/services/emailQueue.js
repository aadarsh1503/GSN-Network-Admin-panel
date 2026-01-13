import subscriptionEmailWorkflow from './subscriptionEmailService.js';
import registrationEmailWorkflow from './registrationEmailService.js';
import { sendQuoteEmail } from './quoteEmailService.js';

// Simple in-memory queue for email processing
class EmailQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
  }

  // Add email to queue (non-blocking)
  async addEmail(emailType, emailData) {
    const emailJob = {
      id: Date.now() + Math.random(),
      type: emailType,
      data: emailData,
      attempts: 0,
      maxAttempts: 3,
      createdAt: new Date()
    };

    this.queue.push(emailJob);
    console.log(`📧 Email queued: ${emailType} (Queue size: ${this.queue.length})`);

    // Start processing if not already running
    if (!this.processing) {
      this.processQueue();
    }

    return emailJob.id;
  }

  // Process emails in background
  async processQueue() {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;
    console.log(`🔄 Processing email queue (${this.queue.length} emails)...`);

    while (this.queue.length > 0) {
      const emailJob = this.queue.shift();
      
      try {
        console.log(`📤 Sending email: ${emailJob.type} (Attempt ${emailJob.attempts + 1})`);
        
        // Send email based on type
        switch (emailJob.type) {
          case 'paymentProofSubmitted':
            await subscriptionEmailWorkflow.paymentProofSubmitted(emailJob.data);
            break;
          case 'paymentApproved':
            await subscriptionEmailWorkflow.paymentApproved(emailJob.data);
            break;
          case 'paymentRejected':
            await subscriptionEmailWorkflow.paymentRejected(emailJob.data);
            break;
          case 'userRegistration':
            await registrationEmailWorkflow.sendUserWelcome(emailJob.data);
            break;
          case 'adminRegistrationNotification':
            await registrationEmailWorkflow.sendAdminNotification(emailJob.data);
            break;
          case 'companyApproval':
            console.log('📧 Processing company approval email:', emailJob.data);
            await registrationEmailWorkflow.sendCompanyApproval(emailJob.data);
            break;
          case 'adminCompanyApprovalNotification':
            console.log('📧 Processing admin company approval notification:', emailJob.data);
            await registrationEmailWorkflow.sendAdminCompanyApprovalNotification(emailJob.data);
            break;
          case 'accountDeactivated':
            console.log('📧 Processing account deactivation notification:', emailJob.data);
            await registrationEmailWorkflow.sendAccountDeactivated(emailJob.data);
            break;
          case 'accountBlacklisted':
            console.log('📧 Processing account blacklisted notification:', emailJob.data);
            await registrationEmailWorkflow.sendAccountBlacklisted(emailJob.data);
            break;
          case 'accountUnblacklisted':
            console.log('📧 Processing account unblacklisted notification:', emailJob.data);
            await registrationEmailWorkflow.sendAccountUnblacklisted(emailJob.data);
            break;
          case 'adminAccountStatusNotification':
            console.log('📧 Processing admin account status notification:', emailJob.data);
            await registrationEmailWorkflow.sendAdminAccountStatusNotification(emailJob.data);
            break;
          // Quote email types
          case 'quoteRequestToCompany':
            console.log('📧 Processing quote request to company:', emailJob.data);
            await sendQuoteEmail('quoteRequestToCompany', emailJob.data);
            break;
          case 'quoteRequestToUser':
            console.log('📧 Processing quote request to user:', emailJob.data);
            await sendQuoteEmail('quoteRequestToUser', emailJob.data);
            break;
          case 'quoteResponseToUser':
            console.log('📧 Processing quote response to user:', emailJob.data);
            await sendQuoteEmail('quoteResponseToUser', emailJob.data);
            break;
          case 'quoteAcceptanceToCompany':
            console.log('📧 Processing quote acceptance to company:', emailJob.data);
            await sendQuoteEmail('quoteAcceptanceToCompany', emailJob.data);
            break;
          case 'quoteAcceptanceToUser':
            console.log('📧 Processing quote acceptance to user:', emailJob.data);
            await sendQuoteEmail('quoteAcceptanceToUser', emailJob.data);
            break;
          // Subscription deletion email types
          case 'subscriptionDeletionToUser':
            console.log('📧 Processing subscription deletion to user:', emailJob.data);
            await sendQuoteEmail('subscriptionDeletionToUser', emailJob.data);
            break;
          case 'subscriptionDeletionToAdmin':
            console.log('📧 Processing subscription deletion to admin:', emailJob.data);
            await sendQuoteEmail('subscriptionDeletionToAdmin', emailJob.data);
            break;
          // Dispute email types
          case 'disputeCreationToAdmin':
            console.log('📧 Processing dispute creation to admin:', emailJob.data);
            await sendQuoteEmail('disputeCreationToAdmin', emailJob.data);
            break;
          case 'disputeCreationToCreator':
            console.log('📧 Processing dispute creation to creator:', emailJob.data);
            await sendQuoteEmail('disputeCreationToCreator', emailJob.data);
            break;
          case 'disputeCreationToTarget':
            console.log('📧 Processing dispute creation to target:', emailJob.data);
            await sendQuoteEmail('disputeCreationToTarget', emailJob.data);
            break;
          // Payment verification email types
          case 'paymentVerifiedToUser':
            console.log('📧 Processing payment verified to user:', emailJob.data);
            await sendQuoteEmail('paymentVerifiedToUser', emailJob.data);
            break;
          case 'paymentRejectedToUser':
            console.log('📧 Processing payment rejected to user:', emailJob.data);
            await sendQuoteEmail('paymentRejectedToUser', emailJob.data);
            break;
          case 'paymentVerifiedToCompany':
            console.log('📧 Processing payment verified to company:', emailJob.data);
            await sendQuoteEmail('paymentVerifiedToCompany', emailJob.data);
            break;
          case 'paymentRejectedToCompany':
            console.log('📧 Processing payment rejected to company:', emailJob.data);
            await sendQuoteEmail('paymentRejectedToCompany', emailJob.data);
            break;
          case 'paymentVerificationToAdmin':
            console.log('📧 Processing payment verification to admin:', emailJob.data);
            await sendQuoteEmail('paymentVerificationToAdmin', emailJob.data);
            break;
          default:
            console.error(`❌ Unknown email type: ${emailJob.type}`);
            continue;
        }

        console.log(`✅ Email sent successfully: ${emailJob.type}`);

      } catch (error) {
        emailJob.attempts++;
        console.error(`❌ Email failed (${emailJob.attempts}/${emailJob.maxAttempts}): ${emailJob.type}`, error.message);

        // Retry if under max attempts
        if (emailJob.attempts < emailJob.maxAttempts) {
          console.log(`🔄 Retrying email: ${emailJob.type}`);
          this.queue.push(emailJob); // Add back to queue for retry
        } else {
          console.error(`💀 Email permanently failed: ${emailJob.type}`);
        }
      }

      // Small delay between emails to prevent overwhelming SMTP server
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.processing = false;
    console.log(`✅ Email queue processing completed`);
  }

  // Get queue status
  getStatus() {
    return {
      queueSize: this.queue.length,
      processing: this.processing,
      pendingEmails: this.queue.map(job => ({
        id: job.id,
        type: job.type,
        attempts: job.attempts,
        createdAt: job.createdAt
      }))
    };
  }
}

// Create singleton instance
const emailQueue = new EmailQueue();

// Convenience functions for different email types
export const queueSubscriptionEmails = {
  // Queue payment proof submission emails
  async paymentProofSubmitted(data) {
    return await emailQueue.addEmail('paymentProofSubmitted', data);
  },

  // Queue payment approval emails
  async paymentApproved(data) {
    return await emailQueue.addEmail('paymentApproved', data);
  },

  // Queue payment rejection emails
  async paymentRejected(data) {
    return await emailQueue.addEmail('paymentRejected', data);
  },

  // Queue user registration welcome email
  async userRegistration(data) {
    return await emailQueue.addEmail('userRegistration', data);
  },

  // Queue admin notification for new registration
  async adminRegistrationNotification(data) {
    return await emailQueue.addEmail('adminRegistrationNotification', data);
  },

  // Queue company approval email
  async companyApproval(data) {
    console.log('🔔 Queuing company approval email for:', data);
    return await emailQueue.addEmail('companyApproval', data);
  },

  // Queue admin notification for company approval
  async adminCompanyApprovalNotification(data) {
    console.log('🔔 Queuing admin company approval notification for:', data);
    return await emailQueue.addEmail('adminCompanyApprovalNotification', data);
  },

  // Queue account deactivation notification
  async accountDeactivated(data) {
    console.log('🔔 Queuing account deactivation notification for:', data);
    return await emailQueue.addEmail('accountDeactivated', data);
  },

  // Queue account blacklisted notification
  async accountBlacklisted(data) {
    console.log('🔔 Queuing account blacklisted notification for:', data);
    return await emailQueue.addEmail('accountBlacklisted', data);
  },

  // Queue account unblacklisted notification
  async accountUnblacklisted(data) {
    console.log('🔔 Queuing account unblacklisted notification for:', data);
    return await emailQueue.addEmail('accountUnblacklisted', data);
  },

  // Queue admin account status notification
  async adminAccountStatusNotification(data) {
    console.log('🔔 Queuing admin account status notification for:', data);
    return await emailQueue.addEmail('adminAccountStatusNotification', data);
  },

  // Quote email functions
  // Queue quote request to company
  async quoteRequestToCompany(data) {
    console.log('🔔 Queuing quote request to company for:', data);
    return await emailQueue.addEmail('quoteRequestToCompany', data);
  },

  // Queue quote request to user
  async quoteRequestToUser(data) {
    console.log('🔔 Queuing quote request to user for:', data);
    return await emailQueue.addEmail('quoteRequestToUser', data);
  },

  // Queue quote response to user
  async quoteResponseToUser(data) {
    console.log('🔔 Queuing quote response to user for:', data);
    return await emailQueue.addEmail('quoteResponseToUser', data);
  },

  // Queue quote acceptance to company
  async quoteAcceptanceToCompany(data) {
    console.log('🔔 Queuing quote acceptance to company for:', data);
    return await emailQueue.addEmail('quoteAcceptanceToCompany', data);
  },

  // Queue quote acceptance to user
  async quoteAcceptanceToUser(data) {
    console.log('🔔 Queuing quote acceptance to user for:', data);
    return await emailQueue.addEmail('quoteAcceptanceToUser', data);
  },

  // Subscription deletion email functions
  // Queue subscription deletion notification to user
  async subscriptionDeletionToUser(data) {
    console.log('🔔 Queuing subscription deletion notification to user for:', data);
    return await emailQueue.addEmail('subscriptionDeletionToUser', data);
  },

  // Queue subscription deletion notification to admin
  async subscriptionDeletionToAdmin(data) {
    console.log('🔔 Queuing subscription deletion notification to admin for:', data);
    return await emailQueue.addEmail('subscriptionDeletionToAdmin', data);
  },

  // Dispute email functions
  // Queue dispute creation notification to admin
  async disputeCreationToAdmin(data) {
    console.log('🔔 Queuing dispute creation notification to admin for:', data);
    return await emailQueue.addEmail('disputeCreationToAdmin', data);
  },

  // Queue dispute creation confirmation to creator
  async disputeCreationToCreator(data) {
    console.log('🔔 Queuing dispute creation confirmation to creator for:', data);
    return await emailQueue.addEmail('disputeCreationToCreator', data);
  },

  // Queue dispute creation notification to target
  async disputeCreationToTarget(data) {
    console.log('🔔 Queuing dispute creation notification to target for:', data);
    return await emailQueue.addEmail('disputeCreationToTarget', data);
  },

  // Payment verification email functions
  // Queue payment verified notification to user
  async paymentVerifiedToUser(data) {
    console.log('🔔 Queuing payment verified notification to user for:', data);
    return await emailQueue.addEmail('paymentVerifiedToUser', data);
  },

  // Queue payment rejected notification to user
  async paymentRejectedToUser(data) {
    console.log('🔔 Queuing payment rejected notification to user for:', data);
    return await emailQueue.addEmail('paymentRejectedToUser', data);
  },

  // Queue payment verified confirmation to company
  async paymentVerifiedToCompany(data) {
    console.log('🔔 Queuing payment verified confirmation to company for:', data);
    return await emailQueue.addEmail('paymentVerifiedToCompany', data);
  },

  // Queue payment rejected confirmation to company
  async paymentRejectedToCompany(data) {
    console.log('🔔 Queuing payment rejected confirmation to company for:', data);
    return await emailQueue.addEmail('paymentRejectedToCompany', data);
  },

  // Queue payment verification notification to admin
  async paymentVerificationToAdmin(data) {
    console.log('🔔 Queuing payment verification notification to admin for:', data);
    return await emailQueue.addEmail('paymentVerificationToAdmin', data);
  },

  // Get queue status
  getQueueStatus() {
    return emailQueue.getStatus();
  }
};

export default emailQueue;