// Debug script to test admin quotes API and check company data
const BASE_URL = 'http://localhost:5000';

async function debugAdminQuotesAPI() {
    console.log('🔍 Starting Admin Quotes API Debug...\n');
    
    try {
        console.log('📡 Making request to:', `${BASE_URL}/api/admin-panel/quotes`);
        
        const response = await fetch(`${BASE_URL}/api/admin-panel/quotes`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const quotes = await response.json();
        
        console.log(`✅ API Response received successfully`);
        console.log(`📊 Total quotes: ${quotes.length}\n`);
        
        if (quotes.length === 0) {
            console.log('⚠️ No quotes found in database');
            return;
        }
        
        // Analyze first quote structure
        console.log('🔍 Analyzing quote data structure...');
        const firstQuote = quotes[0];
        const companyFields = [
            'company_name',
            'company_email', 
            'company_phone',
            'accepted_price',
            'accepted_transit_time',
            'accepted_at',
            'payment_status'
        ];
        
        console.log('\n📋 Company-related fields check:');
        companyFields.forEach(field => {
            const hasField = field in firstQuote;
            const value = firstQuote[field];
            console.log(`  ${hasField ? '✅' : '❌'} ${field}: ${value || 'null/undefined'}`);
        });
        
        // Show detailed data for first 3 quotes
        console.log('\n📊 Detailed quote analysis:');
        quotes.slice(0, 3).forEach((quote, index) => {
            console.log(`\n--- Quote ${index + 1} (ID: ${quote.id}) ---`);
            console.log(`👤 Customer: ${quote.user_name} (${quote.user_email})`);
            console.log(`🏢 Company: ${quote.company_name || 'NO COMPANY ASSIGNED'}`);
            console.log(`📧 Company Email: ${quote.company_email || 'NO EMAIL'}`);
            console.log(`💰 Accepted Price: $${quote.accepted_price || '0.00'}`);
            console.log(`🚚 Transit Time: ${quote.accepted_transit_time || 'N/A'}`);
            console.log(`📦 Product: ${quote.product_description}`);
            console.log(`📍 Route: ${quote.departure_country} → ${quote.arrival_country}`);
            console.log(`📊 Responses: ${quote.response_count} total, ${quote.accepted_count} accepted`);
            console.log(`💳 Payment: ${quote.payment_status || 'No payment status'}`);
            console.log(`📅 Quote Status: ${quote.status}`);
            console.log(`🕒 Accepted At: ${quote.accepted_at || 'Not accepted yet'}`);
        });
        
        // Summary statistics
        const stats = {
            total: quotes.length,
            withCompany: quotes.filter(q => q.company_name).length,
            withoutCompany: quotes.filter(q => !q.company_name).length,
            withAcceptedPrice: quotes.filter(q => q.accepted_price).length,
            withPaymentStatus: quotes.filter(q => q.payment_status).length
        };
        
        console.log('\n📈 Summary Statistics:');
        console.log(`📊 Total quotes: ${stats.total}`);
        console.log(`🏢 With company assigned: ${stats.withCompany} (${((stats.withCompany/stats.total)*100).toFixed(1)}%)`);
        console.log(`❌ Without company: ${stats.withoutCompany} (${((stats.withoutCompany/stats.total)*100).toFixed(1)}%)`);
        console.log(`💰 With accepted price: ${stats.withAcceptedPrice}`);
        console.log(`💳 With payment status: ${stats.withPaymentStatus}`);
        
        if (stats.withCompany > 0) {
            console.log('\n🏢 Companies found:');
            const companies = [...new Set(quotes.filter(q => q.company_name).map(q => q.company_name))];
            companies.forEach(company => {
                const companyQuotes = quotes.filter(q => q.company_name === company);
                console.log(`  - ${company}: ${companyQuotes.length} quotes`);
            });
        }
        
        // Check if the issue is in the data or frontend
        if (stats.withCompany === 0) {
            console.log('\n⚠️ ISSUE IDENTIFIED: No company data found in API response');
            console.log('🔍 This suggests the issue is in the backend SQL query or database structure');
            console.log('💡 Check if:');
            console.log('   1. There are accepted quote responses in the database');
            console.log('   2. The user_quote_status table has accepted entries');
            console.log('   3. The JOIN conditions are correct');
        } else {
            console.log('\n✅ Company data is present in API response');
            console.log('🔍 If admin panel still shows no company data, the issue is in the frontend');
        }
        
    } catch (error) {
        console.error('❌ Error testing API:', error.message);
        console.log('\n💡 Troubleshooting steps:');
        console.log('1. Make sure the server is running on port 3001');
        console.log('2. Check if the database is connected');
        console.log('3. Verify the API endpoint exists');
    }
}

// Run the debug function
debugAdminQuotesAPI();