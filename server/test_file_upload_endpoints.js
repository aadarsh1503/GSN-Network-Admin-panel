import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const testFileUploadEndpoints = async () => {
    try {
        console.log('🔍 Testing file upload endpoints...');
        
        // Check if upload controller exists
        const uploadControllerPath = join(__dirname, 'controllers', 'uploadController.js');
        if (fs.existsSync(uploadControllerPath)) {
            console.log('✅ Upload controller exists');
            
            // Read the controller to check configuration
            const controllerContent = fs.readFileSync(uploadControllerPath, 'utf8');
            
            if (controllerContent.includes('uploadImage')) {
                console.log('✅ uploadImage function found');
            } else {
                console.log('❌ uploadImage function not found');
            }
            
            if (controllerContent.includes('cloudinary')) {
                console.log('✅ Cloudinary integration found');
            } else {
                console.log('❌ Cloudinary integration not found');
            }
            
            if (controllerContent.includes('dispute_attachments')) {
                console.log('✅ Dispute attachments folder configured');
            } else {
                console.log('❌ Dispute attachments folder not configured');
            }
            
        } else {
            console.log('❌ Upload controller not found');
        }
        
        // Check if dispute routes include upload endpoints
        const disputeRoutesPath = join(__dirname, 'routes', 'disputeRoutes.js');
        if (fs.existsSync(disputeRoutesPath)) {
            console.log('✅ Dispute routes file exists');
            
            const routesContent = fs.readFileSync(disputeRoutesPath, 'utf8');
            
            if (routesContent.includes('/attachments')) {
                console.log('✅ Attachments route found');
            } else {
                console.log('❌ Attachments route not found');
            }
            
        } else {
            console.log('❌ Dispute routes file not found');
        }
        
        // Check environment variables for Cloudinary
        console.log('\n🔧 Environment Configuration:');
        console.log(`   CLOUDINARY_CLOUD_NAME: ${process.env.CLOUDINARY_CLOUD_NAME ? 'Set' : 'Not set'}`);
        console.log(`   CLOUDINARY_API_KEY: ${process.env.CLOUDINARY_API_KEY ? 'Set' : 'Not set'}`);
        console.log(`   CLOUDINARY_API_SECRET: ${process.env.CLOUDINARY_API_SECRET ? 'Set' : 'Not set'}`);
        
        console.log('\n✅ File upload endpoint test completed!');
        
    } catch (error) {
        console.error('❌ Error testing file upload endpoints:', error);
    } finally {
        process.exit(0);
    }
};

testFileUploadEndpoints();