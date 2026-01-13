// services/invoiceGenerationService.js
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
 * Create transaction invoice when payment is verified
 * This should be called whenever a payment verification status changes to 'verified'
 */
export const createTransactionInvoiceOnPaymentVerification = async (paymentVerificationId) => {
    try {
        console.log(`🧾 Creating transaction invoice for payment verification ID: ${paymentVerificationId}`);
        
        // Get payment verification details with related quote and response info
        const [paymentDetails] = await db.execute(`
            SELECT 
                pv.*,
                qr.quote_id,
                qr.company_id,
                qr.price,
                q.user_id
            FROM payment_verifications pv
            JOIN quote_responses qr ON pv.quote_response_id = qr.id
            JOIN quotes q ON qr.quote_id = q.id
            WHERE pv.id = ? AND pv.verification_status = 'verified'
        `, [paymentVerificationId]);
        
        if (paymentDetails.length === 0) {
            console.log(`⚠️ No verified payment found for ID: ${paymentVerificationId}`);
            return null;
        }
        
        const payment = paymentDetails[0];
        
        // Check if invoice already exists for this quote and user
        const [existingInvoice] = await db.execute(
            'SELECT id FROM transaction_invoices WHERE quote_id = ? AND user_id = ?',
            [payment.quote_id, payment.user_id]
        );
        
        if (existingInvoice.length > 0) {
            console.log(`⚠️ Invoice already exists for Quote #${payment.quote_id}`);
            return existingInvoice[0];
        }
        
        // Generate invoice
        const invoiceNumber = generateInvoiceNumber();
        const serviceFee = parseFloat(payment.price) * 0.05; // 5% service fee
        const totalAmount = parseFloat(payment.price) + serviceFee;
        
        const [result] = await db.execute(`
            INSERT INTO transaction_invoices 
            (invoice_number, quote_id, user_id, company_id, amount, service_fee, total_amount, status, payment_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'paid', NOW())
        `, [
            invoiceNumber,
            payment.quote_id,
            payment.user_id,
            payment.company_id,
            payment.price,
            serviceFee,
            totalAmount
        ]);
        
        console.log(`✅ Transaction invoice created: ${invoiceNumber} for Quote #${payment.quote_id}`);
        
        // Return the created invoice
        const [createdInvoice] = await db.execute(
            'SELECT * FROM transaction_invoices WHERE id = ?',
            [result.insertId]
        );
        
        return createdInvoice[0];
        
    } catch (error) {
        console.error('❌ Error creating transaction invoice:', error);
        throw error;
    }
};

/**
 * Batch create missing transaction invoices for all verified payments
 */
export const createMissingTransactionInvoices = async () => {
    try {
        console.log('🔍 Checking for missing transaction invoices...');
        
        // Find all verified payments without invoices
        const [verifiedPayments] = await db.execute(`
            SELECT pv.*, qr.quote_id, qr.company_id, qr.price, q.user_id
            FROM payment_verifications pv
            JOIN quote_responses qr ON pv.quote_response_id = qr.id
            JOIN quotes q ON qr.quote_id = q.id
            LEFT JOIN transaction_invoices ti ON ti.quote_id = qr.quote_id AND ti.user_id = q.user_id
            WHERE pv.verification_status = 'verified' AND ti.id IS NULL
        `);
        
        console.log(`📋 Found ${verifiedPayments.length} verified payments without invoices`);
        
        const createdInvoices = [];
        
        for (const payment of verifiedPayments) {
            try {
                const invoice = await createTransactionInvoiceOnPaymentVerification(payment.id);
                if (invoice) {
                    createdInvoices.push(invoice);
                }
            } catch (error) {
                console.error(`❌ Error creating invoice for payment ${payment.id}:`, error.message);
            }
        }
        
        console.log(`✅ Created ${createdInvoices.length} transaction invoices`);
        return createdInvoices;
        
    } catch (error) {
        console.error('❌ Error in batch invoice creation:', error);
        throw error;
    }
};

export default {
    createTransactionInvoiceOnPaymentVerification,
    createMissingTransactionInvoices,
    generateInvoiceNumber
};