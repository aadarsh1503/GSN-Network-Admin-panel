import express from 'express';
import db from '../config/db.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import paypalService, { SENSITIVE_SETTING_KEYS } from '../services/paypalService.js';
import paypalFeeService from '../services/paypalFeeService.js';
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
    
    // Convert to key-value object for easier frontend consumption.
    // This endpoint is public, so server-only secrets are stripped out.
    const settings = {};
    rows.forEach(row => {
      if (SENSITIVE_SETTING_KEYS.includes(row.setting_key)) return;
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

const SETTING_SELECT = `
  SELECT setting_key, setting_value FROM general_settings
  WHERE setting_key IN ('admin_paypal_id', 'paypal_client_id', 'paypal_client_secret', 'paypal_webhook_id', 'paypal_env')
`;

const readPaypalSettings = async () => {
  const [rows] = await db.execute(SETTING_SELECT);
  const byKey = {};
  rows.forEach(row => { byKey[row.setting_key] = row.setting_value; });
  return byKey;
};

const upsertSetting = (key, value, type = 'text') => db.execute(
  `INSERT INTO general_settings (setting_key, setting_value, setting_type) VALUES (?, ?, ?)
   ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = CURRENT_TIMESTAMP`,
  [key, value, type]
);

// Credentials are single tokens with no internal whitespace — remove every
// space/newline so a copy-paste from the PayPal dashboard (which wraps the
// value across lines) still authenticates.
const cleanCredential = (value) => String(value ?? '').replace(/\s+/g, '');

// Get PayPal settings.
// @route   GET /api/general-settings/paypal
// @access  Public — consumed by the company payment/wallet pages to load the
//          checkout SDK. The client id and environment are public by design
//          (they end up in the browser anyway); the SECRET is never returned.
router.get('/paypal', async (req, res) => {
  try {
    const s = await readPaypalSettings();

    res.json({
      success: true,
      data: {
        admin_paypal_id: s.admin_paypal_id || '',
        paypal_client_id: s.paypal_client_id || '',
        paypal_env: s.paypal_env === 'live' ? 'live' : 'sandbox',
        paypal_secret_set: Boolean(String(s.paypal_client_secret || '').trim()),
        paypal_webhook_set: Boolean(String(s.paypal_webhook_id || '').trim()),
        paypal_configured: Boolean(
          String(s.paypal_client_id || '').trim() && String(s.paypal_client_secret || '').trim()
        ),
      }
    });
  } catch (error) {
    console.error('Error fetching paypal settings:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch PayPal settings' });
  }
});

// Save PayPal settings (Admin only) — receiving id + REST API credentials.
// An empty client secret / webhook id means "leave the stored value alone", so
// the admin can edit the other fields without retyping the secret.
// @route   PUT /api/general-settings/paypal
// @access  Private/Admin
router.put('/paypal', protect, authorize('admin'), async (req, res) => {
  try {
    const body = req.body || {};
    const adminPaypalId = String(body.admin_paypal_id ?? '').trim();

    if (adminPaypalId && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminPaypalId) && !/^https?:\/\/.+/i.test(adminPaypalId)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid PayPal email or PayPal.me link' });
    }

    const paypalEnv = String(body.paypal_env ?? '').trim().toLowerCase();
    if (paypalEnv && paypalEnv !== 'sandbox' && paypalEnv !== 'live') {
      return res.status(400).json({ success: false, message: 'PayPal environment must be "sandbox" or "live"' });
    }

    await upsertSetting('admin_paypal_id', adminPaypalId);
    if (body.paypal_client_id !== undefined) {
      await upsertSetting('paypal_client_id', cleanCredential(body.paypal_client_id));
    }
    if (cleanCredential(body.paypal_client_secret)) {
      await upsertSetting('paypal_client_secret', cleanCredential(body.paypal_client_secret));
    }
    if (cleanCredential(body.paypal_webhook_id)) {
      await upsertSetting('paypal_webhook_id', cleanCredential(body.paypal_webhook_id));
    }
    if (paypalEnv) {
      await upsertSetting('paypal_env', paypalEnv);
    }

    // Pick the new credentials up immediately — no server restart needed.
    await paypalService.refreshConfig();

    const s = await readPaypalSettings();
    res.json({
      success: true,
      message: 'PayPal settings saved successfully',
      data: {
        admin_paypal_id: s.admin_paypal_id || '',
        paypal_client_id: s.paypal_client_id || '',
        paypal_env: s.paypal_env === 'live' ? 'live' : 'sandbox',
        paypal_secret_set: Boolean(String(s.paypal_client_secret || '').trim()),
        paypal_webhook_set: Boolean(String(s.paypal_webhook_id || '').trim()),
        paypal_configured: paypalService.isConfigured(),
      }
    });
  } catch (error) {
    console.error('Error saving paypal settings:', error);
    res.status(500).json({ success: false, message: 'Failed to save PayPal settings' });
  }
});

