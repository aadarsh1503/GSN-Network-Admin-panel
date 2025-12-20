// routes/directoryRoutes.js
import express from 'express';
const router = express.Router();
import {
    getMembershipDirectory,
    getCompanyProfile,
    getDirectoryFilters
} from '../controllers/directoryController.js';

// Public routes - no authentication required
router.get('/companies', getMembershipDirectory);
router.get('/company/:id', getCompanyProfile);
router.get('/filters', getDirectoryFilters);

export default router;