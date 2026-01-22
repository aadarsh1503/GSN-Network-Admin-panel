import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Outlet, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { LoadingProvider } from "./contexts/LoadingContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { GlobalNotificationProvider } from "./contexts/GlobalNotificationContext";
import { SubscriptionProvider } from "./contexts/SubscriptionContext";
import activityTracker from "./utils/activityTracker";
import { getToken } from "./utils/api";
import "./App.css";
import "./styles/notifications.css";

// --- Layouts & Global Components ---
import Navbar from "./components/Navbar/Navbar";
import Footer from "./components/Footer/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminLayout from "./layouts/AdminLayout";
import CompanyLayout from "./layouts/CompanyLayout";
import UnauthorizedPage from "./pages/UnauthorizedPage";

// --- Auth & Public Pages ---
import Hero from "./components/Hero/Hero";
import LoginPage from "./components/Login/Login";
import RegisterPage from "./components/Login/RegisterPage";
import UserRegisterPage from "./components/Login/UserRegisterPage";
import ForgotPassword from "./components/ForgotPassword/ForgotPassword";
import ResetPassword from "./components/ResetPassword/ResetPassword";

// --- Admin Pages ---
import Dashboard from "./pages/DashboardContent/DashboardContent";
import LogisticsCategories from "./pages/LogisticsCategories/LogisticsCategories";
import BusinessCategories from "./pages/BusinessCategories/BusinessCategories";
import User from "./pages/Users/Users";
import BusinessOwners from "./pages/Users/BusinessOwners";
import CompanyOwners from "./pages/Users/CompanyOwners";
import RegularUsers from "./pages/Users/RegularUsers";
import QuotesList from "./pages/Quotes/QuotesList";
import ApprovedQuotesList from "./pages/Quotes/ApprovedQuotesList";
import RejectedQuotes from "./pages/Quotes/RejectedQuotes";
import RunningQuotesList from "./pages/Quotes/RunningQuotesList";
import ClosedQuotesList from "./pages/Quotes/ClosedQuotesList";
import AllCompanyQuotesList from "./pages/CompanyQuotes/AllCompanyQuotesList";
import ApprovedCompanyQuotesList from "./pages/CompanyQuotes/ApprovedQuotesList";
import RunningQuotesListCompany from "./pages/CompanyQuotes/RunningQuotesListCompany";
import RejectedCompanyQuotesList from "./pages/CompanyQuotes/RejectedQuotesList";
import ClosedCompanyQuote from "./pages/CompanyQuotes/ClosedCompanyQuote";
import CreateSubscriptionPlan from "./pages/Subscription/CreateSubscriptionPlan";
import ManageSubscription from "./pages/Subscription/ManageSubscription";
import TransactionHistory from "./pages/Deposits/TransactionHistory";
import AllTicketsList from "./pages/SupportTicket/AllTicketsList";
import PendingTickets from "./pages/SupportTicket/PendingTickets";
import ClosedTickets from "./pages/SupportTicket/ClosedTickets";
import AnsweredTickets from "./pages/SupportTicket/AnsweredTickets";
import PolicyEditor from "./pages/PagesSection/PolicyEditor";
import TermsEditor from "./pages/PagesSection/TermsEditor";
import DisclaimerEditor from "./pages/PagesSection/DisclaimerEditor";
import DueDiligenceEditor from "./pages/PagesSection/DueDiligenceEditor";
import Suggestions from "./pages/PagesSection/Suggestions";
import ReviewReason from "./pages/Review/ReviewReason";
import Review from "./pages/Review/Review";
import DisputeReason from "./pages/Dispute/DisputeReason";
import AdminDisputes from "./pages/Admin/AdminDisputes";
import AdminMessages from "./pages/Admin/AdminMessages";
import AdminNotifications from "./pages/Admin/AdminNotifications";
import Subscribers from "./pages/Subscribers/Subscribers";
import ContactsList from "./pages/ContactsList/ContactsList";
import BankDetailEditor from "./pages/BankDetailEditor/BankDetailEditor";
import AdminBankDetails from "./pages/Admin/AdminBankDetails";
import GeneralSettings from "./pages/GeneralSettings/GeneralSettings";
import SendNotifications from "./pages/Notifications/SendNotifications";
import SendEmails from "./pages/Notifications/SendEmails";
import UserProfile from "./pages/UserProfile/UserProfile";
import ReportsPage from "./pages/Reports/ReportsPage";
import VersionManagement from "./pages/VersionManagement/VersionManagement";
import AdminSubscriptions from "./pages/Admin/AdminSubscriptions";
import AdminQuotes from "./pages/Admin/AdminQuotes";
import AdminTransactions from "./pages/Admin/AdminTransactions";
import AdminInvoices from "./pages/Admin/AdminInvoices";

