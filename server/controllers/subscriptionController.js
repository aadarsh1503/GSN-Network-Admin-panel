// controllers/subscriptionController.js
import db from '../config/db.js';
import { createInvoice } from './invoiceController.js';
import { queueSubscriptionEmails } from '../services/emailQueue.js';
import { sendSubscriptionPaymentProofNotificationToAdmin } from '../services/adminNotificationService.js';

// @desc    Get all membership plans
// @route   GET /api/subscriptions/plans
// @access  Public
const getPlans = async (req, res) => {
    try {
        const sql = `SELECT * FROM membership_plans WHERE is_active = 1 ORDER BY price ASC`;
        const [rows] = await db.execute(sql);
        
        // Parse features JSON
        const plans = rows.map(plan => ({
            ...plan,
            features: plan.features ? JSON.parse(plan.features) : []
        }));

        res.status(200).json(plans);
    } catch (error) {
        console.error('Error fetching plans:', error);
        res.status(500).json({ message: 'Server error fetching plans' });
    }
};

// @desc    Get user's current subscription
// @route   GET /api/subscriptions/my-subscription
// @access  Private
const getMySubscription = async (req, res) => {
    const userId = req.user.id;

    try {
        const sql = `
            SELECT us.*, mp.name as plan_name, mp.features, mp.max_quotes, mp.max_responses
            FROM user_subscriptions us
            JOIN membership_plans mp ON us.plan_id = mp.id
            WHERE us.user_id = ? AND us.status = 'active' AND us.end_date >= CURDATE()
            ORDER BY us.end_date DESC
            LIMIT 1
        `;

        const [rows] = await db.execute(sql, [userId]);
        
        if (rows.length === 0) {
            // Return guest plan info
            return res.status(200).json({
                plan_name: 'Guest',
                status: 'active',
                features: ['View directory', 'Submit quotes', 'Basic support'],
                max_quotes: 5,
                max_responses: 0,
                is_guest: true
            });
        }

        const subscription = rows[0];
        subscription.features = subscription.features ? JSON.parse(subscription.features) : [];

        res.status(200).json(subscription);
    } catch (error) {
        console.error('Error fetching subscription:', error);
        res.status(500).json({ message: 'Server error fetching subscription' });
    }
};

