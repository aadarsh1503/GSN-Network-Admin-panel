// controllers/adminPanelController.js
import db from '../config/db.js';

// ==================== SUBSCRIPTION MANAGEMENT ====================

// @desc    Get all subscriptions with user and plan details
// @route   GET /api/admin-panel/subscriptions
// @access  Admin
export const getAllSubscriptionsAdmin = async (req, res) => {
    try {
        // Log the request for debugging
        console.log('🔍 Admin panel subscriptions requested');
        
        // Get the latest ACTIVE subscription for each user
        const sql = `
            SELECT 
                us.id,
                us.user_id,
                u.name as user_name,
                u.email as user_email,
                u.phone as user_phone,
                u.role as user_role,
                us.plan_id,
                mp.name as plan_name,
                mp.price as plan_price,
                mp.duration_months,
                us.start_date,
                us.end_date,
                us.status,
                us.payment_status,
                us.transaction_id,
                us.amount_paid,
                us.proration_applied,
                us.proration_details,
                us.payment_method,
                us.created_at
            FROM user_subscriptions us
            JOIN users u ON us.user_id = u.id
            JOIN membership_plans mp ON us.plan_id = mp.id
            WHERE us.status = 'active'
            AND us.amount_paid > 0
            AND us.id IN (
                SELECT MAX(us2.id)
                FROM user_subscriptions us2
                WHERE us2.user_id = us.user_id
                AND us2.status = 'active'
                AND us2.amount_paid > 0
                GROUP BY us2.user_id
            )
            ORDER BY us.created_at DESC
        `;
        
        const [subscriptions] = await db.execute(sql);
        
        // Log any suspicious subscriptions
        const guestSubs = subscriptions.filter(sub => 
            sub.plan_name === 'Guest' || parseFloat(sub.amount_paid) === 0
        );
        
        if (guestSubs.length > 0) {
            console.log('⚠️ WARNING: Guest subscriptions detected in admin panel:');
            guestSubs.forEach(sub => {
                console.log(`  - ID: ${sub.id}, User: ${sub.user_email}, Plan: ${sub.plan_name}, Amount: $${sub.amount_paid}`);
            });
        }
        
        console.log(`📊 Returning ${subscriptions.length} subscriptions to admin panel`);
        res.status(200).json(subscriptions);
    } catch (error) {
        console.error('Error fetching subscriptions:', error);
        res.status(500).json({ message: 'Server error fetching subscriptions' });
    }
};

// @desc    Get subscription by ID with full details
// @route   GET /api/admin-panel/subscriptions/:id
// @access  Admin
export const getSubscriptionById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const sql = `
            SELECT 
                us.*,
                u.name as user_name,
                u.email as user_email,
                u.phone as user_phone,
                u.role as user_role,
                u.country,
                mp.name as plan_name,
                mp.price as plan_price,
                mp.duration_months,
                mp.features
            FROM user_subscriptions us
            JOIN users u ON us.user_id = u.id
            JOIN membership_plans mp ON us.plan_id = mp.id
            WHERE us.id = ?
        `;
        
        const [rows] = await db.execute(sql, [id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Subscription not found' });
        }
        
        res.status(200).json(rows[0]);
    } catch (error) {
        console.error('Error fetching subscription:', error);
        res.status(500).json({ message: 'Server error fetching subscription' });
    }
};

// @desc    Get quote-related transactions (user payments to companies)
// @route   GET /api/admin-panel/transactions
// @access  Admin
export const getAllTransactions = async (req, res) => {
    try {
        const sql = `
            SELECT 
                t.id,
                t.user_id,
                u.name as user_name,
                u.email as user_email,
                t.company_id,
                c.name as company_name,
                c.email as company_email,
                t.quote_response_id,
                qr.quote_id,
                q.product_description,
                t.amount,
                t.payment_method,
                t.transaction_reference,
                t.status,
                t.description,
                t.created_at
            FROM transactions t
            JOIN users u ON t.user_id = u.id
            LEFT JOIN users c ON t.company_id = c.id
            LEFT JOIN quote_responses qr ON t.quote_response_id = qr.id
            LEFT JOIN quotes q ON qr.quote_id = q.id
            WHERE t.quote_response_id IS NOT NULL
            ORDER BY t.created_at DESC
        `;
        
        const [transactions] = await db.execute(sql);
        res.status(200).json(transactions);
    } catch (error) {
        console.error('Error fetching quote transactions:', error);
        res.status(500).json({ message: 'Server error fetching quote transactions' });
    }
};

// @desc    Get accepted quote data as transactions (since actual transactions aren't created)
// @route   GET /api/admin-panel/accepted-quote-transactions
// @access  Admin
export const getAcceptedQuoteTransactions = async (req, res) => {
    try {
        const sql = `
            SELECT 
                uqs.id,
                uqs.user_id,
                u.name as user_name,
                u.email as user_email,
                uqs.company_id,
                c.name as company_name,
                c.email as company_email,
                uqs.quote_response_id,
                uqs.quote_id,
                q.product_description,
                qr.price as amount,
                'accepted_quote' as payment_method,
                CONCAT('QUOTE-', uqs.quote_id, '-', uqs.quote_response_id) as transaction_reference,
                'completed' as status,
                'Payment for accepted shipping quote' as description,
                uqs.accepted_at as created_at
            FROM user_quote_status uqs
            JOIN users u ON uqs.user_id = u.id
            LEFT JOIN users c ON uqs.company_id = c.id
            LEFT JOIN quote_responses qr ON uqs.quote_response_id = qr.id
            LEFT JOIN quotes q ON uqs.quote_id = q.id
            WHERE uqs.status = 'accepted'
            ORDER BY uqs.accepted_at DESC
        `;
        
        const [transactions] = await db.execute(sql);
        res.status(200).json(transactions);
    } catch (error) {
        console.error('Error fetching accepted quote transactions:', error);
        res.status(500).json({ message: 'Server error fetching accepted quote transactions' });
    }
};

