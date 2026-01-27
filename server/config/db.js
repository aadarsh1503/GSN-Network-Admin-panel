// src/config/db.js
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,

  // ENHANCED FIXES FOR ECONNRESET
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  
  // Connection timeout settings
  connectTimeout: 30000, // 30 seconds (increased from 20)
  acquireTimeout: 30000, // 30 seconds to acquire connection
  
  // Reconnection settings
  reconnect: true,
  idleTimeout: 300000, // 5 minutes idle timeout
  maxIdle: 5, // Maximum idle connections
  
  // Additional stability settings
  charset: 'utf8mb4',
  timezone: '+00:00',
  
  // Handle connection errors gracefully
  handleDisconnects: true
});

// Simplified connection testing without problematic pool status access
const testConnection = async (retryCount = 0) => {
  const maxRetries = 3;
  
  try {
    console.log(`🔍 [DB] Testing database connection (attempt ${retryCount + 1}/${maxRetries + 1})...`);
    
    const conn = await pool.getConnection();
    console.log(`🔗 [DB] New database connection established (ID: ${conn.threadId})`);
    
    // Test with a simple query
    await conn.execute('SELECT 1 as test');
    
    console.log("✅ [DB] MySQL Database connected and tested successfully!");
    
    conn.release();
    return true;
  } catch (err) {
    console.error(`❌ [DB] MySQL Database connection failed (attempt ${retryCount + 1}):`, {
      error: err.message,
      code: err.code,
      errno: err.errno,
      sqlState: err.sqlState
    });
    
    // Retry logic for connection failures
    if (retryCount < maxRetries) {
      const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 4000); // Exponential backoff, max 4 seconds
      console.log(`🔄 [DB] Retrying database connection in ${retryDelay}ms...`);
      
      return new Promise((resolve) => {
        setTimeout(async () => {
          const result = await testConnection(retryCount + 1);
          resolve(result);
        }, retryDelay);
      });
    } else {
      console.error(`🚫 [DB] Database connection failed after ${maxRetries + 1} attempts`);
      return false;
    }
  }
};

// Enhanced error handling for the pool
pool.on('connection', (connection) => {
  console.log(`🔗 [DB] New database connection established (ID: ${connection.threadId})`);
});

pool.on('error', (err) => {
  console.error('🚫 [DB] Database pool error:', {
    error: err.message,
    code: err.code,
    errno: err.errno,
    fatal: err.fatal,
    timestamp: new Date().toISOString()
  });
  
  // Log specific ECONNRESET errors
  if (err.code === 'ECONNRESET') {
    console.error('🔥 [DB] ECONNRESET detected in database pool:', {
      timestamp: new Date().toISOString(),
      threadId: err.threadId,
      stack: err.stack
    });
  }
});

// Graceful shutdown handling
process.on('SIGINT', async () => {
  console.log('🛑 [DB] Closing database pool...');
  await pool.end();
  console.log('✅ [DB] Database pool closed');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🛑 [DB] Closing database pool...');
  await pool.end();
  console.log('✅ [DB] Database pool closed');
  process.exit(0);
});

// Test connection on startup
testConnection();

export default pool;
