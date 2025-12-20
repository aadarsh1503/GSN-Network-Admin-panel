import db from '../config/db.js';

// @desc    Get all business categories
// @route   GET /api/business-categories
// @access  Public
const getBusinessCategories = async (req, res) => {
    try {
        const sql = 'SELECT * FROM business_categories ORDER BY name ASC';
        const [rows] = await db.execute(sql);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching business categories:', error);
        res.status(500).json({ message: 'Server error fetching categories' });
    }
};

// @desc    Add a new business category
// @route   POST /api/business-categories
// @access  Private/Admin
const addBusinessCategory = async (req, res) => {
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({ message: 'Category name is required' });
    }

    try {
        // Check for duplicates
        const [existing] = await db.execute(
            'SELECT id FROM business_categories WHERE name = ?', 
            [name]
        );

        if (existing.length > 0) {
            return res.status(400).json({ message: 'This category already exists' });
        }

        const [result] = await db.execute(
            'INSERT INTO business_categories (name) VALUES (?)', 
            [name]
        );

        const newCategory = {
            id: result.insertId,
            name: name
        };

        res.status(201).json(newCategory);
    } catch (error) {
        console.error('Error adding business category:', error);
        res.status(500).json({ message: 'Server error adding category' });
    }
};

// @desc    Update a business category
// @route   PUT /api/business-categories/:id
// @access  Private/Admin
const updateBusinessCategory = async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({ message: 'Category name is required' });
    }

    try {
        // Check if name exists for a different ID
        const [existing] = await db.execute(
            'SELECT id FROM business_categories WHERE name = ? AND id != ?', 
            [name, id]
        );

        if (existing.length > 0) {
            return res.status(400).json({ message: 'Another category with this name already exists' });
        }

        await db.execute(
            'UPDATE business_categories SET name = ? WHERE id = ?', 
            [name, id]
        );

        res.status(200).json({ id: parseInt(id), name });

    } catch (error) {
        console.error('Error updating business category:', error);
        res.status(500).json({ message: 'Server error updating category' });
    }
};

// @desc    Delete a business category
// @route   DELETE /api/business-categories/:id
// @access  Private/Admin
const deleteBusinessCategory = async (req, res) => {
    const { id } = req.params;

    try {
        await db.execute('DELETE FROM business_categories WHERE id = ?', [id]);
        res.status(200).json({ message: 'Category deleted successfully' });
    } catch (error) {
        console.error('Error deleting business category:', error);
        res.status(500).json({ message: 'Server error deleting category' });
    }
};

export { 
    getBusinessCategories, 
    addBusinessCategory, 
    updateBusinessCategory,
    deleteBusinessCategory 
};