// @desc    Get subscription transactions (member subscription payments)
// @route   GET /api/admin-panel/subscription-transactions
// @access  Admin
export const getSubscriptionTransactions = async (req, res) => {
    try {
        const sql = `
            SELECT 
                t.id,
                t.user_id,
                u.name as user_name,
                u.email as user_email,
                u.role as user_role,
                t.subscription_id,
                us.plan_id,
                mp.name as plan_name,
                t.amount,
                t.payment_method,
                t.transaction_reference,
                t.status,
                t.description,
                t.created_at
            FROM transactions t
            JOIN users u ON t.user_id = u.id
            LEFT JOIN user_subscriptions us ON t.subscription_id = us.id
            LEFT JOIN membership_plans mp ON us.plan_id = mp.id
            WHERE t.subscription_id IS NOT NULL
            ORDER BY t.created_at DESC
        `;
        
        const [transactions] = await db.execute(sql);
        res.status(200).json(transactions);
    } catch (error) {
        console.error('Error fetching subscription transactions:', error);
        res.status(500).json({ message: 'Server error fetching subscription transactions' });
    }
};

// ==================== QUOTE MANAGEMENT ====================

// @desc    Get all quotes with user and company details
// @route   GET /api/admin-panel/quotes
// @access  Admin
export const getAllQuotesAdmin = async (req, res) => {
    console.log('🚨 [URGENT DEBUG] getAllQuotesAdmin function called!');
    console.log('\n🔍 [DEBUG] getAllQuotesAdmin - Starting to fetch quotes...');
    
    try {
        const sql = `
            SELECT 
                q.id,
                q.user_id,
                u.name as user_name,
                u.email as user_email,
                u.phone as user_phone,
                u.role as user_role,
                q.shipping_mode,
                q.departure_country,
                q.departure_city,
                q.arrival_country,
                q.arrival_city,
                q.product_description,
                q.arrival_date,
                q.status,
                q.created_at,
                q.updated_at,
                
                -- Response counts
                COALESCE(response_counts.response_count, 0) as response_count,
                COALESCE(response_counts.accepted_count, 0) as accepted_count,
                
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
            
            -- Subquery for response counts
            LEFT JOIN (
                SELECT 
                    qr_count.quote_id,
                    COUNT(DISTINCT qr_count.id) as response_count,
                    COUNT(DISTINCT CASE WHEN uqs_count.status = 'accepted' THEN qr_count.id END) as accepted_count
                FROM quote_responses qr_count
                LEFT JOIN user_quote_status uqs_count ON qr_count.id = uqs_count.quote_response_id
                GROUP BY qr_count.quote_id
            ) response_counts ON q.id = response_counts.quote_id
            
            -- Subquery for working company (accepted response OR verified payment)
            LEFT JOIN (
                SELECT 
                    qr2.quote_id,
                    c.name as company_name,
                    c.email as company_email,
                    c.phone as company_phone,
                    qr2.price,
                    qr2.transit_time,
                    uqs2.accepted_at,
                    pv.verification_status as payment_status,
                    pp.file_path as payment_proof_url,
                    pv.verification_date,
                    pv.company_notes as payment_company_notes,
                    CASE WHEN pp.id IS NOT NULL THEN 1 ELSE 0 END as has_payment_proof
                FROM quote_responses qr2
                JOIN users c ON qr2.company_id = c.id
                LEFT JOIN user_quote_status uqs2 ON qr2.id = uqs2.quote_response_id
                LEFT JOIN payment_proofs pp ON uqs2.payment_proof_id = pp.id
                LEFT JOIN payment_verifications pv ON pp.id = pv.payment_proof_id
                WHERE uqs2.status = 'accepted' 
                   OR (pv.verification_status = 'verified' AND pv.company_id = qr2.company_id)
            ) working_company ON q.id = working_company.quote_id
            
            ORDER BY q.created_at DESC
        `;
        
        console.log('📝 [DEBUG] Executing SQL query for admin quotes...');
        const [quotes] = await db.execute(sql);
        
        console.log(`✅ [DEBUG] Query executed successfully. Found ${quotes.length} quotes`);
        
        // Log detailed information about the first few quotes
        if (quotes.length > 0) {
            console.log('\n📊 [DEBUG] Sample quote data structure:');
            quotes.slice(0, 3).forEach((quote, index) => {
                console.log(`\n--- Quote ${index + 1} (ID: ${quote.id}) ---`);
                console.log(`👤 Customer: ${quote.user_name} (${quote.user_email})`);
                console.log(`🏢 Company: ${quote.company_name || 'NO COMPANY'} (${quote.company_email || 'NO EMAIL'})`);
                console.log(`💰 Price: ${quote.accepted_price || 'NO PRICE'}`);
                console.log(`📦 Product: ${quote.product_description}`);
                console.log(`📍 Route: ${quote.departure_country} → ${quote.arrival_country}`);
                console.log(`📊 Responses: ${quote.response_count} total, ${quote.accepted_count} accepted`);
                console.log(`💳 Payment Status: ${quote.payment_status || 'NO PAYMENT STATUS'}`);
                console.log(`📅 Status: ${quote.status}`);
                console.log(`🕒 Accepted At: ${quote.accepted_at || 'NOT ACCEPTED'}`);
            });
            
            // Summary statistics
            const quotesWithCompany = quotes.filter(q => q.company_name);
            const quotesWithoutCompany = quotes.filter(q => !q.company_name);
            const quotesWithAcceptedPrice = quotes.filter(q => q.accepted_price);
            
            console.log('\n📈 [DEBUG] Summary Statistics:');
            console.log(`📊 Total quotes: ${quotes.length}`);
            console.log(`🏢 Quotes with company assigned: ${quotesWithCompany.length}`);
            console.log(`❌ Quotes without company: ${quotesWithoutCompany.length}`);
            console.log(`💰 Quotes with accepted price: ${quotesWithAcceptedPrice.length}`);
            
            if (quotesWithCompany.length > 0) {
                console.log('\n🏢 [DEBUG] Companies found:');
                const uniqueCompanies = [...new Set(quotesWithCompany.map(q => q.company_name))];
                uniqueCompanies.forEach(company => {
                    const companyQuotes = quotesWithCompany.filter(q => q.company_name === company);
                    console.log(`  - ${company}: ${companyQuotes.length} quotes`);
                });
            }
        } else {
            console.log('⚠️ [DEBUG] No quotes found in database');
        }
        
        console.log('\n🚀 [DEBUG] Sending response to frontend...');
        res.status(200).json(quotes);
        
    } catch (error) {
        console.error('❌ [DEBUG] Error in getAllQuotesAdmin:', error);
        console.error('❌ [DEBUG] Error details:', {
            message: error.message,
            code: error.code,
            sqlState: error.sqlState,
            stack: error.stack
        });
        console.error('Error fetching quotes:', error);
        res.status(500).json({ message: 'Server error fetching quotes' });
    }
};

