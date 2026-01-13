// services/transactionInvoiceService.js
import db from '../config/db.js';

/**
 * Generate a unique invoice number
 */
const generateInvoiceNumber = () => {
    const year = new Date().getFullYear();
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `TXN-INV-${year}-${timestamp}${random}`;
};

/**
 * Create a transaction invoice when payment proof is accepted
 * @param {Object} params - Invoice parameters
 * @param {number} params.quoteId - Quote ID
 * @param {number} params.userId - User ID
 * @param {number} params.companyId - Company ID
 * @param {number} params.amount - Invoice amount
 * @param {number} params.serviceFee - Service fee (optional)
 * @returns {Object} Created invoice
 */
export const createTransactionInvoice = async ({ quoteId, userId, companyId, amount, serviceFee = 0 }) => {
    try {
        const invoiceNumber = generateInvoiceNumber();
        const totalAmount = parseFloat(amount) + parseFloat(serviceFee);
        
        const sql = `
            INSERT INTO transaction_invoices 
            (invoice_number, quote_id, user_id, company_id, amount, service_fee, total_amount, status, payment_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'paid', NOW())
        `;
        
        const [result] = await db.execute(sql, [
            invoiceNumber,
            quoteId,
            userId,
            companyId,
            amount,
            serviceFee,
            totalAmount
        ]);
        
        // Fetch the created invoice
        const [invoice] = await db.execute(
            'SELECT * FROM transaction_invoices WHERE id = ?',
            [result.insertId]
        );
        
        console.log(`✅ Transaction invoice created: ${invoiceNumber} for quote ${quoteId}`);
        return invoice[0];
        
    } catch (error) {
        console.error('Error creating transaction invoice:', error);
        throw error;
    }
};

/**
 * Update transaction invoice status
 * @param {number} invoiceId - Invoice ID
 * @param {string} status - New status
 */
export const updateTransactionInvoiceStatus = async (invoiceId, status) => {
    try {
        const sql = 'UPDATE transaction_invoices SET status = ?, updated_at = NOW() WHERE id = ?';
        await db.execute(sql, [status, invoiceId]);
        
        console.log(`✅ Transaction invoice ${invoiceId} status updated to: ${status}`);
    } catch (error) {
        console.error('Error updating transaction invoice status:', error);
        throw error;
    }
};

/**
 * Check if transaction invoice exists for a quote
 * @param {number} quoteId - Quote ID
 * @returns {Object|null} Invoice if exists, null otherwise
 */
export const getTransactionInvoiceByQuoteId = async (quoteId) => {
    try {
        const sql = 'SELECT * FROM transaction_invoices WHERE quote_id = ?';
        const [rows] = await db.execute(sql, [quoteId]);
        
        return rows.length > 0 ? rows[0] : null;
    } catch (error) {
        console.error('Error fetching transaction invoice by quote ID:', error);
        throw error;
    }
};

export default {
    createTransactionInvoice,
    updateTransactionInvoiceStatus,
    getTransactionInvoiceByQuoteId
};