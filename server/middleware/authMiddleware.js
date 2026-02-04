import jwt from 'jsonwebtoken';
import db from '../config/db.js';
import dbRetry from '../utils/dbRetry.js';

// Middleware to protect routes (check if user is logged in)
const protect = async (req, res, next) => {
    let token;
    const requestId = Math.random().toString(36).substring(7);
    const timestamp = new Date().toISOString();
    

    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];
            


            // Verify token
            const verifyStartTime = Date.now();

            
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            const verifyEndTime = Date.now();
            const verifyDuration = verifyEndTime - verifyStartTime;
            


            // Get user from the token's ID and attach to the request
            // ENHANCED: Also check account status and blacklist status with retry logic
            const dbStartTime = Date.now();

            
            const [rows] = await dbRetry.execute('SELECT id, name, email, role, status, is_blacklisted FROM users WHERE id = ?', [decoded.id]);
            
            const dbEndTime = Date.now();
            const dbDuration = dbEndTime - dbStartTime;
            
            req.user = rows[0];

            if (!req.user) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }
            


            // ENHANCED: Check if user account is active (status = 1)
            if (req.user.status !== 1 && req.user.status !== true) {
                return res.status(401).json({ 
                    message: 'Your account has been deactivated. Please contact support.',
                    accountDeactivated: true // Flag to help frontend handle this specific case
                });
            }

            // ENHANCED: Check if user is blacklisted
            if (req.user.is_blacklisted === 1 || req.user.is_blacklisted === true) {
                return res.status(401).json({ 
                    message: 'Your account has been blacklisted due to policy violations. Please contact support.',
                    accountBlacklisted: true // Flag to help frontend handle this specific case
                });
            }

            const totalDuration = Date.now() - verifyStartTime;

            
            next(); // Proceed to the next middleware/controller
        } catch (error) {
            const errorTime = Date.now();
            
            // 🔍 SPECIFIC ECONNRESET TRACKING for auth middleware
            if (error.message.includes('ECONNRESET')) {
                // Handle ECONNRESET silently or with minimal logging
            }
            
            // --- MODIFICATION ---
            // Specifically check if the error is because the token expired.
            if (error.name === 'TokenExpiredError') {
                // Send a specific, clear response for expired tokens.
                // Your frontend API utility will look for this 401 status.
                return res.status(401).json({ message: 'Your session has expired. Please log in again.' });
            }

            // For any other token verification error (e.g., invalid signature)
            return res.status(401).json({ message: 'Not authorized, token is invalid.' });
        }
    }

    if (!token) {
        // Also a good idea to make this message slightly more specific
        return res.status(401).json({ message: 'Not authorized, no token provided.' });
    }
};

// Middleware to check for specific roles
const authorize = (...roles) => {
    return (req, res, next) => {
        // Normalize the user role (trim whitespace and handle any encoding issues)
        const userRole = req.user.role ? req.user.role.toString().trim() : '';
        
        // Check if the user role is in the allowed roles
        const isAuthorized = roles.some(role => role.toString().trim() === userRole);
        
        if (!isAuthorized) {
            return res.status(403).json({ 
                message: `User role '${req.user.role}' is not authorized to access this route` 
            });
        }
        
        next();
    };
};

export { protect, authorize };