// @desc    Get quote by ID with full details including responses
// @route   GET /api/admin-panel/quotes/:id
// @access  Admin
export const getQuoteByIdAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Get quote details
        const quoteSql = `
            SELECT 
                q.*,
                u.name as user_name,
                u.email as user_email,
                u.phone as user_phone,
                u.country as user_country
            FROM quotes q
            LEFT JOIN users u ON q.user_id = u.id
            WHERE q.id = ?
        `;
        
        const [quoteRows] = await db.execute(quoteSql, [id]);
        
        if (quoteRows.length === 0) {
            return res.status(404).json({ message: 'Quote not found' });
        }
        
        const quote = quoteRows[0];
        
        // Get quote responses
        const responsesSql = `
            SELECT 
                qr.*,
                u.name as company_name,
                u.email as company_email,
                u.phone as company_phone,
                u.logo as company_logo,
                uqs.status as user_response_status,
                uqs.accepted_at,
                uqs.rejected_at
            FROM quote_responses qr
            JOIN users u ON qr.company_id = u.id
            LEFT JOIN user_quote_status uqs ON qr.id = uqs.quote_response_id
            WHERE qr.quote_id = ?
            ORDER BY qr.created_at DESC
        `;
        
        const [responses] = await db.execute(responsesSql, [id]);
        
        quote.responses = responses;
        
        res.status(200).json(quote);
    } catch (error) {
        console.error('Error fetching quote details:', error);
        res.status(500).json({ message: 'Server error fetching quote details' });
    }
};

// @desc    Delete quote (admin action)
// @route   DELETE /api/admin-panel/quotes/:id
// @access  Admin
export const deleteQuote = async (req, res) => {
    try {
        const { id } = req.params;
        
        const sql = 'DELETE FROM quotes WHERE id = ?';
        const [result] = await db.execute(sql, [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Quote not found' });
        }
        
        res.status(200).json({ message: 'Quote deleted successfully' });
    } catch (error) {
        console.error('Error deleting quote:', error);
        res.status(500).json({ message: 'Server error deleting quote' });
    }
};

// @desc    Update quote status (admin action)
// @route   PUT /api/admin-panel/quotes/:id/status
// @access  Admin
export const updateQuoteStatusAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        const validStatuses = ['pending', 'approved', 'rejected', 'running', 'closed'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }
        
        const sql = 'UPDATE quotes SET status = ?, updated_at = NOW() WHERE id = ?';
        const [result] = await db.execute(sql, [status, id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Quote not found' });
        }
        
        res.status(200).json({ message: 'Quote status updated successfully' });
    } catch (error) {
        console.error('Error updating quote status:', error);
        res.status(500).json({ message: 'Server error updating quote status' });
    }
};

// ==================== INVOICE MANAGEMENT ====================

