// controllers/reviewController.js
import db from '../config/db.js';

// @desc    Submit a review for a company
// @route   POST /api/reviews/submit
// @access  Private
const submitReview = async (req, res) => {
    const userId = req.user.id;
    const {
        companyId, rating, reliability, communication, timeliness, 
        overallExperience, reviewText, quoteId
    } = req.body;

    if (!companyId || !rating || !reviewText) {
        return res.status(400).json({ message: 'Company ID, rating, and review text are required' });
    }

    if (rating < 1 || rating > 5) {
        return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    try {
        // Check if company exists
        const [companyRows] = await db.execute(
            'SELECT id FROM users WHERE id = ? AND role = "company"', 
            [companyId]
        );

        if (companyRows.length === 0) {
            return res.status(404).json({ message: 'Company not found' });
        }

        // Check if user already reviewed this company
        const [existingReview] = await db.execute(
            'SELECT id FROM reviews WHERE user_id = ? AND company_id = ?',
            [userId, companyId]
        );

        if (existingReview.length > 0) {
            return res.status(400).json({ message: 'You have already reviewed this company' });
        }

        const sql = `
            INSERT INTO reviews (
                user_id, company_id, rating, reliability, communication, 
                timeliness, overall_experience, review_text, quote_id, 
                status, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW())
        `;

        const values = [
            userId, companyId, rating, reliability || rating, communication || rating,
            timeliness || rating, overallExperience || rating, reviewText, quoteId || null
        ];

        const [result] = await db.execute(sql, values);

        res.status(201).json({
            message: 'Review submitted successfully',
            reviewId: result.insertId
        });

    } catch (error) {
        console.error('Error submitting review:', error);
        res.status(500).json({ message: 'Server error submitting review' });
    }
};

// @desc    Get reviews for a company
// @route   GET /api/reviews/company/:companyId
// @access  Public
const getCompanyReviews = async (req, res) => {
    const { companyId } = req.params;

    try {
        const sql = `
            SELECT r.*, u.name as reviewer_name
            FROM reviews r
            JOIN users u ON r.user_id = u.id
            WHERE r.company_id = ? AND r.status = 'approved'
            ORDER BY r.created_at DESC
        `;

        const [rows] = await db.execute(sql, [companyId]);

        // Calculate average ratings
        if (rows.length > 0) {
            const avgRating = rows.reduce((sum, review) => sum + review.rating, 0) / rows.length;
            const avgReliability = rows.reduce((sum, review) => sum + review.reliability, 0) / rows.length;
            const avgCommunication = rows.reduce((sum, review) => sum + review.communication, 0) / rows.length;
            const avgTimeliness = rows.reduce((sum, review) => sum + review.timeliness, 0) / rows.length;
            const avgOverall = rows.reduce((sum, review) => sum + review.overall_experience, 0) / rows.length;

            res.status(200).json({
                reviews: rows,
                averages: {
                    rating: Math.round(avgRating * 10) / 10,
                    reliability: Math.round(avgReliability * 10) / 10,
                    communication: Math.round(avgCommunication * 10) / 10,
                    timeliness: Math.round(avgTimeliness * 10) / 10,
                    overallExperience: Math.round(avgOverall * 10) / 10
                },
                totalReviews: rows.length
            });
        } else {
            res.status(200).json({
                reviews: [],
                averages: {
                    rating: 0,
                    reliability: 0,
                    communication: 0,
                    timeliness: 0,
                    overallExperience: 0
                },
                totalReviews: 0
            });
        }

    } catch (error) {
        console.error('Error fetching company reviews:', error);
        res.status(500).json({ message: 'Server error fetching reviews' });
    }
};

// @desc    Get all reviews (Admin)
// @route   GET /api/reviews/all
// @access  Private/Admin
const getAllReviews = async (req, res) => {
    try {
        const sql = `
            SELECT r.*, 
                   u.name as reviewer_name, u.email as reviewer_email,
                   c.name as company_name, c.email as company_email
            FROM reviews r
            JOIN users u ON r.user_id = u.id
            JOIN users c ON r.company_id = c.id
            ORDER BY r.created_at DESC
        `;

        const [rows] = await db.execute(sql);
        res.status(200).json(rows);

    } catch (error) {
        console.error('Error fetching all reviews:', error);
        res.status(500).json({ message: 'Server error fetching reviews' });
    }
};

// @desc    Update review status (Admin)
// @route   PUT /api/reviews/:id/status
// @access  Private/Admin
const updateReviewStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'approved', 'rejected'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
    }

    try {
        await db.execute('UPDATE reviews SET status = ? WHERE id = ?', [status, id]);
        res.status(200).json({ message: 'Review status updated successfully' });

    } catch (error) {
        console.error('Error updating review status:', error);
        res.status(500).json({ message: 'Server error updating review status' });
    }
};

// @desc    Get user's reviews
// @route   GET /api/reviews/my-reviews
// @access  Private
const getMyReviews = async (req, res) => {
    const userId = req.user.id;

    try {
        const sql = `
            SELECT r.*, c.name as company_name, c.logo as company_logo
            FROM reviews r
            JOIN users c ON r.company_id = c.id
            WHERE r.user_id = ?
            ORDER BY r.created_at DESC
        `;

        const [rows] = await db.execute(sql, [userId]);
        res.status(200).json(rows);

    } catch (error) {
        console.error('Error fetching user reviews:', error);
        res.status(500).json({ message: 'Server error fetching reviews' });
    }
};

export {
    submitReview,
    getCompanyReviews,
    getAllReviews,
    updateReviewStatus,
    getMyReviews
};