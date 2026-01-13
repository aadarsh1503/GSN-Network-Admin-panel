// Test Direct Ticket Creation with Email
console.log('🎫 Testing Direct Ticket Creation with Email System...\n');

async function testDirectTicketCreation() {
    try {
        // Test using the main ticket creation endpoint that we know works
        console.log('📧 Testing main ticket creation endpoint...');
        
        const ticketData = {
            subject: 'Test Direct Ticket - Email System Verification',
            category: 'technical',
            priority: 'medium',
            description: 'This is a test ticket to verify the email notification system works correctly.',
            recipient_type: 'admin'
        };

        // We need to simulate a logged-in user - let's create a simple test
        // by directly calling the ticket creation function
        const { createTicket } = await import('./server/controllers/ticketController.js');
        
        // Mock request and response objects
        const mockReq = {
            user: { id: 1 }, // Assuming user ID 1 exists
            body: ticketData
        };
        
        const mockRes = {
            status: (code) => ({
                json: (data) => {
                    console.log(`Response Status: ${code}`);
                    console.log('Response Data:', JSON.stringify(data, null, 2));
                    return data;
                }
            })
        };

        console.log('Creating ticket with data:', ticketData);
        await createTicket(mockReq, mockRes);
        
        console.log('\n✅ Direct ticket creation test completed!');
        console.log('\n📋 Check the following:');
        console.log('1. Server console for email sending logs');
        console.log('2. Database support_tickets table for new ticket');
        console.log('3. Database email_notifications table for email log');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('Stack:', error.stack);
    }
}

// Run the test
testDirectTicketCreation();