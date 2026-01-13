// controllers/enhancedQuoteController.js
import db from '../config/db.js';

// @desc    Submit quote response with bank details
// @route   POST /api/enhanced-quotes/submit-response
// @access  Private/Company
const submitQuoteResponseWithBankDetails = async (req, res) => {
    const companyId = req.user.id;
    const {
        quote_id,
        price,
        transit_time,
        inclusions,
        value_added_services,
        valid_until,
        terms,
        notes,
        company_bank_details_id,
        requires_payment_proof = true,
        payment_currency = 'USD'
    } = req.body;

    if (!quote_id || !price || !transit_time || !company_bank_details_id) {
        return res.status(400).json({ 
            message: 'Quote ID, price, transit time, and bank details are required' 
        });
    }

    try {
        // Verify the quote exists and is still pending
        const [quoteRows] = await db.execute(
            'SELECT * FROM quotes WHERE id = ? AND status = "pending"',
            [quote_id]
        );

        if (quoteRows.length === 0) {
            return res.status(404).json({ message: 'Quote not found or no longer accepting responses' });
        }

        // Verify bank details belong to the company
        const [bankDetails] = await db.execute(
            'SELECT * FROM company_bank_details WHERE id = ? AND company_id = ? AND is_active = TRUE',
            [company_bank_details_id, companyId]
        );

        if (bankDetails.length === 0) {
            return res.status(404).json({ message: 'Bank details not found or inactive' });
        }

        // Check if company has already responded to this quote
        const [existingResponse] = await db.execute(
            'SELECT id FROM quote_responses WHERE quote_id = ? AND company_id = ?',
            [quote_id, companyId]
        );

        if (existingResponse.length > 0) {
            return res.status(400).json({ message: 'You have already responded to this quote' });
        }

        // Insert quote response
        const [responseResult] = await db.execute(
            `INSERT INTO quote_responses 
             (quote_id, company_id, price, transit_time, inclusions, value_added_services, 
              valid_until, terms, notes, requires_payment_proof, payment_amount, payment_currency) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [quote_id, companyId, price, transit_time, inclusions, value_added_services,
             valid_until, terms, notes, requires_payment_proof, price, payment_currency]
        );

        const quoteResponseId = responseResult.insertId;

        // Link bank details to quote response
        await db.execute(
            'INSERT INTO quote_response_bank_details (quote_response_id, company_bank_details_id) VALUES (?, ?)',
            [quoteResponseId, company_bank_details_id]
        );

        res.status(201).json({ 
            message: 'Quote response submitted successfully with bank details',
            quoteResponseId: quoteResponseId
        });

    } catch (error) {
        console.error('Error submitting quote response with bank details:', error);
        res.status(500).json({ message: 'Server error submitting quote response' });
    }
};

// @desc    Get quote responses with bank details for users
// @route   GET /api/enhanced-quotes/:quoteId/responses-with-bank-details
// @access  Private/User,Business
const getQuoteResponsesWithBankDetails = async (req, res) => {
    const { quoteId } = req.params;
    const userId = req.user.id;

    try {
        // Verify the quote belongs to the user
        const [quoteRows] = await db.execute(
            'SELECT id FROM quotes WHERE id = ? AND user_id = ?',
            [quoteId, userId]
        );

        if (quoteRows.length === 0) {
            return res.status(404).json({ message: 'Quote not found or access denied' });
        }

        // Get all responses for this quote with company and bank details
        const [responses] = await db.execute(`
            SELECT qr.*, 
                   u.name as company_name, 
                   u.email as company_email,
                   u.phone as company_phone,
                   u.logo as company_logo,
                   cbd.bank_name,
                   cbd.branch_name,
                   cbd.branch_address,
                   cbd.ifsc_code,
                   cbd.account_number,
                   cbd.account_holder_name,
                   cbd.iban_number,
                   cbd.swift_code,
                   cbd.routing_number,
                   cbd.payment_instructions as bank_instructions,
                   uqs.status as user_response_status,
                   uqs.accepted_at,
                   uqs.rejected_at,
                   uqs.payment_verification_status,
                   pp.file_name as payment_proof_file,
                   pp.upload_date as payment_proof_date,
                   pp.file_path as payment_proof_url,
                   CASE WHEN pp.id IS NOT NULL THEN 1 ELSE 0 END as payment_proof_uploaded,
                   pv.verification_status as payment_status,
                   pv.verification_date,
                   pv.company_notes as payment_company_notes,
                   CASE WHEN pv.verification_status = 'rejected' THEN pv.verification_date ELSE NULL END as rejection_date
            FROM quote_responses qr
            JOIN users u ON qr.company_id = u.id
            LEFT JOIN quote_response_bank_details qrbd ON qr.id = qrbd.quote_response_id
            LEFT JOIN company_bank_details cbd ON qrbd.company_bank_details_id = cbd.id
            LEFT JOIN user_quote_status uqs ON (qr.id = uqs.quote_response_id AND uqs.user_id = ?)
            LEFT JOIN payment_proofs pp ON uqs.payment_proof_id = pp.id
            LEFT JOIN payment_verifications pv ON pp.id = pv.payment_proof_id
            WHERE qr.quote_id = ?
            ORDER BY qr.created_at DESC
        `, [userId, quoteId]);

        res.json(responses);

    } catch (error) {
        console.error('Error fetching quote responses with bank details:', error);
        console.error('Error details:', error.message);
        console.error('SQL Error Code:', error.code);
        res.status(500).json({ 
            message: 'Server error fetching quote responses',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// @desc    Get company's quote responses with payment status
// @route   GET /api/enhanced-quotes/company-responses-with-payments
// @access  Private/Company
const getCompanyResponsesWithPayments = async (req, res) => {
    const companyId = req.user.id;

    try {
        const [responses] = await db.execute(`
            SELECT q.id,
                   qr.id as response_id,
                   qr.quote_id,
                   qr.company_id,
                   qr.price,
                   qr.transit_time,
                   qr.inclusions,
                   qr.value_added_services,
                   qr.valid_until,
                   qr.terms,
                   qr.notes,
                   qr.status as response_status,
                   qr.created_at as response_created_at,
                   qr.updated_at as response_updated_at,
                   qr.requires_payment_proof,
                   qr.payment_amount,
                   qr.payment_currency,
                   q.product_description,
                   q.departure_country,
                   q.arrival_country,
                   q.shipping_mode,
                   q.arrival_date,
                   q.status,
                   q.created_at,
                   q.updated_at,
                   -- Customer information
                   u.name as user_name,
                   u.email as user_email,
                   u.phone as user_phone,
                   -- Company information (the logged-in company)
                   c.name as company_name,
                   c.email as company_email,
                   c.phone as company_phone,
                   -- Bank details
                   cbd.bank_name,
                   cbd.account_holder_name,
                   cbd.account_number,
                   cbd.routing_number,
                   cbd.swift_code,
                   cbd.ifsc_code,
                   -- Quote status and payment info
                   uqs.status as user_response_status,
                   uqs.accepted_at,
                   uqs.payment_verification_status,
                   pp.file_name as payment_proof_file,
                   pp.upload_date as payment_proof_date,
                   pp.notes as payment_notes,
                   pp.file_path as payment_proof_url,
                   CASE WHEN pp.id IS NOT NULL THEN 1 ELSE 0 END as payment_proof_uploaded,
                   CASE WHEN qr.requires_payment_proof = 1 THEN 1 ELSE 0 END as has_payment_proof,
                   pv.id as payment_verification_id,
                   pv.verification_status as payment_status,
                   pv.verification_date,
                   pv.company_notes as payment_company_notes
            FROM quote_responses qr
            JOIN quotes q ON qr.quote_id = q.id
            JOIN users c ON qr.company_id = c.id
            LEFT JOIN users u ON q.user_id = u.id
            LEFT JOIN quote_response_bank_details qrbd ON qr.id = qrbd.quote_response_id
            LEFT JOIN company_bank_details cbd ON qrbd.company_bank_details_id = cbd.id
            LEFT JOIN user_quote_status uqs ON (qr.id = uqs.quote_response_id AND uqs.user_id = u.id)
            LEFT JOIN payment_proofs pp ON (uqs.payment_proof_id = pp.id AND pp.company_id = qr.company_id)
            LEFT JOIN payment_verifications pv ON (pp.id = pv.payment_proof_id AND pv.company_id = qr.company_id)
            WHERE qr.company_id = ?
            ORDER BY qr.created_at DESC
        `, [companyId]);

        res.json(responses);

    } catch (error) {
        console.error('Error fetching company responses with payments:', error);
        res.status(500).json({ message: 'Server error fetching company responses' });
    }
};

// @desc    Update quote response with new bank details
// @route   PUT /api/enhanced-quotes/update-response-bank-details
// @access  Private/Company
const updateQuoteResponseBankDetails = async (req, res) => {
    const companyId = req.user.id;
    const { quote_response_id, company_bank_details_id } = req.body;

    try {
        // Verify quote response belongs to company
        const [quoteResponse] = await db.execute(
            'SELECT id FROM quote_responses WHERE id = ? AND company_id = ?',
            [quote_response_id, companyId]
        );

        if (quoteResponse.length === 0) {
            return res.status(404).json({ message: 'Quote response not found' });
        }

        // Verify bank details belong to company
        const [bankDetails] = await db.execute(
            'SELECT id FROM company_bank_details WHERE id = ? AND company_id = ? AND is_active = TRUE',
            [company_bank_details_id, companyId]
        );

        if (bankDetails.length === 0) {
            return res.status(404).json({ message: 'Bank details not found or inactive' });
        }

        // Update the bank details association
        await db.execute(
            `INSERT INTO quote_response_bank_details (quote_response_id, company_bank_details_id)
             VALUES (?, ?) 
             ON DUPLICATE KEY UPDATE company_bank_details_id = VALUES(company_bank_details_id)`,
            [quote_response_id, company_bank_details_id]
        );

        res.json({ message: 'Quote response bank details updated successfully' });

    } catch (error) {
        console.error('Error updating quote response bank details:', error);
        res.status(500).json({ message: 'Server error updating bank details' });
    }
};

// @desc    Get all companies' quote responses with payment status (Admin only)
// @route   GET /api/enhanced-quotes/all-company-responses-with-payments
// @access  Private/Admin
const getAllCompanyResponsesWithPayments = async (req, res) => {
    try {
        const [responses] = await db.execute(`
            SELECT 
                   qr.id,
                   qr.quote_id,
                   qr.company_id,
                   qr.price,
                   qr.transit_time,
                   qr.inclusions,
                   qr.value_added_services,
                   qr.valid_until,
                   qr.terms,
                   qr.notes,
                   qr.created_at,
                   qr.updated_at,
                   
                   -- Quote details
                   q.user_id,
                   q.product_description,
                   q.departure_country,
                   q.departure_city,
                   q.arrival_country,
                   q.arrival_city,
                   q.shipping_mode,
                   
                   -- User details
                   u.name as user_name,
                   u.email as user_email,
                   u.phone as user_phone,
                   
                   -- Company details
                   c.name as company_name,
                   c.email as company_email,
                   
                   -- Bank details
                   cbd.bank_name,
                   cbd.account_holder_name,
                   cbd.account_number,
                   cbd.routing_number,
                   cbd.swift_code,
                   cbd.iban,
                   cbd.currency,
                   
                   -- Payment proof details
                   pp.id as payment_proof_id,
                   pp.file_path as payment_proof_url,
                   CASE WHEN pp.id IS NOT NULL THEN 1 ELSE 0 END as payment_proof_uploaded,
                   pv.verification_status as payment_status,
                   pv.verification_date,
                   pv.company_notes as payment_company_notes,
                   
                   -- User response status
                   uqs.status as user_response_status,
                   uqs.accepted_at,
                   uqs.rejected_at
                   
            FROM quote_responses qr
            JOIN quotes q ON qr.quote_id = q.id
            LEFT JOIN users u ON q.user_id = u.id
            LEFT JOIN users c ON qr.company_id = c.id
            LEFT JOIN quote_response_bank_details qrbd ON qr.id = qrbd.quote_response_id
            LEFT JOIN company_bank_details cbd ON qrbd.company_bank_details_id = cbd.id
            LEFT JOIN payment_proofs pp ON qr.id = pp.quote_response_id
            LEFT JOIN payment_verifications pv ON pp.id = pv.payment_proof_id
            LEFT JOIN user_quote_status uqs ON qr.id = uqs.quote_response_id
            ORDER BY qr.created_at DESC
        `);

        res.json(responses);

    } catch (error) {
        console.error('Error fetching all company responses with payments:', error);
        res.status(500).json({ message: 'Server error fetching all company responses' });
    }
};

// @desc    Get quote responses with bank details for admin (any quote)
// @route   GET /api/enhanced-quotes/admin/:quoteId/responses-with-bank-details
// @access  Private/Admin
const getQuoteResponsesWithBankDetailsAdmin = async (req, res) => {
    const { quoteId } = req.params;

    try {
        // Get all responses for this quote with company and bank details
        const [responses] = await db.execute(`
            SELECT qr.*, 
                   u.name as company_name, 
                   u.email as company_email,
                   u.phone as company_phone,
                   u.logo as company_logo,
                   cbd.bank_name,
                   cbd.branch_name,
                   cbd.branch_address,
                   cbd.ifsc_code,
                   cbd.account_number,
                   cbd.account_holder_name,
                   cbd.iban_number,
                   cbd.swift_code,
                   cbd.routing_number,
                   cbd.payment_instructions as bank_instructions,
                   uqs.status as user_response_status,
                   uqs.accepted_at,
                   uqs.rejected_at,
                   uqs.payment_verification_status,
                   pp.file_name as payment_proof_file,
                   pp.upload_date as payment_proof_date,
                   pp.file_path as payment_proof_url,
                   CASE WHEN pp.id IS NOT NULL THEN 1 ELSE 0 END as payment_proof_uploaded,
                   pv.verification_status as payment_status,
                   pv.verification_date,
                   pv.company_notes as payment_company_notes
            FROM quote_responses qr
            JOIN users u ON qr.company_id = u.id
            LEFT JOIN quote_response_bank_details qrbd ON qr.id = qrbd.quote_response_id
            LEFT JOIN company_bank_details cbd ON qrbd.company_bank_details_id = cbd.id
            LEFT JOIN user_quote_status uqs ON qr.id = uqs.quote_response_id
            LEFT JOIN payment_proofs pp ON uqs.payment_proof_id = pp.id
            LEFT JOIN payment_verifications pv ON pp.id = pv.payment_proof_id
            WHERE qr.quote_id = ?
            ORDER BY qr.created_at DESC
        `, [quoteId]);

        res.json(responses);

    } catch (error) {
        console.error('Error fetching quote responses with bank details for admin:', error);
        console.error('Error details:', error.message);
        console.error('SQL Error Code:', error.code);
        res.status(500).json({ 
            message: 'Server error fetching quote responses',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// @desc    Get comprehensive admin quotes with company details and payment status
// @route   GET /api/enhanced-quotes/admin/comprehensive-quotes
// @access  Private/Admin
const getComprehensiveAdminQuotes = async (req, res) => {
    try {
        const [quotes] = await db.execute(`
            SELECT DISTINCT
                q.id,
                q.user_id,
                q.product_description,
                q.departure_country,
                q.departure_city,
                q.arrival_country,
                q.arrival_city,
                q.shipping_mode,
                q.arrival_date,
                q.status,
                q.created_at,
                q.updated_at,
                
                -- User details
                u.name as user_name,
                u.email as user_email,
                u.phone as user_phone,
                u.role as user_role,
                
                -- Response count
                (SELECT COUNT(*) FROM quote_responses WHERE quote_id = q.id) as response_count,
                
                -- Accepted responses count
                (SELECT COUNT(*) FROM quote_responses qr2 
                 LEFT JOIN user_quote_status uqs2 ON qr2.id = uqs2.quote_response_id 
                 WHERE qr2.quote_id = q.id AND uqs2.status = 'accepted') as accepted_count,
                
                -- Company working on this quote (accepted response)
                working_company.company_name,
                working_company.company_email,
                working_company.company_phone,
                working_company.price as accepted_price,
                working_company.transit_time as accepted_transit_time,
                working_company.accepted_at,
                working_company.payment_status,
                working_company.payment_proof_url,
                working_company.verification_date,
                working_company.payment_company_notes,
                
                -- Revenue calculation
                CASE 
                    WHEN working_company.payment_status = 'verified' THEN working_company.price
                    ELSE 0
                END as verified_revenue
                
            FROM quotes q
            LEFT JOIN users u ON q.user_id = u.id
            LEFT JOIN (
                SELECT 
                    qr.quote_id,
                    c.name as company_name,
                    c.email as company_email,
                    c.phone as company_phone,
                    qr.price,
                    qr.transit_time,
                    uqs.accepted_at,
                    pv.verification_status as payment_status,
                    pp.file_path as payment_proof_url,
                    pv.verification_date,
                    pv.company_notes as payment_company_notes
                FROM quote_responses qr
                JOIN users c ON qr.company_id = c.id
                LEFT JOIN user_quote_status uqs ON qr.id = uqs.quote_response_id
                LEFT JOIN payment_proofs pp ON uqs.payment_proof_id = pp.id
                LEFT JOIN payment_verifications pv ON pp.id = pv.payment_proof_id
                WHERE uqs.status = 'accepted'
            ) working_company ON q.id = working_company.quote_id
            
            ORDER BY q.created_at DESC
        `);

        res.json(quotes);

    } catch (error) {
        console.error('Error fetching comprehensive admin quotes:', error);
        res.status(500).json({ 
            message: 'Server error fetching comprehensive quotes',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// @desc    Get comprehensive admin quotes by status
// @route   GET /api/enhanced-quotes/admin/comprehensive-quotes/:status
// @access  Private/Admin
const getComprehensiveAdminQuotesByStatus = async (req, res) => {
    const { status } = req.params;
    
    // Validate status
    const validStatuses = ['all', 'pending', 'approved', 'rejected', 'running', 'closed'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid status parameter' });
    }

    try {
        let whereClause = '';
        let queryParams = [];
        
        if (status !== 'all') {
            whereClause = 'WHERE q.status = ?';
            queryParams.push(status);
        }

        const [quotes] = await db.execute(`
            SELECT DISTINCT
                q.id,
                q.user_id,
                q.product_description,
                q.departure_country,
                q.departure_city,
                q.arrival_country,
                q.arrival_city,
                q.shipping_mode,
                q.arrival_date,
                q.status,
                q.created_at,
                q.updated_at,
                
                -- User details
                u.name as user_name,
                u.email as user_email,
                u.phone as user_phone,
                u.role as user_role,
                
                -- Response count
                (SELECT COUNT(*) FROM quote_responses WHERE quote_id = q.id) as response_count,
                
                -- Accepted responses count
                (SELECT COUNT(*) FROM quote_responses qr2 
                 LEFT JOIN user_quote_status uqs2 ON qr2.id = uqs2.quote_response_id 
                 WHERE qr2.quote_id = q.id AND uqs2.status = 'accepted') as accepted_count,
                
                -- Company working on this quote (accepted response)
                working_company.company_name,
                working_company.company_email,
                working_company.company_phone,
                working_company.price as accepted_price,
                working_company.transit_time as accepted_transit_time,
                working_company.accepted_at,
                working_company.payment_status,
                working_company.payment_proof_url,
                working_company.verification_date,
                working_company.payment_company_notes,
                working_company.has_payment_proof,
                
                -- Revenue calculation
                CASE 
                    WHEN working_company.payment_status = 'verified' THEN working_company.price
                    ELSE 0
                END as verified_revenue
                
            FROM quotes q
            LEFT JOIN users u ON q.user_id = u.id
            LEFT JOIN (
                SELECT 
                    qr.quote_id,
                    c.name as company_name,
                    c.email as company_email,
                    c.phone as company_phone,
                    qr.price,
                    qr.transit_time,
                    uqs.accepted_at,
                    pv.verification_status as payment_status,
                    pp.file_path as payment_proof_url,
                    pv.verification_date,
                    pv.company_notes as payment_company_notes,
                    CASE WHEN pp.id IS NOT NULL THEN 1 ELSE 0 END as has_payment_proof
                FROM quote_responses qr
                JOIN users c ON qr.company_id = c.id
                LEFT JOIN user_quote_status uqs ON qr.id = uqs.quote_response_id
                LEFT JOIN payment_proofs pp ON uqs.payment_proof_id = pp.id
                LEFT JOIN payment_verifications pv ON pp.id = pv.payment_proof_id
                WHERE uqs.status = 'accepted'
            ) working_company ON q.id = working_company.quote_id
            
            ${whereClause}
            ORDER BY q.created_at DESC
        `, queryParams);

        res.json(quotes);

    } catch (error) {
        console.error('Error fetching comprehensive admin quotes by status:', error);
        res.status(500).json({ 
            message: 'Server error fetching comprehensive quotes by status',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

export {
    submitQuoteResponseWithBankDetails,
    getQuoteResponsesWithBankDetails,
    getCompanyResponsesWithPayments,
    getAllCompanyResponsesWithPayments,
    getQuoteResponsesWithBankDetailsAdmin,
    getComprehensiveAdminQuotes,
    getComprehensiveAdminQuotesByStatus,
    updateQuoteResponseBankDetails
};