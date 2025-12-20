// routes/ticketRoutes.js
import express from 'express';
const router = express.Router();
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
    createTicket,
    getMyTickets,
    getAllTickets,
    getTicketsByStatus,
    updateTicketStatus,
    getTicketDetails
} from '../controllers/ticketController.js';

// User routes
router.post('/create', protect, createTicket);
router.get('/my-tickets', protect, getMyTickets);
router.get('/:id', protect, getTicketDetails);

// Admin routes
router.get('/admin/all', protect, authorize('admin'), getAllTickets);
router.get('/admin/status/:status', protect, authorize('admin'), getTicketsByStatus);
router.put('/:id/status', protect, authorize('admin'), updateTicketStatus);

export default router;