// controllers/companyQuoteController.js
import db from '../config/db.js';
import { sendStatusUpdateNotification } from '../services/emailService.js';
import { 
    sendQuoteAcceptanceNotificationToAdmin,
    sendQuoteRejectionNotificationToAdmin 
} from '../services/adminNotificationService.js';

// @desc    Get company's quote responses
// @route   GET /api/company-quotes/my-responses
// @access  Private/Company
const getMyQuoteResponses = async (req, res) => {
    const companyId = req.user.id;

    try {
        const sql = `
            SELECT qr.*, q.product_description, q.departure_country, q.arrival_country,
                   q.shipping_mode, q.arrival_date, q.status as quote_status,
                   u.name as user_name, u.email as user_email,
                   uqs.status as user_response_status
            FROM quote_responses qr
            JOIN quotes q ON qr.quote_id = q.id
            LEFT JOIN users u ON q.user_id = u.id
            LEFT JOIN user_quote_status uqs ON (qr.id = uqs.quote_response_id AND uqs.user_id = q.user_id)
            WHERE qr.company_id = ?
            ORDER BY qr.created_at DESC
        `;

        const [rows] = await db.execute(sql, [companyId]);
        res.status(200).json(rows);

    } catch (error) {
        console.error('Error fetching company quote responses:', error);
        res.status(500).json({ message: 'Server error fetching quote responses' });
    }
};

// @desc    Update quote response status (Company can update their response status)
// @route   PUT /api/company-quotes/response/:responseId/status
// @access  Private/Company
const updateResponseStatus = async (req, res) => {
    const { responseId } = req.params;
    const { status } = req.body;
    const companyId = req.user.id;

    const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid status. Valid statuses: pending, in_progress, completed, cancelled' });
    }

    try {
        // Verify the response belongs to the company
        const [responseRows] = await db.execute(`
            SELECT qr.*, q.user_id, u.name as user_name, u.email as user_email, u.role as user_role
            FROM quote_responses qr
            JOIN quotes q ON qr.quote_id = q.id
            LEFT JOIN users u ON q.user_id = u.id
            WHERE qr.id = ? AND qr.company_id = ?
        `, [responseId, companyId]);

        if (responseRows.length === 0) {
            return res.status(404).json({ message: 'Quote response not found or access denied' });
        }

        const response = responseRows[0];

        // Update response status
        await db.execute(
            'UPDATE quote_responses SET status = ?, updated_at = NOW() WHERE id = ?',
            [status, responseId]
        );

        // Create a message for the user if they are registered
        if (response.user_id) {
            const [companyDetails] = await db.execute(
                'SELECT name FROM users WHERE id = ?',
                [companyId]
            );

            const messageText = `Status update for your quote response (Quote #${response.quote_id}):

Status: ${status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}

We will keep you updated on the progress.`;

            await db.execute(`
                INSERT INTO messages (sender_id, receiver_id, subject, message, quote_id, created_at)
                VALUES (?, ?, ?, ?, ?, NOW())
            `, [
                companyId,
                response.user_id,
                `Status Update - Quote #${response.quote_id}`,
                messageText,
                response.quote_id
            ]);

            // Send email notification
            if (response.user_email) {
                await sendStatusUpdateNotification(
                    response.user_email,
                    response.user_name,
                    response.quote_id,
                    status
                );
            }

            // Create admin notification for response status change
            try {
                const companyName = companyDetails.length > 0 ? companyDetails[0].name : 'Company';
                const userType = response.user_role === 'business' ? 'business user' : 
                               response.user_role === 'company' ? 'company user' : 'user';
                
                // Format status names properly
                const formatStatus = (status) => {
                    return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
                };
                
                const title = `Response Status Update - Quote #${response.quote_id}`;
                
                // Simple preview message for the notification list
                const previewMessage = `${companyName} has updated their response status to "${formatStatus(status)}" for Quote #${response.quote_id} (${userType}: ${response.user_name})`;
                
                // Detailed formatted message for the modal
                const detailedMessage = `${previewMessage}

🔄 Quote Response Status Details:

🏢 Company: ${companyName}
📄 Quote ID: #${response.quote_id}
👤 ${userType === 'business user' ? 'Business User' : userType === 'company user' ? 'Company User' : 'User'}: ${response.user_name}

📊 Response Status: ${formatStatus(status)}

⏰ Updated: ${new Date().toLocaleString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric',
                    hour: 'numeric', 
                    minute: '2-digit',
                    hour12: true 
                })}`;
                
                await db.execute(`
                    INSERT INTO admin_notifications (type, title, message, user_id, created_at, is_read)
                    VALUES (?, ?, ?, ?, NOW(), 0)
                `, [
                    'quote',
                    title,
                    detailedMessage,
                    response.user_id
                ]);
                
                console.log(`✅ Admin notification created for response status update: ${response.quote_id}`);
            } catch (notificationError) {
                console.error('❌ Error creating admin notification:', notificationError);
                // Don't fail the whole operation if notification fails
            }
        }

        res.status(200).json({ message: 'Response status updated successfully' });

    } catch (error) {
        console.error('Error updating response status:', error);
        res.status(500).json({ message: 'Server error updating response status' });
    }
};

