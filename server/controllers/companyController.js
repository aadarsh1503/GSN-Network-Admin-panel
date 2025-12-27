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
    // When using multer, text fields are in req.body, files are in req.files
    const {
        owner_name, owner_phone, incharge_name, incharge_phone,
        skype, website, facebook, twitter, instagram, linkedin,
        category, country, state, city, name, 
        services, // stringified JSON coming from frontend
        map_location, company_address, about_company
    } = req.body;

    try {
        // 2. Convert undefined values to null for MySQL compatibility
        const sanitizeValue = (value) => value === undefined ? null : value;

        // 3. Handle File Uploads
        let logoUrl = null;
        let inchargeImageUrl = null;
        
        // If files were uploaded successfully to Cloudinary via middleware
        if (req.files) {
            if (req.files.logo && req.files.logo[0] && req.files.logo[0].path) {
                logoUrl = req.files.logo[0].path;
            }
            if (req.files.incharge_image && req.files.incharge_image[0] && req.files.incharge_image[0].path) {
                inchargeImageUrl = req.files.incharge_image[0].path;
            }
        }
        // Fallback for single file upload (if using single file middleware)
        else if (req.file && req.file.path) {
            logoUrl = req.file.path;
        }

        // 4. Construct SQL Query
        // We check if files exist to decide whether to update the respective columns
        let sql;
        let values;

        // Note: We parse services because usually FormData sends it as a string, 
        // but we need to store it as a JSON string.
        // If it's already a string from frontend, keep it. If array, stringify.
        let servicesString = services;
        if (typeof services !== 'string') {
            servicesString = JSON.stringify(services || []);
        }

        if (logoUrl && inchargeImageUrl) {
            // Update WITH both logo and incharge image
            sql = `
                UPDATE users SET
                    owner_name = ?, owner_phone = ?, incharge_name = ?, incharge_phone = ?,
                    skype = ?, website = ?, facebook = ?, twitter = ?, instagram = ?, linkedin = ?,
                    category = ?, country = ?, state = ?, city = ?, name = ?,
                    services = ?, map_location = ?, company_address = ?, about_company = ?, 
                    logo = ?, incharge_image = ?
                WHERE id = ?
            `;
            values = [
                sanitizeValue(owner_name), sanitizeValue(owner_phone), sanitizeValue(incharge_name), sanitizeValue(incharge_phone),
                sanitizeValue(skype), sanitizeValue(website), sanitizeValue(facebook), sanitizeValue(twitter), sanitizeValue(instagram), sanitizeValue(linkedin),
                sanitizeValue(category), sanitizeValue(country), sanitizeValue(state), sanitizeValue(city), sanitizeValue(name),
                sanitizeValue(servicesString), sanitizeValue(map_location), sanitizeValue(company_address), sanitizeValue(about_company), 
                logoUrl, inchargeImageUrl, userId
            ];
        } else if (logoUrl) {
            // Update WITH logo only
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
                sanitizeValue(owner_name), sanitizeValue(owner_phone), sanitizeValue(incharge_name), sanitizeValue(incharge_phone),
                sanitizeValue(skype), sanitizeValue(website), sanitizeValue(facebook), sanitizeValue(twitter), sanitizeValue(instagram), sanitizeValue(linkedin),
                sanitizeValue(category), sanitizeValue(country), sanitizeValue(state), sanitizeValue(city), sanitizeValue(name),
                sanitizeValue(servicesString), sanitizeValue(map_location), sanitizeValue(company_address), sanitizeValue(about_company), 
                logoUrl, userId
            ];
        } else if (inchargeImageUrl) {
            // Update WITH incharge image only
            sql = `
                UPDATE users SET
                    owner_name = ?, owner_phone = ?, incharge_name = ?, incharge_phone = ?,
                    skype = ?, website = ?, facebook = ?, twitter = ?, instagram = ?, linkedin = ?,
                    category = ?, country = ?, state = ?, city = ?, name = ?,
                    services = ?, map_location = ?, company_address = ?, about_company = ?, 
                    incharge_image = ?
                WHERE id = ?
            `;
            values = [
                sanitizeValue(owner_name), sanitizeValue(owner_phone), sanitizeValue(incharge_name), sanitizeValue(incharge_phone),
                sanitizeValue(skype), sanitizeValue(website), sanitizeValue(facebook), sanitizeValue(twitter), sanitizeValue(instagram), sanitizeValue(linkedin),
                sanitizeValue(category), sanitizeValue(country), sanitizeValue(state), sanitizeValue(city), sanitizeValue(name),
                sanitizeValue(servicesString), sanitizeValue(map_location), sanitizeValue(company_address), sanitizeValue(about_company), 
                inchargeImageUrl, userId
            ];
        } else {
            // Update WITHOUT changing any images
            sql = `
                UPDATE users SET
                    owner_name = ?, owner_phone = ?, incharge_name = ?, incharge_phone = ?,
                    skype = ?, website = ?, facebook = ?, twitter = ?, instagram = ?, linkedin = ?,
                    category = ?, country = ?, state = ?, city = ?, name = ?,
                    services = ?, map_location = ?, company_address = ?, about_company = ?
                WHERE id = ?
            `;
            values = [
                sanitizeValue(owner_name), sanitizeValue(owner_phone), sanitizeValue(incharge_name), sanitizeValue(incharge_phone),
                sanitizeValue(skype), sanitizeValue(website), sanitizeValue(facebook), sanitizeValue(twitter), sanitizeValue(instagram), sanitizeValue(linkedin),
                sanitizeValue(category), sanitizeValue(country), sanitizeValue(state), sanitizeValue(city), sanitizeValue(name),
                sanitizeValue(servicesString), sanitizeValue(map_location), sanitizeValue(company_address), sanitizeValue(about_company),
                userId
            ];
        }
        
        await db.execute(sql, values);

        // Return the new URLs so frontend can update immediately
        res.status(200).json({ 
            message: 'Profile updated successfully', 
            logo: logoUrl,
            incharge_image: inchargeImageUrl
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
        // Convert undefined values to null for MySQL compatibility
        const sanitizeValue = (value) => value === undefined ? null : value;

        const sql = `
            INSERT INTO company_branches (
                company_id, branch_name, branch_phone, branch_email, 
                country, state, city, address, 
                skype, facebook, twitter, instagram, 
                whatsapp, linkedin, map_location, website, telephone
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            companyId, sanitizeValue(branchName), sanitizeValue(branchPhone), sanitizeValue(branchEmail),
            sanitizeValue(country), sanitizeValue(state), sanitizeValue(city), sanitizeValue(branchAddress),
            sanitizeValue(skype), sanitizeValue(facebook), sanitizeValue(twitter), sanitizeValue(instagram),
            sanitizeValue(whatsapp), sanitizeValue(linkedin), sanitizeValue(mapLocation), sanitizeValue(website), sanitizeValue(telephone)
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
        // Convert undefined values to null for MySQL compatibility
        const sanitizeValue = (value) => value === undefined ? null : value;

        const sql = `
            INSERT INTO company_members (
                company_id, branch_id, member_name, member_phone, member_email, member_role,
                skype, facebook, twitter, instagram, whatsapp, linkedin
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            companyId, sanitizeValue(branch), sanitizeValue(memberName), sanitizeValue(memberPhone), sanitizeValue(memberEmail), sanitizeValue(memberRole),
            sanitizeValue(skype), sanitizeValue(facebook), sanitizeValue(twitter), sanitizeValue(instagram), sanitizeValue(whatsapp), sanitizeValue(linkedin)
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
        // Convert undefined values to null for MySQL compatibility
        const sanitizeValue = (value) => value === undefined ? null : value;

        const sql = `
            UPDATE company_members SET 
                branch_id = ?, member_name = ?, member_phone = ?, member_email = ?, member_role = ?,
                skype = ?, facebook = ?, twitter = ?, instagram = ?, whatsapp = ?, linkedin = ?
            WHERE id = ? AND company_id = ?
        `;

        const values = [
            sanitizeValue(branch), sanitizeValue(memberName), sanitizeValue(memberPhone), sanitizeValue(memberEmail), sanitizeValue(memberRole),
            sanitizeValue(skype), sanitizeValue(facebook), sanitizeValue(twitter), sanitizeValue(instagram), sanitizeValue(whatsapp), sanitizeValue(linkedin),
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
        // Convert undefined values to null for MySQL compatibility
        const sanitizeValue = (value) => value === undefined ? null : value;

        const sql = `
            UPDATE company_branches SET 
                branch_name = ?, branch_phone = ?, branch_email = ?, 
                country = ?, state = ?, city = ?, address = ?, 
                skype = ?, facebook = ?, twitter = ?, instagram = ?, 
                whatsapp = ?, linkedin = ?, map_location = ?, website = ?, telephone = ?
            WHERE id = ? AND company_id = ?
        `;

        const values = [
            sanitizeValue(branchName), sanitizeValue(branchPhone), sanitizeValue(branchEmail), sanitizeValue(country),
            sanitizeValue(state), sanitizeValue(city), sanitizeValue(branchAddress), sanitizeValue(skype), sanitizeValue(facebook),
            sanitizeValue(twitter), sanitizeValue(instagram), sanitizeValue(whatsapp), sanitizeValue(linkedin),
            sanitizeValue(mapLocation), sanitizeValue(website), sanitizeValue(telephone),
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