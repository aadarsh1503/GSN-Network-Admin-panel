import express from 'express';
import db from '../config/db.js';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

const router = express.Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Cloudinary storage for multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'general-settings',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [
      { width: 500, height: 500, crop: 'limit' }, // Limit max size
      { quality: 'auto' }, // Auto optimize quality
      { fetch_format: 'auto' } // Auto format selection
    ]
  },
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Get all general settings
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM general_settings ORDER BY setting_key');
    
    // Convert to key-value object for easier frontend consumption
    const settings = {};
    rows.forEach(row => {
      settings[row.setting_key] = {
        value: row.setting_value,
        type: row.setting_type,
        updated_at: row.updated_at
      };
    });
    
    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error fetching general settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch general settings'
    });
  }
});

// Get specific setting by key
router.get('/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const [rows] = await db.execute(
      'SELECT * FROM general_settings WHERE setting_key = ?',
      [key]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Setting not found'
      });
    }
    
    res.json({
      success: true,
      data: {
        key: rows[0].setting_key,
        value: rows[0].setting_value,
        type: rows[0].setting_type,
        updated_at: rows[0].updated_at
      }
    });
  } catch (error) {
    console.error('Error fetching setting:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch setting'
    });
  }
});

// Update general settings
router.put('/', upload.fields([
  { name: 'admin_logo', maxCount: 1 },
  { name: 'favicon', maxCount: 1 }
]), async (req, res) => {
  try {
    const { contact_details, contact_email, contact_phone, company_name, support_hours, address } = req.body;
    
    // Handle file uploads
    const fileUpdates = [];
    if (req.files) {
      if (req.files.admin_logo) {
        const logoUrl = req.files.admin_logo[0].path; // Cloudinary returns the full URL in path
        fileUpdates.push(['admin_logo', logoUrl]);
      }
      if (req.files.favicon) {
        const faviconUrl = req.files.favicon[0].path; // Cloudinary returns the full URL in path
        fileUpdates.push(['favicon', faviconUrl]);
      }
    }
    
    // Handle text updates
    const textUpdates = [];
    if (contact_details) textUpdates.push(['contact_details', contact_details, 'html']);
    if (contact_email) textUpdates.push(['contact_email', contact_email, 'email']);
    if (contact_phone) textUpdates.push(['contact_phone', contact_phone, 'phone']);
    if (company_name) textUpdates.push(['company_name', company_name, 'text']);
    if (support_hours) textUpdates.push(['support_hours', support_hours, 'text']);
    if (address) textUpdates.push(['address', address, 'text']);
    
    // Update database
    const connection = await db.getConnection();
    await connection.beginTransaction();
    
    try {
      // Update file settings
      for (const [key, value] of fileUpdates) {
        await connection.execute(
          'INSERT INTO general_settings (setting_key, setting_value, setting_type) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = CURRENT_TIMESTAMP',
          [key, value, 'image']
        );
      }
      
      // Update text settings
      for (const [key, value, type] of textUpdates) {
        await connection.execute(
          'INSERT INTO general_settings (setting_key, setting_value, setting_type) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = CURRENT_TIMESTAMP',
          [key, value, type]
        );
      }
      
      await connection.commit();
      
      res.json({
        success: true,
        message: 'General settings updated successfully'
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error updating general settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update general settings'
    });
  }
});

// Get help page data (for user and company panels)
router.get('/help/data', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT setting_key, setting_value, setting_type 
      FROM general_settings 
      WHERE setting_key IN ('admin_logo', 'contact_email', 'contact_phone', 'company_name', 'support_hours', 'address', 'contact_details')
      ORDER BY setting_key
    `);
    
    const helpData = {};
    rows.forEach(row => {
      helpData[row.setting_key] = row.setting_value;
    });
    
    res.json({
      success: true,
      data: helpData
    });
  } catch (error) {
    console.error('Error fetching help data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch help data'
    });
  }
});

export default router;