// @desc    Update quote status (Company can update quote status for quotes they responded to)
// @route   PUT /api/company-quotes/quote/:quoteId/status
// @access  Private/Company
const updateQuoteStatus = async (req, res) => {
    console.log('🔍 [DEBUG] updateQuoteStatus called');
    console.log('🔍 [DEBUG] Request params:', req.params);
    console.log('🔍 [DEBUG] Request body:', req.body);
    console.log('🔍 [DEBUG] User:', req.user);
    
    const { quoteId } = req.params;
    const { status } = req.body;
    const companyId = req.user.id;

    const validStatuses = ['pending', 'approved', 'rejected', 'running', 'closed'];
    if (!validStatuses.includes(status)) {
        console.log('❌ [DEBUG] Invalid status:', status);
        return res.status(400).json({ message: 'Invalid status. Valid statuses: pending, approved, rejected, running, closed' });
    }

    try {
        console.log('🔍 [DEBUG] Checking if company has responded to quote...');
        // Verify the company has responded to this quote
        const [responseRows] = await db.execute(`
            SELECT qr.id, q.user_id, u.name as user_name, u.email as user_email, u.role as user_role, q.status as current_status
            FROM quote_responses qr
            JOIN quotes q ON qr.quote_id = q.id
            LEFT JOIN users u ON q.user_id = u.id
            WHERE q.id = ? AND qr.company_id = ?
        `, [quoteId, companyId]);

        console.log('🔍 [DEBUG] Response rows found:', responseRows.length);

        if (responseRows.length === 0) {
            console.log('❌ [DEBUG] Quote not found or company has not responded');
            return res.status(404).json({ message: 'Quote not found or you have not responded to this quote' });
        }

        const quoteInfo = responseRows[0];
        console.log('✅ [DEBUG] Quote found, updating status...');

        // Update quote status
        await db.execute(
            'UPDATE quotes SET status = ?, updated_at = NOW() WHERE id = ?',
            [status, quoteId]
        );

        console.log('✅ [DEBUG] Quote status updated successfully');

        // Get company details
        const [companyDetails] = await db.execute(
            'SELECT name, email, phone FROM users WHERE id = ?',
            [companyId]
        );

        // Send message to user if they are registered
        if (quoteInfo.user_id && companyDetails.length > 0) {
            const company = companyDetails[0];
            const messageText = `Your quote #${quoteId} status has been updated by ${company.name}.

New Status: ${status.charAt(0).toUpperCase() + status.slice(1)}

Company Details:
- Name: ${company.name}
- Email: ${company.email}
${company.phone ? `- Phone: ${company.phone}` : ''}

We will contact you shortly for further details.`;

            await db.execute(`
                INSERT INTO messages (sender_id, receiver_id, subject, message, quote_id, created_at)
                VALUES (?, ?, ?, ?, ?, NOW())
            `, [
                companyId,
                quoteInfo.user_id,
                `Quote Status Updated - Quote #${quoteId}`,
                messageText,
                quoteId
            ]);

            // Send email notification to user
            if (quoteInfo.user_email) {
                // Get complete quote details for email
                const [quoteDetailsRows] = await db.execute(
                    `SELECT 
                        departure_country, departure_state, departure_city, departure_type,
                        arrival_country, arrival_state, arrival_city, arrival_type,
                        product_description, weight, quantity, shipping_mode, arrival_date,
                        packing, incoterms, type, length, width, height, dimension_unit,
                        is_stackable, is_hazardous, has_insurance, notes
                     FROM quotes WHERE id = ?`,
                    [quoteId]
                );
                
                const quoteDetails = quoteDetailsRows.length > 0 ? {
                    origin: `${quoteDetailsRows[0].departure_city || quoteDetailsRows[0].departure_country}`,
                    destination: `${quoteDetailsRows[0].arrival_city || quoteDetailsRows[0].arrival_country}`,
                    fullOrigin: `${quoteDetailsRows[0].departure_city ? quoteDetailsRows[0].departure_city + ', ' : ''}${quoteDetailsRows[0].departure_state ? quoteDetailsRows[0].departure_state + ', ' : ''}${quoteDetailsRows[0].departure_country}`,
                    fullDestination: `${quoteDetailsRows[0].arrival_city ? quoteDetailsRows[0].arrival_city + ', ' : ''}${quoteDetailsRows[0].arrival_state ? quoteDetailsRows[0].arrival_state + ', ' : ''}${quoteDetailsRows[0].arrival_country}`,
                    cargo_type: quoteDetailsRows[0].product_description, // This is the product description
                    product_description: quoteDetailsRows[0].product_description,
                    weight: quoteDetailsRows[0].weight,
                    quantity: quoteDetailsRows[0].quantity,
                    shipping_mode: quoteDetailsRows[0].shipping_mode,
                    arrival_date: quoteDetailsRows[0].arrival_date,
                    packing: quoteDetailsRows[0].packing,
                    incoterms: quoteDetailsRows[0].incoterms,
                    type: quoteDetailsRows[0].type,
                    dimensions: quoteDetailsRows[0].length && quoteDetailsRows[0].width && quoteDetailsRows[0].height ? 
                        `${quoteDetailsRows[0].length} x ${quoteDetailsRows[0].width} x ${quoteDetailsRows[0].height} ${quoteDetailsRows[0].dimension_unit || 'cm'}` : null,
                    is_stackable: quoteDetailsRows[0].is_stackable,
                    is_hazardous: quoteDetailsRows[0].is_hazardous,
                    has_insurance: quoteDetailsRows[0].has_insurance,
                    notes: quoteDetailsRows[0].notes
                } : null;
                
                await sendStatusUpdateNotification(
                    quoteInfo.user_email,
                    quoteInfo.user_name,
                    quoteId,
                    status,
                    company.name,
                    quoteDetails
                );
            }

            // Create business notification if the user is a business user
            if (quoteInfo.user_role === 'business') {
                try {
                    const title = '📊 Quote Status Update';
                    const message = `Your quote #${quoteId} status has been updated to "${status.charAt(0).toUpperCase() + status.slice(1)}" by ${company.name}. Check your quotes for more details.`;
                    
                    // Create notification for businesses
                    const [notificationResult] = await db.execute(`
                        INSERT INTO notifications (target_role, title, message, target_audience, created_at)
                        VALUES (?, ?, ?, ?, NOW())
                    `, ['user_specific', title, message, 'businesses']);
                    
                    const notificationId = notificationResult.insertId;
                    
                    // Create user-specific notification record for the business user
                    await db.execute(`
                        INSERT INTO user_notifications (user_id, notification_id, is_read)
                        VALUES (?, ?, 0)
                    `, [quoteInfo.user_id, notificationId]);
                    
                    console.log(`✅ Business notification created for user ${quoteInfo.user_id} for quote status update: ${quoteId}`);
                } catch (businessNotificationError) {
                    console.error('❌ Error creating business notification:', businessNotificationError);
                    // Don't fail the whole operation if notification fails
                }
            }

            // Create admin notification for quote status change
            try {
                const userType = quoteInfo.user_role === 'business' ? 'business user' : 
                               quoteInfo.user_role === 'company' ? 'company user' : 'user';
                
                // Format status names properly
                const formatStatus = (status) => {
                    return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
                };
                
                const title = `Quote Status Update - #${quoteId}`;
                
                // Simple preview message for the notification list
                const previewMessage = `${company.name} has updated Quote #${quoteId} status from "${formatStatus(quoteInfo.current_status)}" to "${formatStatus(status)}" for ${userType} ${quoteInfo.user_name}`;
                
                // Detailed formatted message for the modal
                const detailedMessage = `${previewMessage}

📋 Quote Status Change Details:

🏢 Company: ${company.name}
📄 Quote ID: #${quoteId}
👤 ${userType === 'business user' ? 'Business User' : userType === 'company user' ? 'Company User' : 'User'}: ${quoteInfo.user_name}

📊 Status Update:
   • From: ${formatStatus(quoteInfo.current_status)}
   • To: ${formatStatus(status)}

⏰ Updated: ${new Date().toLocaleString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric',
                    hour: 'numeric', 
                    minute: '2-digit',
                    hour12: true 
                })}`;
                
                await db.execute(`
                    INSERT INTO admin_notifications (type, title, message, user_id, created_at, is_read)
                    VALUES (?, ?, ?, ?, NOW(), 0)
                `, [
                    'quote',
                    title,
                    detailedMessage,
                    quoteInfo.user_id
                ]);
                
                console.log(`✅ Admin notification created for quote status update: ${quoteId}`);
            } catch (notificationError) {
                console.error('❌ Error creating admin notification:', notificationError);
                // Don't fail the whole operation if notification fails
            }
        }

        res.status(200).json({ message: 'Quote status updated successfully' });

    } catch (error) {
        console.error('Error updating quote status:', error);
        res.status(500).json({ message: 'Server error updating quote status' });
    }
};

