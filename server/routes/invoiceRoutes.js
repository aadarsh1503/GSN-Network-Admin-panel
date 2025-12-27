// routes/invoiceRoutes.js
import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
    getCompanyInvoices,
    getInvoiceDetails,
    downloadInvoice
} from '../controllers/invoiceController.js';

const router = express.Router();

// All routes require authentication and 'company' role
router.use(protect);
router.use(authorize('company'));

// Invoice routes
router.get('/', getCompanyInvoices);
router.get('/:id', getInvoiceDetails);
router.get('/:id/download', downloadInvoice);

export default router;