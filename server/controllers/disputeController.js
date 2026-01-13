import db from '../config/db.js';
import { 
    sendDisputeStatusUpdateNotificationToUser, 
    sendDisputeResponseNotificationToUser 
} from '../services/notificationService.js';

// ==================== DISPUTE REASONS MANAGEMENT ====================

// @desc    Get all dispute reasons
// @route   GET /api/disputes/reasons
// @access  Public (for dropdown in forms)
export const getAllDisputeReasons = async (req, res) => {
    try {
        const sql = `
            SELECT id, title, description, is_active, created_at
            FROM dispute_reasons 
            WHERE is_active = TRUE
            ORDER BY title ASC
        `;
        const [reasons] = await db.execute(sql);
        res.status(200).json(reasons);
    } catch (error) {
        console.error('Error fetching dispute reasons:', error);
        res.status(500).json({ message: 'Server error fetching dispute reasons' });
    }
};

// @desc    Get all dispute reasons (Admin)
// @route   GET /api/disputes/admin/reasons
// @access  Private/Admin
export const getAdminDisputeReasons = async (req, res) => {
    try {
        const sql = `
            SELECT id, title, description, is_active, created_at, updated_at
            FROM dispute_reasons 
            ORDER BY created_at DESC
        `;
        const [reasons] = await db.execute(sql);
        res.status(200).json(reasons);
    } catch (error) {
        console.error('Error fetching admin dispute reasons:', error);
        res.status(500).json({ message: 'Server error fetching dispute reasons' });
    }
};

// @desc    Create new dispute reason
// @route   POST /api/disputes/admin/reasons
// @access  Private/Admin
export const createDisputeReason = async (req, res) => {
    try {
        const { title, description } = req.body;

        if (!title) {
            return res.status(400).json({ message: 'Title is required' });
        }

        const sql = `
            INSERT INTO dispute_reasons (title, description)
            VALUES (?, ?)
        `;
        const [result] = await db.execute(sql, [title, description || null]);

        res.status(201).json({
            message: 'Dispute reason created successfully',
            id: result.insertId
        });
    } catch (error) {
        console.error('Error creating dispute reason:', error);
        res.status(500).json({ message: 'Server error creating dispute reason' });
    }
};

// @desc    Update dispute reason
// @route   PUT /api/disputes/admin/reasons/:id
// @access  Private/Admin
export const updateDisputeReason = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, is_active } = req.body;

        const sql = `
            UPDATE dispute_reasons 
            SET title = ?, description = ?, is_active = ?
            WHERE id = ?
        `;
        const [result] = await db.execute(sql, [title, description, is_active, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Dispute reason not found' });
        }

        res.status(200).json({ message: 'Dispute reason updated successfully' });
    } catch (error) {
        console.error('Error updating dispute reason:', error);
        res.status(500).json({ message: 'Server error updating dispute reason' });
    }
};

// @desc    Delete dispute reason
// @route   DELETE /api/disputes/admin/reasons/:id
// @access  Private/Admin
export const deleteDisputeReason = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if reason is being used in any disputes
        const checkSql = `SELECT COUNT(*) as count FROM disputes WHERE dispute_reason_id = ?`;
        const [checkResult] = await db.execute(checkSql, [id]);

        if (checkResult[0].count > 0) {
            return res.status(400).json({ 
                message: 'Cannot delete dispute reason as it is being used in existing disputes' 
            });
        }

        const sql = `DELETE FROM dispute_reasons WHERE id = ?`;
        const [result] = await db.execute(sql, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Dispute reason not found' });
        }

        res.status(200).json({ message: 'Dispute reason deleted successfully' });
    } catch (error) {
        console.error('Error deleting dispute reason:', error);
        res.status(500).json({ message: 'Server error deleting dispute reason' });
    }
};

// ==================== DISPUTES MANAGEMENT ====================

