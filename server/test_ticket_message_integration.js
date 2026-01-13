// Test the ticket-to-message integration
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function testTicketMessageIntegration() {
    let connection;
    
    try {
        // Create database connection
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'gsn_database'
        });

        console.log('🔗 Connected to database');
        console.log('🧪 Testing Ticket-Message Integration...\n');

        // 1. Check if we have any tickets
        const [tickets] = await connection.execute(`
            SELECT st.*, u.name as user_name, u.email as user_email
            FROM support_tickets st
            JOIN users u ON st.user_id = u.id
            ORDER BY st.created_at DESC
            LIMIT 5
        `);

        console.log(`📋 Found ${tickets.length} tickets in the system`);
        
        if (tickets.length > 0) {
            console.log('\n🎫 Recent Tickets:');
            tickets.forEach((ticket, index) => {
                console.log(`   ${index + 1}. ${ticket.ticket_number} - ${ticket.subject}`);
                console.log(`      User: ${ticket.user_name} (${ticket.user_email})`);
                console.log(`      Status: ${ticket.status} | Priority: ${ticket.priority}`);
                console.log(`      Created: ${ticket.created_at}`);
                if (ticket.admin_response) {
                    console.log(`      ✅ Has admin response`);
                }
                console.log('');
            });
        }

        // 2. Check messages with ticket references
        const [ticketMessages] = await connection.execute(`
            SELECT m.*, 
                   sender.name as sender_name, 
                   receiver.name as receiver_name,
                   st.ticket_number, st.subject as ticket_subject
            FROM messages m
            JOIN users sender ON m.sender_id = sender.id
            JOIN users receiver ON m.receiver_id = receiver.id
            LEFT JOIN support_tickets st ON m.ticket_id = st.id
            WHERE m.ticket_id IS NOT NULL OR m.subject LIKE '%Ticket%'
            ORDER BY m.created_at DESC
            LIMIT 10
        `);

        console.log(`💬 Found ${ticketMessages.length} ticket-related messages`);
        
        if (ticketMessages.length > 0) {
            console.log('\n📨 Ticket-Related Messages:');
            ticketMessages.forEach((msg, index) => {
                console.log(`   ${index + 1}. From: ${msg.sender_name} → To: ${msg.receiver_name}`);
                console.log(`      Subject: ${msg.subject || 'No subject'}`);
                console.log(`      Ticket: ${msg.ticket_number || 'Not linked'}`);
                console.log(`      Created: ${msg.created_at}`);
                console.log(`      Message: ${msg.message.substring(0, 100)}...`);
                console.log('');
            });
        }

        // 3. Test creating a ticket response message manually
        console.log('🧪 Testing manual ticket response creation...');
        
        if (tickets.length > 0) {
            const testTicket = tickets[0];
            
            // Get admin user
            const [adminUsers] = await connection.execute(`
                SELECT id, name FROM users WHERE role = 'admin' LIMIT 1
            `);
            
            if (adminUsers.length > 0) {
                const admin = adminUsers[0];
                const testMessage = `**Support Ticket Response - TEST**\n\n**Ticket:** ${testTicket.ticket_number}\n**Subject:** ${testTicket.subject}\n**Status:** ANSWERED\n\n**Admin Response:**\nThis is a test response to verify the ticket-message integration is working correctly. The system should now sync ticket responses with the messages system.`;
                
                // Insert test message
                const [result] = await connection.execute(`
                    INSERT INTO messages (sender_id, receiver_id, subject, message, ticket_id, is_read, created_at)
                    VALUES (?, ?, ?, ?, ?, 0, NOW())
                `, [
                    admin.id,
                    testTicket.user_id,
                    `Test Ticket Response: ${testTicket.ticket_number}`,
                    testMessage,
                    testTicket.id
                ]);
                
                console.log(`✅ Created test message with ID: ${result.insertId}`);
                console.log(`   From: Admin (${admin.name})`);
                console.log(`   To: User ID ${testTicket.user_id}`);
                console.log(`   Linked to ticket: ${testTicket.ticket_number}`);
            } else {
                console.log('⚠️  No admin users found for testing');
            }
        }

        // 4. Show integration statistics
        console.log('\n📊 Integration Statistics:');
        
        const [stats] = await connection.execute(`
            SELECT 
                (SELECT COUNT(*) FROM support_tickets) as total_tickets,
                (SELECT COUNT(*) FROM support_tickets WHERE admin_response IS NOT NULL) as tickets_with_responses,
                (SELECT COUNT(*) FROM messages) as total_messages,
                (SELECT COUNT(*) FROM messages WHERE ticket_id IS NOT NULL) as ticket_linked_messages,
                (SELECT COUNT(*) FROM messages WHERE subject LIKE '%Ticket%') as ticket_subject_messages
        `);
        
        const stat = stats[0];
        console.log(`   📋 Total Tickets: ${stat.total_tickets}`);
        console.log(`   ✅ Tickets with Admin Responses: ${stat.tickets_with_responses}`);
        console.log(`   💬 Total Messages: ${stat.total_messages}`);
        console.log(`   🔗 Ticket-Linked Messages: ${stat.ticket_linked_messages}`);
        console.log(`   📨 Messages with Ticket Subject: ${stat.ticket_subject_messages}`);

        // 5. Show next steps
        console.log('\n🎯 Next Steps to Test Integration:');
        console.log('   1. Go to Admin Tickets: http://localhost:5174/admin/all-Ticket');
        console.log('   2. Respond to a ticket with admin response');
        console.log('   3. Check Messages in all user panels:');
        console.log('      • Admin Messages: http://localhost:5174/admin/messages');
        console.log('      • Company Messages: http://localhost:5174/company/messages');
        console.log('      • Business Messages: http://localhost:5174/business/messages');
        console.log('      • User Messages: http://localhost:5174/user/messages');
        console.log('   4. Verify ticket responses appear as messages with proper context');

    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n🔌 Database connection closed');
        }
    }
}

// Run the test
testTicketMessageIntegration();