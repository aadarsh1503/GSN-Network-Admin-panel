import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT
};

/**
 * Automatically create transaction invoices for verified payments
 * This should be called whenever a payment is verified
 */
export const createTransactionInvoiceForPayment = async (quoteId, userId, companyId, amount, verificationDate) => {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    
    // Check if invoice already exists
    const [existingInvoices] = await connection.execute(`
      SELECT id FROM transaction_invoices 
      WHERE quote_id = ? AND user_id = ? AND company_id = ?
    `, [quoteId, userId, companyId]);
    
    if (existingInvoices.length > 0) {
      console.log(`Invoice already exists for Quote #${quoteId}`);
      return existingInvoices[0].id;
    }
    
    // Generate invoice number
    const invoiceNumber = `TXN-INV-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000000000).toString().padStart(9, '0')}`;
    
    // Calculate fees
    const serviceFeePct = 0.05; // 5%
    const baseAmount = parseFloat(amount);
    const serviceFee = baseAmount * serviceFeePct;
    const totalAmount = baseAmount + serviceFee;
    
    // Create invoice
    const [result] = await connection.execute(`
      INSERT INTO transaction_invoices 
      (invoice_number, quote_id, user_id, company_id, amount, service_fee, total_amount, status, payment_date, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'paid', ?, NOW(), NOW())
    `, [
      invoiceNumber,
      quoteId,
      userId,
      companyId,
      baseAmount,
      serviceFee,
      totalAmount,
      verificationDate
    ]);
    
    console.log(`✅ Auto-created transaction invoice ${invoiceNumber} for Quote #${quoteId}`);
    console.log(`   Amount: $${baseAmount} + $${serviceFee.toFixed(2)} = $${totalAmount.toFixed(2)}`);
    
    return result.insertId;
    
  } catch (error) {
    console.error('❌ Error creating transaction invoice:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

/**
 * Scan for verified payments without invoices and create them
 * This can be run as a cleanup/maintenance task
 */
export const createMissingTransactionInvoices = async () => {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('🔍 Scanning for verified payments without invoices...');
    
    // Find verified payments without invoices
    const [verifiedPayments] = await connection.execute(`
      SELECT DISTINCT pv.*, q.id as quote_id, qr.company_id, qr.price as amount, c.name as company_name, u.name as user_name
      FROM payment_verifications pv
      JOIN quotes q ON pv.quote_id = q.id
      JOIN quote_responses qr ON q.id = qr.quote_id
      JOIN users c ON qr.company_id = c.id
      JOIN users u ON q.user_id = u.id
      LEFT JOIN transaction_invoices ti ON q.id = ti.quote_id AND ti.user_id = q.user_id
      WHERE pv.verification_status = 'verified' AND ti.id IS NULL
      ORDER BY pv.created_at DESC
    `);
    
    console.log(`📊 Found ${verifiedPayments.length} verified payments without invoices`);
    
    let createdCount = 0;
    
    for (const payment of verifiedPayments) {
      try {
        await createTransactionInvoiceForPayment(
          payment.quote_id,
          payment.user_id,
          payment.company_id,
          payment.amount,
          payment.verification_date
        );
        createdCount++;
      } catch (error) {
        console.error(`❌ Failed to create invoice for Quote #${payment.quote_id}:`, error.message);
      }
    }
    
    console.log(`🎉 Created ${createdCount} missing transaction invoices`);
    return createdCount;
    
  } catch (error) {
    console.error('❌ Error scanning for missing invoices:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

export default {
  createTransactionInvoiceForPayment,
  createMissingTransactionInvoices
};