// @desc    Create a new plan (Admin)
// @route   POST /api/subscriptions/plans
// @access  Private/Admin
const createPlan = async (req, res) => {
    const { name, description, price, durationMonths, features, maxQuotes, maxResponses, directoryListing, prioritySupport } = req.body;

    if (!name || price === undefined) {
        return res.status(400).json({ message: 'Name and price are required' });
    }

    try {
        const sql = `
            INSERT INTO membership_plans 
            (name, description, price, duration_months, features, max_quotes, max_responses, directory_listing, priority_support)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const featuresJson = JSON.stringify(features || []);
        const values = [
            name, description, price, durationMonths || 1, featuresJson,
            maxQuotes || -1, maxResponses || -1, directoryListing ? 1 : 0, prioritySupport ? 1 : 0
        ];

        const [result] = await db.execute(sql, values);

        res.status(201).json({
            message: 'Plan created successfully',
            planId: result.insertId
        });
    } catch (error) {
        console.error('Error creating plan:', error);
        res.status(500).json({ message: 'Server error creating plan' });
    }
};

// @desc    Update a plan (Admin)
// @route   PUT /api/subscriptions/plans/:id
// @access  Private/Admin
const updatePlan = async (req, res) => {
    const { id } = req.params;
    const { name, description, price, durationMonths, features, maxQuotes, maxResponses, directoryListing, prioritySupport, isActive } = req.body;

    try {
        const sql = `
            UPDATE membership_plans SET
            name = ?, description = ?, price = ?, duration_months = ?, features = ?,
            max_quotes = ?, max_responses = ?, directory_listing = ?, priority_support = ?, is_active = ?
            WHERE id = ?
        `;

        const featuresJson = JSON.stringify(features || []);
        const values = [
            name, description, price, durationMonths || 1, featuresJson,
            maxQuotes || -1, maxResponses || -1, directoryListing ? 1 : 0, prioritySupport ? 1 : 0, isActive ? 1 : 0, id
        ];

        await db.execute(sql, values);

        res.status(200).json({ message: 'Plan updated successfully' });
    } catch (error) {
        console.error('Error updating plan:', error);
        res.status(500).json({ message: 'Server error updating plan' });
    }
};

// @desc    Get all plans (Admin)
// @route   GET /api/subscriptions/admin/plans
// @access  Private/Admin
const getAllPlans = async (req, res) => {
    try {
        const sql = `SELECT * FROM membership_plans ORDER BY price ASC`;
        const [rows] = await db.execute(sql);
        
        const plans = rows.map(plan => ({
            ...plan,
            features: plan.features ? JSON.parse(plan.features) : []
        }));

        res.status(200).json(plans);
    } catch (error) {
        console.error('Error fetching all plans:', error);
        res.status(500).json({ message: 'Server error fetching plans' });
    }
};

// @desc    Activate subscription (without payment for now)
// @route   POST /api/subscriptions/activate
// @access  Private
const activateSubscription = async (req, res) => {
    const userId = req.user.id;
    const { planId, paymentMethod = 'manual' } = req.body; // Default to manual for now

    if (!planId) {
        return res.status(400).json({ message: 'Plan ID is required' });
    }

    try {
        // Check if plan exists and is active
        const planSql = `SELECT * FROM membership_plans WHERE id = ? AND is_active = 1`;
        const [planRows] = await db.execute(planSql, [planId]);
        
        if (planRows.length === 0) {
            return res.status(404).json({ message: 'Plan not found or inactive' });
        }

        const plan = planRows[0];

        // Check if user already has an active subscription
        const existingSql = `
            SELECT * FROM user_subscriptions 
            WHERE user_id = ? AND status = 'active' AND end_date >= CURDATE()
        `;
        const [existingRows] = await db.execute(existingSql, [userId]);

        if (existingRows.length > 0) {
            return res.status(400).json({ message: 'You already have an active subscription' });
        }

        // Calculate end date
        const startDate = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + plan.duration_months);

        // Create subscription with payment method
        const subscriptionSql = `
            INSERT INTO user_subscriptions 
            (user_id, plan_id, start_date, end_date, status, payment_status, payment_method, amount_paid)
            VALUES (?, ?, ?, ?, 'active', 'paid', ?, ?)
        `;

        const [result] = await db.execute(subscriptionSql, [
            userId, 
            planId, 
            startDate.toISOString().split('T')[0], 
            endDate.toISOString().split('T')[0],
            paymentMethod,
            plan.price
        ]);

        // Create invoice for this subscription
        const invoiceResult = await createInvoice(result.insertId, plan.price, 0);

        res.status(201).json({
            message: 'Subscription activated successfully',
            subscriptionId: result.insertId,
            planName: plan.name,
            endDate: endDate.toISOString().split('T')[0],
            transactionId: result.insertId,
            invoiceNumber: invoiceResult.invoiceNumber,
            invoiceId: invoiceResult.invoiceId
        });

    } catch (error) {
        console.error('Error activating subscription:', error);
        res.status(500).json({ message: 'Server error activating subscription' });
    }
};

// @desc    Get all subscriptions (Admin)
// @route   GET /api/subscriptions/admin/all
// @access  Private/Admin
const getAllSubscriptions = async (req, res) => {
    try {
        const sql = `
            SELECT us.*, u.name as user_name, u.email as user_email, mp.name as plan_name
            FROM user_subscriptions us
            JOIN users u ON us.user_id = u.id
            JOIN membership_plans mp ON us.plan_id = mp.id
            ORDER BY us.created_at DESC
        `;

        const [rows] = await db.execute(sql);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching subscriptions:', error);
        res.status(500).json({ message: 'Server error fetching subscriptions' });
    }
};

// @desc    Delete a plan (Admin)
// @route   DELETE /api/subscriptions/admin/plans/:id
// @access  Private/Admin
const deletePlan = async (req, res) => {
    const { id } = req.params;

    try {
        // Check if plan exists
        const checkSql = `SELECT * FROM membership_plans WHERE id = ?`;
        const [planRows] = await db.execute(checkSql, [id]);
        
        if (planRows.length === 0) {
            return res.status(404).json({ message: 'Plan not found' });
        }

        // Check if plan has active subscriptions
        const subscriptionSql = `
            SELECT COUNT(*) as count FROM user_subscriptions 
            WHERE plan_id = ? AND status = 'active' AND end_date >= CURDATE()
        `;
        const [subscriptionRows] = await db.execute(subscriptionSql, [id]);
        
        if (subscriptionRows[0].count > 0) {
            return res.status(400).json({ 
                message: 'Cannot delete plan with active subscriptions. Deactivate it instead.' 
            });
        }

        // Delete the plan
        const deleteSql = `DELETE FROM membership_plans WHERE id = ?`;
        await db.execute(deleteSql, [id]);

        res.status(200).json({ message: 'Plan deleted successfully' });
    } catch (error) {
        console.error('Error deleting plan:', error);
        res.status(500).json({ message: 'Server error deleting plan' });
    }
};

// @desc    Submit bank transfer subscription request
// @route   POST /api/subscriptions/bank-transfer-request
// @access  Private
const submitBankTransferRequest = async (req, res) => {
    const userId = req.user.id;
    const { planId, transactionId, paymentMethod = 'bank_transfer' } = req.body;

    if (!planId || !transactionId) {
        return res.status(400).json({ message: 'Plan ID and transaction ID are required' });
    }

    if (!req.file) {
        return res.status(400).json({ message: 'Payment proof image is required' });
    }

    try {
        // Check if plan exists and is active
        const planSql = `SELECT * FROM membership_plans WHERE id = ? AND is_active = 1`;
        const [planRows] = await db.execute(planSql, [planId]);
        
        if (planRows.length === 0) {
            return res.status(404).json({ message: 'Plan not found or inactive' });
        }

        const plan = planRows[0];

        // Get user details
        const userSql = `SELECT * FROM users WHERE id = ?`;
        const [userRows] = await db.execute(userSql, [userId]);
        
        if (userRows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = userRows[0];

        // Check if user already has a pending request
        const existingRequestSql = `
            SELECT * FROM subscription_requests 
            WHERE user_id = ? AND status = 'pending'
        `;
        const [existingRows] = await db.execute(existingRequestSql, [userId]);

        if (existingRows.length > 0) {
            return res.status(400).json({ message: 'You already have a pending subscription request' });
        }

        // Store the subscription request
        const requestSql = `
            INSERT INTO subscription_requests 
            (user_id, plan_id, transaction_id, payment_method, payment_proof_url, status, company_name, user_name, user_email, user_phone, plan_name, plan_price, duration_months)
            VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?)
        `;

        const paymentProofUrl = req.file.path; // Cloudinary URL

        const [result] = await db.execute(requestSql, [
            userId,
            planId,
            transactionId,
            paymentMethod,
            paymentProofUrl,
            user.name || 'N/A', // Use name as company_name
            user.name,
            user.email,
            user.phone || null,
            plan.name,
            plan.price,
            plan.duration_months
        ]);

        // 🚀 QUEUE EMAIL WORKFLOW - Payment Proof Submitted (NON-BLOCKING)
        queueSubscriptionEmails.paymentProofSubmitted({
            companyId: userId,
            companyName: user.name || 'N/A',
            companyEmail: user.email,
            planName: plan.name,
            planDuration: `${plan.duration_months} month${plan.duration_months > 1 ? 's' : ''}`,
            planPrice: `$${plan.price}`,
            paymentMethod: paymentMethod === 'bank_transfer' ? 'Bank Transfer' : paymentMethod,
            transactionReference: transactionId,
            subscriptionId: result.insertId
        }).then(jobId => {
            console.log(`✅ Payment proof submission emails queued (Job ID: ${jobId})`);
        }).catch(error => {
            console.error('❌ Failed to queue payment proof submission emails:', error);
        });

        // 🔔 CREATE ADMIN NOTIFICATION - Subscription Payment Proof Submitted
        try {
            await sendSubscriptionPaymentProofNotificationToAdmin(
                userId,
                user.name || 'N/A',
                plan.name,
                plan.price,
                transactionId,
                result.insertId
            );
        } catch (notificationError) {
            console.error('❌ Failed to create admin notification for subscription payment proof:', notificationError);
            // Don't fail the request if notification creation fails
        }

        res.status(201).json({
            message: 'Subscription request submitted successfully',
            requestId: result.insertId,
            status: 'pending'
        });

    } catch (error) {
        console.error('Error submitting subscription request:', error);
        res.status(500).json({ message: 'Server error submitting subscription request' });
    }
};

// @desc    Get all subscription requests (Admin)
// @route   GET /api/admin-panel/subscription-requests
// @access  Private/Admin
const getSubscriptionRequests = async (req, res) => {
    try {
        const sql = `
            SELECT sr.*, u.name as user_name, u.email as user_email, u.phone as user_phone, u.name as company_name,
                   mp.name as plan_name, mp.price as plan_price, mp.duration_months
            FROM subscription_requests sr
            JOIN users u ON sr.user_id = u.id
            JOIN membership_plans mp ON sr.plan_id = mp.id
            WHERE sr.status = 'pending'
            ORDER BY sr.created_at DESC
        `;

        const [rows] = await db.execute(sql);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching subscription requests:', error);
        res.status(500).json({ message: 'Server error fetching subscription requests' });
    }
};

// @desc    Get subscription request details (Admin)
// @route   GET /api/admin-panel/subscription-requests/:id
// @access  Private/Admin
const getSubscriptionRequestDetails = async (req, res) => {
    const { id } = req.params;

    try {
        const sql = `
            SELECT sr.*, u.name as user_name, u.email as user_email, u.phone as user_phone, u.name as company_name,
                   mp.name as plan_name, mp.price as plan_price, mp.duration_months, mp.features
            FROM subscription_requests sr
            JOIN users u ON sr.user_id = u.id
            JOIN membership_plans mp ON sr.plan_id = mp.id
            WHERE sr.id = ?
        `;

        const [rows] = await db.execute(sql, [id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Subscription request not found' });
        }

        const request = rows[0];
        request.features = request.features ? JSON.parse(request.features) : [];

        res.status(200).json(request);
    } catch (error) {
        console.error('Error fetching subscription request details:', error);
        res.status(500).json({ message: 'Server error fetching request details' });
    }
};

// @desc    Approve subscription request (Admin)
// @route   POST /api/admin-panel/subscription-requests/:id/approve
// @access  Private/Admin
const approveSubscriptionRequest = async (req, res) => {
    const { id } = req.params;

    try {
        // Get request details
        const requestSql = `
            SELECT sr.*, mp.duration_months, mp.price
            FROM subscription_requests sr
            JOIN membership_plans mp ON sr.plan_id = mp.id
            WHERE sr.id = ? AND sr.status = 'pending'
        `;
        const [requestRows] = await db.execute(requestSql, [id]);
        
        if (requestRows.length === 0) {
            return res.status(404).json({ message: 'Subscription request not found or already processed' });
        }

        const request = requestRows[0];

        // Calculate subscription dates
        const startDate = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + request.duration_months);

        // Create subscription
        const subscriptionSql = `
            INSERT INTO user_subscriptions 
            (user_id, plan_id, start_date, end_date, status, payment_status, payment_method, amount_paid, transaction_id)
            VALUES (?, ?, ?, ?, 'active', 'paid', ?, ?, ?)
        `;

        const [subscriptionResult] = await db.execute(subscriptionSql, [
            request.user_id,
            request.plan_id,
            startDate.toISOString().split('T')[0],
            endDate.toISOString().split('T')[0],
            request.payment_method || 'bank_transfer',
            request.plan_price,
            request.transaction_id
        ]);

        // Update request status
        await db.execute(
            `UPDATE subscription_requests SET status = 'approved', processed_at = NOW() WHERE id = ?`,
            [id]
        );

        // Create invoice
        const invoiceResult = await createInvoice(subscriptionResult.insertId, request.plan_price, 0);

        // Get admin and company details for email
        const adminId = req.user.id;
        const [adminRows] = await db.execute('SELECT name, email FROM users WHERE id = ?', [adminId]);
        const admin = adminRows[0] || { name: 'Admin', email: 'admin@system.com' };

        const [companyRows] = await db.execute('SELECT name, email FROM users WHERE id = ?', [request.user_id]);
        const company = companyRows[0];

        // 🚀 QUEUE EMAIL WORKFLOW - Payment Approved (NON-BLOCKING)
        queueSubscriptionEmails.paymentApproved({
            companyId: request.user_id,
            companyName: company.name || 'N/A',
            companyEmail: company.email,
            planName: request.plan_name,
            startDate: startDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
            expiryDate: endDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
            invoiceId: invoiceResult.invoiceNumber,
            adminId: adminId,
            adminName: admin.name || 'Admin',
            adminEmail: admin.email
        }).then(jobId => {
            console.log(`✅ Payment approval emails queued (Job ID: ${jobId})`);
        }).catch(error => {
            console.error('❌ Failed to queue payment approval emails:', error);
        });

        // Send notification to user (you can implement this)
        // await sendNotification(request.user_id, 'subscription_approved', { planName: request.plan_name });

        res.status(200).json({
            message: 'Subscription request approved successfully',
            subscriptionId: subscriptionResult.insertId,
            invoiceId: invoiceResult.invoiceId
        });

    } catch (error) {
        console.error('Error approving subscription request:', error);
        res.status(500).json({ message: 'Server error approving subscription request' });
    }
};

// @desc    Reject subscription request (Admin)
// @route   POST /api/admin-panel/subscription-requests/:id/reject
// @access  Private/Admin
const rejectSubscriptionRequest = async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
        return res.status(400).json({ message: 'Rejection reason is required' });
    }

    try {
        // Check if request exists and is pending
        const requestSql = `SELECT * FROM subscription_requests WHERE id = ? AND status = 'pending'`;
        const [requestRows] = await db.execute(requestSql, [id]);
        
        if (requestRows.length === 0) {
            return res.status(404).json({ message: 'Subscription request not found or already processed' });
        }

        // Update request status
        await db.execute(
            `UPDATE subscription_requests SET status = 'rejected', rejection_reason = ?, processed_at = NOW() WHERE id = ?`,
            [reason, id]
        );

        // Get admin and company details for email
        const request = requestRows[0];
        const adminId = req.user.id;
        const [adminRows] = await db.execute('SELECT name, email FROM users WHERE id = ?', [adminId]);
        const admin = adminRows[0] || { name: 'Admin', email: 'admin@system.com' };

        const [companyRows] = await db.execute('SELECT name, email FROM users WHERE id = ?', [request.user_id]);
        const company = companyRows[0];

        // 🚀 QUEUE EMAIL WORKFLOW - Payment Rejected (NON-BLOCKING)
        queueSubscriptionEmails.paymentRejected({
            companyId: request.user_id,
            companyName: company.name || 'N/A',
            companyEmail: company.email,
            planName: request.plan_name,
            rejectionReason: reason,
            correctionNeeded: 'Please review the rejection reason and resubmit with correct payment proof.',
            adminId: adminId,
            adminName: admin.name || 'Admin',
            adminEmail: admin.email
        }).then(jobId => {
            console.log(`✅ Payment rejection emails queued (Job ID: ${jobId})`);
        }).catch(error => {
            console.error('❌ Failed to queue payment rejection emails:', error);
        });

        // Send notification to user (you can implement this)
        // await sendNotification(request.user_id, 'subscription_rejected', { reason });

        res.status(200).json({
            message: 'Subscription request rejected successfully'
        });

    } catch (error) {
        console.error('Error rejecting subscription request:', error);
        res.status(500).json({ message: 'Server error rejecting subscription request' });
    }
};

// @desc    Get company subscription transactions
// @route   GET /api/company/subscription-transactions
// @access  Private/Company
const getCompanySubscriptionTransactions = async (req, res) => {
    const userId = req.user.id;

    try {
        const sql = `
            SELECT 
                us.id,
                us.start_date,
                us.end_date,
                us.status,
                us.payment_status,
                us.payment_method,
                us.amount_paid,
                us.transaction_id,
                us.created_at,
                mp.name as plan_name,
                mp.duration_months,
                mp.price as plan_price,
                'subscription' as type
            FROM user_subscriptions us
            JOIN membership_plans mp ON us.plan_id = mp.id
            WHERE us.user_id = ?
            ORDER BY us.created_at DESC
        `;

        const [rows] = await db.execute(sql, [userId]);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching company subscription transactions:', error);
        res.status(500).json({ message: 'Server error fetching subscription transactions' });
    }
};

export {
    getPlans,
    getMySubscription,
    activateSubscription,
    createPlan,
    updatePlan,
    getAllPlans,
    getAllSubscriptions,
    deletePlan,
    submitBankTransferRequest,
    getSubscriptionRequests,
    getSubscriptionRequestDetails,
    approveSubscriptionRequest,
    rejectSubscriptionRequest,
    getCompanySubscriptionTransactions
};