// @desc    Get all disputes (Admin)
// @route   GET /api/disputes/admin/all
// @access  Private/Admin
export const getAllDisputes = async (req, res) => {
    try {
        const sql = `
            SELECT 
                d.id,
                d.title,
                d.description,
                d.status,
                d.priority,
                d.admin_response,
                d.resolution_notes,
                d.resolved_at,
                d.created_at,
                d.updated_at,
                d.user_id,
                d.company_id,
                u.name as user_name,
                u.email as user_email,
                u.role as user_role,
                c.name as company_name,
                c.email as company_email,
                c.role as company_role,
                dr.title as reason_title,
                q.id as quote_id,
                t.id as transaction_id,
                resolver.name as resolved_by_name
            FROM disputes d
            JOIN users u ON d.user_id = u.id
            JOIN users c ON d.company_id = c.id
            JOIN dispute_reasons dr ON d.dispute_reason_id = dr.id
            LEFT JOIN quotes q ON d.quote_id = q.id
            LEFT JOIN transactions t ON d.transaction_id = t.id
            LEFT JOIN users resolver ON d.resolved_by = resolver.id
            ORDER BY d.created_at DESC
        `;
        const [disputes] = await db.execute(sql);

        // Get images for each dispute
        for (let dispute of disputes) {
            const imagesSql = `
                SELECT id, image_url, image_type, uploaded_by, created_at
                FROM dispute_images 
                WHERE dispute_id = ?
                ORDER BY created_at ASC
            `;
            const [images] = await db.execute(imagesSql, [dispute.id]);
            dispute.images = images;
        }

        res.status(200).json(disputes);
    } catch (error) {
        console.error('Error fetching disputes:', error);
        res.status(500).json({ message: 'Server error fetching disputes' });
    }
};

// @desc    Get dispute by ID with full details
// @route   GET /api/disputes/admin/:id
// @access  Private/Admin
export const getDisputeById = async (req, res) => {
    try {
        const { id } = req.params;

        const sql = `
            SELECT 
                d.*,
                u.name as user_name,
                u.email as user_email,
                u.phone as user_phone,
                c.name as company_name,
                c.email as company_email,
                c.phone as company_phone,
                dr.title as reason_title,
                dr.description as reason_description,
                q.product_description as quote_description,
                t.amount as transaction_amount,
                resolver.name as resolved_by_name
            FROM disputes d
            JOIN users u ON d.user_id = u.id
            JOIN users c ON d.company_id = c.id
            JOIN dispute_reasons dr ON d.dispute_reason_id = dr.id
            LEFT JOIN quotes q ON d.quote_id = q.id
            LEFT JOIN transactions t ON d.transaction_id = t.id
            LEFT JOIN users resolver ON d.resolved_by = resolver.id
            WHERE d.id = ?
        `;
        const [disputes] = await db.execute(sql, [id]);

        if (disputes.length === 0) {
            return res.status(404).json({ message: 'Dispute not found' });
        }

        const dispute = disputes[0];

        // Get images
        const imagesSql = `
            SELECT id, image_url, image_type, uploaded_by, created_at
            FROM dispute_images 
            WHERE dispute_id = ?
            ORDER BY created_at ASC
        `;
        const [images] = await db.execute(imagesSql, [id]);
        dispute.images = images;

        // Get messages
        const messagesSql = `
            SELECT 
                dm.*,
                u.name as sender_name,
                u.email as sender_email
            FROM dispute_messages dm
            JOIN users u ON dm.sender_id = u.id
            WHERE dm.dispute_id = ?
            ORDER BY dm.created_at ASC
        `;
        const [messages] = await db.execute(messagesSql, [id]);
        dispute.messages = messages;

        res.status(200).json(dispute);
    } catch (error) {
        console.error('Error fetching dispute details:', error);
        res.status(500).json({ message: 'Server error fetching dispute details' });
    }
};

