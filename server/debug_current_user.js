// Debug script to check current user authentication
import express from 'express';
import { protect } from './middleware/authMiddleware.js';
import db from './config/db.js';

const app = express();
app.use(express.json());

// Debug endpoint to check current user
app.get('/debug/current-user', protect, async (req, res) => {
    try {
        console.log('Current authenticated user:', req.user);
        
        // Get user's notifications
        const [notifications] = await db.execute(`
            SELECT n.*, un.is_read, un.read_at
            FROM notifications n
            LEFT JOIN user_notifications un ON (n.id = un.notification_id AND un.user_id = ?)
            WHERE (
                (n.target_role = 'user_specific' AND un.user_id = ?)
                OR 
                ((n.target_audience = 'all' OR 
                 (n.target_audience = 'companies' AND ? = 'company') OR
                 (n.target_audience = 'businesses' AND ? = 'business') OR
                 (n.target_audience = 'users' AND ? = 'user'))
                AND n.target_role != 'user_specific')
            )
            ORDER BY n.created_at DESC
            LIMIT 10
        `, [req.user.id, req.user.id, req.user.role, req.user.role, req.user.role]);
        
        res.json({
            user: req.user,
            notificationCount: notifications.length,
            notifications: notifications
        });
    } catch (error) {
        console.error('Debug error:', error);
        res.status(500).json({ error: error.message });
    }
});

const PORT = 5001;
app.listen(PORT, () => {
    console.log(`Debug server running on port ${PORT}`);
    console.log(`Visit: http://localhost:${PORT}/debug/current-user`);
    console.log('Make sure to include Authorization: Bearer <token> header');
});