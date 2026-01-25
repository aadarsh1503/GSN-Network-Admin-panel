// Test routes for simulating account status changes
import express from 'express';
import jwt from 'jsonwebtoken';

const router = express.Router();

// In-memory storage for test user statuses (in production, this would be in database)
const testUserStatuses = new Map();

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// GET /api/test/account-status - Check current user status
router.get('/account-status', verifyToken, (req, res) => {
  const userId = req.user.id || req.user.userId;
  const userStatus = testUserStatuses.get(userId) || 'active';
  
  console.log(`🔍 Checking test account status for user ${userId}: ${userStatus}`);
  
  // Simulate user data with status
  const userData = {
    id: userId,
    name: req.user.name || 'Test User',
    email: req.user.email || 'test@example.com',
    status: userStatus,
    is_active: userStatus === 'active',
    role: req.user.role || 'user'
  };

  // If user is blacklisted or deactivated, return 401 to trigger logout
  if (userStatus === 'blacklisted' || userStatus === 'deactivated') {
    return res.status(401).json({ 
      error: 'Account access revoked',
      status: userStatus,
      message: `Your account has been ${userStatus} by an administrator.`
    });
  }

  res.json({ 
    success: true,
    user: userData,
    message: 'Account status check successful'
  });
});

// POST /api/test/set-status - Set user status for testing (admin only)
router.post('/set-status', (req, res) => {
  const { userId, status } = req.body;
  
  if (!userId || !status) {
    return res.status(400).json({ error: 'userId and status are required' });
  }

  if (!['active', 'blacklisted', 'deactivated'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status. Must be: active, blacklisted, or deactivated' });
  }

  testUserStatuses.set(userId, status);
  
  console.log(`🎭 Test: Set user ${userId} status to ${status}`);
  
  res.json({ 
    success: true,
    message: `User ${userId} status set to ${status}`,
    userId,
    status
  });
});

// POST /api/test/simulate-blacklist - Simulate blacklisting a user
router.post('/simulate-blacklist', (req, res) => {
  const { userId } = req.body;
  
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  testUserStatuses.set(userId, 'blacklisted');
  
  console.log(`🚫 Test: Simulated blacklist for user ${userId}`);
  
  res.json({ 
    success: true,
    message: `User ${userId} has been blacklisted (simulated)`,
    userId,
    status: 'blacklisted'
  });
});

// POST /api/test/simulate-deactivate - Simulate deactivating a user
router.post('/simulate-deactivate', (req, res) => {
  const { userId } = req.body;
  
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  testUserStatuses.set(userId, 'deactivated');
  
  console.log(`⏸️ Test: Simulated deactivation for user ${userId}`);
  
  res.json({ 
    success: true,
    message: `User ${userId} has been deactivated (simulated)`,
    userId,
    status: 'deactivated'
  });
});

// POST /api/test/simulate-reactivate - Simulate reactivating a user
router.post('/simulate-reactivate', (req, res) => {
  const { userId } = req.body;
  
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  testUserStatuses.set(userId, 'active');
  
  console.log(`✅ Test: Simulated reactivation for user ${userId}`);
  
  res.json({ 
    success: true,
    message: `User ${userId} has been reactivated (simulated)`,
    userId,
    status: 'active'
  });
});

// GET /api/test/all-statuses - Get all test user statuses
router.get('/all-statuses', (req, res) => {
  const allStatuses = Object.fromEntries(testUserStatuses);
  
  res.json({ 
    success: true,
    statuses: allStatuses,
    count: testUserStatuses.size
  });
});

// DELETE /api/test/clear-statuses - Clear all test statuses
router.delete('/clear-statuses', (req, res) => {
  testUserStatuses.clear();
  
  console.log('🗑️ Test: Cleared all user statuses');
  
  res.json({ 
    success: true,
    message: 'All test user statuses cleared'
  });
});

export default router;