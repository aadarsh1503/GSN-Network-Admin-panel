// controllers/subscriptionController.js
import db from '../config/db.js';
import { createInvoice } from './invoiceController.js';

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

export {
    getPlans,
    getMySubscription,
    activateSubscription,
    createPlan,
    updatePlan,
    getAllPlans,
    getAllSubscriptions
};
