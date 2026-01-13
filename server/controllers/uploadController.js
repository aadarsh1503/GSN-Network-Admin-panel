// controllers/uploadController.js
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'), false);
        }
    }
});

// @desc    Upload image to Cloudinary
// @route   POST /api/upload/image
// @access  Private
export const uploadImage = async (req, res) => {
    try {
        console.log('🔍 UPLOAD IMAGE - Request received');
        console.log('👤 User:', req.user);
        console.log('📁 File info:', req.file ? {
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size
        } : 'No file');

        if (!req.file) {
            console.log('❌ No file uploaded');
            return res.status(400).json({ message: 'No file uploaded' });
        }

        console.log('☁️ Uploading to Cloudinary...');
        
        // Determine folder and transformations based on file usage
        // For business profile logos, use different settings
        const isLogo = req.file.originalname?.toLowerCase().includes('logo') || 
                      req.body.type === 'logo' ||
                      req.headers.referer?.includes('/business/profile');
        
        const uploadOptions = {
            resource_type: 'image',
            folder: isLogo ? 'business_logos' : 'dispute_attachments',
            transformation: isLogo ? [
                { width: 400, height: 400, crop: 'limit' },
                { quality: 'auto' },
                { format: 'auto' }
            ] : [
                { width: 1200, height: 1200, crop: 'limit' },
                { quality: 'auto' }
            ]
        };

        // Upload to Cloudinary
        const result = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
                uploadOptions,
                (error, result) => {
                    if (error) {
                        console.log('❌ Cloudinary error:', error);
                        reject(error);
                    } else {
                        console.log('✅ Cloudinary upload successful:', result.secure_url);
                        resolve(result);
                    }
                }
            ).end(req.file.buffer);
        });

        console.log('✅ Image upload completed successfully');
        res.status(200).json({
            message: 'Image uploaded successfully',
            url: result.secure_url,
            public_id: result.public_id
        });

    } catch (error) {
        console.error('❌ Error uploading image:', error);
        res.status(500).json({ 
            message: error.message || 'Server error uploading image' 
        });
    }
};

export { upload };