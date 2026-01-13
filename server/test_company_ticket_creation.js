// Test script to create sample company tickets for testing
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function createTestCompanyTickets() {
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

        // First, let's check if we have any company users
        const [companies] = await connection.execute(
            "SELECT id, name, email FROM users WHERE role = 'company' LIMIT 3"
        );

        console.log(`📊 Found ${companies.length} company users`);
        
        if (companies.length === 0) {
            console.log('⚠️  No company users found. Creating a test company user...');
            
            // Create a test company user
            const [companyResult] = await connection.execute(
                `INSERT INTO users (name, email, password, role, phone, address, created_at) 
                 VALUES (?, ?, ?, 'company', ?, ?, NOW())`,
                [
                    'Tech Solutions Inc',
                    'contact@techsolutions.com',
                    '$2b$10$hashedpassword', // This would be properly hashed in real scenario
                    '+1-555-0123',
                    '123 Business Ave, Tech City, TC 12345'
                ]
            );
            
            companies.push({
                id: companyResult.insertId,
                name: 'Tech Solutions Inc',
                email: 'contact@techsolutions.com'
            });
            
            console.log('✅ Created test company user');
        }

        // Check if we have regular users to create tickets from
        const [users] = await connection.execute(
            "SELECT id, name, email FROM users WHERE role IN ('user', 'business') LIMIT 2"
        );

        console.log(`👥 Found ${users.length} regular users`);

        if (users.length === 0) {
            console.log('⚠️  No regular users found. Creating test users...');
            
            // Create test users
            const testUsers = [
                ['John Doe', 'john@example.com', 'user'],
                ['Jane Business', 'jane@business.com', 'business']
            ];

            for (const [name, email, role] of testUsers) {
                const [userResult] = await connection.execute(
                    `INSERT INTO users (name, email, password, role, phone, created_at) 
                     VALUES (?, ?, ?, ?, ?, NOW())`,
                    [name, email, '$2b$10$hashedpassword', role, '+1-555-0100']
                );
                
                users.push({
                    id: userResult.insertId,
                    name: name,
                    email: email
                });
            }
            
            console.log('✅ Created test users');
        }

        // Now create sample company tickets
        const sampleTickets = [
            {
                subject: `[TO COMPANY ID:${companies[0].id}] Website Integration Issue`,
                category: 'technical',
                priority: 'high',
                description: 'We are experiencing issues integrating with your API. The authentication tokens are not working properly and we need immediate assistance.',
                user_id: users[0].id
            },
            {
                subject: `[TO COMPANY ID:${companies[0].id}] Billing Question`,
                category: 'billing',
                priority: 'medium',
                description: 'I have a question about the recent invoice. There seems to be a discrepancy in the charges for the premium features.',
                user_id: users.length > 1 ? users[1].id : users[0].id
            }
        ];

        // Add more tickets if we have more companies
        if (companies.length > 1) {
            sampleTickets.push({
                subject: `[TO COMPANY ID:${companies[1].id}] Service Request`,
                category: 'general',
                priority: 'low',
                description: 'I would like to request additional services for my account. Please contact me to discuss the options available.',
                user_id: users[0].id
            });
        }

        // Also create some regular admin tickets for comparison
        sampleTickets.push({
            subject: '[TO ADMIN] General Support Request',
            category: 'general',
            priority: 'medium',
            description: 'I need help with my account settings. I cannot seem to update my profile information.',
            user_id: users[0].id
        });

        console.log(`🎫 Creating ${sampleTickets.length} test tickets...`);

        for (const ticket of sampleTickets) {
            const ticketNumber = 'GSN-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
            
            await connection.execute(
                `INSERT INTO support_tickets (user_id, ticket_number, subject, category, priority, description, status, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, 'pending', NOW())`,
                [ticket.user_id, ticketNumber, ticket.subject, ticket.category, ticket.priority, ticket.description]
            );
            
            console.log(`✅ Created ticket: ${ticketNumber} - ${ticket.subject.substring(0, 50)}...`);
        }

        console.log('🎉 Test tickets created successfully!');
        console.log('');
        console.log('📋 Summary:');
        console.log(`   • ${companies.length} company users available`);
        console.log(`   • ${users.length} regular users available`);
        console.log(`   • ${sampleTickets.length} test tickets created`);
        console.log('');
        console.log('🔗 Test the admin tickets page at: http://localhost:5174/admin/all-Ticket');

    } catch (error) {
        console.error('❌ Error creating test tickets:', error);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Database connection closed');
        }
    }
}

// Run the test
createTestCompanyTickets();