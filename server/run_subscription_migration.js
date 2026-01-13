import mysql from 'mysql2/promise';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

async function runMigration() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'freight_forwarding'
    });

    const sql = fs.readFileSync('create_subscription_requests_table.sql', 'utf8');
    const statements = sql.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        await connection.execute(statement);
        console.log('✓ Executed statement');
      }
    }
    
    console.log('✅ Migration completed successfully');
    await connection.end();
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  }
}

runMigration();