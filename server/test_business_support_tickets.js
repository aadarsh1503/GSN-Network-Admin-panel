// Test business support ticket functionality
import fetch from 'node-fetch';

const testBusinessSupportTickets = async () => {
    try {
        console.log('🔍 Testing Business Support Tickets...\n');

        // Step 1: Login as business user
        console.log('🔐 Step 1: Login as business user...');
        const loginResponse = await fetch('http://localhost:5000/api/user/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'ksacargo@gvscargo.com',
                password: 'password123'
            })
        });

        const loginData = await loginResponse.json();
        
        if (!loginResponse.ok) {
            console.log('❌ Login failed:', loginData);
            return;
        }

        console.log('✅ Login successful');
        const token = loginData.token;

        // Step 2: Test submitting a support ticket
        console.log('\n📝 Step 2: Submit support ticket...');
        
        const ticketData = {
            subject: 'Test Business Support Ticket',
            message: 'This is a test support ticket for business users. I need help with quote requests.',
            priority: 'medium',
            category: 'quotes'
        };

        console.log('Ticket data:', ticketData);

        const submitResponse = await fetch('http://localhost:5000/api/business/help/ticket', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(ticketData)
        });

        console.log('Submit response status:', submitResponse.status);
        
        const submitResult = await submitResponse.text();
        console.log('Submit response:', submitResult);

        if (submitResponse.ok) {
            console.log('✅ Ticket submitted successfully');
            
            try {
                const parsedResult = JSON.parse(submitResult);
                console.log('Ticket ID:', parsedResult.ticketId);
                console.log('Ticket Number:', parsedResult.ticketNumber);
            } catch (e) {
                console.log('Could not parse response as JSON');
            }
        } else {
            console.log('❌ Ticket submission failed');
        }

        // Step 3: Test fetching support tickets
        console.log('\n📋 Step 3: Fetch support tickets...');
        
        const fetchResponse = await fetch('http://localhost:5000/api/business/help/tickets', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('Fetch response status:', fetchResponse.status);
        
        const fetchResult = await fetchResponse.text();
        console.log('Fetch response:', fetchResult);

        if (fetchResponse.ok) {
            console.log('✅ Tickets fetched successfully');
            
            try {
                const tickets = JSON.parse(fetchResult);
                console.log(`Found ${tickets.length} tickets`);
                
                if (tickets.length > 0) {
                    console.log('Latest ticket:', {
                        id: tickets[0].id,
                        ticket_number: tickets[0].ticket_number,
                        subject: tickets[0].subject,
                        status: tickets[0].status,
                        priority: tickets[0].priority,
                        category: tickets[0].category
                    });
                }
            } catch (e) {
                console.log('Could not parse response as JSON');
            }
        } else {
            console.log('❌ Tickets fetch failed');
        }

        console.log('\n✨ Support ticket test completed!');

    } catch (error) {
        console.error('❌ Test error:', error);
    }
};

// Run the test
testBusinessSupportTickets();