// @desc    Get all invoices for admin panel
// @route   GET /api/admin-panel/invoices
// @access  Admin
export const getAllInvoicesAdmin = async (req, res) => {
    try {
        console.log('🔍 Admin panel invoices requested');
        
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
                u.role as user_role,
                u.company_address,
                u.city,
                u.state,
                u.country
            FROM invoices i
            LEFT JOIN user_subscriptions us ON i.subscription_id = us.id
            LEFT JOIN membership_plans mp ON us.plan_id = mp.id
            LEFT JOIN users u ON i.user_id = u.id
            ORDER BY i.created_at DESC
        `;
        
        const [invoices] = await db.execute(sql);
        
        console.log(`📊 Returning ${invoices.length} invoices to admin panel`);
        res.status(200).json(invoices);
    } catch (error) {
        console.error('Error fetching admin invoices:', error);
        res.status(500).json({ message: 'Server error fetching invoices' });
    }
};

// @desc    Get invoice by ID for admin
// @route   GET /api/admin-panel/invoices/:id
// @access  Admin
export const getInvoiceByIdAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        
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
                u.role as user_role,
                u.company_address,
                u.city,
                u.state,
                u.country
            FROM invoices i
            LEFT JOIN user_subscriptions us ON i.subscription_id = us.id
            LEFT JOIN membership_plans mp ON us.plan_id = mp.id
            LEFT JOIN users u ON i.user_id = u.id
            WHERE i.id = ?
        `;
        
        const [rows] = await db.execute(sql, [id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Invoice not found' });
        }
        
        const invoice = rows[0];
        
        // Ensure we have plan information
        invoice.plan_name = invoice.plan_name || 'Unknown Plan';
        invoice.plan_description = invoice.plan_description || 'No description available';
        invoice.features = invoice.features ? JSON.parse(invoice.features) : [];
        
        res.status(200).json(invoice);
    } catch (error) {
        console.error('Error fetching admin invoice details:', error);
        res.status(500).json({ message: 'Server error fetching invoice details' });
    }
};

// @desc    Get all transaction invoices for admin panel
// @route   GET /api/admin-panel/transaction-invoices
// @access  Admin
export const getAllTransactionInvoicesAdmin = async (req, res) => {
    try {
        console.log('🔍 Admin panel transaction invoices requested');
        
        const sql = `
            SELECT 
                ti.*,
                q.id as quote_id,
                q.departure_city,
                q.arrival_city,
                u.name as user_name,
                u.email as user_email,
                u.phone as user_phone,
                c.name as company_name,
                c.email as company_email,
                c.phone as company_phone
            FROM transaction_invoices ti
            LEFT JOIN quotes q ON ti.quote_id = q.id
            LEFT JOIN users u ON ti.user_id = u.id
            LEFT JOIN users c ON ti.company_id = c.id
            ORDER BY ti.created_at DESC
        `;
        
        const [invoices] = await db.execute(sql);
        
        console.log(`📊 Returning ${invoices.length} transaction invoices to admin panel`);
        res.status(200).json(invoices);
    } catch (error) {
        console.error('Error fetching admin transaction invoices:', error);
        res.status(500).json({ message: 'Server error fetching transaction invoices' });
    }
};

// @desc    Get transaction invoice by ID for admin
// @route   GET /api/admin-panel/transaction-invoices/:id
// @access  Admin
export const getTransactionInvoiceByIdAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        
        const sql = `
            SELECT 
                ti.*,
                q.id as quote_id,
                q.departure_city,
                q.arrival_city,
                q.product_description,
                q.shipping_mode,
                u.name as user_name,
                u.email as user_email,
                u.phone as user_phone,
                u.country as user_country,
                u.state as user_state,
                u.city as user_city,
                c.name as company_name,
                c.email as company_email,
                c.phone as company_phone,
                c.logo as company_logo,
                c.company_address as company_address,
                c.city as company_city,
                c.state as company_state,
                c.country as company_country,
                c.website as company_website,
                c.owner_name as company_owner_name,
                c.incharge_name as company_incharge_name,
                c.incharge_phone as company_incharge_phone
            FROM transaction_invoices ti
            LEFT JOIN quotes q ON ti.quote_id = q.id
            LEFT JOIN users u ON ti.user_id = u.id
            LEFT JOIN users c ON ti.company_id = c.id
            WHERE ti.id = ?
        `;
        
        const [rows] = await db.execute(sql, [id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Transaction invoice not found' });
        }
        
        const invoice = rows[0];
        res.status(200).json(invoice);
    } catch (error) {
        console.error('Error fetching admin transaction invoice details:', error);
        res.status(500).json({ message: 'Server error fetching transaction invoice details' });
    }
};

// ==================== USER MANAGEMENT (Enhanced) ====================

// @desc    Get user with subscription details
// @route   GET /api/admin-panel/users/:id/subscriptions
// @access  Admin
export const getUserSubscriptions = async (req, res) => {
    try {
        const { id } = req.params;
        
        const sql = `
            SELECT 
                us.*,
                mp.name as plan_name,
                mp.price as plan_price,
                mp.duration_months
            FROM user_subscriptions us
            JOIN membership_plans mp ON us.plan_id = mp.id
            WHERE us.user_id = ?
            ORDER BY us.created_at DESC
        `;
        
        const [subscriptions] = await db.execute(sql, [id]);
        res.status(200).json(subscriptions);
    } catch (error) {
        console.error('Error fetching user subscriptions:', error);
        res.status(500).json({ message: 'Server error fetching user subscriptions' });
    }
};

// @desc    Get user quotes
// @route   GET /api/admin-panel/users/:id/quotes
// @access  Admin
export const getUserQuotes = async (req, res) => {
    try {
        const { id } = req.params;
        
        const sql = `
            SELECT 
                q.*,
                COUNT(DISTINCT qr.id) as response_count
            FROM quotes q
            LEFT JOIN quote_responses qr ON q.id = qr.quote_id
            WHERE q.user_id = ?
            GROUP BY q.id
            ORDER BY q.created_at DESC
        `;
        
        const [quotes] = await db.execute(sql, [id]);
        res.status(200).json(quotes);
    } catch (error) {
        console.error('Error fetching user quotes:', error);
        res.status(500).json({ message: 'Server error fetching user quotes' });
    }
};

// @desc    Get company quote responses
// @route   GET /api/admin-panel/companies/:id/responses
// @access  Admin
export const getCompanyResponses = async (req, res) => {
    try {
        const { id } = req.params;
        
        const sql = `
            SELECT 
                qr.*,
                q.product_description,
                q.departure_country,
                q.arrival_country,
                q.status as quote_status,
                u.name as user_name,
                u.email as user_email
            FROM quote_responses qr
            JOIN quotes q ON qr.quote_id = q.id
            LEFT JOIN users u ON q.user_id = u.id
            WHERE qr.company_id = ?
            ORDER BY qr.created_at DESC
        `;
        
        const [responses] = await db.execute(sql, [id]);
        res.status(200).json(responses);
    } catch (error) {
        console.error('Error fetching company responses:', error);
        res.status(500).json({ message: 'Server error fetching company responses' });
    }
};

