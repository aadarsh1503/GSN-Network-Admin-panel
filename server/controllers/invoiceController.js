// controllers/invoiceController.js
import db from '../config/db.js';
import crypto from 'crypto';

// Generate unique invoice number
const generateInvoiceNumber = () => {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `INV-${timestamp.slice(-6)}-${random}`;
};

// Generate QR code data (JSON string with invoice info)
const generateQRData = (invoice) => {
    return JSON.stringify({
        invoiceNumber: invoice.invoice_number,
        amount: invoice.amount,
        date: invoice.created_at,
        company: invoice.company_name,
        plan: invoice.plan_name,
        status: invoice.status
    });
};

// @desc    Get company invoices
// @route   GET /api/company/invoices
// @access  Private/Company
const getCompanyInvoices = async (req, res) => {
    const companyId = req.user.id;

    try {
        const sql = `
            SELECT 
                i.*,
                us.start_date,
                us.end_date,
                us.payment_status,
                us.payment_method,
                mp.name as plan_name,
                mp.description as plan_description,
                u.name as company_name,
                u.email as company_email,
                u.phone as company_phone,
                u.company_address
            FROM invoices i
            JOIN user_subscriptions us ON i.subscription_id = us.id
            JOIN membership_plans mp ON us.plan_id = mp.id
            JOIN users u ON us.user_id = u.id
            WHERE us.user_id = ?
            ORDER BY i.created_at DESC
        `;

        const [rows] = await db.execute(sql, [companyId]);
        
        // Add QR code data to each invoice
        const invoicesWithQR = rows.map(invoice => ({
            ...invoice,
            qr_data: generateQRData(invoice)
        }));

        res.status(200).json(invoicesWithQR);

    } catch (error) {
        console.error('Error fetching company invoices:', error);
        res.status(500).json({ message: 'Server error fetching invoices' });
    }
};

// @desc    Get single invoice details
// @route   GET /api/company/invoices/:id
// @access  Private/Company
const getInvoiceDetails = async (req, res) => {
    const { id } = req.params;
    const companyId = req.user.id;

    try {
        const sql = `
            SELECT 
                i.*,
                us.start_date,
                us.end_date,
                us.payment_status,
                us.payment_method,
                us.transaction_id,
                mp.name as plan_name,
                mp.description as plan_description,
                mp.features,
                u.name as company_name,
                u.email as company_email,
                u.phone as company_phone,
                u.company_address,
                u.city,
                u.state,
                u.country
            FROM invoices i
            JOIN user_subscriptions us ON i.subscription_id = us.id
            JOIN membership_plans mp ON us.plan_id = mp.id
            JOIN users u ON us.user_id = u.id
            WHERE i.id = ? AND us.user_id = ?
        `;

        const [rows] = await db.execute(sql, [id, companyId]);
        
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Invoice not found' });
        }

        const invoice = rows[0];
        invoice.qr_data = generateQRData(invoice);
        invoice.features = invoice.features ? JSON.parse(invoice.features) : [];

        res.status(200).json(invoice);

    } catch (error) {
        console.error('Error fetching invoice details:', error);
        res.status(500).json({ message: 'Server error fetching invoice details' });
    }
};

// @desc    Create invoice for subscription
// @route   POST /api/company/invoices
// @access  Private (Internal use - called when subscription is created)
const createInvoice = async (subscriptionId, amount, taxAmount = 0) => {
    try {
        const invoiceNumber = generateInvoiceNumber();
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 30); // 30 days from now

        const sql = `
            INSERT INTO invoices 
            (subscription_id, invoice_number, amount, tax_amount, total_amount, due_date, status)
            VALUES (?, ?, ?, ?, ?, ?, 'paid')
        `;

        const totalAmount = parseFloat(amount) + parseFloat(taxAmount);
        const [result] = await db.execute(sql, [
            subscriptionId,
            invoiceNumber,
            amount,
            taxAmount,
            totalAmount,
            dueDate.toISOString().split('T')[0]
        ]);

        return {
            invoiceId: result.insertId,
            invoiceNumber: invoiceNumber
        };

    } catch (error) {
        console.error('Error creating invoice:', error);
        throw error;
    }
};

// @desc    Download invoice as PDF (placeholder for future implementation)
// @route   GET /api/company/invoices/:id/download
// @access  Private/Company
const downloadInvoice = async (req, res) => {
    const { id } = req.params;
    
    // For now, return invoice data that can be used to generate PDF on frontend
    try {
        const invoice = await getInvoiceDetails(req, res);
        // In the future, this would generate and return a PDF file
        res.status(200).json({ 
            message: 'PDF generation not implemented yet',
            invoiceData: invoice 
        });
    } catch (error) {
        res.status(500).json({ message: 'Error preparing invoice download' });
    }
};

export {
    getCompanyInvoices,
    getInvoiceDetails,
    createInvoice,
    downloadInvoice
};