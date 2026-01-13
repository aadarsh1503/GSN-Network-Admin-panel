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
                -- Use backup dates for cancelled invoices, otherwise use current subscription dates
                COALESCE(i.subscription_start_date_backup, us.start_date) as start_date,
                COALESCE(i.subscription_end_date_backup, us.end_date) as end_date,
                us.payment_status,
                us.payment_method,
                -- Use backup plan info for cancelled invoices, otherwise use current plan info
                COALESCE(i.plan_name_backup, mp.name) as plan_name,
                COALESCE(i.plan_description_backup, mp.description) as plan_description,
                u.name as company_name,
                u.email as company_email,
                u.phone as company_phone,
                u.company_address
            FROM invoices i
            LEFT JOIN user_subscriptions us ON i.subscription_id = us.id
            LEFT JOIN membership_plans mp ON us.plan_id = mp.id
            LEFT JOIN users u ON i.user_id = u.id
            WHERE i.user_id = ?
            ORDER BY i.created_at DESC
        `;

        const [rows] = await db.execute(sql, [companyId]);
        
        // Add QR code data to each invoice
        const invoicesWithQR = rows.map(invoice => ({
            ...invoice,
            plan_name: invoice.plan_name || 'Unknown Plan',
            plan_description: invoice.plan_description || 'No description available',
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
                -- Use backup dates for cancelled invoices, otherwise use current subscription dates
                COALESCE(i.subscription_start_date_backup, us.start_date) as start_date,
                COALESCE(i.subscription_end_date_backup, us.end_date) as end_date,
                us.payment_status,
                us.payment_method,
                us.transaction_id,
                -- Use backup plan info for cancelled invoices, otherwise use current plan info
                COALESCE(i.plan_name_backup, mp.name) as plan_name,
                COALESCE(i.plan_description_backup, mp.description) as plan_description,
                mp.features,
                u.name as company_name,
                u.email as company_email,
                u.phone as company_phone,
                u.company_address,
                u.city,
                u.state,
                u.country
            FROM invoices i
            LEFT JOIN user_subscriptions us ON i.subscription_id = us.id
            LEFT JOIN membership_plans mp ON us.plan_id = mp.id
            LEFT JOIN users u ON i.user_id = u.id
            WHERE i.id = ? AND i.user_id = ?
        `;

        const [rows] = await db.execute(sql, [id, companyId]);
        
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Invoice not found' });
        }

        const invoice = rows[0];
        
        // Ensure we have plan information
        invoice.plan_name = invoice.plan_name || 'Unknown Plan';
        invoice.plan_description = invoice.plan_description || 'No description available';
        
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
const createInvoice = async (subscriptionId, amount, taxAmount = 0, userId = null) => {
    try {
        const invoiceNumber = generateInvoiceNumber();
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 30); // 30 days from now

        // If userId is not provided, get it from the subscription
        if (!userId) {
            const [subscription] = await db.execute(
                'SELECT user_id FROM user_subscriptions WHERE id = ?',
                [subscriptionId]
            );
            if (subscription.length > 0) {
                userId = subscription[0].user_id;
            }
        }

        // Get plan information and subscription period to store as backup
        let planName = 'Unknown Plan';
        let planDescription = 'No description available';
        let startDate = null;
        let endDate = null;
        
        try {
            const [subscriptionInfo] = await db.execute(`
                SELECT 
                    mp.name, 
                    mp.description,
                    us.start_date,
                    us.end_date
                FROM user_subscriptions us
                JOIN membership_plans mp ON us.plan_id = mp.id
                WHERE us.id = ?
            `, [subscriptionId]);
            
            if (subscriptionInfo.length > 0) {
                planName = subscriptionInfo[0].name;
                planDescription = subscriptionInfo[0].description || 'No description available';
                startDate = subscriptionInfo[0].start_date;
                endDate = subscriptionInfo[0].end_date;
            }
        } catch (infoError) {
            console.warn('Could not fetch subscription info for invoice backup:', infoError.message);
        }

        const sql = `
            INSERT INTO invoices 
            (subscription_id, user_id, invoice_number, amount, tax_amount, total_amount, due_date, status, 
             plan_name_backup, plan_description_backup, subscription_start_date_backup, subscription_end_date_backup)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'paid', ?, ?, ?, ?)
        `;

        const totalAmount = parseFloat(amount) + parseFloat(taxAmount);
        const [result] = await db.execute(sql, [
            subscriptionId,
            userId,
            invoiceNumber,
            amount,
            taxAmount,
            totalAmount,
            dueDate.toISOString().split('T')[0],
            planName,
            planDescription,
            startDate,
            endDate
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