// ==================== DASHBOARD STATS ====================

// @desc    Get comprehensive admin dashboard statistics
// @route   GET /api/admin-panel/dashboard-stats
// @access  Admin
export const getAdminDashboardStats = async (req, res) => {
    try {
        const stats = {};
        
        // User statistics
        const userStatsSql = `
            SELECT 
                role,
                COUNT(*) as count,
                SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END) as active_count,
                SUM(CASE WHEN is_blacklisted = 1 THEN 1 ELSE 0 END) as blacklisted_count
            FROM users
            WHERE role != 'admin'
            GROUP BY role
        `;
        const [userStats] = await db.execute(userStatsSql);
        stats.users = userStats;
        
        // Quote statistics
        const quoteStatsSql = `
            SELECT 
                status,
                COUNT(*) as count
            FROM quotes
            GROUP BY status
        `;
        const [quoteStats] = await db.execute(quoteStatsSql);
        stats.quotes = quoteStats;
        
        // Subscription statistics
        const subscriptionStatsSql = `
            SELECT 
                status,
                COUNT(*) as count,
                SUM(amount_paid) as total_revenue
            FROM user_subscriptions
            GROUP BY status
        `;
        const [subscriptionStats] = await db.execute(subscriptionStatsSql);
        stats.subscriptions = subscriptionStats;
        
        // Transaction statistics (using accepted quotes since actual transactions aren't created)
        const transactionStatsSql = `
            SELECT 
                'completed' as status,
                COUNT(*) as count,
                SUM(qr.price) as total_amount
            FROM user_quote_status uqs
            JOIN quote_responses qr ON uqs.quote_response_id = qr.id
            WHERE uqs.status = 'accepted'
            UNION ALL
            SELECT 
                status,
                COUNT(*) as count,
                SUM(amount) as total_amount
            FROM transactions
            GROUP BY status
        `;
        const [transactionStats] = await db.execute(transactionStatsSql);
        stats.transactions = transactionStats;

        // Dispute statistics
        const disputeStatsSql = `
            SELECT 
                status,
                COUNT(*) as count,
                AVG(CASE 
                    WHEN priority = 'urgent' THEN 4
                    WHEN priority = 'high' THEN 3
                    WHEN priority = 'medium' THEN 2
                    WHEN priority = 'low' THEN 1
                    ELSE 2
                END) as avg_priority_score
            FROM disputes
            GROUP BY status
        `;
        const [disputeStats] = await db.execute(disputeStatsSql);
        stats.disputes = disputeStats;

        // Monthly revenue data for charts (last 6 months) - including accepted quotes
        const monthlyRevenueSql = `
            SELECT 
                DATE_FORMAT(created_at, '%Y-%m') as month,
                DATE_FORMAT(created_at, '%b %Y') as month_name,
                SUM(CASE WHEN quote_response_id IS NOT NULL THEN amount ELSE 0 END) as quote_revenue,
                SUM(CASE WHEN subscription_id IS NOT NULL THEN amount ELSE 0 END) as subscription_revenue,
                SUM(amount) as total_revenue,
                COUNT(*) as transaction_count
            FROM transactions 
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
            AND status = 'completed'
            GROUP BY DATE_FORMAT(created_at, '%Y-%m'), DATE_FORMAT(created_at, '%b %Y')
            
            UNION ALL
            
            SELECT 
                DATE_FORMAT(uqs.accepted_at, '%Y-%m') as month,
                DATE_FORMAT(uqs.accepted_at, '%b %Y') as month_name,
                SUM(qr.price) as quote_revenue,
                0 as subscription_revenue,
                SUM(qr.price) as total_revenue,
                COUNT(*) as transaction_count
            FROM user_quote_status uqs
            JOIN quote_responses qr ON uqs.quote_response_id = qr.id
            WHERE uqs.accepted_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
            AND uqs.status = 'accepted'
            GROUP BY DATE_FORMAT(uqs.accepted_at, '%Y-%m'), DATE_FORMAT(uqs.accepted_at, '%b %Y')
            
            ORDER BY month ASC
        `;
        const [monthlyRevenue] = await db.execute(monthlyRevenueSql);
        stats.monthlyRevenue = monthlyRevenue;

        // Monthly user growth data (last 6 months)
        const monthlyUserGrowthSql = `
            SELECT 
                DATE_FORMAT(created_at, '%Y-%m') as month,
                DATE_FORMAT(created_at, '%b %Y') as month_name,
                COUNT(*) as new_users,
                SUM(CASE WHEN role = 'user' THEN 1 ELSE 0 END) as new_regular_users,
                SUM(CASE WHEN role = 'company' THEN 1 ELSE 0 END) as new_companies,
                SUM(CASE WHEN role = 'business' THEN 1 ELSE 0 END) as new_businesses
            FROM users 
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
            AND role != 'admin'
            GROUP BY DATE_FORMAT(created_at, '%Y-%m'), DATE_FORMAT(created_at, '%b %Y')
            ORDER BY month ASC
        `;
        const [monthlyUserGrowth] = await db.execute(monthlyUserGrowthSql);
        stats.monthlyUserGrowth = monthlyUserGrowth;

        // Top performing metrics (including accepted quotes as transactions)
        const topMetricsSql = `
            SELECT 
                (SELECT COUNT(*) FROM quotes WHERE status = 'running') as active_quotes,
                (SELECT COUNT(*) FROM user_subscriptions WHERE status = 'active') as active_subscriptions,
                (SELECT COUNT(*) FROM users WHERE status = 1 AND role != 'admin') as active_users,
                (
                    (SELECT COUNT(*) FROM transactions WHERE status = 'completed' AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)) +
                    (SELECT COUNT(*) FROM user_quote_status WHERE status = 'accepted' AND accepted_at >= DATE_SUB(NOW(), INTERVAL 30 DAY))
                ) as monthly_transactions,
                (
                    COALESCE((SELECT AVG(amount) FROM transactions WHERE status = 'completed'), 0) +
                    COALESCE((SELECT AVG(qr.price) FROM user_quote_status uqs JOIN quote_responses qr ON uqs.quote_response_id = qr.id WHERE uqs.status = 'accepted'), 0)
                ) / 2 as avg_transaction_value,
                (SELECT COUNT(*) FROM quotes WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)) as weekly_quotes,
                (SELECT COUNT(*) FROM disputes WHERE status = 'pending') as pending_disputes,
                (SELECT COUNT(*) FROM disputes WHERE status = 'resolved' AND resolved_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)) as monthly_resolved_disputes,
                (SELECT COUNT(*) FROM disputes) as total_disputes
        `;
        const [topMetrics] = await db.execute(topMetricsSql);
        stats.topMetrics = topMetrics[0];

        // Recent activity with more details (simplified)
        const recentActivitySql = `
            SELECT 
                'user_registration' as type,
                name as title,
                email as description,
                created_at,
                role as metadata
            FROM users
            WHERE role != 'admin'
            AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            ORDER BY created_at DESC
            LIMIT 10
        `;
        const [recentActivity] = await db.execute(recentActivitySql);
        stats.recentActivity = recentActivity;

        // Performance metrics (including accepted quotes)
        const performanceMetricsSql = `
            SELECT 
                (SELECT COUNT(*) FROM quotes WHERE status = 'running') / NULLIF((SELECT COUNT(*) FROM quotes), 0) * 100 as quote_success_rate,
                (SELECT COUNT(*) FROM user_subscriptions WHERE status = 'active') / NULLIF((SELECT COUNT(*) FROM users WHERE role != 'admin'), 0) * 100 as subscription_rate,
                (
                    (SELECT COUNT(*) FROM transactions WHERE status = 'completed') +
                    (SELECT COUNT(*) FROM user_quote_status WHERE status = 'accepted')
                ) / NULLIF(
                    (SELECT COUNT(*) FROM transactions) +
                    (SELECT COUNT(*) FROM user_quote_status WHERE status IN ('accepted', 'rejected')), 0
                ) * 100 as transaction_success_rate
        `;
        const [performanceMetrics] = await db.execute(performanceMetricsSql);
        stats.performanceMetrics = performanceMetrics[0];
        
        res.status(200).json(stats);
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ message: 'Server error fetching dashboard stats' });
    }
};

