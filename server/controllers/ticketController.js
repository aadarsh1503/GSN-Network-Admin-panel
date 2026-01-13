// controllers/ticketController.js
import db from '../config/db.js';
import { sendTicketEmail } from '../services/ticketEmailService.js';

// @desc    Create a support ticket
// @route   POST /api/tickets/create
// @access  Private
const createTicket = async (req, res) => {
    const userId = req.user.id;
    const { subject, category, priority, description, recipient_type, recipient_id } = req.body;

    if (!subject || !category || !description) {
        return res.status(400).json({ message: 'Subject, category, and description are required' });
    }

    try {
        // Get user details for email notifications
        const [userRows] = await db.execute(
            'SELECT name, email, role FROM users WHERE id = ?',
            [userId]
        );

        if (userRows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = userRows[0];

        // Generate ticket number
        const ticketNumber = 'GSN-' + Date.now();

        // Prepare subject with recipient info for database storage
        let finalSubject = subject;
        let recipientName = 'Admin Support';
        let companyEmail = null;

        if (recipient_type === 'company' && recipient_id) {
            // Get company details
            const [companyRows] = await db.execute(
                'SELECT name, email FROM users WHERE id = ? AND role = "company"',
                [recipient_id]
            );

            if (companyRows.length > 0) {
                recipientName = companyRows[0].name;
                companyEmail = companyRows[0].email;
                finalSubject = `[TO COMPANY ID:${recipient_id}] ${subject}`;
            } else {
                return res.status(404).json({ message: 'Company not found' });
            }
        } else {
            finalSubject = `[TO ADMIN] ${subject}`;
        }

        const sql = `
            INSERT INTO support_tickets (
                user_id, ticket_number, subject, category, priority, 
                description, status, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, 'pending', NOW())
        `;

        const values = [userId, ticketNumber, finalSubject, category, priority || 'medium', description];
        const [result] = await db.execute(sql, values);

        // 📧 SEND EMAIL NOTIFICATIONS (NON-BLOCKING)
        try {
            const ticketData = {
                ticket_number: ticketNumber,
                subject: subject, // Clean subject without prefixes
                description,
                priority: priority || 'medium',
                category,
                user_name: user.name,
                user_email: user.email,
                user_role: user.role,
                recipient_type: recipient_type || 'admin',
                recipient_id: recipient_id || null,
                recipient_name: recipientName
            };

            // Send email notification
            await sendTicketEmail('ticket_created', ticketData);
            console.log(`✅ Email notifications sent for ticket ${ticketNumber}`);
        } catch (emailError) {
            console.error('❌ Error sending ticket creation emails:', emailError);
            // Don't fail the ticket creation if email fails
        }

        res.status(201).json({
            message: 'Support ticket created successfully',
            ticketId: result.insertId,
            ticketNumber: ticketNumber
        });

    } catch (error) {
        console.error('Error creating ticket:', error);
        res.status(500).json({ message: 'Server error creating ticket' });
    }
};

// @desc    Get user's tickets
// @route   GET /api/tickets/my-tickets
// @access  Private
const getMyTickets = async (req, res) => {
    const userId = req.user.id;

    try {
        const sql = `
            SELECT * FROM support_tickets 
            WHERE user_id = ? 
            ORDER BY created_at DESC
        `;

        const [rows] = await db.execute(sql, [userId]);
        res.status(200).json(rows);

    } catch (error) {
        console.error('Error fetching user tickets:', error);
        res.status(500).json({ message: 'Server error fetching tickets' });
    }
};

// @desc    Get all tickets (Admin) - Including tickets to companies
// @route   GET /api/tickets/admin/all
// @access  Private/Admin
const getAllTickets = async (req, res) => {
    try {
        const sql = `
            SELECT st.*, 
                   u.name as user_name, 
                   u.email as user_email, 
                   u.role as user_role,
                   admin.name as admin_name
            FROM support_tickets st
            JOIN users u ON st.user_id = u.id
            LEFT JOIN users admin ON st.admin_id = admin.id
            ORDER BY st.created_at DESC
        `;

        const [rows] = await db.execute(sql);
        
        // Parse recipient info from subject and enhance ticket data
        const enhancedTickets = await Promise.all(rows.map(async (ticket) => {
            let recipient_name = 'Admin Support';
            let recipient_type = 'admin';
            let recipient_id = null;
            let company_name = null;
            let company_email = null;
            
            // Parse company tickets
            if (ticket.subject.includes('[TO COMPANY ID:')) {
                const match = ticket.subject.match(/\[TO COMPANY ID:(\d+)\]/);
                if (match) {
                    recipient_type = 'company';
                    recipient_id = parseInt(match[1]);
                    
                    // Fetch company details
                    try {
                        const companySql = `
                            SELECT name, email FROM users 
                            WHERE id = ? AND role = 'company'
                        `;
                        const [companyRows] = await db.execute(companySql, [recipient_id]);
                        
                        if (companyRows.length > 0) {
                            company_name = companyRows[0].name;
                            company_email = companyRows[0].email;
                            recipient_name = company_name;
                        } else {
                            recipient_name = `Company (ID: ${match[1]}) - Not Found`;
                        }
                    } catch (error) {
                        console.error('Error fetching company details:', error);
                        recipient_name = `Company (ID: ${match[1]}) - Error`;
                    }
                    
                    // Clean the subject
                    ticket.subject = ticket.subject.replace(/\[TO COMPANY ID:\d+\]\s*/, '');
                }
            } else if (ticket.subject.includes('[TO ADMIN]')) {
                ticket.subject = ticket.subject.replace(/\[TO ADMIN\]\s*/, '');
            }
            
            return {
                ...ticket,
                recipient_type,
                recipient_id,
                recipient_name,
                company_name,
                company_email
            };
        }));

        res.status(200).json(enhancedTickets);

    } catch (error) {
        console.error('Error fetching all tickets:', error);
        res.status(500).json({ message: 'Server error fetching tickets' });
    }
};

// @desc    Get tickets by status (Admin)
// @route   GET /api/tickets/status/:status
// @access  Private/Admin
const getTicketsByStatus = async (req, res) => {
    const { status } = req.params;

    try {
        const sql = `
            SELECT st.*, u.name as user_name, u.email as user_email, u.role as user_role
            FROM support_tickets st
            JOIN users u ON st.user_id = u.id
            WHERE st.status = ?
            ORDER BY st.created_at DESC
        `;

        const [rows] = await db.execute(sql, [status]);
        res.status(200).json(rows);

    } catch (error) {
        console.error('Error fetching tickets by status:', error);
        res.status(500).json({ message: 'Server error fetching tickets' });
    }
};

// @desc    Update ticket status (Admin)
// @route   PUT /api/tickets/:id/status
// @access  Private/Admin
const updateTicketStatus = async (req, res) => {
    const { id } = req.params;
    const { status, adminResponse } = req.body;
    const adminId = req.user.id;

    const validStatuses = ['pending', 'answered', 'closed'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
    }

    try {
        // First get the ticket details
        const [ticketRows] = await db.execute(
            'SELECT * FROM support_tickets WHERE id = ?',
            [id]
        );

        if (ticketRows.length === 0) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        const ticket = ticketRows[0];

        // Update the ticket
        let sql = 'UPDATE support_tickets SET status = ?';
        let values = [status];

        if (adminResponse) {
            sql += ', admin_response = ?, admin_id = ?, responded_at = NOW()';
            values.push(adminResponse, adminId);
        }

        sql += ' WHERE id = ?';
        values.push(id);

        await db.execute(sql, values);

        // 🎯 TICKET → MESSAGE INTEGRATION
        // Create a message in the messages system when admin responds
        if (adminResponse && adminResponse.trim()) {
            try {
                // Determine the recipient based on ticket type
                let recipientId = ticket.user_id; // Default to ticket creator
                let messageSubject = `Ticket Response: ${ticket.ticket_number}`;
                let messageContent = `**Support Ticket Response**\n\n**Ticket:** ${ticket.ticket_number}\n**Subject:** ${ticket.subject}\n**Status:** ${status.toUpperCase()}\n\n**Admin Response:**\n${adminResponse}`;

                // Check if this is a company ticket
                if (ticket.subject.includes('[TO COMPANY ID:')) {
                    const match = ticket.subject.match(/\[TO COMPANY ID:(\d+)\]/);
                    if (match) {
                        const companyId = parseInt(match[1]);
                        
                        // Send message to both the ticket creator and the company
                        // Message to ticket creator
                        await db.execute(`
                            INSERT INTO messages (sender_id, receiver_id, subject, message, ticket_id, is_read, created_at)
                            VALUES (?, ?, ?, ?, ?, 0, NOW())
                        `, [adminId, ticket.user_id, messageSubject, messageContent, ticket.id]);

                        // Message to company
                        const companyMessageContent = `**Company Support Ticket Response**\n\n**Ticket:** ${ticket.ticket_number}\n**From User:** ${ticket.user_name || 'Customer'}\n**Subject:** ${ticket.subject.replace(/\[TO COMPANY ID:\d+\]\s*/, '')}\n**Status:** ${status.toUpperCase()}\n\n**Admin Response:**\n${adminResponse}\n\n*This ticket was originally sent to your company for support.*`;
                        
                        await db.execute(`
                            INSERT INTO messages (sender_id, receiver_id, subject, message, ticket_id, is_read, created_at)
                            VALUES (?, ?, ?, ?, ?, 0, NOW())
                        `, [adminId, companyId, `Company Ticket Response: ${ticket.ticket_number}`, companyMessageContent, ticket.id]);
                    }
                } else {
                    // Regular admin ticket - send message to ticket creator
                    await db.execute(`
                        INSERT INTO messages (sender_id, receiver_id, subject, message, ticket_id, is_read, created_at)
                        VALUES (?, ?, ?, ?, ?, 0, NOW())
                    `, [adminId, ticket.user_id, messageSubject, messageContent, ticket.id]);
                }

                console.log(`✅ Ticket response synced to messages for ticket ${ticket.ticket_number}`);
            } catch (messageError) {
                console.error('❌ Error syncing ticket response to messages:', messageError);
                // Don't fail the ticket update if message sync fails
            }
        }

        // 📧 SEND EMAIL NOTIFICATIONS (NON-BLOCKING)
        try {
            // Get user and admin details for email
            const [userRows] = await db.execute(
                'SELECT name, email, role FROM users WHERE id = ?',
                [ticket.user_id]
            );

            const [adminRows] = await db.execute(
                'SELECT name FROM users WHERE id = ?',
                [adminId]
            );

            if (userRows.length > 0) {
                const user = userRows[0];
                const admin = adminRows.length > 0 ? adminRows[0] : null;

                // Parse recipient info from ticket subject
                let recipientType = 'admin';
                let recipientId = null;
                let recipientName = 'Admin Support';

                if (ticket.subject.includes('[TO COMPANY ID:')) {
                    const match = ticket.subject.match(/\[TO COMPANY ID:(\d+)\]/);
                    if (match) {
                        recipientType = 'company';
                        recipientId = parseInt(match[1]);
                        
                        // Get company name
                        const [companyRows] = await db.execute(
                            'SELECT name FROM users WHERE id = ? AND role = "company"',
                            [recipientId]
                        );
                        
                        if (companyRows.length > 0) {
                            recipientName = companyRows[0].name;
                        }
                    }
                }

                const ticketData = {
                    ticket_number: ticket.ticket_number,
                    subject: ticket.subject.replace(/\[TO (ADMIN|COMPANY ID:\d+)\]\s*/, ''),
                    priority: ticket.priority,
                    user_name: user.name,
                    user_email: user.email,
                    user_role: user.role,
                    recipient_type: recipientType,
                    recipient_id: recipientId,
                    recipient_name: recipientName
                };

                const responseData = {
                    status: status,
                    admin_response: adminResponse,
                    admin_name: admin ? admin.name : 'GSN Support Team'
                };

                // Send response notification if there's a response
                if (adminResponse && adminResponse.trim()) {
                    await sendTicketEmail('ticket_response', ticketData, responseData);
                    console.log(`✅ Ticket response email sent for ticket ${ticket.ticket_number}`);
                }

                // Send status update notification if status changed
                if (ticket.status !== status) {
                    await sendTicketEmail('ticket_status_update', ticketData, {
                        oldStatus: ticket.status,
                        newStatus: status
                    });
                    console.log(`✅ Ticket status update email sent for ticket ${ticket.ticket_number}`);
                }
            }
        } catch (emailError) {
            console.error('❌ Error sending ticket response emails:', emailError);
            // Don't fail the ticket update if email fails
        }

        res.status(200).json({ message: 'Ticket updated successfully' });

    } catch (error) {
        console.error('Error updating ticket:', error);
        res.status(500).json({ message: 'Server error updating ticket' });
    }
};

// @desc    Get ticket details
// @route   GET /api/tickets/:id
// @access  Private (Owner or Admin)
const getTicketDetails = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    try {
        const sql = `
            SELECT st.*, 
                   u.name as user_name, u.email as user_email,
                   admin.name as admin_name
            FROM support_tickets st
            JOIN users u ON st.user_id = u.id
            LEFT JOIN users admin ON st.admin_id = admin.id
            WHERE st.id = ?
        `;

        const [rows] = await db.execute(sql, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        const ticket = rows[0];

        // Check access permissions
        if (userRole !== 'admin' && ticket.user_id !== userId) {
            return res.status(403).json({ message: 'Access denied' });
        }

        res.status(200).json(ticket);

    } catch (error) {
        console.error('Error fetching ticket details:', error);
        res.status(500).json({ message: 'Server error fetching ticket details' });
    }
};

// @desc    Delete ticket (Admin)
// @route   DELETE /api/tickets/admin/:id
// @access  Private/Admin
const deleteTicket = async (req, res) => {
    const { id } = req.params;

    try {
        // Check if ticket exists
        const checkSql = 'SELECT id FROM support_tickets WHERE id = ?';
        const [existing] = await db.execute(checkSql, [id]);

        if (existing.length === 0) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        // Delete the ticket
        const deleteSql = 'DELETE FROM support_tickets WHERE id = ?';
        await db.execute(deleteSql, [id]);

        res.status(200).json({ message: 'Ticket deleted successfully' });

    } catch (error) {
        console.error('Error deleting ticket:', error);
        res.status(500).json({ message: 'Server error deleting ticket' });
    }
};

// @desc    Get company tickets (tickets sent TO this company)
// @route   GET /api/tickets/company/received
// @access  Private/Company
const getCompanyTickets = async (req, res) => {
    const companyId = req.user.id;

    try {
        const sql = `
            SELECT st.*, 
                   u.name as user_name, 
                   u.email as user_email, 
                   u.role as user_role,
                   admin.name as admin_name
            FROM support_tickets st
            JOIN users u ON st.user_id = u.id
            LEFT JOIN users admin ON st.admin_id = admin.id
            WHERE st.subject LIKE CONCAT('%[TO COMPANY ID:', ?, ']%')
            ORDER BY st.created_at DESC
        `;

        const [rows] = await db.execute(sql, [companyId]);
        
        // Clean the subject lines and enhance ticket data
        const enhancedTickets = rows.map(ticket => ({
            ...ticket,
            subject: ticket.subject.replace(/\[TO COMPANY ID:\d+\]\s*/, ''),
            recipient_type: 'company',
            is_company_ticket: true
        }));

        res.status(200).json(enhancedTickets);

    } catch (error) {
        console.error('Error fetching company tickets:', error);
        res.status(500).json({ message: 'Server error fetching company tickets' });
    }
};

// @desc    Update company ticket response
// @route   PUT /api/tickets/company/:id/respond
// @access  Private/Company
const respondToCompanyTicket = async (req, res) => {
    const { id } = req.params;
    const { response } = req.body;
    const companyId = req.user.id;

    if (!response || !response.trim()) {
        return res.status(400).json({ message: 'Response is required' });
    }

    try {
        // First verify this ticket is for this company
        const [ticketRows] = await db.execute(
            'SELECT * FROM support_tickets WHERE id = ? AND subject LIKE CONCAT("%[TO COMPANY ID:", ?, "]%")',
            [id, companyId]
        );

        if (ticketRows.length === 0) {
            return res.status(404).json({ message: 'Ticket not found or access denied' });
        }

        const ticket = ticketRows[0];

        // Update ticket with company response
        await db.execute(
            'UPDATE support_tickets SET company_response = ?, company_responded_at = NOW(), status = "answered" WHERE id = ?',
            [response, id]
        );

        // 🎯 COMPANY TICKET → MESSAGE INTEGRATION
        // Create a message when company responds to a ticket
        try {
            const messageSubject = `Company Response: ${ticket.ticket_number}`;
            const messageContent = `**Company Support Response**\n\n**Ticket:** ${ticket.ticket_number}\n**Subject:** ${ticket.subject.replace(/\[TO COMPANY ID:\d+\]\s*/, '')}\n**Status:** ANSWERED\n\n**Company Response:**\n${response}`;

            // Send message to the ticket creator
            await db.execute(`
                INSERT INTO messages (sender_id, receiver_id, subject, message, ticket_id, is_read, created_at)
                VALUES (?, ?, ?, ?, ?, 0, NOW())
            `, [companyId, ticket.user_id, messageSubject, messageContent, ticket.id]);

            console.log(`✅ Company response synced to messages for ticket ${ticket.ticket_number}`);
        } catch (messageError) {
            console.error('❌ Error syncing company response to messages:', messageError);
            // Don't fail the ticket update if message sync fails
        }

        res.status(200).json({ message: 'Response submitted successfully' });

    } catch (error) {
        console.error('Error responding to company ticket:', error);
        res.status(500).json({ message: 'Server error submitting response' });
    }
};

export {
    createTicket,
    getMyTickets,
    getAllTickets,
    getTicketsByStatus,
    updateTicketStatus,
    getTicketDetails,
    deleteTicket,
    getCompanyTickets,
    respondToCompanyTicket
};