// @desc    Get quotes where company's responses have been accepted
// @route   GET /api/company-quotes/accepted-quotes
// @access  Private/Company
const getAcceptedQuotes = async (req, res) => {
    const companyId = req.user.id;

    try {
        const sql = `
            SELECT q.*, 
                   qr.price, qr.transit_time, qr.created_at as response_date,
                   uqs.accepted_at, uqs.status as user_response_status,
                   u.id as user_id, u.name as user_name, u.email as user_email, u.phone as user_phone,
                   COUNT(qr2.id) as total_responses,
                   pp.id as payment_proof_id,
                   pp.file_path as payment_proof_url,
                   pp.upload_date as payment_proof_date,
                   pv.id as payment_verification_id,
                   pv.verification_status as payment_status,
                   pv.verification_date,
                   pv.company_notes as payment_notes,
                   CASE WHEN pp.id IS NOT NULL THEN 1 ELSE 0 END as has_payment_proof
            FROM quotes q
            JOIN quote_responses qr ON q.id = qr.quote_id
            LEFT JOIN user_quote_status uqs ON qr.id = uqs.quote_response_id
            LEFT JOIN users u ON q.user_id = u.id
            LEFT JOIN quote_responses qr2 ON q.id = qr2.quote_id
            LEFT JOIN payment_proofs pp ON (uqs.payment_proof_id = pp.id AND pp.company_id = qr.company_id)
            LEFT JOIN payment_verifications pv ON (pp.id = pv.payment_proof_id AND pv.company_id = qr.company_id)
            WHERE qr.company_id = ? 
            AND (
                uqs.status = 'accepted' 
                OR (q.status = 'approved' AND pv.verification_status = 'verified' AND pv.company_id = qr.company_id)
                OR (q.status = 'approved' AND pp.company_id = qr.company_id)
            )
            GROUP BY q.id, qr.id, uqs.id, pp.id, pv.id
            ORDER BY 
                CASE 
                    WHEN uqs.accepted_at IS NOT NULL THEN uqs.accepted_at 
                    WHEN pv.verification_date IS NOT NULL THEN pv.verification_date
                    ELSE qr.created_at 
                END DESC
        `;

        const [rows] = await db.execute(sql, [companyId]);
        res.status(200).json(rows);

    } catch (error) {
        console.error('Error fetching accepted quotes:', error);
        res.status(500).json({ message: 'Server error fetching accepted quotes' });
    }
};

