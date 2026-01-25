// Real-time account status notification service
import { WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';
import db from '../config/db.js';

class RealTimeAccountService {
    constructor() {
        this.wss = null;
        this.clients = new Map(); // userId -> WebSocket connection
    }

    // Initialize WebSocket server
    initialize(server) {
        this.wss = new WebSocketServer({ 
            server,
            path: '/ws/account-status'
        });

        this.wss.on('connection', (ws, req) => {
            console.log('🔌 New WebSocket connection for account status');
            
            ws.on('message', async (message) => {
                try {
                    const data = JSON.parse(message.toString());
                    
                    if (data.type === 'authenticate') {
                        await this.authenticateConnection(ws, data.token);
                    }
                } catch (error) {
                    console.error('WebSocket message error:', error);
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: 'Invalid message format'
                    }));
                }
            });

            ws.on('close', () => {
                // Remove client from active connections
                for (const [userId, client] of this.clients.entries()) {
                    if (client === ws) {
                        this.clients.delete(userId);
                        console.log(`🔌 WebSocket disconnected for user ${userId}`);
                        break;
                    }
                }
            });

            ws.on('error', (error) => {
                console.error('WebSocket error:', error);
            });
        });

        console.log('✅ Real-time account status service initialized');
    }

    // Authenticate WebSocket connection
    async authenticateConnection(ws, token) {
        try {
            if (!token) {
                ws.send(JSON.stringify({
                    type: 'auth_error',
                    message: 'No token provided'
                }));
                return;
            }

            // Verify JWT token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // Get user info
            const [rows] = await db.execute(
                'SELECT id, name, email, role, status, is_blacklisted FROM users WHERE id = ?', 
                [decoded.id]
            );

            if (rows.length === 0) {
                ws.send(JSON.stringify({
                    type: 'auth_error',
                    message: 'User not found'
                }));
                return;
            }

            const user = rows[0];
            
            // Store authenticated connection
            this.clients.set(user.id, ws);
            
            ws.send(JSON.stringify({
                type: 'authenticated',
                userId: user.id,
                message: 'WebSocket authenticated successfully'
            }));

            console.log(`✅ WebSocket authenticated for user ${user.email} (ID: ${user.id})`);

        } catch (error) {
            console.error('WebSocket authentication error:', error);
            ws.send(JSON.stringify({
                type: 'auth_error',
                message: 'Authentication failed'
            }));
        }
    }

    // Notify user about account deactivation
    notifyAccountDeactivated(userId, message = 'Your account has been deactivated') {
        const client = this.clients.get(userId);
        if (client && client.readyState === client.OPEN) {
            client.send(JSON.stringify({
                type: 'account_deactivated',
                message: message,
                timestamp: new Date().toISOString()
            }));
            console.log(`📢 Sent deactivation notification to user ${userId}`);
            return true;
        }
        return false;
    }

    // Notify user about blacklisting
    notifyAccountBlacklisted(userId, message = 'Your account has been blacklisted') {
        const client = this.clients.get(userId);
        if (client && client.readyState === client.OPEN) {
            client.send(JSON.stringify({
                type: 'account_blacklisted',
                message: message,
                timestamp: new Date().toISOString()
            }));
            console.log(`📢 Sent blacklist notification to user ${userId}`);
            return true;
        }
        return false;
    }

    // Notify user about account reactivation
    notifyAccountReactivated(userId, message = 'Your account has been reactivated') {
        const client = this.clients.get(userId);
        if (client && client.readyState === client.OPEN) {
            client.send(JSON.stringify({
                type: 'account_reactivated',
                message: message,
                timestamp: new Date().toISOString()
            }));
            console.log(`📢 Sent reactivation notification to user ${userId}`);
            return true;
        }
        return false;
    }

    // Get connected clients count
    getConnectedClientsCount() {
        return this.clients.size;
    }

    // Get connected user IDs
    getConnectedUserIds() {
        return Array.from(this.clients.keys());
    }
}

// Export singleton instance
export default new RealTimeAccountService();