// --- Company Pages ---
import CompanyDashboard from "./companyPages/CompanyDashboard/CompanyDashboard";
import MembersDirectory from "./companyPages/MembersDirectory/MembersDirectory";
import QuotesPage from "./companyPages/QuotesPage/QuotesPage";
import RequestQuote from "./companyPages/RequestQuote/RequestQuote";
import CompanyProfileDetail from "./companyPages/CompanyProfileDetail/CompanyProfileDetail";
import EditCompanyDetails from "./companyPages/EditCompanyDetails/EditCompanyDetails";
import AddCompanyBranch from "./companyPages/CompanyBranch/AddCompanyBranch";
import ManageCompanyBranch from "./companyPages/CompanyBranch/ManageCompanyBranch";
import AddCompanyMember from "./companyPages/CompanyMembers/CompanyMembers";
import ManageCompanyMember from "./companyPages/CompanyMembers/ManageCompanyMember";
import PlansPage from "./companyPages/Plans/PlansPage";
import MyCertificatePage from "./companyPages/MyCertificatePage/MyCertificatePage";
import SubscriptionPage from "./pages/SubscriptionPage";
import MemberQuotesPage from "./pages/MemberQuotesPage";
import Invoices from "./companyPages/Invoices/Invoices";
import TransactionHistorycompany from "./companyPages/TransactionHistory/TransactionHistorycompany";
import ProfileViewers from "./companyPages/ProfileViewers/ProfileViewers";
import SupportTicket from "./companyPages/Tickets/SupportTicket";
import MyTickets from "./companyPages/Tickets/CompanyTicketsManager";
import Wishlist from "./companyPages/Wishlist/Wishlist";
import IndividualQuotes from "./companyPages/IndividualQuotes/IndividualQuotes";
import MyQuotes from "./companyPages/MyQuotes/MyQuotes";
import MessagesPage from "./companyPages/MessagesPage/MessagesPage";
import SuggestionCompany from "./companyPages/Suggestion/Suggestion";
import NotificationsCompany from "./companyPages/NotificationsCompany/NotificationsCompany";
import ChangePasswordPage from "./companyPages/ChangePasswordPage/ChangePasswordPage";
import MyQuoteResponses from "./companyPages/MyQuoteResponses/MyQuoteResponses";
import BlacklistedCompanies from "./companyPages/BlacklistedCompanies/BlacklistedCompanies";

// --- User Pages ---
import UserLayout from "./layouts/UserLayout";
import UserDashboard from "./pages/UserDashboard/UserDashboard";
import UserQuotes from "./pages/UserQuotes/UserQuotes";
import QuoteDetails from "./pages/UserQuotes/QuoteDetails";
import UserMessages from "./pages/UserMessages/UserMessages";
import UserNotifications from "./pages/UserNotifications/UserNotifications";
import UserDisputes from "./pages/UserDisputes/UserDisputes";
import UserInvoices from "./pages/UserInvoices/UserInvoices";
import CompanyDisputes from "./companyPages/Disputes/CompanyDisputes";
import UserHelp from "./pages/Help/UserHelp";
import CompanyHelp from "./pages/Help/CompanyHelp";
import UserTickets from "./pages/UserTickets/UserTickets";

// --- Payment Management Components ---
import BankDetailsManager from "./components/BankDetailsManager/BankDetailsManager";
import PaymentManagement from "./components/PaymentManagement/PaymentManagement";

// --- Business Pages ---
import BusinessLayout from "./layouts/BusinessLayout";
import BusinessDashboard from "./pages/BusinessDashboard/BusinessDashboard";
import BusinessQuotes from "./pages/BusinessQuotes/BusinessQuotes";
import BusinessQuoteDetails from "./pages/BusinessQuotes/BusinessQuoteDetails";
import BusinessMessages from "./pages/BusinessMessages/BusinessMessages";
import BusinessNotifications from "./pages/BusinessNotifications/BusinessNotifications";
import BusinessDisputes from "./pages/BusinessDisputes/BusinessDisputes";
import BusinessProfile from "./pages/BusinessProfile/BusinessProfile";
import BusinessHelp from "./pages/BusinessHelp/BusinessHelp";
import BusinessInvoices from "./pages/BusinessInvoices/BusinessInvoices";
import BusinessTickets from "./pages/BusinessTickets/BusinessTickets";
import BusinessDirectoryPage from "./pages/BusinessDirectory/BusinessDirectoryPage";
import CompanyDirectoryPage from "./pages/CompanyDirectory/CompanyDirectoryPage";

// --- Components ---

