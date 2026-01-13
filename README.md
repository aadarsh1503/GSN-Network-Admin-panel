# GSN (Global Shipping Network) - Comprehensive Platform Documentation

## 🌟 Overview

GSN is a comprehensive logistics and freight forwarding platform that connects users, companies, and businesses in the shipping industry. The platform facilitates quote requests, responses, payments, disputes, and complete workflow management for international shipping services.

## 🏗️ Architecture

### Frontend (React + Vite)
- **Framework**: React 19.1.1 with Vite build system
- **Styling**: Tailwind CSS 4.1.17 + Bootstrap 5.3.8
- **State Management**: React Context API
- **Routing**: React Router DOM 7.9.5
- **UI Components**: Headless UI, Heroicons, Lucide React
- **Notifications**: React Hot Toast + React Toastify
- **Charts**: Recharts
- **File Handling**: HTML2Canvas, jsPDF, React-to-Print

### Backend (Node.js + Express)
- **Runtime**: Node.js with ES Modules
- **Framework**: Express 5.1.0
- **Database**: MySQL 2 (mysql2 3.15.3)
- **Authentication**: JWT (jsonwebtoken 9.0.2)
- **Password Hashing**: bcryptjs 3.0.3
- **File Upload**: Multer 2.0.2 + Cloudinary 1.41.3
- **Email**: Nodemailer 7.0.11
- **CORS**: cors 2.8.5

## 👥 User Roles & Access Levels

### 1. **Admin Panel** (`/admin`)
**Role**: `admin`
**Access**: Complete system administration

#### Core Features:
- **Dashboard**: System overview, statistics, real-time monitoring
- **User Management**: 
  - All Users overview
  - Business Owners management
  - Company Owners management  
  - Regular Users management
  - User status control (active/inactive/blacklisted)
- **Quote Management**:
  - All Quotes overview
  - Approved Quotes
  - Rejected Quotes
  - Running Quotes
  - Closed Quotes
  - Company Quotes (all categories)
- **Category Management**:
  - Logistics Categories
  - Business Categories
- **Subscription Management**:
  - Create Subscription Plans
  - Manage Subscriptions
  - Subscription Analytics
- **Financial Management**:
  - Transaction History
  - Invoices Management
  - Bank Details Management
- **Support System**:
  - All Support Tickets
  - Pending Tickets
  - Answered Tickets
  - Closed Tickets
- **Dispute Resolution**:
  - All Disputes
  - Dispute Reasons Management
- **Communication**:
  - Admin Messages
  - Send Notifications
  - Send Emails
  - Email Queue Management
- **Content Management**:
  - Policy Editor
  - Terms Editor
  - Disclaimer Editor
  - Due Diligence Editor
- **System Management**:
  - General Settings
  - Version Management
  - Reports & Analytics
  - Suggestions Management
  - Review Management

#### Admin Layout Features:
- Collapsible sidebar navigation
- Real-time notifications
- Fullscreen mode toggle
- Message center with unread counts
- Profile dropdown with logout

### 2. **Company Panel** (`/company`)
**Role**: `company`
**Access**: Freight forwarding companies

#### Core Features:
- **Dashboard**: Company overview, quote statistics, revenue tracking
- **Profile Management**:
  - Company Profile Details
  - Edit Company Information
  - Logo Upload & Management
  - Certificate Management
- **Branch & Member Management**:
  - Add/Manage Company Branches
  - Add/Manage Company Members
  - Member Directory
- **Quote Management**:
  - Available Quotes (respond to user requests)
  - My Quotes (submitted responses)
  - My Quote Responses
  - Individual Quotes
  - Request Quote (for own needs)
- **Financial Operations**:
  - Bank Details Management
  - Payment Management
  - Transaction History
  - Invoices
  - Subscription Plans
- **Communication**:
  - Messages
  - Notifications
  - Support Tickets
- **Additional Features**:
  - Wishlist
  - Profile Viewers
  - Suggestions
  - Disputes Management
  - Help Center
  - Change Password

#### Company Layout Features:
- Responsive sidebar (desktop/mobile)
- Company header with notifications
- Profile dropdown with company logo
- Real-time notification system

### 3. **Business Panel** (`/business`)
**Role**: `business`
**Access**: Business users seeking shipping services

#### Core Features:
- **Dashboard**: Business overview, quote history, notifications
- **Quote Management**:
  - Request Quotes
  - My Quotes
  - Quote Details & Responses
- **Profile Management**:
  - Business Profile
  - Logo Upload
  - Company Information
- **Communication**:
  - Messages
  - Notifications
- **Financial**:
  - Invoices
  - Payment Management
- **Support**:
  - Support Tickets
  - Help Center
  - Disputes

#### Business Layout Features:
- Clean, business-focused interface
- Sidebar navigation with notification badges
- Profile management with logo display

### 4. **User Panel** (`/user`)
**Role**: `user`
**Access**: Individual users/customers