// ==================== FRAUD MANAGEMENT ====================

// @desc    Block/Unblock user (enhanced blacklist)
// @route   PUT /api/admin-panel/users/:id/block
// @access  Admin
export const blockUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { blocked, reason } = req.body;
        
        const sql = `
            UPDATE users 
            SET is_blacklisted = ?, 
                status = ?,
                updated_at = NOW()
            WHERE id = ?
        `;
        
        const [result] = await db.execute(sql, [blocked ? 1 : 0, blocked ? 0 : 1, id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Log the action
        if (blocked && reason) {
            const logSql = `
                INSERT INTO admin_actions (admin_id, action_type, target_user_id, reason, created_at)
                VALUES (?, 'block_user', ?, ?, NOW())
            `;
            await db.execute(logSql, [req.user.id, id, reason]);
        }
        
        res.status(200).json({ 
            message: blocked ? 'User blocked successfully' : 'User unblocked successfully' 
        });
    } catch (error) {
        console.error('Error blocking/unblocking user:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Delete transaction (admin action)
// @route   DELETE /api/admin-panel/transactions/:id
// @access  Admin
export const deleteTransaction = async (req, res) => {
    try {
        const { id } = req.params;
        
        // First check if transaction exists
        const checkSql = 'SELECT id, user_id, amount, status FROM transactions WHERE id = ?';
        const [existingTransaction] = await db.execute(checkSql, [id]);
        
        if (existingTransaction.length === 0) {
            return res.status(404).json({ message: 'Transaction not found' });
        }
        
        // Delete the transaction
        const deleteSql = 'DELETE FROM transactions WHERE id = ?';
        const [result] = await db.execute(deleteSql, [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Transaction not found' });
        }
        
        res.status(200).json({ message: 'Transaction deleted successfully' });
    } catch (error) {
        console.error('Error deleting transaction:', error);
        res.status(500).json({ message: 'Server error deleting transaction' });
    }
};

// @desc    Delete subscription and revert user to basic plan
// @route   DELETE /api/admin-panel/subscriptions/:id
// @access  Admin
export const deleteSubscription = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body; // Get reason from request body
        
        console.log(`🗑️ Attempting to delete subscription ID: ${id}`);
        console.log(`📝 Reason provided: ${reason || 'No reason provided'}`);
        
        // Validate reason is provided
        if (!reason || reason.trim() === '') {
            return res.status(400).json({ message: 'Reason for deletion is required' });
        }
        
        // First, get the subscription details to find the user
        const getSubscriptionSql = `
            SELECT us.*, u.name as user_name, u.email as user_email, u.role as user_role
            FROM user_subscriptions us
            JOIN users u ON us.user_id = u.id
            WHERE us.id = ?
        `;
        const [subscriptionRows] = await db.execute(getSubscriptionSql, [id]);
        
        if (subscriptionRows.length === 0) {
            console.log(`❌ Subscription ID ${id} not found`);
            return res.status(404).json({ message: 'Subscription not found' });
        }
        
        const subscription = subscriptionRows[0];
        console.log(`📋 Found subscription for user: ${subscription.user_name} (${subscription.user_email})`);
        
        // Get a connection for transaction
        const connection = await db.getConnection();
        
        try {
            // Start transaction
            await connection.beginTransaction();
            
            // Check and handle dependencies
            console.log('🔍 Checking for related records...');
            
            // 1. Check for invoices - DON'T DELETE, UPDATE STATUS
            const [invoices] = await connection.execute(
                'SELECT id, invoice_number FROM invoices WHERE subscription_id = ?', 
                [id]
            );
            
            if (invoices.length > 0) {
                console.log(`📄 Found ${invoices.length} related invoices, updating status to cancelled...`);
                
                // First, get the plan and subscription information before we lose the subscription link
                const [subscriptionInfo] = await connection.execute(`
                    SELECT 
                        mp.name as plan_name, 
                        mp.description as plan_description,
                        us.start_date,
                        us.end_date
                    FROM user_subscriptions us
                    JOIN membership_plans mp ON us.plan_id = mp.id
                    WHERE us.id = ?
                `, [id]);
                
                const planName = subscriptionInfo.length > 0 ? subscriptionInfo[0].plan_name : 'Unknown Plan';
                const planDescription = subscriptionInfo.length > 0 ? subscriptionInfo[0].plan_description : 'Plan information unavailable';
                const startDate = subscriptionInfo.length > 0 ? subscriptionInfo[0].start_date : null;
                const endDate = subscriptionInfo.length > 0 ? subscriptionInfo[0].end_date : null;
                
                // Update invoices status to cancelled and add cancellation reason
                // Also store plan and subscription period information directly in the invoice for future reference
                await connection.execute(`
                    UPDATE invoices 
                    SET status = 'cancelled', 
                        cancellation_reason = ?,
                        cancelled_at = NOW(),
                        user_id = ?,
                        plan_name_backup = ?,
                        plan_description_backup = ?,
                        subscription_start_date_backup = ?,
                        subscription_end_date_backup = ?
                    WHERE subscription_id = ?
                `, [reason.trim(), subscription.user_id, planName, planDescription, startDate, endDate, id]);
                
                console.log(`✅ Updated ${invoices.length} invoices to cancelled status with plan and period backup info`);
                
                // Log each cancelled invoice
                invoices.forEach(invoice => {
                    console.log(`  - Invoice ${invoice.invoice_number} (ID: ${invoice.id}) marked as cancelled`);
                });
            }
            
            // 2. Check for transactions - still delete these as they're payment records
            const [transactions] = await connection.execute(
                'SELECT id FROM transactions WHERE subscription_id = ?', 
                [id]
            );
            
            if (transactions.length > 0) {
                console.log(`💳 Found ${transactions.length} related transactions, deleting...`);
                await connection.execute(
                    'DELETE FROM transactions WHERE subscription_id = ?', 
                    [id]
                );
                console.log(`✅ Deleted ${transactions.length} transactions`);
            }
            
            // 3. Delete the subscription
            const deleteSubscriptionSql = 'DELETE FROM user_subscriptions WHERE id = ?';
            const [deleteResult] = await connection.execute(deleteSubscriptionSql, [id]);
            
            if (deleteResult.affectedRows === 0) {
                throw new Error('Failed to delete subscription');
            }
            
            console.log(`✅ Deleted subscription ID: ${id}`);
            
            // COMPLETELY REMOVED: No automatic subscription creation
            // Users get Guest access by default without any subscription record
            // Only paid subscriptions should exist in the database
            console.log(`📝 User ${subscription.user_id} (${subscription.user_name}) now has Guest access by default (no subscription record)`);
            
            // Log the admin action (if admin_actions table exists)
            try {
                const logSql = `
                    INSERT INTO admin_actions (admin_id, action_type, target_user_id, reason, created_at)
                    VALUES (?, 'delete_subscription', ?, ?, NOW())
                `;
                await connection.execute(logSql, [
                    req.user?.id || 1, // Use 1 as fallback if req.user.id is undefined
                    subscription.user_id, 
                    `Deleted subscription ID ${id}: ${reason.trim()}`
                ]);
            } catch (logError) {
                console.log('⚠️ Could not log admin action (table may not exist):', logError.message);
            }
            
            // Commit transaction
            await connection.commit();
            
            console.log(`🎉 Successfully deleted subscription and updated related records. User now has Guest access by default.`);
            
            // Send email notifications after successful deletion
            try {
                console.log('📧 Sending subscription deletion email notifications...');
                
                // Get plan details for email
                const [planDetails] = await db.execute(`
                    SELECT mp.name as plan_name, mp.price as plan_price, mp.duration_months
                    FROM membership_plans mp 
                    WHERE mp.id = ?
                `, [subscription.plan_id]);
                
                const planInfo = planDetails.length > 0 ? planDetails[0] : {};
                
                // Format dates for email
                const formatDate = (dateString) => {
                    if (!dateString) return 'N/A';
                    return new Date(dateString).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    });
                };
                
                // Prepare email data
                const emailData = {
                    subscriptionId: id,
                    userName: subscription.user_name,
                    userEmail: subscription.user_email,
                    userRole: subscription.user_role,
                    userId: subscription.user_id,
                    planName: planInfo.plan_name || 'Unknown Plan',
                    planPrice: planInfo.plan_price || subscription.plan_price,
                    durationMonths: planInfo.duration_months || subscription.duration_months,
                    startDate: formatDate(subscription.start_date),
                    endDate: formatDate(subscription.end_date),
                    amountPaid: subscription.amount_paid,
                    paymentStatus: subscription.payment_status,
                    status: subscription.status,
                    reason: reason.trim(),
                    cancelledAt: new Date().toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    }),
                    cancelledInvoices: invoices.length,
                    deletedTransactions: transactions.length
                };
                
                // Import email queue functions
                const { queueSubscriptionEmails } = await import('../services/emailQueue.js');
                
                // Send email to the user (company member)
                queueSubscriptionEmails.subscriptionDeletionToUser({
                    ...emailData,
                    recipientEmail: subscription.user_email
                }).then(jobId => {
                    console.log(`✅ Subscription deletion user email queued (Job ID: ${jobId})`);
                }).catch(error => {
                    console.error('❌ Failed to queue subscription deletion user email:', error);
                });
                
                // Send email to all admin users
                const [adminUsers] = await db.execute(`
                    SELECT email FROM users WHERE role = 'admin' AND email IS NOT NULL
                `);
                
                console.log(`📧 Sending subscription deletion notifications to ${adminUsers.length} admin(s)`);
                
                for (const admin of adminUsers) {
                    queueSubscriptionEmails.subscriptionDeletionToAdmin({
                        ...emailData,
                        recipientEmail: admin.email
                    }).then(jobId => {
                        console.log(`✅ Subscription deletion admin email queued for ${admin.email} (Job ID: ${jobId})`);
                    }).catch(error => {
                        console.error(`❌ Failed to queue subscription deletion admin email for ${admin.email}:`, error);
                    });
                }
                
            } catch (emailError) {
                console.error('❌ Error sending subscription deletion emails:', emailError);
                // Don't fail the deletion if emails fail
            }
            
            res.status(200).json({ 
                message: 'Subscription deleted successfully. Related invoices have been marked as cancelled.',
                cancelledInvoices: invoices.length,
                deletedTransactions: transactions.length,
                reason: reason.trim()
            });
            
        } catch (error) {
            // Rollback transaction on error
            await connection.rollback();
            throw error;
        } finally {
            // Release connection
            connection.release();
        }
        
    } catch (error) {
        console.error('❌ Error deleting subscription:', error);
        res.status(500).json({ message: 'Server error deleting subscription' });
    }
};