// @desc    Update dispute status
// @route   PUT /api/disputes/admin/:id/status
// @access  Private/Admin
export const updateDisputeStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, admin_response, resolution_notes } = req.body;
        const adminId = req.user.id;

        let sql, params;

        if (status === 'resolved' || status === 'closed') {
            sql = `
                UPDATE disputes 
                SET status = ?, admin_response = ?, resolution_notes = ?, 
                    resolved_by = ?, resolved_at = NOW()
                WHERE id = ?
            `;
            params = [status, admin_response, resolution_notes, adminId, id];
        } else {
            sql = `
                UPDATE disputes 
                SET status = ?, admin_response = ?
                WHERE id = ?
            `;
            params = [status, admin_response, id];
        }

        const [result] = await db.execute(sql, params);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Dispute not found' });
        }

        res.status(200).json({ message: 'Dispute status updated successfully' });
    } catch (error) {
        console.error('Error updating dispute status:', error);
        res.status(500).json({ message: 'Server error updating dispute status' });
    }
};

// @desc    Delete dispute
// @route   DELETE /api/disputes/admin/:id
// @access  Private/Admin
export const deleteDispute = async (req, res) => {
    try {
        const { id } = req.params;

        const sql = `DELETE FROM disputes WHERE id = ?`;
        const [result] = await db.execute(sql, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Dispute not found' });
        }

        res.status(200).json({ message: 'Dispute deleted successfully' });
    } catch (error) {
        console.error('Error deleting dispute:', error);
        res.status(500).json({ message: 'Server error deleting dispute' });
    }
};

