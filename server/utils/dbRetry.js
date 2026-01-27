// Database query wrapper with retry logic for ECONNRESET errors
import db from '../config/db.js';

class DatabaseRetry {
  constructor() {
    this.maxRetries = 3;
    this.baseDelay = 1000; // 1 second
    this.maxDelay = 10000; // 10 seconds
  }

  // Execute query with retry logic
  async execute(query, params = [], retryCount = 0) {
    const queryId = Math.random().toString(36).substring(7);
    
    try {
      console.log(`🗄️ [DB-${queryId}] Executing query (attempt ${retryCount + 1}/${this.maxRetries + 1}):`, {
        query: query.substring(0, 100) + (query.length > 100 ? '...' : ''),
        paramsCount: params.length,
        timestamp: new Date().toISOString()
      });

      const startTime = Date.now();
      const result = await db.execute(query, params);
      const duration = Date.now() - startTime;

      console.log(`✅ [DB-${queryId}] Query executed successfully (${duration}ms):`, {
        rowsAffected: result[0].length || result[1]?.affectedRows || 0,
        duration: `${duration}ms`
      });

      return result;
    } catch (error) {
      const errorTime = Date.now();
      
      console.error(`💥 [DB-${queryId}] Query failed at ${new Date(errorTime).toISOString()}:`, {
        errorName: error.name,
        errorMessage: error.message,
        errorCode: error.code,
        errno: error.errno,
        sqlState: error.sqlState,
        query: query.substring(0, 100) + (query.length > 100 ? '...' : ''),
        paramsCount: params.length,
        retryCount,
        maxRetries: this.maxRetries
      });

      // Check if this is a retryable error
      const isRetryableError = this.isRetryableError(error);
      
      if (isRetryableError && retryCount < this.maxRetries) {
        const delay = Math.min(this.baseDelay * Math.pow(2, retryCount), this.maxDelay);
        
        console.warn(`🔄 [DB-${queryId}] Retrying query in ${delay}ms due to ${error.code || error.name}...`);
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Retry the query
        return this.execute(query, params, retryCount + 1);
      }

      // If not retryable or max retries reached, throw the error
      if (retryCount >= this.maxRetries) {
        console.error(`❌ [DB-${queryId}] Query failed after ${this.maxRetries + 1} attempts`);
      }

      throw error;
    }
  }

  // Check if error is retryable
  isRetryableError(error) {
    const retryableCodes = [
      'ECONNRESET',
      'ENOTFOUND',
      'ECONNREFUSED',
      'ETIMEDOUT',
      'PROTOCOL_CONNECTION_LOST',
      'ER_LOCK_WAIT_TIMEOUT',
      'ER_LOCK_DEADLOCK'
    ];

    const retryableMessages = [
      'Connection lost',
      'Connection timeout',
      'Server has gone away',
      'Lost connection to MySQL server'
    ];

    // Check error code
    if (error.code && retryableCodes.includes(error.code)) {
      return true;
    }

    // Check error message
    if (error.message) {
      return retryableMessages.some(msg => 
        error.message.toLowerCase().includes(msg.toLowerCase())
      );
    }

    return false;
  }

  // Execute query and return first row
  async queryOne(query, params = []) {
    const [rows] = await this.execute(query, params);
    return rows[0] || null;
  }

  // Execute query and return all rows
  async queryAll(query, params = []) {
    const [rows] = await this.execute(query, params);
    return rows;
  }

  // Execute insert/update/delete and return result info
  async executeUpdate(query, params = []) {
    const [, result] = await this.execute(query, params);
    return result;
  }

  // Get connection pool status
  getPoolStatus() {
    try {
      // Safely access pool internals
      const pool = db.pool || db;
      return {
        totalConnections: pool._allConnections?.length || 0,
        freeConnections: pool._freeConnections?.length || 0,
        acquiringConnections: pool._acquiringConnections?.length || 0,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.warn('Could not get pool status:', error.message);
      return { 
        error: 'Unable to get pool status',
        timestamp: new Date().toISOString()
      };
    }
  }
}

// Create and export singleton instance
const dbRetry = new DatabaseRetry();

export default dbRetry;