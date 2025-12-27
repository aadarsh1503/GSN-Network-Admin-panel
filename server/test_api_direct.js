import axios from 'axios';
import jwt from 'jsonwebtoken';
import db from './config/db.js';

async function testAPIDirect() {
    try {
        console.log('🧪 Testing API endpoint directly...\n');
        
        // Get a company user and generate token
        const [companies] = await db.execute(`
            SELECT id, name, email, role 
            FROM users 
            WHERE role = 'company' 
            LIMIT 1
        `);
        
        if (companies.length === 0) {
            console.log('❌ No company users found');
            return;
        }
        
        const company = companies[0];
        console.log(`Using company: ${company.name} (ID: ${company.id})`);
        
        // Generate JWT token
        const token = jwt.sign(
            { 
                id: company.id, 
                email: company.email, 
                role: company.role 
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '1h' }
        );
        
        // Get a dispute for this company
        const [disputes] = await db.execute(`
            SELECT id, status, title
            FROM disputes 
            WHERE company_id = ? AND status != 'closed'
            LIMIT 1
        `, [company.id]);
        
        if (disputes.length === 0) {
            console.log('❌ No disputes found for this company');
            return;
        }
        
        const dispute = disputes[0];
        console.log(`Testing with dispute: ${dispute.id} (${dispute.status})`);
        
        // Test the API call
        console.log('\n1️⃣ Testing API call...');
        try {
            const response = await axios.put(
                `http://localhost:5000/api/disputes/company-status/${dispute.id}`,
                {
                    status: 'running',
                    reason: 'API test - starting work on dispute'
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            console.log('✅ API call successful!');
            console.log('Response:', response.data);
            
        } catch (error) {
            console.log('❌ API call failed:');
            if (error.response) {
                console.log(`Status: ${error.response.status}`);
                console.log(`Data:`, error.response.data);
            } else {
                console.log(`Error: ${error.message}`);
            }
        }
        
        // Check if status actually changed
        console.log('\n2️⃣ Checking database...');
        const [updated] = await db.execute(`
            SELECT status, company_requested_status, company_status_reason
            FROM disputes 
            WHERE id = ?
        `, [dispute.id]);
        
        if (updated.length > 0) {
            const u = updated[0];
            console.log(`Current status: ${u.status}`);
            console.log(`Company requested: ${u.company_requested_status}`);
            console.log(`Company reason: ${u.company_status_reason ? 'Yes' : 'No'}`);
        }
        
    } catch (error) {
        console.error('❌ Error testing API:', error);
    } finally {
        process.exit(0);
    }
}

testAPIDirect();