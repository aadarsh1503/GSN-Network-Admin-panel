import jwt from 'jsonwebtoken';
import db from '../config/db.js';

// Middleware to protect routes (check if user is logged in)
const protect = async (req, res, next) => {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user from the token's ID and attach to the request
            const [rows] = await db.execute('SELECT id, name, email, role FROM users WHERE id = ?', [decoded.id]);
            req.user = rows[0];

            if (!req.user) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }

            next(); // Proceed to the next middleware/controller
        } catch (error) {
            
            // --- MODIFICATION ---
            // Specifically check if the error is because the token expired.
            if (error.name === 'TokenExpiredError') {
                // Send a specific, clear response for expired tokens.
                // Your frontend API utility will look for this 401 status.
                return res.status(401).json({ message: 'Your session has expired. Please log in again.' });
            }

            // For any other token verification error (e.g., invalid signature)
            console.error('Token verification error:', error.message);
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