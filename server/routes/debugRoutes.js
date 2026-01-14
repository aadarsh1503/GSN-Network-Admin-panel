// Debug routes for troubleshooting authentication issues
import express from 'express';
import { protect as authenticateToken, authorize as authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// @desc    Debug current user's authentication state
// @route   GET /api/debug/auth-state
// @access  Private (any authenticated user)
router.get('/auth-state', authenticateToken, (req, res) => {
    try {
        const user = req.user;
        
        res.json({
            success: true,
            message: 'Authentication successful',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            },
            timestamp: new Date().toISOString(),
            tokenValid: true
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error getting auth state',
            error: error.message
        });
    }
});

// @desc    Test company role authorization
// @route   GET /api/debug/test-company-auth
// @access  Private (company users only)
router.get('/test-company-auth', authenticateToken, (req, res) => {
    try {
        const user = req.user;
        
        // Manual role check
        if (user.role !== 'company') {
            return res.status(403).json({
                success: false,
                message: `User role '${user.role}' is not authorized for company routes`,
                userRole: user.role,
                requiredRole: 'company'
            });
        }
        
        res.json({
            success: true,
            message: 'Company authorization successful',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error testing company auth',
            error: error.message
        });
    }
});

// @desc    Test company role with middleware
// @route   GET /api/debug/test-company-middleware
// @access  Private (company users only) - uses authorizeRoles middleware
router.get('/test-company-middleware', authenticateToken, authorizeRoles('company'), (req, res) => {
    res.json({
        success: true,
        message: 'Company middleware authorization successful',
        user: {
            id: req.user.id,
            name: req.user.name,
            email: req.user.email,
            role: req.user.role
        },
        timestamp: new Date().toISOString()
    });
});

// @desc    Get detailed user information for debugging
// @route   GET /api/debug/user-details
// @access  Private (any authenticated user)
router.get('/user-details', authenticateToken, async (req, res) => {
    try {
        const user = req.user;
        
        // Get additional user details from database if needed
        // This endpoint just returns what's already in req.user from the middleware
        
        res.json({
            success: true,
            message: 'User details retrieved successfully',
            user: user,
            middleware_source: 'authMiddleware.js protect function',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error getting user details',
            error: error.message
        });
    }
});

export default router;