#### Core Features:
- **Dashboard**: User overview, recent activity
- **Quote Management**:
  - My Quotes
  - Quote Details
  - Quote Responses
- **Communication**:
  - Messages
  - Notifications
- **Financial**:
  - Invoices
  - Payment History
- **Support**:
  - Support Tickets
  - Help Center
  - Disputes
- **Profile**:
  - User Profile Management

#### User Layout Features:
- Simplified interface for individual users
- Essential features focus
- Mobile-responsive design

## 🔄 Core Workflows

### 1. **Quote Request & Response Workflow**

#### Step 1: Quote Creation
- **Users/Businesses** create quote requests with:
  - Shipping details (origin/destination)
  - Product information
  - Dimensions and weight
  - Special requirements (hazardous, insurance, etc.)
  - Contact information

#### Step 2: Quote Visibility
- Quotes become visible to **Companies** based on:
  - Geographic coverage
  - Service capabilities
  - Subscription status

#### Step 3: Company Response
- **Companies** submit responses with:
  - Pricing information
  - Transit time
  - Inclusions/exclusions
  - Value-added services
  - Terms and conditions
  - Bank details for payment

#### Step 4: User Selection
- **Users** review responses and can:
  - Accept a quote response
  - Reject responses
  - Request clarifications via messages

#### Step 5: Payment Process
- Upon acceptance:
  - User uploads payment proof
  - Company verifies payment
  - Quote status updates to "approved"
  - Automated email notifications sent

#### Step 6: Completion
- Quote marked as "running" during shipment
- Final status: "closed" upon completion

### 2. **Subscription Management Workflow**

#### For Companies:
1. **Plan Selection**: Choose from available subscription plans
2. **Payment**: Submit payment via bank transfer or online
3. **Verification**: Admin verifies payment
4. **Activation**: Subscription activated with benefits
5. **Renewal**: Automatic or manual renewal process

#### Subscription Benefits:
- Enhanced quote visibility
- Priority listing
- Advanced analytics
- Additional features access

### 3. **Dispute Resolution Workflow**

#### Step 1: Dispute Creation
- **Users/Businesses** can file disputes against companies
- Dispute categories and reasons selection
- Evidence upload (images, documents)
- Priority level assignment

#### Step 2: Company Response
- **Companies** receive dispute notifications
- Submit response with explanation
- Suggest resolution status
- Provide counter-evidence if needed

#### Step 3: Admin Review
- **Admins** review all evidence
- Communicate with both parties
- Make final resolution decision
- Update dispute status

#### Step 4: Resolution
- Final status: resolved/closed
- Notifications sent to all parties
- Resolution recorded for future reference

### 4. **Support Ticket System**

#### Ticket Creation:
- Users create tickets with categories
- Priority levels (low, medium, high, urgent)
- Detailed descriptions
- File attachments support

#### Admin Response:
- Admins review and respond to tickets
- Status updates (pending, answered, closed)
- Internal notes and tracking
- Response time monitoring

## 💾 Database Schema

### Core Tables:

#### Users Table
```sql
users (id, name, email, phone, password, role, category, country, state, city, 
       owner_name, owner_phone, incharge_name, incharge_phone, 
       social_media_fields, services, company_details, logo, status, is_blacklisted)
```

#### Quotes System
```sql
quotes (id, user_id, shipping_details, product_info, dimensions, 
        special_requirements, contact_info, status, timestamps)

quote_responses (id, quote_id, company_id, pricing, transit_time, 
                 inclusions, terms, bank_details, status)

user_quote_status (id, quote_id, user_id, company_id, quote_response_id, 
                   status, payment_proof_id, timestamps)
```

#### Payment System
```sql
payment_proofs (id, user_id, quote_id, file_path, upload_date)

payment_verifications (id, payment_proof_id, company_id, user_id, 
                       verification_status, company_notes, verification_date)
```

#### Communication System
```sql
messages (id, sender_id, receiver_id, subject, message, quote_id, 
          ticket_id, is_read, timestamps)

notifications (id, title, message, image_url, target_audience, created_by)

user_notifications (id, user_id, notification_id, is_read, read_at)
```

#### Support System
```sql
support_tickets (id, user_id, ticket_number, subject, category, priority, 
                 description, admin_response, admin_id, status, timestamps)

disputes (id, user_id, company_id, dispute_reason_id, title, description, 
          priority, status, company_response, resolution, timestamps)

dispute_images (id, dispute_id, image_url, image_type, timestamps)
```

#### Subscription System
```sql
membership_plans (id, name, price, duration_months, features, status)

user_subscriptions (id, user_id, plan_id, amount_paid, start_date, 
                    end_date, status, payment_method)

subscription_requests (id, user_id, plan_id, payment_proof, 
                       admin_notes, status, timestamps)
```

## 🔐 Authentication & Security

### JWT Authentication
- Token-based authentication system
- Role-based access control (RBAC)
- Protected routes for each user type
- Token expiration and refresh handling

