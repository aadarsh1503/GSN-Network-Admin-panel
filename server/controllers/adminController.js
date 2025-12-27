import db from '../config/db.js';

// @desc    Get new registrations since timestamp
// @route   GET /api/admin/new-registrations
// @access  Admin
export const getNewRegistrations = async (req, res) => {
  try {
    const { since } = req.query;
    
    if (!since) {
      return res.status(400).json({ message: 'Since timestamp is required' });
    }

    const sql = `
      SELECT 
        id, 
        name, 
        email, 
        role, 
        created_at 
      FROM users 
      WHERE role IN ('company', 'business') 
        AND created_at > ? 
      ORDER BY created_at DESC
    `;
    
    const [rows] = await db.execute(sql, [since]);
    
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching new registrations:', error);
    res.status(500).json({ message: 'Server error fetching new registrations' });
  }
};

// @desc    Get pending notifications
// @route   GET /api/admin/pending-notifications
// @access  Admin
export const getPendingNotifications = async (req, res) => {
  try {
    // Check if admin_notifications table exists, if not create it
    const createTableSql = `
      CREATE TABLE IF NOT EXISTS admin_notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        type ENUM('registration', 'quote', 'ticket', 'general') NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        user_id INT,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `;
    
    await db.execute(createTableSql);

    const sql = `
      SELECT 
        an.*,
        u.name as user_name,
        u.email as user_email,
        u.role as user_role
      FROM admin_notifications an
      LEFT JOIN users u ON an.user_id = u.id
      WHERE an.is_read = FALSE
      ORDER BY an.created_at DESC
      LIMIT 50
    `;
    
    const [rows] = await db.execute(sql);
    
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching pending notifications:', error);
    res.status(500).json({ message: 'Server error fetching pending notifications' });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/admin/notifications/:id/read
// @access  Admin
export const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    
    const sql = `UPDATE admin_notifications SET is_read = TRUE WHERE id = ?`;
    const [result] = await db.execute(sql, [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    res.status(200).json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Server error marking notification as read' });
  }
};

// @desc    Get admin dashboard stats
// @route   GET /api/admin/stats
// @access  Admin
export const getAdminStats = async (req, res) => {
  try {
    // Get various counts for dashboard
    const stats = {};
    
    // Total users by role
    const userCountSql = `
      SELECT 
        role,
        COUNT(*) as count
      FROM users 
      WHERE role IN ('company', 'business', 'user')
      GROUP BY role
    `;
    const [userCounts] = await db.execute(userCountSql);
    
    stats.userCounts = userCounts.reduce((acc, row) => {
      acc[row.role] = row.count;
      return acc;
    }, {});
    
    // New registrations today
    const todayRegistrationsSql = `
      SELECT COUNT(*) as count
      FROM users 
      WHERE role IN ('company', 'business') 
        AND DATE(created_at) = CURDATE()
    `;
    const [todayRegs] = await db.execute(todayRegistrationsSql);
    stats.todayRegistrations = todayRegs[0].count;
    
    // Unread notifications count
    const unreadNotificationsSql = `
      SELECT COUNT(*) as count
      FROM admin_notifications 
      WHERE is_read = FALSE
    `;
    const [unreadNotifs] = await db.execute(unreadNotificationsSql);
    stats.unreadNotifications = unreadNotifs[0].count;
    
    res.status(200).json(stats);
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ message: 'Server error fetching admin stats' });
  }
};

// Helper function to create admin notification
export const createAdminNotification = async (type, title, message, userId = null) => {
  try {
    const sql = `
      INSERT INTO admin_notifications (type, title, message, user_id)
      VALUES (?, ?, ?, ?)
    `;
    
    await db.execute(sql, [type, title, message, userId]);
  } catch (error) {
    console.error('Error creating admin notification:', error);
  }
};