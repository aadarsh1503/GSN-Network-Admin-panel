// controllers/companyController.js
import db from '../config/db.js';

// @desc    Get company profile
// @route   GET /api/company/profile
const getCompanyProfile = async (req, res) => {
    const userId = req.user.id;

    try {
        const [rows] = await db.execute('SELECT * FROM users WHERE id = ?', [userId]);
        const userProfile = rows[0];

        if (!userProfile) {
            return res.status(404).json({ message: 'Company profile not found' });
        }

        delete userProfile.password;
        res.status(200).json(userProfile);
    } catch (error) {
        console.error('Error fetching company profile:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update company profile
// @route   PUT /api/company/profile
const updateCompanyProfile = async (req, res) => {
    const userId = req.user.id;
    
    // 1. Handle Data from FormData
    // When using multer, text fields are in req.body, file is in req.file
    const {
        owner_name, owner_phone, incharge_name, incharge_phone,
        skype, website, facebook, twitter, instagram, linkedin,
        category, country, state, city, name, 
        services, // stringified JSON coming from frontend
        map_location, company_address, about_company
    } = req.body;

    try {
        // 2. Handle Logo Upload
        let logoUrl = null;
        
        // If a file was uploaded successfully to Cloudinary via middleware
        if (req.file && req.file.path) {
            logoUrl = req.file.path;
        }

        // 3. Construct SQL Query
        // We check if logoUrl exists to decide whether to update the logo column
        let sql;
        let values;

        // Note: We parse services because usually FormData sends it as a string, 
        // but we need to store it as a JSON string.
        // If it's already a string from frontend, keep it. If array, stringify.
        let servicesString = services;
        if (typeof services !== 'string') {
            servicesString = JSON.stringify(services || []);
        }

        if (logoUrl) {
            // Update WITH logo
            sql = `
                UPDATE users SET
                    owner_name = ?, owner_phone = ?, incharge_name = ?, incharge_phone = ?,
                    skype = ?, website = ?, facebook = ?, twitter = ?, instagram = ?, linkedin = ?,
                    category = ?, country = ?, state = ?, city = ?, name = ?,
                    services = ?, map_location = ?, company_address = ?, about_company = ?, 
                    logo = ?
                WHERE id = ?
            `;
            values = [
                owner_name, owner_phone, incharge_name, incharge_phone,
                skype, website, facebook, twitter, instagram, linkedin,
                category, country, state, city, name,
                servicesString, map_location, company_address, about_company, 
                logoUrl, userId
            ];
        } else {
            // Update WITHOUT changing logo
            sql = `
                UPDATE users SET
                    owner_name = ?, owner_phone = ?, incharge_name = ?, incharge_phone = ?,
                    skype = ?, website = ?, facebook = ?, twitter = ?, instagram = ?, linkedin = ?,
                    category = ?, country = ?, state = ?, city = ?, name = ?,
                    services = ?, map_location = ?, company_address = ?, about_company = ?
                WHERE id = ?
            `;
            values = [
                owner_name, owner_phone, incharge_name, incharge_phone,
                skype, website, facebook, twitter, instagram, linkedin,
                category, country, state, city, name,
                servicesString, map_location, company_address, about_company,
                userId
            ];
        }
        
        await db.execute(sql, values);

        // Return the new logo URL so frontend can update immediately
        res.status(200).json({ 
            message: 'Profile updated successfully', 
            logo: logoUrl 
        });

    } catch (error) {
        console.error('Error updating company profile:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
const addCompanyBranch = async (req, res) => {
    const companyId = req.user.id; // From JWT Token

    const {
        branchName, branchPhone, branchEmail, country,
        state, city, branchAddress, skype, facebook,
        twitter, instagram, whatsapp, linkedin,
        mapLocation, website, telephone
    } = req.body;

    if (!branchName) {
        return res.status(400).json({ message: 'Branch Name is required' });
    }

    try {
        const sql = `
            INSERT INTO company_branches (
                company_id, branch_name, branch_phone, branch_email, 
                country, state, city, address, 
                skype, facebook, twitter, instagram, 
                whatsapp, linkedin, map_location, website, telephone
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            companyId, branchName, branchPhone, branchEmail,
            country, state, city, branchAddress,
            skype, facebook, twitter, instagram,
            whatsapp, linkedin, mapLocation, website, telephone
        ];

        await db.execute(sql, values);

        res.status(201).json({ message: 'Branch added successfully' });

    } catch (error) {
        console.error('Error adding branch:', error);
        res.status(500).json({ message: 'Server error while adding branch' });
    }
};

// @desc    Get all branches for the logged-in company
// @route   GET /api/company/branches
const getCompanyBranches = async (req, res) => {
    const companyId = req.user.id;

    try {
        const sql = `SELECT * FROM company_branches WHERE company_id = ? ORDER BY id DESC`;
        const [rows] = await db.execute(sql, [companyId]);

        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching branches:', error);
        res.status(500).json({ message: 'Server error fetching branches' });
    }
};
const deleteCompanyBranch = async (req, res) => {
    const branchId = req.params.id;
    const companyId = req.user.id; // Ensure user owns this branch

    try {
        // Only delete if the branch belongs to the logged-in company
        const sql = 'DELETE FROM company_branches WHERE id = ? AND company_id = ?';
        const [result] = await db.execute(sql, [branchId, companyId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Branch not found or unauthorized' });
        }

        res.status(200).json({ message: 'Branch deleted successfully' });
    } catch (error) {
        console.error('Error deleting branch:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
const addCompanyMember = async (req, res) => {
    const companyId = req.user.id;
    
    // Note: 'branch' from frontend formData contains the branch_id
    const {
        branch, memberName, memberPhone, memberEmail, memberRole,
        skype, facebook, twitter, instagram, whatsapp, linkedin
    } = req.body;

    if (!branch || !memberName) {
        return res.status(400).json({ message: 'Branch and Member Name are required' });
    }

    try {
        const sql = `
            INSERT INTO company_members (
                company_id, branch_id, member_name, member_phone, member_email, member_role,
                skype, facebook, twitter, instagram, whatsapp, linkedin
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            companyId, branch, memberName, memberPhone, memberEmail, memberRole,
            skype, facebook, twitter, instagram, whatsapp, linkedin
        ];

        await db.execute(sql, values);

        res.status(201).json({ message: 'Member added successfully' });

    } catch (error) {
        console.error('Error adding member:', error);
        res.status(500).json({ message: 'Server error while adding member' });
    }
};

// @desc    Get all members for the logged-in company
// @route   GET /api/company/members
const getCompanyMembers = async (req, res) => {
    const companyId = req.user.id;

    try {
        // We join with company_branches to get the branch name for display purposes later
        const sql = `
            SELECT cm.*, cb.branch_name 
            FROM company_members cm
            JOIN company_branches cb ON cm.branch_id = cb.id
            WHERE cm.company_id = ? 
            ORDER BY cm.id DESC
        `;
        const [rows] = await db.execute(sql, [companyId]);

        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching members:', error);
        res.status(500).json({ message: 'Server error fetching members' });
    }
};
const deleteCompanyMember = async (req, res) => {
    const memberId = req.params.id;
    const companyId = req.user.id; // Security check: user must own the data

    try {
        const sql = 'DELETE FROM company_members WHERE id = ? AND company_id = ?';
        const [result] = await db.execute(sql, [memberId, companyId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Member not found or unauthorized' });
        }

        res.status(200).json({ message: 'Member deleted successfully' });
    } catch (error) {
        console.error('Error deleting member:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
const updateCompanyMember = async (req, res) => {
    const memberId = req.params.id;
    const companyId = req.user.id; // Security: Ensure user owns this member

    const {
        branch, memberName, memberPhone, memberEmail, memberRole,
        skype, facebook, twitter, instagram, whatsapp, linkedin
    } = req.body;

    try {
        const sql = `
            UPDATE company_members SET 
                branch_id = ?, member_name = ?, member_phone = ?, member_email = ?, member_role = ?,
                skype = ?, facebook = ?, twitter = ?, instagram = ?, whatsapp = ?, linkedin = ?
            WHERE id = ? AND company_id = ?
        `;

        const values = [
            branch, memberName, memberPhone, memberEmail, memberRole,
            skype, facebook, twitter, instagram, whatsapp, linkedin,
            memberId, companyId
        ];

        const [result] = await db.execute(sql, values);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Member not found or unauthorized' });
        }

        res.status(200).json({ message: 'Member updated successfully' });

    } catch (error) {
        console.error('Error updating member:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
const updateCompanyBranch = async (req, res) => {
    const branchId = req.params.id;
    const companyId = req.user.id; // Security: User must own the branch

    const {
        branchName, branchPhone, branchEmail, country,
        state, city, branchAddress, skype, facebook,
        twitter, instagram, whatsapp, linkedin,
        mapLocation, website, telephone
    } = req.body;

    try {
        const sql = `
            UPDATE company_branches SET 
                branch_name = ?, branch_phone = ?, branch_email = ?, 
                country = ?, state = ?, city = ?, address = ?, 
                skype = ?, facebook = ?, twitter = ?, instagram = ?, 
                whatsapp = ?, linkedin = ?, map_location = ?, website = ?, telephone = ?
            WHERE id = ? AND company_id = ?
        `;

        const values = [
            branchName, branchPhone, branchEmail, country,
            state, city, branchAddress, skype, facebook,
            twitter, instagram, whatsapp, linkedin,
            mapLocation, website, telephone,
            branchId, companyId
        ];

        const [result] = await db.execute(sql, values);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Branch not found or unauthorized' });
        }

        res.status(200).json({ message: 'Branch updated successfully' });

    } catch (error) {
        console.error('Error updating branch:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update exports
export { 
    getCompanyProfile, 
    updateCompanyProfile, 
    addCompanyBranch, 
    getCompanyBranches,
    deleteCompanyBranch,
    addCompanyMember,
    getCompanyMembers,
    deleteCompanyMember,
    updateCompanyMember,
    updateCompanyBranch
};