// @desc    Create new dispute (User/Company)
// @route   POST /api/disputes/create
// @access  Private
export const createDispute = async (req, res) => {
    try {
        console.log('🔍 CREATE DISPUTE - Request received');
        console.log('👤 User:', req.user);
        console.log('📋 Request body:', req.body);
        
        const { 
            company_id, 
            quote_id, 
            transaction_id, 
            dispute_reason_id, 
            title, 
            description,
            priority = 'medium',
            images 
        } = req.body;
        const user_id = req.user.id;

        console.log('📊 Parsed data:', {
            user_id,
            company_id,
            dispute_reason_id,
            title,
            description,
            priority
        });

        if (!company_id || !dispute_reason_id || !title || !description) {
            console.log('❌ Missing required fields');
            return res.status(400).json({ 
                message: 'Company, dispute reason, title, and description are required' 
            });
        }

        console.log('💾 Inserting dispute into database...');
        const sql = `
            INSERT INTO disputes (
                user_id, company_id, quote_id, transaction_id, 
                dispute_reason_id, title, description, priority
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const [result] = await db.execute(sql, [
            user_id, company_id, quote_id || null, transaction_id || null,
            dispute_reason_id, title, description, priority
        ]);

        const disputeId = result.insertId;
        console.log('✅ Dispute created with ID:', disputeId);

        // Add images if provided
        if (images && images.length > 0) {
            console.log('📸 Adding images to dispute...');
            const imageSql = `
                INSERT INTO dispute_images (dispute_id, image_url, image_type, uploaded_by)
                VALUES (?, ?, ?, 'user')
            `;
            for (const image of images) {
                await db.execute(imageSql, [disputeId, image.url, image.type || 'evidence']);
                console.log('✅ Image added:', image.url);
            }
        }

        console.log('✅ Dispute creation completed successfully');
        
        // Send asynchronous email notifications after successful dispute creation
        try {
            console.log('📧 Sending dispute creation email notifications...');
            
            // Get complete dispute information for emails
            const [disputeDetails] = await db.execute(`
                SELECT 
                    d.*,
                    creator.name as creator_name,
                    creator.email as creator_email,
                    creator.role as creator_role,
                    target.name as target_name,
                    target.email as target_email,
                    target.role as target_role,
                    dr.title as reason_title,
                    dr.description as reason_description
                FROM disputes d
                JOIN users creator ON d.user_id = creator.id
                JOIN users target ON d.company_id = target.id
                JOIN dispute_reasons dr ON d.dispute_reason_id = dr.id
                WHERE d.id = ?
            `, [disputeId]);
            
            if (disputeDetails.length > 0) {
                const dispute = disputeDetails[0];
                
                // Format date for email
                const formatDate = (dateString) => {
                    return new Date(dateString).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                };
                
                // Prepare email data
                const emailData = {
                    disputeId: disputeId,
                    title: dispute.title,
                    description: dispute.description,
                    priority: dispute.priority,
                    status: dispute.status,
                    createdAt: formatDate(dispute.created_at),
                    creatorName: dispute.creator_name,
                    creatorEmail: dispute.creator_email,
                    creatorRole: dispute.creator_role,
                    targetName: dispute.target_name,
                    targetEmail: dispute.target_email,
                    targetRole: dispute.target_role,
                    reasonTitle: dispute.reason_title,
                    reasonDescription: dispute.reason_description,
                    quoteId: dispute.quote_id,
                    transactionId: dispute.transaction_id,
                    attachments: images || []
                };
                
                // Import email queue functions
                const { queueSubscriptionEmails } = await import('../services/emailQueue.js');
                
                // 1. Send email to admin (always)
                const [adminUsers] = await db.execute(`
                    SELECT email FROM users WHERE role = 'admin' AND email IS NOT NULL
                `);
                
                console.log(`📧 Sending dispute notifications to ${adminUsers.length} admin(s)`);
                
                for (const admin of adminUsers) {
                    queueSubscriptionEmails.disputeCreationToAdmin({
                        ...emailData,
                        recipientEmail: admin.email
                    }).then(jobId => {
                        console.log(`✅ Dispute admin email queued for ${admin.email} (Job ID: ${jobId})`);
                    }).catch(error => {
                        console.error(`❌ Failed to queue dispute admin email for ${admin.email}:`, error);
                    });
                }
                
                // 2. Send confirmation email to dispute creator
                queueSubscriptionEmails.disputeCreationToCreator({
                    ...emailData,
                    recipientEmail: dispute.creator_email
                }).then(jobId => {
                    console.log(`✅ Dispute creator email queued for ${dispute.creator_email} (Job ID: ${jobId})`);
                }).catch(error => {
                    console.error(`❌ Failed to queue dispute creator email:`, error);
                });
                
                // 3. Send notification email to dispute target
                queueSubscriptionEmails.disputeCreationToTarget({
                    ...emailData,
                    recipientEmail: dispute.target_email
                }).then(jobId => {
                    console.log(`✅ Dispute target email queued for ${dispute.target_email} (Job ID: ${jobId})`);
                }).catch(error => {
                    console.error(`❌ Failed to queue dispute target email:`, error);
                });
                
                console.log('✅ All dispute email notifications queued successfully');
            }
            
        } catch (emailError) {
            console.error('❌ Error sending dispute creation emails:', emailError);
            // Don't fail the dispute creation if emails fail
        }
        
        res.status(201).json({
            message: 'Dispute created successfully',
            disputeId: disputeId
        });
    } catch (error) {
        console.error('❌ Error creating dispute:', error);
        res.status(500).json({ message: 'Server error creating dispute' });
    }
};

// @desc    Get user's own disputes
// @route   GET /api/disputes/my-disputes
// @access  Private
export const getUserDisputes = async (req, res) => {
    try {
        const user_id = req.user.id;

        const sql = `
            SELECT 
                d.id,
                d.title,
                d.description,
                d.status,
                d.priority,
                d.admin_response,
                d.company_response,
                d.company_suggested_status,
                d.company_responded_at,
                d.company_requested_status,
                d.company_status_reason,
                d.company_status_requested_at,
                d.created_at,
                d.updated_at,
                d.resolved_at,
                c.name as company_name,
                c.email as company_email,
                dr.title as reason_title
            FROM disputes d
            JOIN users c ON d.company_id = c.id
            JOIN dispute_reasons dr ON d.dispute_reason_id = dr.id
            WHERE d.user_id = ?
            ORDER BY d.created_at DESC
        `;
        const [disputes] = await db.execute(sql, [user_id]);

        // Get images for each dispute
        for (let dispute of disputes) {
            const imagesSql = `
                SELECT id, image_url, image_type, created_at
                FROM dispute_images 
                WHERE dispute_id = ?
                ORDER BY created_at ASC
            `;
            const [images] = await db.execute(imagesSql, [dispute.id]);
            dispute.images = images;
        }

        res.status(200).json(disputes);
    } catch (error) {
        console.error('Error fetching user disputes:', error);
        res.status(500).json({ message: 'Server error fetching user disputes' });
    }
};

// @desc    Get disputes against a company
// @route   GET /api/disputes/company-disputes
// @access  Private (Company users only)
export const getCompanyDisputes = async (req, res) => {
    try {
        const company_id = req.user.id;

        const sql = `
            SELECT 
                d.id,
                d.title,
                d.description,
                d.status,
                d.priority,
                d.admin_response,
                d.company_response,
                d.company_suggested_status,
                d.company_responded_at,
                d.company_requested_status,
                d.company_status_reason,
                d.company_status_requested_at,
                d.created_at,
                d.updated_at,
                d.resolved_at,
                u.name as user_name,
                u.email as user_email,
                dr.title as reason_title
            FROM disputes d
            JOIN users u ON d.user_id = u.id
            JOIN dispute_reasons dr ON d.dispute_reason_id = dr.id
            WHERE d.company_id = ?
            ORDER BY d.created_at DESC
        `;
        const [disputes] = await db.execute(sql, [company_id]);

        // Get images for each dispute
        for (let dispute of disputes) {
            const imagesSql = `
                SELECT id, image_url, image_type, created_at
                FROM dispute_images 
                WHERE dispute_id = ?
                ORDER BY created_at ASC
            `;
            const [images] = await db.execute(imagesSql, [dispute.id]);
            dispute.images = images;
        }

        res.status(200).json(disputes);
    } catch (error) {
        console.error('Error fetching company disputes:', error);
        res.status(500).json({ message: 'Server error fetching company disputes' });
    }
};

// @desc    Company respond to dispute
// @route   POST /api/disputes/company-response/:id
// @access  Private (Company users only)
export const companyRespondToDispute = async (req, res) => {
    try {
        const { id } = req.params;
        const { response, suggested_status } = req.body;
        const companyId = req.user.id;

        if (!response || !response.trim()) {
            return res.status(400).json({ message: 'Response message is required' });
        }

        // Verify this dispute is against the company
        const checkSql = `
            SELECT d.*, u.name as user_name, c.name as company_name
            FROM disputes d
            JOIN users u ON d.user_id = u.id
            JOIN users c ON d.company_id = c.id
            WHERE d.id = ? AND d.company_id = ?
        `;
        const [disputes] = await db.execute(checkSql, [id, companyId]);

        if (disputes.length === 0) {
            return res.status(404).json({ message: 'Dispute not found or not authorized' });
        }

        const dispute = disputes[0];

        // Add company response to dispute
        const updateSql = `
            UPDATE disputes 
            SET company_response = ?, company_suggested_status = ?, company_responded_at = NOW()
            WHERE id = ?
        `;
        await db.execute(updateSql, [response, suggested_status, id]);

        // Send notification to user
        await sendDisputeResponseNotificationToUser(
            dispute.user_id, 
            id, 
            dispute.company_name
        );

        res.status(200).json({ message: 'Response submitted successfully' });
    } catch (error) {
        console.error('Error submitting company response:', error);
        res.status(500).json({ message: 'Server error submitting response' });
    }
};

// @desc    Company request status change
// @route   PUT /api/disputes/company-status/:id
// @access  Private (Company users only)
export const companyStatusChangeRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, reason } = req.body;
        const companyId = req.user.id;

        if (!status || !reason || !reason.trim()) {
            return res.status(400).json({ message: 'Status and reason are required' });
        }

        // Verify this dispute is against the company
        const checkSql = `
            SELECT d.*, u.name as user_name, c.name as company_name
            FROM disputes d
            JOIN users u ON d.user_id = u.id
            JOIN users c ON d.company_id = c.id
            WHERE d.id = ? AND d.company_id = ?
        `;
        const [disputes] = await db.execute(checkSql, [id, companyId]);

        if (disputes.length === 0) {
            return res.status(404).json({ message: 'Dispute not found or not authorized' });
        }

        const dispute = disputes[0];

        // Validate workflow transitions
        const currentStatus = dispute.status;
        let canTransition = false;
        let autoApply = false;

        switch (currentStatus) {
            case 'pending':
                // From pending: can go to running or resolved
                canTransition = ['running', 'resolved'].includes(status);
                autoApply = true; // Company can directly change these
                break;
            case 'running':
                // From running: can go to resolved or back to pending
                canTransition = ['resolved', 'pending'].includes(status);
                autoApply = true; // Company can directly change these
                break;
            case 'resolved':
                // From resolved: only user can close it, company can reopen to running
                canTransition = ['running'].includes(status);
                autoApply = true;
                break;
            case 'closed':
                // From closed: can reopen to running (rare case)
                canTransition = ['running'].includes(status);
                autoApply = true;
                break;
        }

        if (!canTransition) {
            return res.status(400).json({ 
                message: `Cannot change status from ${currentStatus} to ${status}. Invalid workflow transition.` 
            });
        }

        // Update dispute with company's status change request
        const updateSql = `
            UPDATE disputes 
            SET company_requested_status = ?, company_status_reason = ?, 
                company_status_requested_at = NOW()
            WHERE id = ?
        `;
        const [updateResult1] = await db.execute(updateSql, [status, reason, id]);

        // Auto-apply the status change for company-controlled transitions
        if (autoApply) {
            let adminResponse = `Status changed to ${status} by company. Reason: ${reason}`;
            let resolvedAt = null;
            let resolvedBy = null;

            if (status === 'resolved') {
                resolvedAt = 'NOW()';
                resolvedBy = companyId;
                adminResponse = `Dispute resolved by company. Reason: ${reason}`;
            }

            const statusUpdateSql = resolvedAt ? `
                UPDATE disputes 
                SET status = ?, admin_response = ?, resolved_at = ${resolvedAt}, resolved_by = ?
                WHERE id = ?
            ` : `
                UPDATE disputes 
                SET status = ?, admin_response = ?
                WHERE id = ?
            `;

            const params = resolvedAt ? 
                [status, adminResponse, resolvedBy, id] : 
                [status, adminResponse, id];

            const [updateResult2] = await db.execute(statusUpdateSql, params);

            // Send notification to user about status change
            try {
                await sendDisputeStatusUpdateNotificationToUser(
                    dispute.user_id, 
                    id, 
                    status, 
                    dispute.company_name
                );
            } catch (notifError) {
                // Silently handle notification errors
            }
        }

        res.status(200).json({ 
            message: autoApply ? 
                'Dispute status updated successfully' : 
                'Status change request submitted for admin review'
        });
    } catch (error) {
        console.error('Error submitting status change request:', error);
        res.status(500).json({ message: 'Server error submitting status change request' });
    }
};
// @desc    User close resolved dispute
// @route   PUT /api/disputes/user-close/:id
// @access  Private (Users only)
export const userCloseDispute = async (req, res) => {
    try {
        const { id } = req.params;
        const { feedback } = req.body; // Optional feedback from user
        const userId = req.user.id;

        // Verify this dispute belongs to the user and is resolved
        const checkSql = `
            SELECT d.*, c.name as company_name
            FROM disputes d
            JOIN users c ON d.company_id = c.id
            WHERE d.id = ? AND d.user_id = ? AND d.status = 'resolved'
        `;
        const [disputes] = await db.execute(checkSql, [id, userId]);

        if (disputes.length === 0) {
            return res.status(404).json({ 
                message: 'Dispute not found, not authorized, or not in resolved status' 
            });
        }

        const dispute = disputes[0];

        // Close the dispute
        const updateSql = `
            UPDATE disputes 
            SET status = 'closed', 
                admin_response = CONCAT(COALESCE(admin_response, ''), '\n\nClosed by user.', 
                    CASE WHEN ? IS NOT NULL THEN CONCAT(' User feedback: ', ?) ELSE '' END),
                resolved_at = NOW()
            WHERE id = ?
        `;
        await db.execute(updateSql, [feedback, feedback, id]);

        // Send notification to company that dispute was closed
        await sendDisputeStatusUpdateNotificationToUser(
            dispute.company_id, 
            id, 
            'closed', 
            'User'
        );

        res.status(200).json({ message: 'Dispute closed successfully' });
    } catch (error) {
        console.error('Error closing dispute:', error);
        res.status(500).json({ message: 'Server error closing dispute' });
    }
};
// @route   GET /api/disputes/user-companies
// @access  Private
export const getUserCompanies = async (req, res) => {
    try {
        const user_id = req.user.id;

        // Get companies from quote responses and transactions
        const sql = `
            SELECT DISTINCT 
                c.id,
                c.name,
                c.email
            FROM users c
            WHERE c.role = 'company' 
            AND c.id IN (
                SELECT DISTINCT qr.company_id 
                FROM quote_responses qr
                JOIN quotes q ON qr.quote_id = q.id
                WHERE q.user_id = ?
                UNION
                SELECT DISTINCT company_id 
                FROM transactions 
                WHERE user_id = ? AND company_id IS NOT NULL
            )
            ORDER BY c.name ASC
        `;
        const [companies] = await db.execute(sql, [user_id, user_id]);

        // If no interactions found, return all active companies
        if (companies.length === 0) {
            const allCompaniesSql = `
                SELECT id, name, email 
                FROM users 
                WHERE role = 'company' AND status = 1 
                ORDER BY name ASC
            `;
            const [allCompanies] = await db.execute(allCompaniesSql);
            return res.status(200).json(allCompanies);
        }

        res.status(200).json(companies);
    } catch (error) {
        console.error('Error fetching user companies:', error);
        res.status(500).json({ message: 'Server error fetching companies' });
    }
};

// ==================== DISPUTE MESSAGING ====================

// @desc    Get messages for a specific dispute
// @route   GET /api/disputes/:id/messages
// @access  Private
export const getDisputeMessages = async (req, res) => {
    try {
        const disputeId = req.params.id;
        const userId = req.user.id;
        const userRole = req.user.role;

        // First verify user has access to this dispute
        let accessCheckSql;
        let accessParams;

        if (userRole === 'admin') {
            // Admin can access all disputes
            accessCheckSql = 'SELECT id FROM disputes WHERE id = ?';
            accessParams = [disputeId];
        } else if (userRole === 'company') {
            // Company can access disputes they're involved in
            accessCheckSql = 'SELECT id FROM disputes WHERE id = ? AND company_id = ?';
            accessParams = [disputeId, userId];
        } else {
            // User can access disputes they filed
            accessCheckSql = 'SELECT id FROM disputes WHERE id = ? AND user_id = ?';
            accessParams = [disputeId, userId];
        }

        const [accessCheck] = await db.execute(accessCheckSql, accessParams);
        if (accessCheck.length === 0) {
            return res.status(403).json({ message: 'Access denied to this dispute' });
        }

        // Get messages for this dispute
        const sql = `
            SELECT 
                dm.*,
                sender.name as sender_name,
                sender.role as sender_role,
                sender.logo as sender_logo
            FROM dispute_messages dm
            JOIN users sender ON dm.sender_id = sender.id
            WHERE dm.dispute_id = ?
            ORDER BY dm.created_at ASC
        `;

        const [messages] = await db.execute(sql, [disputeId]);
        res.status(200).json(messages);

    } catch (error) {
        console.error('Error fetching dispute messages:', error);
        res.status(500).json({ message: 'Server error fetching messages' });
    }
};

// @desc    Send message in dispute context
// @route   POST /api/disputes/:id/messages
// @access  Private
export const sendDisputeMessage = async (req, res) => {
    try {
        const disputeId = req.params.id;
        const senderId = req.user.id;
        const senderRole = req.user.role;
        const { message, recipientId } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({ message: 'Message content is required' });
        }

        // First verify user has access to this dispute
        let accessCheckSql;
        let accessParams;

        if (senderRole === 'admin') {
            // Admin can access all disputes
            accessCheckSql = 'SELECT * FROM disputes WHERE id = ?';
            accessParams = [disputeId];
        } else if (senderRole === 'company') {
            // Company can access disputes they're involved in
            accessCheckSql = 'SELECT * FROM disputes WHERE id = ? AND company_id = ?';
            accessParams = [disputeId, senderId];
        } else {
            // User can access disputes they filed
            accessCheckSql = 'SELECT * FROM disputes WHERE id = ? AND user_id = ?';
            accessParams = [disputeId, senderId];
        }

        const [accessCheck] = await db.execute(accessCheckSql, accessParams);
        if (accessCheck.length === 0) {
            return res.status(403).json({ message: 'Access denied to this dispute' });
        }

        const dispute = accessCheck[0];

        // Create the dispute message table if it doesn't exist
        await db.execute(`
            CREATE TABLE IF NOT EXISTS dispute_messages (
                id INT AUTO_INCREMENT PRIMARY KEY,
                dispute_id INT NOT NULL,
                sender_id INT NOT NULL,
                message TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (dispute_id) REFERENCES disputes(id) ON DELETE CASCADE,
                FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // Insert the message
        const insertSql = `
            INSERT INTO dispute_messages (dispute_id, sender_id, message, created_at)
            VALUES (?, ?, ?, NOW())
        `;

        const [result] = await db.execute(insertSql, [disputeId, senderId, message]);

        // Also create a regular message for notification purposes
        let regularRecipientId;
        if (senderRole === 'admin') {
            // Admin sending to both user and company
            regularRecipientId = recipientId || (senderRole === 'user' ? dispute.company_id : dispute.user_id);
        } else if (senderRole === 'company') {
            // Company sending to user (and admin gets notified)
            regularRecipientId = dispute.user_id;
        } else {
            // User sending to company (and admin gets notified)
            regularRecipientId = dispute.company_id;
        }

        if (regularRecipientId) {
            await db.execute(`
                INSERT INTO messages (sender_id, receiver_id, subject, message, created_at)
                VALUES (?, ?, ?, ?, NOW())
            `, [
                senderId,
                regularRecipientId,
                `Dispute #${disputeId} Message`,
                message
            ]);
        }

        res.status(201).json({
            message: 'Message sent successfully',
            messageId: result.insertId
        });

    } catch (error) {
        console.error('Error sending dispute message:', error);
        res.status(500).json({ message: 'Server error sending message' });
    }
};

// @desc    Add attachment to dispute
// @route   POST /api/disputes/attachments
// @access  Private
export const addDisputeAttachment = async (req, res) => {
    try {
        const { dispute_id, image_url, image_type } = req.body;
        const user_id = req.user.id;

        if (!dispute_id || !image_url) {
            return res.status(400).json({ message: 'Dispute ID and image URL are required' });
        }

        // Verify the dispute belongs to the user
        const [disputeCheck] = await db.execute(
            'SELECT id FROM disputes WHERE id = ? AND user_id = ?',
            [dispute_id, user_id]
        );

        if (disputeCheck.length === 0) {
            return res.status(404).json({ message: 'Dispute not found or not authorized' });
        }

        // Insert attachment
        const sql = `
            INSERT INTO dispute_images (dispute_id, image_url, image_type, uploaded_by, created_at)
            VALUES (?, ?, ?, 'user', NOW())
        `;
        
        const [result] = await db.execute(sql, [dispute_id, image_url, image_type || 'evidence']);

        res.status(201).json({
            message: 'Attachment added successfully',
            attachmentId: result.insertId
        });

    } catch (error) {
        console.error('Error adding dispute attachment:', error);
        res.status(500).json({ message: 'Server error adding attachment' });
    }
};

export default {
    getAllDisputeReasons,
    getAdminDisputeReasons,
    createDisputeReason,
    updateDisputeReason,
    deleteDisputeReason,
    getAllDisputes,
    getDisputeById,
    updateDisputeStatus,
    deleteDispute,
    createDispute,
    getUserDisputes,
    getCompanyDisputes,
    companyRespondToDispute,
    companyStatusChangeRequest,
    userCloseDispute,
    getUserCompanies,
    getDisputeMessages,
    sendDisputeMessage,
    addDisputeAttachment
};