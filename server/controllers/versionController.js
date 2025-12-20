import db from '../config/db.js';

// @desc    Get current system version
// @route   GET /api/version/current
// @access  Public
const getCurrentVersion = async (req, res) => {
    try {
        const [rows] = await db.execute(
            'SELECT version_number, description, created_at FROM system_versions WHERE is_current = 1 LIMIT 1'
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'No current version found' });
        }

        res.status(200).json(rows[0]);
    } catch (error) {
        console.error('Error fetching current version:', error);
        res.status(500).json({ message: 'Server error fetching version' });
    }
};

// @desc    Get all system versions (Admin only)
// @route   GET /api/version/all
// @access  Private/Admin
const getAllVersions = async (req, res) => {
    try {
        const [rows] = await db.execute(
            'SELECT * FROM system_versions ORDER BY created_at DESC'
        );

        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching all versions:', error);
        res.status(500).json({ message: 'Server error fetching versions' });
    }
};

// @desc    Create new system version (Admin only)
// @route   POST /api/version/create
// @access  Private/Admin
const createVersion = async (req, res) => {
    const { version_number, description } = req.body;
    const userId = req.user.id;

    if (!version_number) {
        return res.status(400).json({ message: 'Version number is required' });
    }

    try {
        // Check if version already exists
        const [existing] = await db.execute(
            'SELECT id FROM system_versions WHERE version_number = ?',
            [version_number]
        );

        if (existing.length > 0) {
            return res.status(400).json({ message: 'Version number already exists' });
        }

        // Set all versions to not current
        await db.execute('UPDATE system_versions SET is_current = 0');

        // Create new version as current
        const [result] = await db.execute(
            'INSERT INTO system_versions (version_number, description, is_current, created_by) VALUES (?, ?, 1, ?)',
            [version_number, description || '', userId]
        );

        res.status(201).json({ 
            message: 'Version created successfully',
            versionId: result.insertId,
            version_number
        });
    } catch (error) {
        console.error('Error creating version:', error);
        res.status(500).json({ message: 'Server error creating version' });
    }
};

// @desc    Update current version (Admin only)
// @route   PUT /api/version/set-current/:id
// @access  Private/Admin
const setCurrentVersion = async (req, res) => {
    const { id } = req.params;

    try {
        // Check if version exists
        const [version] = await db.execute(
            'SELECT id, version_number FROM system_versions WHERE id = ?',
            [id]
        );

        if (version.length === 0) {
            return res.status(404).json({ message: 'Version not found' });
        }

        // Set all versions to not current
        await db.execute('UPDATE system_versions SET is_current = 0');

        // Set specified version as current
        await db.execute(
            'UPDATE system_versions SET is_current = 1 WHERE id = ?',
            [id]
        );

        res.status(200).json({ 
            message: 'Current version updated successfully',
            version_number: version[0].version_number
        });
    } catch (error) {
        console.error('Error setting current version:', error);
        res.status(500).json({ message: 'Server error updating current version' });
    }
};

export {
    getCurrentVersion,
    getAllVersions,
    createVersion,
    setCurrentVersion
};