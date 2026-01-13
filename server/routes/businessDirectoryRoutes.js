// routes/businessDirectoryRoutes.js
import express from 'express';
const router = express.Router();
import {
    getBusinessDirectoryFilters,
    getBusinessDirectoryBusinesses,
    getBusinessDirectoryBusiness
} from '../controllers/businessController.js';

// Public business directory routes (no authentication required)
router.get('/filters', getBusinessDirectoryFilters);
router.get('/businesses', getBusinessDirectoryBusinesses);
router.get('/business/:id', getBusinessDirectoryBusiness);

export default router;