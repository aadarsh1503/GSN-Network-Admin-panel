// middleware/optionalAuth.js
import jwt from 'jsonwebtoken';
import db from '../config/db.js';

// Optional authentication middleware - doesn't fail if no token is provided
const optionalAuth = async (req, res, next) => {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user from the token's ID and attach to the request
            const [rows] = await db.execute('SELECT id, name, email, role FROM users WHERE id = ?', [decoded.id]);
            
            if (rows.length > 0) {
                req.user = rows[0];
            }
        } catch (error) {
            // If token is invalid, just continue without user (don't fail)
            console.log('Optional auth failed:', error.message);
        }
    }

    next(); // Always proceed to the next middleware/controller
};

export { optionalAuth };