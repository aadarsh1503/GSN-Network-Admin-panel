import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";

// Public components
import Navbar from "./components/Navbar/Navbar";
import Footer from "./components/Footer/Footer";
import Hero from "./components/Hero/Hero";
import LoginPage from "./components/Login/Login";
import AdminLayout from "./layouts/AdminLayout";
import Dashboard from "./pages/DashboardContent/DashboardContent";
import LogisticsCategories from "./pages/LogisticsCategories/LogisticsCategories";
import BusinessCategories from "./pages/BusinessCategories/BusinessCategories";
import User from "./pages/Users/Users";
import BusinessOwners from "./pages/Users/BusinessOwners";
import CompanyOwners from "./pages/Users/CompanyOwners";
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
import Dispute from "./pages/Dispute/Dispute";
import Subscribers from "./pages/Subscribers/Subscribers";
import ContactsList from "./pages/ContactsList/ContactsList";
import BankDetailEditor from "./pages/BankDetailEditor/BankDetailEditor";
import GeneralSettings from "./pages/GeneralSettings/GeneralSettings";
import SendNotifications from "./pages/Notifications/SendNotifications";
import SendEmails from "./pages/Notifications/SendEmails";
import UserProfile from "./pages/UserProfile/UserProfile";

// Admin components and layout


function App() {
  return (
    <Router>
      {/* The Routes component will handle rendering the correct layout */}
      <Routes>
        {/* --- PUBLIC ROUTES --- */}
        {/* These routes will have the public Navbar and Footer */}
        <Route path="/" element={
          <>
            <Navbar />
            <Hero />
            <Footer />
          </>
        } />
        <Route path="/login" element={
          <>
            <Navbar />
            <LoginPage />
            <Footer />
          </>
        } />

        {/* --- ADMIN ROUTES --- */}
        {/* All routes starting with /admin will be rendered inside the AdminLayout */}
        <Route path="/admin" element={<AdminLayout />}>
        
          {/* The index route for /admin will be the Dashboard */}
          <Route index element={<Dashboard />} />
          <Route path="logistics-categories" element={<LogisticsCategories />} /> 
          <Route path="business-categories" element={<BusinessCategories />} /> 
          <Route path="users" element={<User />} /> 
          <Route path="business-Owners" element={<BusinessOwners />} /> 
          <Route path="company-Owners" element={<CompanyOwners />} /> 
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
          <Route path="disputes" element={<Dispute />} /> 
          <Route path="subscribers" element={<Subscribers />} /> 
          <Route path="subscribers" element={<Subscribers />} /> 
          <Route path="contactList" element={<ContactsList />} /> 
          <Route path="BankDetail" element={<BankDetailEditor />} /> 
          <Route path="general-settings" element={<GeneralSettings />} /> 
          <Route path="send-notifications" element={<SendNotifications />} /> 
          <Route path="send-emails" element={<SendEmails />} /> 
          <Route path="user-Profile" element={<UserProfile />} /> 









          













          













          {/* You can add more admin pages like this */}
          {/* e.g., <Route path="users" element={<AdminUsersPage />} /> */}
          {/* e.g., <Route path="settings" element={<AdminSettingsPage />} /> */}
        </Route>

      </Routes>
    </Router>
  );
}

export default App;