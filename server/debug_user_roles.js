// debug_user_roles.js
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function debugUserRoles() {
    let connection;
    
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });
        
        console.log('✅ Connected to database');
        
        // Check the specific user
        const userEmail = 'subodhchauhan1309@gmail.com';
        const [users] = await connection.execute(
            'SELECT id, name, email, role FROM users WHERE email = ?',
            [userEmail]
        );
        
        if (users.length === 0) {
            console.log(`❌ User not found: ${userEmail}`);
            return;
        }
        
        const user = users[0];
        console.log(`👤 User details:`, user);
        
        // Check what companies exist
        const [companies] = await connection.execute(
            "SELECT id, name, email, role FROM users WHERE role IN ('company', 'business') ORDER BY role, name"
        );
        
        console.log(`\n🏢 All companies and business users:`);
        companies.forEach(company => {
            console.log(`  - ${company.role.toUpperCase()}: ${company.name} (${company.email}) - ID: ${company.id}`);
        });
        
        // Check transaction invoices
        const [invoices] = await connection.execute(
            'SELECT * FROM transaction_invoices WHERE user_id = ? OR company_id = ?',
            [user.id, user.id]
        );
        
        console.log(`\n🧾 Transaction invoices for user ${user.id}:`);
        invoices.forEach(invoice => {
            console.log(`  - Invoice ${invoice.invoice_number}: User ID ${invoice.user_id} → Company ID ${invoice.company_id} ($${invoice.total_amount})`);
        });
        
        // The key insight: 
        console.log(`\n💡 KEY INSIGHT:`);
        console.log(`   - User ${userEmail} has role: ${user.role}`);
        console.log(`   - If role is 'business': They should see invoices in BUSINESS panel where company_id = ${user.id}`);
        console.log(`   - If role is 'company': They should see invoices in COMPANY panel where company_id = ${user.id}`);
        console.log(`   - User invoices: They should see invoices in USER panel where user_id = ${user.id}`);
        
        // Check what invoices this user should see in business panel
        const [businessInvoices] = await connection.execute(
            'SELECT * FROM transaction_invoices WHERE company_id = ?',
            [user.id]
        );
        
        console.log(`\n📊 Invoices this user should see in BUSINESS panel (company_id = ${user.id}):`);
        console.log(`   Count: ${businessInvoices.length}`);
        businessInvoices.forEach(invoice => {
            console.log(`   - ${invoice.invoice_number}: $${invoice.total_amount}`);
        });
        
        // Check what invoices this user should see in user panel
        const [userInvoices] = await connection.execute(
            'SELECT * FROM transaction_invoices WHERE user_id = ?',
            [user.id]
        );
        
        console.log(`\n📊 Invoices this user should see in USER panel (user_id = ${user.id}):`);
        console.log(`   Count: ${userInvoices.length}`);
        userInvoices.forEach(invoice => {
            console.log(`   - ${invoice.invoice_number}: $${invoice.total_amount}`);
        });
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

debugUserRoles();