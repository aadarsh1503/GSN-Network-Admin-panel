import db from '../config/db.js';

// @desc    Get all logistics categories
// @route   GET /api/logistics-categories
const getLogisticsCategories = async (req, res) => {
    try {
        const sql = 'SELECT * FROM logistics_categories ORDER BY name ASC';
        const [rows] = await db.execute(sql);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching logistics categories:', error);
        res.status(500).json({ message: 'Server error fetching categories' });
    }
};

// @desc    Add a new logistics category
// @route   POST /api/logistics-categories
const addLogisticsCategory = async (req, res) => {
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({ message: 'Category name is required' });
    }

    try {
        const [existing] = await db.execute(
            'SELECT id FROM logistics_categories WHERE name = ?', 
            [name]
        );

        if (existing.length > 0) {
            return res.status(400).json({ message: 'This category already exists' });
        }

        const [result] = await db.execute(
            'INSERT INTO logistics_categories (name) VALUES (?)', 
            [name]
        );

        const newCategory = {
            id: result.insertId,
            name: name
        };

        res.status(201).json(newCategory);
    } catch (error) {
        console.error('Error adding logistics category:', error);
        res.status(500).json({ message: 'Server error adding category' });
    }
};

// @desc    Update a logistics category
// @route   PUT /api/logistics-categories/:id
// @access  Private/Admin
const updateLogisticsCategory = async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({ message: 'Category name is required' });
    }

    try {
        // 1. Check if the name exists for a DIFFERENT id (prevent duplicates)
        const [existing] = await db.execute(
            'SELECT id FROM logistics_categories WHERE name = ? AND id != ?', 
            [name, id]
        );

        if (existing.length > 0) {
            return res.status(400).json({ message: 'Another category with this name already exists' });
        }

        // 2. Update the category
        await db.execute(
            'UPDATE logistics_categories SET name = ? WHERE id = ?', 
            [name, id]
        );

        // 3. Return updated data
        res.status(200).json({ id: parseInt(id), name });

    } catch (error) {
        console.error('Error updating logistics category:', error);
        res.status(500).json({ message: 'Server error updating category' });
    }
};

// @desc    Delete a logistics category
// @route   DELETE /api/logistics-categories/:id
const deleteLogisticsCategory = async (req, res) => {
    const { id } = req.params;

    try {
        await db.execute('DELETE FROM logistics_categories WHERE id = ?', [id]);
        res.status(200).json({ message: 'Category deleted successfully' });
    } catch (error) {
        console.error('Error deleting logistics category:', error);
        res.status(500).json({ message: 'Server error deleting category' });
    }
};

export { 
    getLogisticsCategories, 
    addLogisticsCategory,
    updateLogisticsCategory, // Export the new function
    deleteLogisticsCategory 
};