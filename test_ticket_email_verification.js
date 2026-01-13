// Test Support Ticket Email System
import { sendTicketEmail } from './server/services/ticketEmailService.js';

console.log('🎫 Testing Support Ticket Email System...\n');

// Test data for different ticket scenarios
const testTickets = [
  {
    name: 'Admin Ticket Test',
    ticketData: {
      ticket_number: 'GSN-TEST-001',
      subject: 'Test Admin Ticket - Email System Verification',
      description: 'This is a test ticket to verify admin email notifications work correctly.',
      priority: 'medium',
      category: 'technical',
      user_name: 'Test User',
      user_email: 'testuser@example.com',
      user_role: 'user',
      recipient_type: 'admin',
      recipient_id: null,
      recipient_name: 'Admin Support'
    },
    expectedRecipients: 'Admin users only'
  },
  {
    name: 'Company Ticket Test',
    ticketData: {
      ticket_number: 'GSN-TEST-002',
      subject: 'Test Company Ticket - Email System Verification',
      description: 'This is a test ticket to verify company email notifications work correctly.',
      priority: 'high',
      category: 'billing',
      user_name: 'Business User',
      user_email: 'business@example.com',
      user_role: 'business',
      recipient_type: 'company',
      recipient_id: 10,
      recipient_name: 'Test Company'
    },
    expectedRecipients: 'Company (ID: 10) AND Admin users'
  }
];

// Test ticket creation emails
async function testTicketCreationEmails() {
  console.log('📧 Testing Ticket Creation Email Notifications...\n');
  
  for (const test of testTickets) {
    console.log(`🔍 Testing: ${test.name}`);
    console.log(`   Expected Recipients: ${test.expectedRecipients}`);
    
    try {
      const result = await sendTicketEmail('ticket_created', test.ticketData);
      
      if (result.success) {
        console.log(`   ✅ SUCCESS: Email notifications sent successfully`);
      } else {
        console.log(`   ❌ FAILED: ${result.error}`);
      }
    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}`);
    }
    
    console.log(''); // Empty line for readability
  }
}

// Test ticket response emails
async function testTicketResponseEmails() {
  console.log('📬 Testing Ticket Response Email Notifications...\n');
  
  const responseTest = {
    ticketData: {
      ticket_number: 'GSN-TEST-003',
      subject: 'Test Response Email',
      priority: 'medium',
      user_name: 'Test User',
      user_email: 'testuser@example.com',
      user_role: 'user',
      recipient_type: 'admin',
      recipient_name: 'Admin Support'
    },
    responseData: {
      status: 'answered',
      admin_response: 'Thank you for contacting GSN Support. We have reviewed your request and are working on a solution.',
      admin_name: 'Support Team'
    }
  };
  
  console.log('🔍 Testing: Ticket Response Email');
  console.log('   Expected Recipients: Original ticket creator');
  
  try {
    const result = await sendTicketEmail('ticket_response', responseTest.ticketData, responseTest.responseData);
    
    if (result.success) {
      console.log('   ✅ SUCCESS: Response email sent successfully');
    } else {
      console.log(`   ❌ FAILED: ${result.error}`);
    }
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`);
  }
  
  console.log('');
}

// Test ticket status update emails
async function testTicketStatusUpdateEmails() {
  console.log('🔄 Testing Ticket Status Update Email Notifications...\n');
  
  const statusUpdateTest = {
    ticketData: {
      ticket_number: 'GSN-TEST-004',
      subject: 'Test Status Update Email',
      priority: 'high',
      user_name: 'Test User',
      user_email: 'testuser@example.com',
      user_role: 'user',
      recipient_type: 'admin',
      recipient_name: 'Admin Support'
    },
    additionalData: {
      oldStatus: 'pending',
      newStatus: 'closed'
    }
  };
  
  console.log('🔍 Testing: Ticket Status Update Email');
  console.log('   Expected Recipients: Original ticket creator');
  
  try {
    const result = await sendTicketEmail('ticket_status_update', statusUpdateTest.ticketData, statusUpdateTest.additionalData);
    
    if (result.success) {
      console.log('   ✅ SUCCESS: Status update email sent successfully');
    } else {
      console.log(`   ❌ FAILED: ${result.error}`);
    }
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`);
  }
  
  console.log('');
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting Support Ticket Email System Tests...\n');
  console.log('=' .repeat(60));
  
  await testTicketCreationEmails();
  console.log('=' .repeat(60));
  
  await testTicketResponseEmails();
  console.log('=' .repeat(60));
  
  await testTicketStatusUpdateEmails();
  console.log('=' .repeat(60));
  
  console.log('🎯 Email System Test Complete!');
  console.log('\n📋 What to Check:');
  console.log('1. Server console logs for email sending confirmations');
  console.log('2. Database email_notifications table for logged emails');
  console.log('3. Actual email delivery (if SMTP is configured)');
  console.log('4. Email routing follows the correct rules:');
  console.log('   - Admin tickets → Admin only');
  console.log('   - Company tickets → Company + Admin');
  console.log('   - Responses → Original ticket creator');
}

// Run the tests
runAllTests().catch(console.error);