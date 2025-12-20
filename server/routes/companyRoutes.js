import express from 'express';
const router = express.Router();
import { 
    getCompanyProfile, 
    updateCompanyProfile, 
    addCompanyBranch,
    getCompanyBranches,
    deleteCompanyBranch,
    addCompanyMember,   // Import this
    getCompanyMembers,   // Import this
    deleteCompanyMember,
    updateCompanyMember,
    updateCompanyBranch
} from '../controllers/companyController.js';
import { protect } from '../middleware/authMiddleware.js';
import { upload } from '../config/cloudinary.js'; 

// Existing Profile Routes
router.route('/profile')
    .get(protect, getCompanyProfile)
    .put(protect, upload.single('logo'), updateCompanyProfile);

// Existing Branch Routes
router.route('/branches')
    .post(protect, addCompanyBranch)
    .get(protect, getCompanyBranches);

router.route('/branches/:id')
    .delete(protect, deleteCompanyBranch);

// --- NEW MEMBER ROUTES ---
router.route('/members')
    .post(protect, addCompanyMember)  // Add Member
    .get(protect, getCompanyMembers); // Get Members List
    router.route('/members')
    .post(protect, addCompanyMember)
    .get(protect, getCompanyMembers);

router.route('/members/:id') // <--- New Route for Deleting Members
    .delete(protect, deleteCompanyMember);
    router.route('/members/:id')
    .delete(protect, deleteCompanyMember)
    .put(protect, updateCompanyMember); // <--- Add PUT route

    router.route('/branches/:id')
    .delete(protect, deleteCompanyBranch)
    .put(protect, updateCompanyBranch);

export default router;