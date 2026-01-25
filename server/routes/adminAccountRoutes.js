// Admin routes for account management with real-time notifications
import express from 'express';
import { protect as authenticateToken, authorize as authorizeRoles } from '../middleware/authMiddleware.js';
import db from '../config/db.js';
import realTimeAccountService from '../services/realTimeAccountService.js';

const router = express.Router();

// @desc    Deactivate user account
// @route   PUT /api/admin/accounts/:userId/deactivate
// @access  Private/Admin
router.put('/accounts/:userId/deactivate', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const { userId } = req.params;
        const { reason } = req.body;

        // Get user info before deactivation
        const [userRows] = await db.execute('SELECT id, name, email, role FROM users WHERE id = ?', [userId]);
        
        if (userRows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = userRows[0];

        // Deactivate the account
        const [result] = await db.execute(
            'UPDATE users SET status = 0 WHERE id = ?',
            [userId]
        );

        if (result.affectedRows === 0) {
            return res.status(400).json({ message: 'Failed to deactivate account' });
        }

        // Send real-time notification to the user
        const notificationMessage = reason 
            ? `Your account has been deactivated. Reason: ${reason}`
            : 'Your account has been deactivated. Please contact support.';
        
        const notificationSent = realTimeAccountService.notifyAccountDeactivated(parseInt(userId), notificationMessage);

        // Log the action
        console.log(`🚫 Admin ${req.user.email} deactivated account for ${user.email} (ID: ${userId})`);

        res.json({
            success: true,
            message: 'Account deactivated successfully',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            },
            realTimeNotificationSent: notificationSent
        });

    } catch (error) {
        console.error('Error deactivating account:', error);
        res.status(500).json({ message: 'Server error while deactivating account' });
    }
});

// @desc    Blacklist user account
// @route   PUT /api/admin/accounts/:userId/blacklist
// @access  Private/Admin
router.put('/accounts/:userId/blacklist', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const { userId } = req.params;
        const { reason } = req.body;

        // Get user info before blacklisting
        const [userRows] = await db.execute('SELECT id, name, email, role FROM users WHERE id = ?', [userId]);
        
        if (userRows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = userRows[0];

        // Blacklist the account
        const [result] = await db.execute(
            'UPDATE users SET is_blacklisted = 1 WHERE id = ?',
            [userId]
        );

        if (result.affectedRows === 0) {
            return res.status(400).json({ message: 'Failed to blacklist account' });
        }

        // Send real-time notification to the user
        const notificationMessage = reason 
            ? `Your account has been blacklisted due to policy violations. Reason: ${reason}`
            : 'Your account has been blacklisted due to policy violations. Please contact support.';
        
        const notificationSent = realTimeAccountService.notifyAccountBlacklisted(parseInt(userId), notificationMessage);

        // Log the action
        console.log(`🚫 Admin ${req.user.email} blacklisted account for ${user.email} (ID: ${userId})`);

        res.json({
            success: true,
            message: 'Account blacklisted successfully',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            },
            realTimeNotificationSent: notificationSent
        });

    } catch (error) {
        console.error('Error blacklisting account:', error);
        res.status(500).json({ message: 'Server error while blacklisting account' });
    }
});

// @desc    Reactivate user account
// @route   PUT /api/admin/accounts/:userId/reactivate
// @access  Private/Admin
router.put('/accounts/:userId/reactivate', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const { userId } = req.params;

        // Get user info before reactivation
        const [userRows] = await db.execute('SELECT id, name, email, role FROM users WHERE id = ?', [userId]);
        
        if (userRows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = userRows[0];

        // Reactivate the account (set status = 1 and is_blacklisted = 0)
        const [result] = await db.execute(
            'UPDATE users SET status = 1, is_blacklisted = 0 WHERE id = ?',
            [userId]
        );

        if (result.affectedRows === 0) {
            return res.status(400).json({ message: 'Failed to reactivate account' });
        }

        // Send real-time notification to the user
        const notificationSent = realTimeAccountService.notifyAccountReactivated(
            parseInt(userId), 
            'Your account has been reactivated. You can now access the system.'
        );

        // Log the action
        console.log(`✅ Admin ${req.user.email} reactivated account for ${user.email} (ID: ${userId})`);

        res.json({
            success: true,
            message: 'Account reactivated successfully',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            },
            realTimeNotificationSent: notificationSent
        });

    } catch (error) {
        console.error('Error reactivating account:', error);
        res.status(500).json({ message: 'Server error while reactivating account' });
    }
});

// @desc    Get real-time connection status
// @route   GET /api/admin/accounts/realtime-status
// @access  Private/Admin
router.get('/accounts/realtime-status', authenticateToken, authorizeRoles('admin'), (req, res) => {
    try {
        const connectedClients = realTimeAccountService.getConnectedClientsCount();
        const connectedUserIds = realTimeAccountService.getConnectedUserIds();

        res.json({
            success: true,
            connectedClients,
            connectedUserIds,
            message: `${connectedClients} users connected to real-time account status service`
        });
    } catch (error) {
        console.error('Error getting real-time status:', error);
        res.status(500).json({ message: 'Server error while getting real-time status' });
    }
});

export default router;