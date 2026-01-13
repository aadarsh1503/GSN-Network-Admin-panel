// index.js

import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors'; // You will need CORS for your React app
import companyRoutes from './routes/companyRoutes.js';
import invoiceRoutes from './routes/invoiceRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import logisticsCategoryRoutes from './routes/logisticsCategoryRoutes.js';
import businessCategoryRoutes from './routes/businessCategoryRoutes.js';
import quoteRoutes from './routes/quoteRoutes.js';
import quoteResponseRoutes from './routes/quoteResponseRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import ticketRoutes from './routes/ticketRoutes.js';
import directoryRoutes from './routes/directoryRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import wishlistRoutes from './routes/wishlistRoutes.js';
import suggestionRoutes from './routes/suggestionRoutes.js';
import subscriptionRoutes from './routes/subscriptionRoutes.js';
import userQuoteRoutes from './routes/userQuoteRoutes.js';
import userNotificationRoutes from './routes/userNotificationRoutes.js';
import companyQuoteRoutes from './routes/companyQuoteRoutes.js';
import versionRoutes from './routes/versionRoutes.js';
import testRoutes from './routes/testRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import adminPanelRoutes from './routes/adminPanelRoutes.js';
import disputeRoutes from './routes/disputeRoutes.js';
import emailRoutes from './routes/emailRoutes.js';
import generalSettingsRoutes from './routes/generalSettingsRoutes.js';
import bankDetailsRoutes from './routes/bankDetailsRoutes.js';
import realTimeNotificationRoutes from './routes/realTimeNotificationRoutes.js';
import businessRoutes from './routes/businessRoutes.js';
import businessDirectoryRoutes from './routes/businessDirectoryRoutes.js';
import businessQuoteRoutes from './routes/businessQuoteRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import enhancedQuoteRoutes from './routes/enhancedQuoteRoutes.js';
import emailQueueRoutes from './routes/emailQueueRoutes.js';
// ==========================================================
// CONFIGURE DOTENV AT THE VERY TOP
dotenv.config();
// ==========================================================

import userRoutes from './routes/userRoutes.js';

// For debugging: check if the variable is loaded
console.log('JWT Secret Loaded:', process.env.JWT_SECRET ? 'Yes' : 'No'); 

const app = express();
const PORT = process.env.PORT || 5001;

// Middlewares
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Middleware to parse JSON bodies
app.use('/uploads', express.static('uploads')); // Serve uploaded files

// Mount the user routes
app.use('/api/user', userRoutes);
app.use('/api/user-quotes', userQuoteRoutes);
app.use('/api/user-notifications', userNotificationRoutes);
app.use('/api/company-quotes', companyQuoteRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/company/invoices', invoiceRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/logistics-categories', logisticsCategoryRoutes);
app.use('/api/business-categories', businessCategoryRoutes);
app.use('/api/quotes', quoteRoutes);
app.use('/api/quote-responses', quoteResponseRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/directory', directoryRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/suggestions', suggestionRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/disputes', disputeRoutes);
app.use('/api/version', versionRoutes);
app.use('/api/test', testRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin-panel', adminPanelRoutes);
app.use('/api/admin', emailRoutes);
app.use('/api/general-settings', generalSettingsRoutes);
app.use('/api/bank-details', bankDetailsRoutes);
app.use('/api/notifications', realTimeNotificationRoutes);
app.use('/api/business', businessRoutes);
app.use('/api/business-directory', businessDirectoryRoutes);
app.use('/api', businessRoutes); // Mount business directory routes at /api level for public access
app.use('/api/business-quotes', businessQuoteRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/enhanced-quotes', enhancedQuoteRoutes);
app.use('/api/email-queue', emailQueueRoutes);

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});