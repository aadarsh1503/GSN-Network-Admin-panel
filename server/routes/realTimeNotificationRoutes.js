import express from 'express';
import jwt from 'jsonwebtoken';
import { protect } from '../middleware/authMiddleware.js';
import db from '../config/db.js';

const router = express.Router();

// Store active SSE connections
const activeConnections = new Map();

// Notification event types
export const NOTIFICATION_EVENTS = {
  // Admin Panel Events
  ADMIN: {
    NEW_USER_REGISTRATION: 'admin_new_user_registration',
    NEW_COMPANY_REGISTRATION: 'admin_new_company_registration',
    NEW_QUOTE_REQUEST: 'admin_new_quote_request',
    USER_ACCEPTS_QUOTE: 'admin_user_accepts_quote',
    QUOTE_STATUS_CHANGED: 'admin_quote_status_changed',
    NEW_MESSAGE: 'admin_new_message',
    MEMBER_ACTIVITY_UPDATE: 'admin_member_activity_update',
    PROFILE_UPDATE: 'admin_profile_update',
    DISPUTE_RAISED: 'admin_dispute_raised',
    SUPPORT_TICKET_RAISED: 'admin_support_ticket_raised',
    TICKET_STATUS_UPDATE: 'admin_ticket_status_update',
    SYSTEM_CRITICAL_ACTION: 'admin_system_critical_action'
  },
  
  // Member Panel Events
  MEMBER: {
    NEW_QUOTE_ASSIGNED: 'member_new_quote_assigned',
    USER_ACCEPTS_QUOTE: 'member_user_accepts_quote',
    USER_REJECTS_QUOTE: 'member_user_rejects_quote',
    QUOTE_STATUS_UPDATE: 'member_quote_status_update',
    NEW_MESSAGE: 'member_new_message',
    DISPUTE_INVOLVING_MEMBER: 'member_dispute_involving',
    SUPPORT_TICKET_INVOLVING: 'member_support_ticket_involving',
    ADMIN_ACTION_IMPACT: 'member_admin_action_impact'
  },
  
  // User Panel Events
  USER: {
    QUOTE_STATUS_APPROVED: 'user_quote_status_approved',
    QUOTE_STATUS_REJECTED: 'user_quote_status_rejected',
    QUOTE_STATUS_RUNNING: 'user_quote_status_running',
    QUOTE_STATUS_CLOSED: 'user_quote_status_closed',
    ADMIN_STATUS_CHANGE: 'user_admin_status_change',
    MEMBER_QUOTE_RESPONSE: 'user_member_quote_response',
    WORK_STARTED: 'user_work_started',
    WORK_COMPLETED: 'user_work_completed',
    NEW_MESSAGE: 'user_new_message',
    DISPUTE_UPDATE: 'user_dispute_update',
    SUPPORT_TICKET_UPDATE: 'user_support_ticket_update'
  }
};

// SSE endpoint for real-time notifications
router.get('/stream', (req, res) => {
  // Extract token from query params for SSE
  const token = req.query.token;
  const lastEventId = req.query.lastEventId;

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  // Verify token manually since middleware doesn't work well with SSE
  let user;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    user = decoded;
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  // Set SSE headers (removed CORS headers since using Vite proxy)
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no', // Disable nginx buffering
  });

  // Send initial connection confirmation
  res.write(`data: ${JSON.stringify({
    type: 'connection',
    message: 'Connected to real-time notifications',
    timestamp: new Date().toISOString()
  })}\n\n`);

  // Store connection
  const connectionId = `${user.id}_${user.role}_${Date.now()}`;
  activeConnections.set(connectionId, {
    res,
    user,
    lastEventId,
    connectedAt: new Date()
  });

  // console.log(`📡 SSE connection established for user ${user.id} (${user.role}) - Connection ID: ${connectionId}`);
  // console.log(`📊 Active connections: ${activeConnections.size}`);

  // Keep connection alive with periodic heartbeat
  const heartbeat = setInterval(() => {
    if (activeConnections.has(connectionId)) {
      try {
        res.write(`data: ${JSON.stringify({
          type: 'heartbeat',
          timestamp: new Date().toISOString()
        })}\n\n`);
      } catch (error) {
        console.log(`Heartbeat failed for connection ${connectionId}:`, error.message);
        clearInterval(heartbeat);
        activeConnections.delete(connectionId);
      }
    } else {
      clearInterval(heartbeat);
    }
  }, 30000); // 30 seconds

  // Handle client disconnect
  const cleanup = () => {
    clearInterval(heartbeat);
    activeConnections.delete(connectionId);
    // console.log(`📡 SSE connection closed for user ${user.id} (${user.role}) - Connection ID: ${connectionId}`);
    // console.log(`📊 Active connections: ${activeConnections.size}`);
  };

  req.on('close', cleanup);
  req.on('aborted', cleanup);
  res.on('close', cleanup);
});

// Function to broadcast notification to specific users
export const broadcastNotification = (eventType, data, targetUsers = null) => {
  const notification = {
    type: eventType,
    data,
    timestamp: new Date().toISOString(),
    id: `${eventType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  };

  console.log(`📢 Broadcasting notification: ${eventType}`, data);

  let sentCount = 0;
  
  for (const [connectionId, connection] of activeConnections) {
    const { res, user } = connection;
    
    // If targetUsers is specified, only send to those users
    if (targetUsers && !targetUsers.includes(user.id)) {
      continue;
    }

    try {
      res.write(`id: ${notification.id}\n`);
      res.write(`data: ${JSON.stringify(notification)}\n\n`);
      sentCount++;
    } catch (error) {
      console.error(`Error sending notification to user ${user.id}:`, error);
      // Remove dead connection
      activeConnections.delete(connectionId);
    }
  }

  console.log(`📤 Notification sent to ${sentCount} connections`);
  return sentCount;
};

// Function to broadcast to all users of a specific role
export const broadcastToRole = (eventType, data, role) => {
  const notification = {
    type: eventType,
    data,
    timestamp: new Date().toISOString(),
    id: `${eventType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  };

  console.log(`📢 Broadcasting to role ${role}: ${eventType}`, data);

  let sentCount = 0;
  
  for (const [connectionId, connection] of activeConnections) {
    const { res, user } = connection;
    
    if (user.role !== role) {
      continue;
    }

    try {
      res.write(`id: ${notification.id}\n`);
      res.write(`data: ${JSON.stringify(notification)}\n\n`);
      sentCount++;
    } catch (error) {
      console.error(`Error sending notification to user ${user.id}:`, error);
      // Remove dead connection
      activeConnections.delete(connectionId);
    }
  }

  console.log(`📤 Notification sent to ${sentCount} ${role} connections`);
  return sentCount;
};

// Test endpoint to trigger notifications
router.post('/test-trigger', protect, async (req, res) => {
  try {
    const { eventType, data } = req.body;
    
    // Broadcast the test notification
    const sentCount = broadcastNotification(eventType, data);
    
    res.json({
      success: true,
      message: `Test notification sent to ${sentCount} connections`,
      eventType,
      data
    });
  } catch (error) {
    console.error('Error triggering test notification:', error);
    res.status(500).json({ error: 'Failed to trigger test notification' });
  }
});

// Get active connections info (for debugging)
router.get('/connections', protect, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const connections = Array.from(activeConnections.entries()).map(([id, conn]) => ({
    connectionId: id,
    userId: conn.user.id,
    userRole: conn.user.role,
    connectedAt: conn.connectedAt,
    lastEventId: conn.lastEventId
  }));

  res.json({
    totalConnections: activeConnections.size,
    connections
  });
});

export default router;