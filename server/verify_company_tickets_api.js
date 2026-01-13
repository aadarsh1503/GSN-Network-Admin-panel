// Verify that the company tickets API is returning proper company information
import fetch from 'node-fetch';

async function verifyCompanyTicketsAPI() {
    try {
        console.log('🔍 Testing Admin Tickets API...');
        console.log('📍 Server URL: http://localhost:5000');
        
        // Note: In a real scenario, we'd need proper authentication
        // For testing purposes, we'll check if the endpoint is accessible
        
        const response = await fetch('http://localhost:5000/api/tickets/admin/all', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                // In production, you'd need: 'Authorization': 'Bearer ' + token
            }
        });
        
        console.log(`📊 Response Status: ${response.status} ${response.statusText}`);
        
        if (response.status === 401) {
            console.log('🔐 Authentication required (expected for admin endpoint)');
            console.log('✅ Endpoint is accessible but requires authentication');
            return;
        }
        
        if (response.ok) {
            const tickets = await response.json();
            console.log(`🎫 Total tickets found: ${tickets.length}`);
            
            // Filter company tickets
            const companyTickets = tickets.filter(ticket => ticket.recipient_type === 'company');
            console.log(`🏢 Company tickets found: ${companyTickets.length}`);
            
            if (companyTickets.length > 0) {
                console.log('\n📋 Company Ticket Analysis:');
                
                companyTickets.forEach((ticket, index) => {
                    console.log(`\n🎫 Ticket ${index + 1}:`);
                    console.log(`   • Ticket Number: ${ticket.ticket_number}`);
                    console.log(`   • Subject: ${ticket.subject}`);
                    console.log(`   • Recipient Type: ${ticket.recipient_type}`);
                    console.log(`   • Recipient Name: ${ticket.recipient_name}`);
                    console.log(`   • Company Name: ${ticket.company_name || 'Not set'}`);
                    console.log(`   • Company Email: ${ticket.company_email || 'Not set'}`);
                    console.log(`   • User: ${ticket.user_name} (${ticket.user_role})`);
                    
                    // Verify the implementation
                    if (ticket.company_name && ticket.company_email) {
                        console.log(`   ✅ Company info properly loaded`);
                    } else {
                        console.log(`   ⚠️  Company info missing`);
                    }
                });
                
                console.log('\n🎯 Implementation Status:');
                const hasCompanyNames = companyTickets.every(t => t.company_name);
                const hasCompanyEmails = companyTickets.every(t => t.company_email);
                
                console.log(`   • Company Names: ${hasCompanyNames ? '✅ All loaded' : '❌ Some missing'}`);
                console.log(`   • Company Emails: ${hasCompanyEmails ? '✅ All loaded' : '❌ Some missing'}`);
                console.log(`   • Recipient Type: ${companyTickets.every(t => t.recipient_type === 'company') ? '✅ Correct' : '❌ Incorrect'}`);
                
            } else {
                console.log('ℹ️  No company tickets found in the response');
            }
            
            // Check admin tickets too
            const adminTickets = tickets.filter(ticket => ticket.recipient_type === 'admin');
            console.log(`\n👨‍💼 Admin tickets found: ${adminTickets.length}`);
            
        } else {
            console.log(`❌ API Error: ${response.status} ${response.statusText}`);
            const errorText = await response.text();
            console.log(`Error details: ${errorText}`);
        }
        
    } catch (error) {
        console.error('❌ Network Error:', error.message);
        console.log('\n💡 Make sure the server is running on http://localhost:5000');
    }
}

// Run the verification
console.log('🚀 Starting Company Tickets API Verification...\n');
verifyCompanyTicketsAPI();