// Test the saved PayPal credentials against PayPal itself.
// Changing a client id without the matching secret — or picking the wrong
// environment — is the usual reason a checkout "could not be verified", so this
// lets the admin confirm the pair works before a real payment fails.
// @route   POST /api/general-settings/paypal/test
// @access  Private/Admin
router.post('/paypal/test', protect, authorize('admin'), async (req, res) => {
  try {
    // Re-read from the DB so a just-saved credential is used immediately.
    await paypalService.refreshConfig();

    if (!paypalService.isConfigured()) {
      return res.status(400).json({
        success: false,
        message: 'PayPal is not configured. Enter a Client ID and Secret first.',
      });
    }

    const environment = paypalService.getEnvironment();
    try {
      await paypalService.getAccessToken();
    } catch (error) {
      console.error('PayPal connection test failed:', error.message);
      return res.status(502).json({
        success: false,
        message: `PayPal rejected these credentials: ${error.message}`,
        data: { environment },
      });
    }

    res.json({
      success: true,
      message: `Connected to PayPal (${environment}). These credentials are valid.`,
      data: { environment },
    });
  } catch (error) {
    console.error('Error testing PayPal connection:', error);
    res.status(500).json({ success: false, message: 'Failed to test the PayPal connection' });
  }
});

// Get the PayPal processing-fee configuration used to gross up checkout.
// Public: the checkout pages need the percentages to show the buyer exactly
// what the fee is. No secrets are involved.
// @route   GET /api/general-settings/paypal-fee
// @access  Public
router.get('/paypal-fee', async (req, res) => {
  try {
    res.json({ success: true, data: await paypalFeeService.getFeeConfig() });
  } catch (error) {
    console.error('Error fetching PayPal fee config:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch the PayPal fee settings' });
  }
});

// Save the PayPal processing-fee configuration.
// @route   PUT /api/general-settings/paypal-fee
// @access  Private/Admin
router.put('/paypal-fee', protect, authorize('admin'), async (req, res) => {
  try {
    const b = req.body || {};
    const patch = {};
    ['enabled', 'merchantCountry', 'intlPct', 'intlFixed', 'domesticPct', 'domesticFixed'].forEach((k) => {
      if (b[k] !== undefined) patch[k] = b[k];
    });
    if (patch.enabled !== undefined && typeof patch.enabled !== 'boolean') {
      patch.enabled = patch.enabled === '1' || patch.enabled === 'true' || patch.enabled === true;
    }
    if (!Object.keys(patch).length) {
      return res.status(400).json({ success: false, message: 'Nothing to update' });
    }
    res.json({
      success: true,
      message: 'PayPal fee settings saved successfully',
      data: await paypalFeeService.updateFeeConfig(patch),
    });
  } catch (error) {
    console.error('Error saving PayPal fee config:', error);
    res.status(500).json({ success: false, message: 'Failed to save the PayPal fee settings' });
  }
});

// Derive the fee rates from the fees PayPal actually charged on past payments.
// @route   POST /api/general-settings/paypal-fee/sync
// @access  Private/Admin
router.post('/paypal-fee/sync', protect, authorize('admin'), async (req, res) => {
  try {
    const days = Number(req.body?.days) || 30;
    const data = await paypalFeeService.learnFeesFromPayPal({ days });
    res.json({
      success: true,
      message: `Fee rates updated from your last ${days} day(s) of PayPal transactions`,
      data,
    });
  } catch (error) {
    console.error('PayPal fee sync failed:', error.message);
    res.status(502).json({ success: false, message: error.message || 'Could not read PayPal transactions' });
  }
});

// Get specific setting by key
router.get('/:key', async (req, res) => {
  try {
    const { key } = req.params;

    // Server-only secrets are never readable through the public API.
    if (SENSITIVE_SETTING_KEYS.includes(key)) {
      return res.status(404).json({ success: false, message: 'Setting not found' });
    }

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