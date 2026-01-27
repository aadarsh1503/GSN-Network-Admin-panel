import jwt from 'jsonwebtoken';
import db from '../config/db.js';
import dbRetry from '../utils/dbRetry.js';

// Middleware to protect routes (check if user is logged in)
const protect = async (req, res, next) => {
    let token;
    const requestId = Math.random().toString(36).substring(7);
    const timestamp = new Date().toISOString();
    
    // 🔍 DETAILED LOGGING: Track middleware entry
    console.log(`🔐 [AUTH-${requestId}] Token verification started at ${timestamp}:`, {
        method: req.method,
        url: req.url,
        userAgent: req.headers['user-agent'],
        ip: req.ip || req.connection.remoteAddress,
        hasAuthHeader: !!req.headers.authorization,
        authHeaderStart: req.headers.authorization ? req.headers.authorization.substring(0, 20) + '...' : 'none'
    });
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];
            
            console.log(`🔍 [AUTH-${requestId}] Token extracted, length: ${token.length} chars`);

            // Verify token
            const verifyStartTime = Date.now();
            console.log(`🔑 [AUTH-${requestId}] Starting JWT verification...`);
            
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            const verifyEndTime = Date.now();
            const verifyDuration = verifyEndTime - verifyStartTime;
            
            console.log(`✅ [AUTH-${requestId}] JWT verification successful (${verifyDuration}ms):`, {
                userId: decoded.id,
                userEmail: decoded.email,
                tokenExp: new Date(decoded.exp * 1000).toISOString(),
                tokenIat: new Date(decoded.iat * 1000).toISOString(),
                verificationDuration: `${verifyDuration}ms`
            });

            // Get user from the token's ID and attach to the request
            // ENHANCED: Also check account status and blacklist status with retry logic
            const dbStartTime = Date.now();
            console.log(`🗄️ [AUTH-${requestId}] Querying user data from database with retry logic...`);
            
            const [rows] = await dbRetry.execute('SELECT id, name, email, role, status, is_blacklisted FROM users WHERE id = ?', [decoded.id]);
            
            const dbEndTime = Date.now();
            const dbDuration = dbEndTime - dbStartTime;
            
            req.user = rows[0];

            if (!req.user) {
                console.error(`❌ [AUTH-${requestId}] User not found in database for ID: ${decoded.id}`);
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }
            
            console.log(`✅ [AUTH-${requestId}] User data retrieved (${dbDuration}ms):`, {
                userId: req.user.id,
                userEmail: req.user.email,
                userRole: req.user.role,
                userStatus: req.user.status,
                isBlacklisted: req.user.is_blacklisted,
                dbQueryDuration: `${dbDuration}ms`
            });

            // ENHANCED: Check if user account is active (status = 1)
            if (req.user.status !== 1 && req.user.status !== true) {
                console.log(`🚫 [AUTH-${requestId}] Account deactivated for user ${req.user.email} (ID: ${req.user.id})`);
                return res.status(401).json({ 
                    message: 'Your account has been deactivated. Please contact support.',
                    accountDeactivated: true // Flag to help frontend handle this specific case
                });
            }

            // ENHANCED: Check if user is blacklisted
            if (req.user.is_blacklisted === 1 || req.user.is_blacklisted === true) {
                console.log(`🚫 [AUTH-${requestId}] Blacklisted user attempted access: ${req.user.email} (ID: ${req.user.id})`);
                return res.status(401).json({ 
                    message: 'Your account has been blacklisted due to policy violations. Please contact support.',
                    accountBlacklisted: true // Flag to help frontend handle this specific case
                });
            }

            const totalDuration = Date.now() - verifyStartTime;
            console.log(`✅ [AUTH-${requestId}] Authentication successful - proceeding to next middleware (total: ${totalDuration}ms)`);
            
            next(); // Proceed to the next middleware/controller
        } catch (error) {
            const errorTime = Date.now();
            
            // 🔍 DETAILED LOGGING: Comprehensive error analysis
            console.error(`💥 [AUTH-${requestId}] Token verification error at ${new Date(errorTime).toISOString()}:`, {
                errorName: error.name,
                errorMessage: error.message,
                errorStack: error.stack,
                tokenLength: token ? token.length : 0,
                tokenStart: token ? token.substring(0, 20) + '...' : 'none',
                method: req.method,
                url: req.url,
                userAgent: req.headers['user-agent'],
                ip: req.ip || req.connection.remoteAddress,
                jwtSecret: process.env.JWT_SECRET ? 'present' : 'missing'
            });
            
            // 🔍 SPECIFIC ECONNRESET TRACKING for auth middleware
            if (error.message.includes('ECONNRESET')) {
                console.error(`🔥 [AUTH-${requestId}] ECONNRESET in Auth Middleware:`, {
                    timestamp: new Date().toISOString(),
                    method: req.method,
                    url: req.url,
                    userAgent: req.headers['user-agent'],
                    ip: req.ip || req.connection.remoteAddress,
                    stackTrace: error.stack
                });
            }
            
            // --- MODIFICATION ---
            // Specifically check if the error is because the token expired.
            if (error.name === 'TokenExpiredError') {
                console.warn(`⏰ [AUTH-${requestId}] Token expired for request to ${req.url}`);
                // Send a specific, clear response for expired tokens.
                // Your frontend API utility will look for this 401 status.
                return res.status(401).json({ message: 'Your session has expired. Please log in again.' });
            }

            // For any other token verification error (e.g., invalid signature)
            console.error(`🚫 [AUTH-${requestId}] Token verification failed:`, error.message);
            return res.status(401).json({ message: 'Not authorized, token is invalid.' });
        }
    }

    if (!token) {
        console.warn(`🚫 [AUTH-${requestId}] No token provided for ${req.method} ${req.url}`);
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