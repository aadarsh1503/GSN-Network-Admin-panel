import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const testCloudinaryConnection = async () => {
    try {
        console.log('🔍 Testing Cloudinary connection...');
        
        // Configure Cloudinary
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET
        });
        
        console.log('\n🔧 Cloudinary Configuration:');
        console.log(`   Cloud Name: ${process.env.CLOUDINARY_CLOUD_NAME}`);
        console.log(`   API Key: ${process.env.CLOUDINARY_API_KEY}`);
        console.log(`   API Secret: ${process.env.CLOUDINARY_API_SECRET ? 'Set' : 'Not set'}`);
        
        // Test connection by getting account details
        const result = await cloudinary.api.ping();
        console.log('\n✅ Cloudinary connection successful!');
        console.log('   Response:', result);
        
        // Test upload folder access
        try {
            const folders = await cloudinary.api.root_folders();
            console.log('\n📁 Available folders:', folders.folders.map(f => f.name));
        } catch (folderError) {
            console.log('\n📁 Could not list folders (this is normal for new accounts)');
        }
        
        console.log('\n✅ Cloudinary test completed successfully!');
        
    } catch (error) {
        console.error('❌ Error testing Cloudinary connection:', error);
        console.error('Error details:', error.message);
    } finally {
        process.exit(0);
    }
};

testCloudinaryConnection();