// @desc    Get all responses for a quote where company has been accepted or approved
// @route   GET /api/company-quotes/quote/:quoteId/responses
// @access  Private/Company
const getQuoteResponsesForCompany = async (req, res) => {
    const { quoteId } = req.params;
    const companyId = req.user.id;

    try {
        // Verify the company has an accepted response OR approved quote through payment verification
        const [accessCheck] = await db.execute(`
            SELECT qr.id
            FROM quote_responses qr
            LEFT JOIN user_quote_status uqs ON qr.id = uqs.quote_response_id
            LEFT JOIN quotes q ON qr.quote_id = q.id
            LEFT JOIN payment_proofs pp ON (uqs.payment_proof_id = pp.id AND pp.company_id = qr.company_id)
            LEFT JOIN payment_verifications pv ON (pp.id = pv.payment_proof_id AND pv.company_id = qr.company_id)
            WHERE qr.quote_id = ? AND qr.company_id = ?
            AND (
                uqs.status = 'accepted'
                OR (q.status = 'approved' AND pv.verification_status = 'verified')
                OR (q.status = 'approved' AND pp.company_id = qr.company_id)
            )
        `, [quoteId, companyId]);

        if (accessCheck.length === 0) {
            return res.status(403).json({ message: 'Access denied. You do not have an accepted or approved response for this quote.' });
        }

        // Get all responses for this quote
        const sql = `
            SELECT qr.*, u.name as company_name, u.email as company_email, u.logo as company_logo,
                   uqs.status as user_response_status, uqs.accepted_at
            FROM quote_responses qr
            JOIN users u ON qr.company_id = u.id
            LEFT JOIN user_quote_status uqs ON qr.id = uqs.quote_response_id
            WHERE qr.quote_id = ?
            ORDER BY qr.price ASC
        `;

        const [rows] = await db.execute(sql, [quoteId]);
        res.status(200).json(rows);

    } catch (error) {
        console.error('Error fetching quote responses for company:', error);
        res.status(500).json({ message: 'Server error fetching quote responses' });
    }
};

// @desc    Get company transaction history
// @route   GET /api/company/transactions
// @access  Private/Company
const getCompanyTransactions = async (req, res) => {
    const companyId = req.user.id;

    try {
        const sql = `
            SELECT 
                us.id,
                us.created_at as transaction_date,
                us.amount_paid,
                us.payment_status,
                us.payment_method,
                us.start_date,
                us.end_date,
                mp.name as plan_name,
                mp.description as plan_description,
                u.name as company_name
            FROM user_subscriptions us
            JOIN membership_plans mp ON us.plan_id = mp.id
            JOIN users u ON us.user_id = u.id
            WHERE us.user_id = ?
            ORDER BY us.created_at DESC
        `;

        const [rows] = await db.execute(sql, [companyId]);
        res.status(200).json(rows);

    } catch (error) {
        console.error('Error fetching company transactions:', error);
        res.status(500).json({ message: 'Server error fetching transactions' });
    }
};

export {
    getMyQuoteResponses,
    updateResponseStatus,
    updateQuoteStatus,
    getAcceptedQuotes,
    getQuoteResponsesForCompany,
    getCompanyTransactions
};