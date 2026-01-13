import mysql from 'mysql2/promise';

// Database configuration
const dbConfig = {
    host: '92.112.181.224',
    user: 'gsnuser',
    password: 'sCp@/2I1D3w',
    database: 'GSN'
};

async function debugServicesParsing() {
    let connection;
    
    try {
        console.log('🔍 Debugging services parsing...\n');
        
        // Connect to database
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Database connected successfully\n');
        
        // Get the specific company with services
        const [rows] = await connection.execute(`
            SELECT id, name, services
            FROM users 
            WHERE id = 10 AND role = 'company'
        `);
        
        if (rows.length > 0) {
            const company = rows[0];
            console.log('Raw company data:', company);
            console.log('Services type:', typeof company.services);
            console.log('Services value:', company.services);
            console.log('Is Buffer:', Buffer.isBuffer(company.services));
            
            if (company.services) {
                let servicesString = company.services;
                if (Buffer.isBuffer(company.services)) {
                    servicesString = company.services.toString('utf8');
                    console.log('Converted from buffer:', servicesString);
                }
                
                console.log('Services string type:', typeof servicesString);
                console.log('Services string value:', `"${servicesString}"`);
                
                try {
                    const jsonParsed = JSON.parse(servicesString);
                    console.log('JSON parsed successfully:', jsonParsed);
                } catch (e) {
                    console.log('JSON parse failed:', e.message);
                    
                    if (typeof servicesString === 'string') {
                        const splitServices = servicesString.split(',').map(s => s.trim()).filter(s => s);
                        console.log('Split by comma:', splitServices);
                    }
                }
            }
        }
        
        console.log('\n🎉 Services parsing debug completed!');
        
    } catch (error) {
        console.error('❌ Error during debugging:', error.message);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n🔌 Database connection closed');
        }
    }
}

// Run the debug
debugServicesParsing();