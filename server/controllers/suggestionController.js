// controllers/suggestionController.js
import db from '../config/db.js';

// @desc    Submit a suggestion/feedback
// @route   POST /api/suggestions/submit
// @access  Private
const submitSuggestion = async (req, res) => {
    const userId = req.user.id;
    const { subject, category, message } = req.body;

    if (!subject || !message) {
        return res.status(400).json({ message: 'Subject and message are required' });
    }

    try {
        const sql = `
            INSERT INTO suggestions (user_id, subject, category, message, status, created_at)
            VALUES (?, ?, ?, ?, 'pending', NOW())
        `;

        const [result] = await db.execute(sql, [userId, subject, category || 'general', message]);

        res.status(201).json({
            message: 'Suggestion submitted successfully',
            suggestionId: result.insertId
        });

    } catch (error) {
        console.error('Error submitting suggestion:', error);
        res.status(500).json({ message: 'Server error submitting suggestion' });
    }
};

// @desc    Get user's suggestions
// @route   GET /api/suggestions/my-suggestions
// @access  Private
const getMySuggestions = async (req, res) => {
    const userId = req.user.id;

    try {
        const sql = `
            SELECT * FROM suggestions 
            WHERE user_id = ? 
            ORDER BY created_at DESC
        `;

        const [rows] = await db.execute(sql, [userId]);
        res.status(200).json(rows);

    } catch (error) {
        console.error('Error fetching suggestions:', error);
        res.status(500).json({ message: 'Server error fetching suggestions' });
    }
};

// @desc    Get all suggestions (Admin)
// @route   GET /api/suggestions/all
// @access  Private/Admin
const getAllSuggestions = async (req, res) => {
    try {
        const sql = `
            SELECT s.*, u.name as user_name, u.email as user_email, u.role as user_role
            FROM suggestions s
            JOIN users u ON s.user_id = u.id
            ORDER BY s.created_at DESC
        `;

        const [rows] = await db.execute(sql);
        res.status(200).json(rows);

    } catch (error) {
        console.error('Error fetching all suggestions:', error);
        res.status(500).json({ message: 'Server error fetching suggestions' });
    }
};

// @desc    Update suggestion status (Admin)
// @route   PUT /api/suggestions/:id/status
// @access  Private/Admin
const updateSuggestionStatus = async (req, res) => {
    const { id } = req.params;
    const { status, adminResponse } = req.body;

    const validStatuses = ['pending', 'reviewed', 'implemented', 'rejected'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
    }

    try {
        let sql = 'UPDATE suggestions SET status = ?';
        let values = [status];

        if (adminResponse) {
            sql += ', admin_response = ?';
            values.push(adminResponse);
        }

        sql += ' WHERE id = ?';
        values.push(id);

        await db.execute(sql, values);
        res.status(200).json({ message: 'Suggestion updated successfully' });

    } catch (error) {
        console.error('Error updating suggestion:', error);
        res.status(500).json({ message: 'Server error updating suggestion' });
    }
};

export {
    submitSuggestion,
    getMySuggestions,
    getAllSuggestions,
    updateSuggestionStatus
};