### Password Security
- bcrypt hashing for password storage
- Password reset functionality with tokens
- Secure token generation and validation

### File Upload Security
- Cloudinary integration for secure file storage
- File type validation
- Size restrictions
- Secure URL generation

## 📧 Email System

### Automated Email Notifications:
1. **User Registration**: Welcome emails
2. **Quote Responses**: New response notifications
3. **Payment Updates**: Payment verification status
4. **Subscription Changes**: Activation/deactivation notices
5. **Dispute Updates**: Status change notifications
6. **Support Tickets**: Response notifications
7. **Admin Alerts**: System notifications

### Email Queue System:
- Background email processing
- Retry mechanisms for failed emails
- Email status tracking
- Template-based email generation

## 🔔 Real-time Features

### Notification System:
- Real-time notifications via WebSocket-like updates
- Unread count tracking
- Auto-mark as read functionality
- Role-based notification filtering

### Live Updates:
- Quote status changes
- Payment verifications
- Message notifications
- Dispute updates

## 📱 Responsive Design

### Mobile Optimization:
- Mobile-first design approach
- Responsive layouts for all user panels
- Touch-friendly interfaces
- Optimized navigation for small screens

### Cross-browser Compatibility:
- Modern browser support
- Progressive enhancement
- Fallback mechanisms

## 🚀 Deployment & Configuration

### Environment Variables:
```env
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password
DB_NAME=gsn_database

# JWT
JWT_SECRET=your_jwt_secret

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email
EMAIL_PASS=your_password
```

### Installation:
```bash
# Backend setup
cd server
npm install
npm start

# Frontend setup  
cd client
npm install
npm run dev
```

### Database Setup:
```bash
# Run database schema
mysql -u root -p < server/database_schema.sql

# Run migrations
node server/run_migration.js
```

## 📊 Analytics & Reporting

### Admin Analytics:
- User registration trends
- Quote volume statistics
- Revenue tracking
- Subscription analytics
- Dispute resolution metrics
- Support ticket performance

### Company Analytics:
- Quote response rates
- Conversion statistics
- Revenue tracking
- Customer feedback
- Performance metrics

## 🔧 API Endpoints

### Authentication:
- `POST /api/user/login` - User login
- `POST /api/user/register` - User registration
- `POST /api/user/forgot-password` - Password reset request
- `POST /api/user/reset-password` - Password reset confirmation

### Quotes:
- `GET /api/quotes` - Get quotes (role-based filtering)
- `POST /api/quotes` - Create new quote
- `PUT /api/quotes/:id` - Update quote
- `DELETE /api/quotes/:id` - Delete quote

### Quote Responses:
- `GET /api/quote-responses` - Get responses
- `POST /api/quote-responses` - Submit response
- `PUT /api/quote-responses/:id` - Update response

### Messages:
- `GET /api/messages` - Get messages
- `POST /api/messages` - Send message
- `PUT /api/messages/:id/read` - Mark as read

### Notifications:
- `GET /api/notifications` - Get notifications
- `POST /api/notifications` - Create notification
- `PUT /api/notifications/:id/read` - Mark as read

### Disputes:
- `GET /api/disputes` - Get disputes
- `POST /api/disputes` - Create dispute
- `PUT /api/disputes/:id` - Update dispute
- `POST /api/disputes/:id/respond` - Respond to dispute

### Support Tickets:
- `GET /api/tickets` - Get tickets
- `POST /api/tickets` - Create ticket
- `PUT /api/tickets/:id` - Update ticket

## 🎯 Key Features Summary

### For Admins:
✅ Complete system oversight and control  
✅ User management and role assignment  
✅ Financial transaction monitoring  
✅ Dispute resolution system  
✅ Content management capabilities  
✅ Analytics and reporting tools  

### For Companies:
✅ Quote response and management system  
✅ Customer relationship management  
✅ Financial tracking and invoicing  
✅ Branch and member management  
✅ Subscription and payment handling  
✅ Communication tools  

### For Businesses:
✅ Quote request system  
✅ Service provider comparison  
✅ Payment and invoice management  
✅ Communication with providers  
✅ Dispute filing capabilities  

### For Users:
✅ Simple quote request process  
✅ Response comparison tools  
✅ Payment tracking  
✅ Support ticket system  
✅ Communication features  

## 🔮 Future Enhancements

### Planned Features:
- Mobile applications (iOS/Android)
- Advanced analytics dashboard
- AI-powered quote matching
- Blockchain integration for transparency
- Multi-language support
- Advanced reporting tools
- API for third-party integrations
- Enhanced security features

---

## 📞 Support & Contact

For technical support or questions about the GSN platform, please:
1. Create a support ticket through the platform
2. Contact the development team
3. Refer to the API documentation
4. Check the troubleshooting guides

---

*This documentation covers the complete GSN platform workflow and functionality. The system is designed to handle the complex logistics industry requirements while maintaining user-friendly interfaces for all stakeholder types.*