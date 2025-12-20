// controllers/testController.js
import db from '../config/db.js';

// @desc    Create test messages between users and companies
// @route   POST /api/test/create-messages
// @access  Private/Admin
const createTestMessages = async (req, res) => {
    try {
        // Get some users and companies
        const [users] = await db.execute("SELECT id, name FROM users WHERE role = 'user' LIMIT 2");
        const [companies] = await db.execute("SELECT id, name FROM users WHERE role = 'company' LIMIT 2");

        if (users.length === 0 || companies.length === 0) {
            return res.status(400).json({ message: 'Need at least 1 user and 1 company to create test messages' });
        }

        const testMessages = [
            {
                sender_id: companies[0].id,
                receiver_id: users[0].id,
                subject: 'Quote Response - Test Message',
                message: 'Thank you for your quote request. We have prepared a competitive offer for your shipment needs.'
            },
            {
                sender_id: users[0].id,
                receiver_id: companies[0].id,
                subject: 'Re: Quote Response',
                message: 'Thank you for your response. Could you please provide more details about the transit time?'
            }
        ];

        for (const msg of testMessages) {
            await db.execute(
                'INSERT INTO messages (sender_id, receiver_id, subject, message, created_at) VALUES (?, ?, ?, ?, NOW())',
                [msg.sender_id, msg.receiver_id, msg.subject, msg.message]
            );
        }

        res.status(200).json({ 
            message: 'Test messages created successfully',
            created: testMessages.length,
            users: users.map(u => ({ id: u.id, name: u.name })),
            companies: companies.map(c => ({ id: c.id, name: c.name }))
        });

    } catch (error) {
        console.error('Error creating test messages:', error);
        res.status(500).json({ message: 'Server error creating test messages' });
    }
};

export { createTestMessages };