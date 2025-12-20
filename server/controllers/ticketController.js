// controllers/ticketController.js
import db from '../config/db.js';

// @desc    Create a support ticket
// @route   POST /api/tickets/create
// @access  Private
const createTicket = async (req, res) => {
    const userId = req.user.id;
    const { subject, category, priority, description } = req.body;

    if (!subject || !category || !description) {
        return res.status(400).json({ message: 'Subject, category, and description are required' });
    }

    try {
        // Generate ticket number
        const ticketNumber = 'GSN-' + Date.now();

        const sql = `
            INSERT INTO support_tickets (
                user_id, ticket_number, subject, category, priority, 
                description, status, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, 'pending', NOW())
        `;

        const values = [userId, ticketNumber, subject, category, priority || 'medium', description];
        const [result] = await db.execute(sql, values);

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

// @desc    Get all tickets (Admin)
// @route   GET /api/tickets/all
// @access  Private/Admin
const getAllTickets = async (req, res) => {
    try {
        const sql = `
            SELECT st.*, u.name as user_name, u.email as user_email, u.role as user_role
            FROM support_tickets st
            JOIN users u ON st.user_id = u.id
            ORDER BY st.created_at DESC
        `;

        const [rows] = await db.execute(sql);
        res.status(200).json(rows);

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
        let sql = 'UPDATE support_tickets SET status = ?';
        let values = [status];

        if (adminResponse) {
            sql += ', admin_response = ?, admin_id = ?, responded_at = NOW()';
            values.push(adminResponse, adminId);
        }

        sql += ' WHERE id = ?';
        values.push(id);

        await db.execute(sql, values);
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

export {
    createTicket,
    getMyTickets,
    getAllTickets,
    getTicketsByStatus,
    updateTicketStatus,
    getTicketDetails
};