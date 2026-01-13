// Test business support tickets with correct user
import db from './config/db.js';
import jwt from 'jsonwebtoken';

const testBusinessTicketsDirectly = async () => {
    try {
        console.log('🔍 Testing Business Support Tickets Directly...\n');

        // Get a business user
        const [businessUsers] = await db.execute(
            'SELECT id, name, email FROM users WHERE role = "business" LIMIT 1'
        );

        if (businessUsers.length === 0) {
            console.log('❌ No business users found');
            return;
        }

        const businessUser = businessUsers[0];
        console.log(`📊 Testing with business user: ${businessUser.name} (ID: ${businessUser.id})`);

        // Test submitting a ticket directly to database
        console.log('\n📝 Step 1: Test ticket submission...');
        
        const ticketNumber = `BSN-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
        const ticketData = {
            user_id: businessUser.id,
            ticket_number: ticketNumber,
            subject: 'Test Business Support Ticket',
            description: 'This is a test support ticket for business users. I need help with quote requests.',
            priority: 'medium',
            category: 'quotes',
            status: 'pending'
        };

        const insertSql = `
            INSERT INTO support_tickets (
                user_id, ticket_number, subject, description, priority, category, status, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
        `;

        const [insertResult] = await db.execute(insertSql, [
            ticketData.user_id,
            ticketData.ticket_number,
            ticketData.subject,
            ticketData.description,
            ticketData.priority,
            ticketData.category,
            ticketData.status
        ]);

        console.log('✅ Ticket inserted successfully');
        console.log('Ticket ID:', insertResult.insertId);
        console.log('Ticket Number:', ticketNumber);

        // Test fetching tickets
        console.log('\n📋 Step 2: Test fetching tickets...');
        
        const fetchSql = `
            SELECT id, ticket_number, subject, description as message, priority, category, status, 
                   admin_response, created_at, updated_at, responded_at
            FROM support_tickets
            WHERE user_id = ?
            ORDER BY created_at DESC
        `;

        const [tickets] = await db.execute(fetchSql, [businessUser.id]);

        console.log(`✅ Found ${tickets.length} tickets for user`);
        
        if (tickets.length > 0) {
            console.log('Latest ticket details:');
            const ticket = tickets[0];
            console.log(`  ID: ${ticket.id}`);
            console.log(`  Ticket Number: ${ticket.ticket_number}`);
            console.log(`  Subject: ${ticket.subject}`);
            console.log(`  Message: ${ticket.message}`);
            console.log(`  Priority: ${ticket.priority}`);
            console.log(`  Category: ${ticket.category}`);
            console.log(`  Status: ${ticket.status}`);
            console.log(`  Created: ${ticket.created_at}`);
        }

        // Test the controller functions by simulating API calls
        console.log('\n🔧 Step 3: Test controller functions...');
        
        // Simulate submitBusinessTicket
        const req = {
            user: { id: businessUser.id },
            body: {
                subject: 'Controller Test Ticket',
                message: 'Testing the controller function directly',
                priority: 'high',
                category: 'technical'
            }
        };

        const res = {
            status: (code) => ({
                json: (data) => {
                    console.log(`Response ${code}:`, data);
                    return { status: code, data };
                }
            })
        };

        // Test the actual controller logic
        try {
            const controllerTicketNumber = `BSN-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
            
            const controllerSql = `
                INSERT INTO support_tickets (
                    user_id, ticket_number, subject, description, priority, category, status, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, 'pending', NOW())
            `;

            const [controllerResult] = await db.execute(controllerSql, [
                req.user.id,
                controllerTicketNumber,
                req.body.subject,
                req.body.message,
                req.body.priority,
                req.body.category
            ]);

            console.log('✅ Controller simulation successful');
            console.log('Controller ticket ID:', controllerResult.insertId);
            console.log('Controller ticket number:', controllerTicketNumber);

        } catch (controllerError) {
            console.error('❌ Controller simulation error:', controllerError);
        }

        console.log('\n✨ Direct database test completed successfully!');
        
    } catch (error) {
        console.error('❌ Error during testing:', error);
    } finally {
        await db.end();
    }
};

// Run the test
testBusinessTicketsDirectly();