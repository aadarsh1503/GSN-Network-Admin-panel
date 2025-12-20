// controllers/wishlistController.js
import db from '../config/db.js';

// @desc    Add company to wishlist
// @route   POST /api/wishlist/add
// @access  Private
const addToWishlist = async (req, res) => {
    const userId = req.user.id;
    const { companyId } = req.body;

    if (!companyId) {
        return res.status(400).json({ message: 'Company ID is required' });
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

        // Check if already in wishlist
        const [existing] = await db.execute(
            'SELECT id FROM wishlist WHERE user_id = ? AND company_id = ?',
            [userId, companyId]
        );

        if (existing.length > 0) {
            return res.status(400).json({ message: 'Company already in wishlist' });
        }

        await db.execute(
            'INSERT INTO wishlist (user_id, company_id) VALUES (?, ?)',
            [userId, companyId]
        );

        res.status(201).json({ message: 'Company added to wishlist' });
    } catch (error) {
        console.error('Error adding to wishlist:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Remove company from wishlist
// @route   DELETE /api/wishlist/:companyId
// @access  Private
const removeFromWishlist = async (req, res) => {
    const userId = req.user.id;
    const { companyId } = req.params;

    try {
        const [result] = await db.execute(
            'DELETE FROM wishlist WHERE user_id = ? AND company_id = ?',
            [userId, companyId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Company not in wishlist' });
        }

        res.status(200).json({ message: 'Company removed from wishlist' });
    } catch (error) {
        console.error('Error removing from wishlist:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get user's wishlist
// @route   GET /api/wishlist
// @access  Private
const getWishlist = async (req, res) => {
    const userId = req.user.id;

    try {
        const sql = `
            SELECT w.*, u.name as company_name, u.logo, u.category, u.country, u.city,
                   AVG(r.rating) as average_rating
            FROM wishlist w
            JOIN users u ON w.company_id = u.id
            LEFT JOIN reviews r ON u.id = r.company_id AND r.status = 'approved'
            WHERE w.user_id = ?
            GROUP BY w.id
            ORDER BY w.created_at DESC
        `;

        const [rows] = await db.execute(sql, [userId]);

        const wishlist = rows.map(item => ({
            ...item,
            average_rating: item.average_rating ? Math.round(item.average_rating * 10) / 10 : 0
        }));

        res.status(200).json(wishlist);
    } catch (error) {
        console.error('Error fetching wishlist:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export {
    addToWishlist,
    removeFromWishlist,
    getWishlist
};
