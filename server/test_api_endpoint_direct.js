import express from 'express';
import jwt from 'jsonwebtoken';
import { getUserDisputes } from './controllers/disputeController.js';

const testAPIEndpointDirect = async () => {
    try {
        console.log('🔍 Testing API endpoint directly...');
        
        // Create a mock request object for business user
        const businessUserId = 21; // adaersh user ID
        
        // Create a mock JWT token for the business user
        const token = jwt.sign(
            { id: businessUserId, role: 'business' },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '1h' }
        );
        
        console.log(`📋 Testing with business user ID: ${businessUserId}`);
        console.log(`🔑 Generated token: ${token.substring(0, 50)}...`);
        
        // Mock request and response objects
        const mockReq = {
            user: {
                id: businessUserId,
                role: 'business'
            }
        };
        
        const mockRes = {
            status: (code) => ({
                json: (data) => {
                    console.log(`\n✅ API Response (Status: ${code}):`);
                    if (Array.isArray(data)) {
                        console.log(`   Found ${data.length} disputes:`);
                        data.forEach(dispute => {
                            console.log(`     Dispute #${dispute.id}: ${dispute.title}`);
                            console.log(`       Against: ${dispute.company_name}`);
                            console.log(`       Status: ${dispute.status}`);
                            console.log(`       Created: ${dispute.created_at}`);
                            console.log('');
                        });
                    } else {
                        console.log('   Response:', JSON.stringify(data, null, 2));
                    }
                }
            })
        };
        
        // Call the actual controller function
        await getUserDisputes(mockReq, mockRes);
        
        console.log('\n✅ Direct API endpoint test completed!');
        
    } catch (error) {
        console.error('❌ Error testing API endpoint:', error);
    } finally {
        process.exit(0);
    }
};

testAPIEndpointDirect();