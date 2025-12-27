import express from 'express';
const router = express.Router();
import { 
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
} from '../controllers/companyController.js';
import { protect } from '../middleware/authMiddleware.js';
import { upload } from '../config/cloudinary.js'; 

// Profile Routes
router.route('/profile')
    .get(protect, getCompanyProfile)
    .put(protect, upload.fields([
        { name: 'logo', maxCount: 1 },
        { name: 'incharge_image', maxCount: 1 }
    ]), updateCompanyProfile);

// Branch Routes
router.route('/branches')
    .post(protect, addCompanyBranch)
    .get(protect, getCompanyBranches);

router.route('/branches/:id')
    .delete(protect, deleteCompanyBranch)
    .put(protect, updateCompanyBranch);

// Member Routes
router.route('/members')
    .post(protect, addCompanyMember)
    .get(protect, getCompanyMembers);

router.route('/members/:id')
    .delete(protect, deleteCompanyMember)
    .put(protect, updateCompanyMember);

export default router;