// 1. ScrollToTop Component
// This component listens to route changes and scrolls the window to (0,0).
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

// 2. Public Layout
const PublicLayout = () => (
  <>
    <Navbar />
    <Outlet />
    <Footer />
  </>
);

function App() {
  // Initialize activity tracker when app starts
  useEffect(() => {
    const token = getToken();
    if (token) {
      activityTracker.startTracking();
      console.log('🚀 Activity tracker initialized');
    }

    // Cleanup on unmount
    return () => {
      activityTracker.stopTracking();
    };
  }, []);

  return (
    <LoadingProvider>
      <NotificationProvider>
        <GlobalNotificationProvider>
          <SubscriptionProvider>
            <Router>
            {/* ScrollToTop must be inside Router to access useLocation */}
            <ScrollToTop />
            
            {/* Global Toaster Configuration for react-hot-toast */}
            <Toaster
              position="top-center"
              toastOptions={{
                duration: 3000,
              }}
            />

            {/* Global Toast Container for react-toastify */}
            <ToastContainer
              position="top-right"
              autoClose={5000}
              hideProgressBar={false}
              newestOnTop={true}
              closeOnClick={true}
              rtl={false}
              pauseOnFocusLoss={false}
              draggable={true}
              pauseOnHover={true}
              theme="light"
              limit={5}
              style={{
                zIndex: 9999
              }}
            />

      <Routes>
        {/* ================= PUBLIC ROUTES ================= */}
        <Route path="/" element={<PublicLayout />}>
          <Route index element={<Hero />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="user-register" element={<UserRegisterPage />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="reset-password" element={<ResetPassword />} />
          <Route path="quote" element={<RequestQuote />} />
          <Route path="subscriptions" element={<SubscriptionPage />} />
          <Route path="/company/freight-quotes" element={<QuotesPage />} />
          <Route path="business-directory" element={<BusinessDirectoryPage />} />
          <Route path="company-directory" element={<CompanyDirectoryPage />} />
        </Route>

        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        {/* ================= ADMIN ROUTES ================= */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="logistics-categories" element={<LogisticsCategories />} />
          <Route path="business-categories" element={<BusinessCategories />} />
          <Route path="users" element={<User />} />
          <Route path="business-Owners" element={<BusinessOwners />} />
          <Route path="company-Owners" element={<CompanyOwners />} />
          <Route path="regular-users" element={<RegularUsers />} />
          <Route path="quote-List" element={<QuotesList />} />
          <Route path="approved-Quotes" element={<ApprovedQuotesList />} />
          <Route path="rejected-Quotes" element={<RejectedQuotes />} />
          <Route path="running-Quotes" element={<RunningQuotesList />} />
          <Route path="closed-Quotes" element={<ClosedQuotesList />} />
          <Route path="all-company-Quotes" element={<AllCompanyQuotesList />} />
          <Route path="all-approved-Quotes" element={<ApprovedCompanyQuotesList />} />
          <Route path="all-rejected-Quotes" element={<RejectedCompanyQuotesList />} />
          <Route path="all-running-Quotes" element={<RunningQuotesListCompany />} />
          <Route path="all-closed-Quotes" element={<ClosedCompanyQuote />} />
          <Route path="create-Subscription" element={<CreateSubscriptionPlan />} />
          <Route path="manage-Subscription" element={<ManageSubscription />} />
          <Route path="transaction-History" element={<TransactionHistory />} />
          <Route path="all-Ticket" element={<AllTicketsList />} />
          <Route path="pending-Ticket" element={<PendingTickets />} />
          <Route path="closed-Ticket" element={<ClosedTickets />} />
          <Route path="answered-Ticket" element={<AnsweredTickets />} />
          <Route path="policy" element={<PolicyEditor />} />
          <Route path="terms" element={<TermsEditor />} />
          <Route path="disclaimer" element={<DisclaimerEditor />} />
          <Route path="dueDiligenceEditor" element={<DueDiligenceEditor />} />
          <Route path="suggestion" element={<Suggestions />} />
          <Route path="review-Reason" element={<ReviewReason />} />
          <Route path="all-reviews" element={<Review />} />
          <Route path="dispute-Reason" element={<DisputeReason />} />
          <Route path="disputes" element={<AdminDisputes />} />
          <Route path="messages" element={<AdminMessages />} />
          <Route path="subscribers" element={<Subscribers />} />
          <Route path="contactList" element={<ContactsList />} />
          <Route path="BankDetail" element={<BankDetailEditor />} />
          <Route path="bank-details" element={<AdminBankDetails />} />
          <Route path="general-settings" element={<GeneralSettings />} />
          <Route path="notifications" element={<AdminNotifications />} />
          <Route path="send-notifications" element={<SendNotifications />} />
          <Route path="send-emails" element={<SendEmails />} />
          <Route path="user-Profile" element={<UserProfile />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="version-management" element={<VersionManagement />} />
          <Route path="subscriptions-management" element={<AdminSubscriptions />} />
          <Route path="quotes-management" element={<AdminQuotes />} />
          <Route path="transactions-management" element={<AdminTransactions />} />
          <Route path="invoices-management" element={<AdminInvoices />} />
        </Route>

        {/* ================= COMPANY ROUTES ================= */}
        <Route
          path="/company"
          element={
            <ProtectedRoute allowedRoles={["company"]}>
              <CompanyLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<CompanyDashboard />} />
          <Route path="dashboard" element={<CompanyDashboard />} />
          <Route path="member-directory" element={<MembersDirectory />} />
          <Route path="quote" element={<RequestQuote />} />
          <Route path="freight-quotes" element={<QuotesPage />} />
          <Route path="my-profile" element={<CompanyProfileDetail />} />
          <Route path="messages" element={<MessagesPage />} />
          <Route path="edit-Profile" element={<EditCompanyDetails />} />
          <Route path="add-Branch" element={<AddCompanyBranch />} />
          <Route path="manage-Branch" element={<ManageCompanyBranch />} />
          <Route path="add-member" element={<AddCompanyMember />} />
          <Route path="manage-member" element={<ManageCompanyMember />} />
          <Route path="plans" element={<PlansPage />} />
          <Route path="subscriptions" element={<SubscriptionPage />} />
          <Route path="available-quotes" element={<MemberQuotesPage />} />
          <Route path="bank-details" element={<BankDetailsManager />} />
          <Route path="payment-management" element={<PaymentManagement />} />
          <Route path="profile-certificate" element={<MyCertificatePage />} />
          <Route path="transaction-History-Company" element={<TransactionHistorycompany />} />
          <Route path="invoices" element={<Invoices />} />
          <Route path="profile-Viewers" element={<ProfileViewers />} />
          <Route path="create-Ticket" element={<SupportTicket />} />
          <Route path="my-Tickets" element={<MyTickets />} />
          <Route path="tickets" element={<MyTickets />} />
          <Route path="wishlist" element={<Wishlist />} />
          <Route path="individual-Quotes" element={<IndividualQuotes />} />
          <Route path="my-Quotes" element={<MyQuotes />} />
          <Route path="suggestions" element={<SuggestionCompany />} />
          <Route path="notification-company" element={<NotificationsCompany />} />
          <Route path="disputes" element={<CompanyDisputes />} />
          <Route path="change-Password" element={<ChangePasswordPage />} />
          <Route path="my-quote-responses" element={<MyQuoteResponses />} />
          <Route path="blacklisted-companies" element={<BlacklistedCompanies />} />
          <Route path="help" element={<CompanyHelp />} />
        </Route>

        {/* ================= USER ROUTES ================= */}
        <Route
          path="/user"
          element={
            <ProtectedRoute allowedRoles={["user"]}>
              <UserLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<UserDashboard />} />
          <Route path="dashboard" element={<UserDashboard />} />
          <Route path="quotes" element={<UserQuotes />} />
          <Route path="quotes/:quoteId" element={<QuoteDetails />} />
          <Route path="messages" element={<UserMessages />} />
          <Route path="notifications" element={<UserNotifications />} />
          <Route path="invoices" element={<UserInvoices />} />
          <Route path="disputes" element={<UserDisputes />} />
          <Route path="tickets" element={<UserTickets />} />
          <Route path="profile" element={<UserProfile />} />
          <Route path="help" element={<UserHelp />} />
        </Route>

        {/* ================= BUSINESS ROUTES ================= */}
        <Route
          path="/business"
          element={
            <ProtectedRoute allowedRoles={["business"]}>
              <BusinessLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<BusinessDashboard />} />
          <Route path="dashboard" element={<BusinessDashboard />} />
          <Route path="quotes" element={<BusinessQuotes />} />
          <Route path="quotes/:quoteId" element={<BusinessQuoteDetails />} />
          <Route path="messages" element={<BusinessMessages />} />
          <Route path="notifications" element={<BusinessNotifications />} />
          <Route path="invoices" element={<BusinessInvoices />} />
          <Route path="disputes" element={<BusinessDisputes />} />
          <Route path="tickets" element={<BusinessTickets />} />
          <Route path="profile" element={<BusinessProfile />} />
          <Route path="help" element={<BusinessHelp />} />
        </Route>
      </Routes>
    </Router>
          </SubscriptionProvider>
        </GlobalNotificationProvider>
      </NotificationProvider>
    </LoadingProvider>
  );
}

export default App;