// @desc    Delete user account (permanent)
// @route   DELETE /api/admin-panel/users/:id
// @access  Admin
export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        
        // Log the deletion before deleting
        const logSql = `
            INSERT INTO admin_actions (admin_id, action_type, target_user_id, reason, created_at)
            VALUES (?, 'delete_user', ?, ?, NOW())
        `;
        await db.execute(logSql, [req.user.id, id, reason || 'No reason provided']);
        
        // Delete user (cascading will handle related records)
        const sql = 'DELETE FROM users WHERE id = ? AND role != "admin"';
        const [result] = await db.execute(sql, [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found or cannot delete admin' });
        }
        
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Server error deleting user' });
    }
};

// @desc    Activate/Approve user account (for company approvals)
// @route   PUT /api/admin-panel/users/:id/activate
// @access  Admin
export const activateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        
        // Get user details before activation
        const [userRows] = await db.execute('SELECT * FROM users WHERE id = ?', [id]);
        
        if (userRows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        const user = userRows[0];
        
        // Update user status to active
        const sql = `
            UPDATE users 
            SET status = 1, 
                updated_at = NOW()
            WHERE id = ?
        `;
        
        const [result] = await db.execute(sql, [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Log the activation action
        const logSql = `
            INSERT INTO admin_actions (admin_id, action_type, target_user_id, reason, created_at)
            VALUES (?, 'activate_user', ?, ?, NOW())
        `;
        await db.execute(logSql, [req.user.id, id, reason || 'User account activated']);
        
        // 🚀 QUEUE COMPANY APPROVAL EMAIL (NON-BLOCKING)
        if (user.role === 'company') {
            console.log(`🔔 User role is company, queuing approval email for: ${user.name} (${user.email})`);
            
            try {
                const { queueSubscriptionEmails } = await import('../services/emailQueue.js');
                
                console.log('📧 Attempting to queue company approval email...');
                const jobId = await queueSubscriptionEmails.companyApproval({
                    userId: user.id,
                    userName: user.name,
                    userEmail: user.email
                });
                
                console.log(`✅ Company approval email queued successfully (Job ID: ${jobId})`);
                
                // Also send admin notification about the approval
                console.log('📧 Queuing admin notification for company approval...');
                const adminJobId = await queueSubscriptionEmails.adminCompanyApprovalNotification({
                    userId: user.id,
                    userName: user.name,
                    userEmail: user.email,
                    userPhone: user.phone || 'Not provided'
                });
                
                console.log(`✅ Admin notification for company approval queued (Job ID: ${adminJobId})`);
                
            } catch (error) {
                console.error('❌ Failed to queue company approval email:', error);
                console.error('❌ Error details:', error.stack);
            }
        } else {
            console.log(`ℹ️ User role is ${user.role}, not queuing company approval email`);
        }
        
        res.status(200).json({ 
            message: `User ${user.role === 'company' ? 'company' : 'account'} activated successfully`,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                status: 1
            }
        });
    } catch (error) {
        console.error('Error activating user:', error);
        res.status(500).json({ message: 'Server error activating user' });
    }
};

export default {
    getAllSubscriptionsAdmin,
    getSubscriptionById,
    deleteSubscription,
    getAllTransactions,
    getAcceptedQuoteTransactions,
    getAllQuotesAdmin,
    getQuoteByIdAdmin,
    deleteQuote,
    updateQuoteStatusAdmin,
    getAllInvoicesAdmin,
    getInvoiceByIdAdmin,
    getAllTransactionInvoicesAdmin,
    getTransactionInvoiceByIdAdmin,
    getUserSubscriptions,
    getUserQuotes,
    getCompanyResponses,
    getAdminDashboardStats,
    blockUser,
    deleteUser,
    activateUser,
    deleteTransaction
};
