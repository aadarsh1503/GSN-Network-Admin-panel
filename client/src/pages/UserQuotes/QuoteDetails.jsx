import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  AiOutlineArrowLeft,
  AiOutlineArrowRight,
  AiOutlineApartment,
  AiOutlineBank,
  AiOutlineCalendar,
  AiOutlineCar,
  AiOutlineCheckCircle,
  AiOutlineClockCircle,
  AiOutlineCloseCircle,
  AiOutlineCloudUpload,
  AiOutlineContainer,
  AiOutlineCreditCard,
  AiOutlineDollar,
  AiOutlineEnvironment,
  AiOutlineEye,
  AiOutlineFileText,
  AiOutlineGlobal,
  AiOutlineInbox,
  AiOutlineMessage,
  AiOutlinePhone,
  AiOutlineSafetyCertificate,
  AiOutlineStar,
  AiOutlineSync,
  AiOutlineTeam,
  AiOutlineTrophy,
  AiOutlineWarning
} from 'react-icons/ai';
import toast from 'react-hot-toast';
import { api } from '../../utils/api';
import QuotePaymentModal from '../../components/QuotePayment/QuotePaymentModal';
import CompanyProfileModal from '../../components/CompanyProfileModal/CompanyProfileModal';
import { useCurrency } from '../../contexts/CurrencyContext';

// Shared glass surface style
const GLASS = 'bg-white/60 backdrop-blur-xl border border-white/60 rounded-2xl shadow-[0_12px_32px_-16px_rgba(15,23,42,0.22)]';

// Compact Response Row Component
const CompactResponseRow = ({
  response,
  quote,
  onAccept,
  onReject,
  onViewCompany,
  onUploadPayment,
  onMessageCompany,
  actionLoading,
  hasAcceptedResponse,
  hasUploadedPaymentToAnyCompany,
  formatDate
}) => {
  const [showDetails, setShowDetails] = useState(false);

  // Quote prices are stored in USD; display them in the buyer's local currency
  // with the USD equivalent underneath.
  const { format, formatUsd } = useCurrency();
  const amount = response.has_coupon ? Number(response.coupon_final_amount) : response.price;

  const isAccepted = response.user_response_status === 'accepted';
  const isRejected = response.user_response_status === 'rejected';

  const getStatusBadge = () => {
    const base = 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border';
    if (isAccepted) {
      if (response.payment_status === 'verified') return <span className={`${base} bg-emerald-50 text-emerald-700 border-emerald-200`}><AiOutlineCheckCircle /> Approved</span>;
      if (response.payment_status === 'rejected') return <span className={`${base} bg-rose-50 text-rose-700 border-rose-200`}><AiOutlineCloseCircle /> Rejected</span>;
      if (response.payment_status === 'pending') return <span className={`${base} bg-amber-50 text-amber-700 border-amber-200`}><AiOutlineClockCircle /> Pending</span>;
      return <span className={`${base} bg-[#bca142]/15 text-[#8f7a2e] border-[#bca142]/30`}><AiOutlineCheckCircle /> Accepted</span>;
    }
    if (isRejected) return <span className={`${base} bg-slate-100 text-slate-600 border-slate-200`}><AiOutlineCloseCircle /> Rejected</span>;
    return <span className={`${base} bg-slate-100 text-slate-600 border-slate-200`}><AiOutlineClockCircle /> Pending</span>;
  };

  return (
    <div className={`rounded-2xl p-5 backdrop-blur-md border transition-all duration-300 ${
      isAccepted
        ? 'border-[#bca142]/50 bg-gradient-to-r from-emerald-50/70 to-[#fdf6e8]/80 ring-1 ring-[#bca142]/30 shadow-[0_10px_26px_-14px_rgba(188,161,66,0.45)]'
        : isRejected
        ? 'border-rose-200 bg-rose-50/50'
        : 'border-white/60 bg-white/70 hover:border-[#bca142]/50 hover:shadow-[0_10px_26px_-16px_rgba(15,23,42,0.25)]'
    }`}>
      {/* Top Row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1 min-w-[220px]">
          {/* Company mark */}
          <div className="relative w-11 h-11 rounded-xl flex items-center justify-center shadow-md shrink-0"
            style={{ background: 'linear-gradient(135deg, #d4b55e, #bca142)' }}>
            <AiOutlineApartment className="text-white text-lg" />
            {isAccepted && (
              <div className="absolute -top-1 -right-1 w-4.5 h-4.5 p-0.5 bg-emerald-500 rounded-full flex items-center justify-center">
                <AiOutlineCheckCircle className="text-white text-[10px]" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-semibold text-slate-900 truncate">{response.company_name}</h4>
              {isAccepted && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#bca142] text-white text-[11px] font-bold rounded-full">
                  <AiOutlineTrophy /> APPROVED
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500 truncate">{response.company_email}</p>
          </div>
        </div>

        {/* Key metrics */}
        <div className="flex items-center gap-5 text-sm">
          <div className="flex items-center gap-1.5">
            <AiOutlineDollar className="text-[#bca142] text-base" />
            <span className="font-bold text-slate-900">
              {format(amount, 'USD')}
              <span className="block text-[10px] font-normal text-gray-400">≈ {formatUsd(amount, 'USD')}</span>
            </span>
            {response.has_coupon && (
              <span className="text-xs text-slate-400 line-through">{format(Number(response.coupon_original_amount), 'USD')}</span>
            )}
          </div>
          {response.has_coupon && (
            <div className="flex items-center gap-1.5 text-[#8f7a2e]">
              <AiOutlineSafetyCertificate className="text-[#bca142] text-base" />
              <span className="font-semibold text-xs">
                {response.coupon_discount_type === 'percentage'
                  ? `${Number(response.coupon_discount_value)}% off`
                  : `${format(Number(response.coupon_discount_value), 'USD')} off`}
              </span>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-slate-700">
            <AiOutlineClockCircle className="text-[#bca142] text-base" />
            <span className="font-medium">{response.transit_time}</span>
          </div>
          {response.valid_until && (
            <div className="flex items-center gap-1.5 text-slate-700">
              <AiOutlineCalendar className="text-[#bca142] text-base" />
              <span className="font-medium">Valid: {formatDate(response.valid_until)}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">{getStatusBadge()}</div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-slate-200/70">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/80 border border-slate-200 text-slate-700 hover:border-[#bca142]/50 hover:text-[#8f7a2e] transition-colors text-sm font-medium"
        >
          <AiOutlineEye />
          <span>{showDetails ? 'Hide' : 'View'} Details</span>
        </button>

        <button
          onClick={onViewCompany}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/80 border border-slate-200 text-slate-700 hover:border-[#bca142]/50 hover:text-[#8f7a2e] transition-colors text-sm font-medium"
        >
          <AiOutlineApartment />
          <span>Company</span>
        </button>

        <button
          onClick={onMessageCompany}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/80 border border-slate-200 text-slate-700 hover:border-[#bca142]/50 hover:text-[#8f7a2e] transition-colors text-sm font-medium"
        >
          <AiOutlineMessage />
          <span>Message</span>
        </button>

        <div className="flex-1" />

        {/* Quick actions */}
        {isAccepted ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white text-sm font-bold rounded-lg">
            <AiOutlineCheckCircle />
            <span>SELECTED</span>
          </span>
        ) : !hasAcceptedResponse && !response.user_response_status && (
          <>
            {(Boolean(response.payment_proof_uploaded) || (!response.bank_name && !response.account_number)) ? (
              <>
                <button
                  onClick={onAccept}
                  disabled={actionLoading === response.id}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-white rounded-lg text-sm font-semibold transition-all disabled:opacity-50 shadow-sm"
                  style={{ background: 'linear-gradient(135deg, #34a853, #1e8e3e)' }}
                >
                  <AiOutlineCheckCircle />
                  <span>Accept</span>
                </button>
                <button
                  onClick={onReject}
                  disabled={actionLoading === response.id}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-white/80 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  <AiOutlineCloseCircle />
                  <span>Reject</span>
                </button>
              </>
            ) : (response.bank_name || response.account_number) && !hasUploadedPaymentToAnyCompany && (
              <button
                onClick={onUploadPayment}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-white rounded-lg text-sm font-semibold transition-all shadow-sm"
                style={{ background: 'linear-gradient(135deg, #d4b55e, #bca142)' }}
              >
                <AiOutlineCloudUpload />
                <span>Pay</span>
              </button>
            )}
          </>
        )}
      </div>

      {/* Expandable Details */}
      {showDetails && (
        <div className="mt-4 pt-4 border-t border-slate-200/70 space-y-4">
          {(response.inclusions || response.value_added_services || response.terms || response.notes) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {response.inclusions && (
                <div className="bg-white/70 rounded-xl p-4 border border-slate-200/80">
                  <h5 className="font-semibold text-slate-800 mb-2 flex items-center gap-2 text-sm">
                    <AiOutlineCheckCircle className="text-[#bca142]" />
                    <span>Inclusions</span>
                  </h5>
                  <p className="text-slate-600 text-sm leading-relaxed">{response.inclusions}</p>
                </div>
              )}

              {response.value_added_services && (
                <div className="bg-white/70 rounded-xl p-4 border border-slate-200/80">
                  <h5 className="font-semibold text-slate-800 mb-2 flex items-center gap-2 text-sm">
                    <AiOutlineStar className="text-[#bca142]" />
                    <span>Value Added Services</span>
                  </h5>
                  <p className="text-slate-600 text-sm leading-relaxed">{response.value_added_services}</p>
                </div>
              )}

              {response.terms && (
                <div className="bg-white/70 rounded-xl p-4 border border-slate-200/80">
                  <h5 className="font-semibold text-slate-800 mb-2 flex items-center gap-2 text-sm">
                    <AiOutlineSafetyCertificate className="text-[#bca142]" />
                    <span>Terms &amp; Conditions</span>
                  </h5>
                  <p className="text-slate-600 text-sm leading-relaxed">{response.terms}</p>
                </div>
              )}

              {response.notes && (
                <div className="bg-white/70 rounded-xl p-4 border border-slate-200/80">
                  <h5 className="font-semibold text-slate-800 mb-2 flex items-center gap-2 text-sm">
                    <AiOutlineTrophy className="text-[#bca142]" />
                    <span>Additional Notes</span>
                  </h5>
                  <p className="text-slate-600 text-sm leading-relaxed">{response.notes}</p>
                </div>
              )}
            </div>
          )}

          {/* Bank Details */}
          {(response.bank_name || response.account_number) && (
            <div className="bg-white/70 rounded-xl p-5 border border-[#bca142]/30">
              <h5 className="font-semibold text-slate-800 mb-4 flex items-center gap-2 text-sm">
                <AiOutlineBank className="text-[#bca142]" />
                <span>Payment Bank Details</span>
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  ['Bank Name', response.bank_name],
                  ['Account Holder', response.account_holder_name],
                  ['Account Number', response.account_number],
                  ['SWIFT Code', response.swift_code],
                  ['IFSC Code', response.ifsc_code],
                  ['Branch', response.branch_name]
                ].filter(([, v]) => v).map(([label, value]) => (
                  <div key={label}>
                    <span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1">{label}</span>
                    <p className="text-slate-800 font-semibold text-sm">{value}</p>
                  </div>
                ))}
              </div>
              {response.bank_instructions && (
                <div className="mt-4 p-3 bg-[#bca142]/10 rounded-lg border border-[#bca142]/20">
                  <span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1">Instructions</span>
                  <p className="text-slate-700 text-sm">{response.bank_instructions}</p>
                </div>
              )}
            </div>
          )}

          {/* Payment Status */}
          {isAccepted && (
            <div className="space-y-3">
              {response.payment_status === 'pending' && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <div className="flex items-center gap-2">
                    <AiOutlineCreditCard className="text-amber-600" />
                    <span className="font-semibold text-amber-800 text-sm">Payment Verification Pending</span>
                  </div>
                  <p className="text-amber-700 text-sm mt-1">Your payment proof is being verified by the company.</p>
                </div>
              )}

              {response.payment_status === 'verified' && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                  <div className="flex items-center gap-2">
                    <AiOutlineCheckCircle className="text-emerald-600" />
                    <span className="font-semibold text-emerald-800 text-sm">Payment Verified</span>
                  </div>
                  <p className="text-emerald-700 text-sm mt-1">Your payment has been verified. The service will begin as scheduled.</p>
                </div>
              )}

              {response.payment_status === 'rejected' && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
                  <div className="flex items-center gap-2">
                    <AiOutlineCloseCircle className="text-rose-600" />
                    <span className="font-semibold text-rose-800 text-sm">Payment Verification Failed</span>
                  </div>
                  <p className="text-rose-700 text-sm mt-1">Please contact the company or upload a clearer payment proof.</p>
                  {response.payment_company_notes && (
                    <p className="text-rose-600 text-xs mt-1">Note: {response.payment_company_notes}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Action Buttons inside Details */}
          {!hasAcceptedResponse && !response.user_response_status && (
            <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-slate-200/70">
              {!Boolean(response.payment_proof_uploaded) && (response.bank_name || response.account_number) && !hasUploadedPaymentToAnyCompany && (
                <div className="bg-[#bca142]/10 border border-[#bca142]/30 rounded-xl p-4 flex items-center justify-between gap-3 flex-1">
                  <div>
                    <h6 className="font-semibold text-[#8f7a2e] text-sm">Payment Required First</h6>
                    <p className="text-slate-600 text-xs">Make payment and upload proof before accepting.</p>
                  </div>
                  <button
                    onClick={onUploadPayment}
                    className="inline-flex items-center gap-1.5 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm"
                    style={{ background: 'linear-gradient(135deg, #d4b55e, #bca142)' }}
                  >
                    <AiOutlineCloudUpload />
                    <span>Upload Payment</span>
                  </button>
                </div>
              )}

              {Boolean(response.payment_proof_uploaded) && (
                <div className="flex gap-3 flex-1">
                  <button
                    onClick={onAccept}
                    disabled={actionLoading === response.id}
                    className="flex-1 inline-flex items-center justify-center gap-2 text-white font-semibold py-2.5 px-4 rounded-xl transition-all disabled:opacity-50 shadow-sm"
                    style={{ background: 'linear-gradient(135deg, #34a853, #1e8e3e)' }}
                  >
                    <AiOutlineCheckCircle />
                    <span>Accept Quote</span>
                  </button>
                  <button
                    onClick={onReject}
                    disabled={actionLoading === response.id}
                    className="flex-1 inline-flex items-center justify-center gap-2 bg-white/80 border border-rose-200 text-rose-600 hover:bg-rose-50 font-semibold py-2.5 px-4 rounded-xl transition-colors disabled:opacity-50"
                  >
                    <AiOutlineCloseCircle />
                    <span>Reject Quote</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const QuoteDetails = () => {
  const { quoteId } = useParams();
  const navigate = useNavigate();
  const [quote, setQuote] = useState(null);
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedResponseForPayment, setSelectedResponseForPayment] = useState(null);
  const [showCompanyProfileModal, setShowCompanyProfileModal] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);

  useEffect(() => {
    fetchQuoteDetails();
    fetchQuoteResponses();
  }, [quoteId]);

  const fetchQuoteDetails = async () => {
    try {
      const quotes = await api.get('/api/user-quotes/my-quotes');
      const currentQuote = Array.isArray(quotes) ? quotes.find(q => q.id === parseInt(quoteId)) : null;
      setQuote(currentQuote);
    } catch (error) {
      console.error('Error fetching quote details:', error);
      toast.error('Failed to fetch quote details');
    }
  };

  const fetchQuoteResponses = async () => {
    try {
      // Use enhanced API to get responses with bank details
      const data = await api.get(`/api/enhanced-quotes/${quoteId}/responses-with-bank-details`);
      setResponses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching quote responses:', error);
      toast.error('Failed to fetch quote responses');
    } finally {
      setLoading(false);
    }
  };

  // Check if user has uploaded payment proof to any company for this quote
  const hasUploadedPaymentToAnyCompany = responses.some(response => Boolean(response.payment_proof_uploaded));

  const handleAcceptResponse = async (responseId, companyId) => {
    if (!window.confirm('Are you sure you want to accept this quote? This action cannot be undone.')) {
      return;
    }

    setActionLoading(responseId);
    try {
      await api.post('/api/user-quotes/accept-response', {
        quoteId: parseInt(quoteId),
        quoteResponseId: responseId,
        companyId: companyId
      });

      toast.success('Quote accepted successfully! Your payment is being verified by the company. Work will begin once payment is confirmed.');
      fetchQuoteResponses();
      fetchQuoteDetails();
    } catch (error) {
      console.error('Error accepting quote response:', error);
      toast.error(error.message || 'Failed to accept quote response');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectResponse = async (responseId, companyId) => {
    if (!window.confirm('Are you sure you want to reject this quote?')) {
      return;
    }

    setActionLoading(responseId);
    try {
      await api.post('/api/user-quotes/reject-response', {
        quoteId: parseInt(quoteId),
        quoteResponseId: responseId,
        companyId: companyId
      });

      toast.success('Quote response rejected. The company has been notified.');
      fetchQuoteResponses();
    } catch (error) {
      console.error('Error rejecting quote response:', error);
      toast.error(error.message || 'Failed to reject quote response');
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Get rejected response for top banner
  const getRejectedResponse = () => {
    return Array.isArray(responses) ? responses.find(response => response.payment_status === 'rejected') : null;
  };

  // Function to navigate to messages with specific company
  const handleMessageCompany = (companyId, companyName) => {
    navigate('/user/messages', {
      state: {
        selectedCompanyId: companyId,
        selectedCompanyName: companyName
      }
    });
  };

  const hasAcceptedResponse = Array.isArray(responses) ? responses.some(response => response.user_response_status === 'accepted') : false;

  // Resolve the approved/winning company (same fallback strategy used elsewhere)
  const findApprovedResponse = () => {
    if (!Array.isArray(responses) || responses.length === 0) return null;
    return (
      responses.find(r => r.user_response_status === 'accepted' && r.payment_status === 'verified') ||
      responses.find(r => r.user_response_status === 'accepted') ||
      responses.find(r => r.payment_status === 'verified') ||
      responses.find(r => r.payment_proof_uploaded) ||
      (quote && quote.status === 'approved' ? responses.find(r => r.company_name && r.company_email) : null)
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(145deg, #faf8f0 0%, #fdf6e8 50%, #f7f3e7 100%)' }}>
        <div className={`${GLASS} flex flex-col items-center gap-4 px-12 py-9`}>
          <div className="relative h-12 w-12">
            <div className="absolute inset-0 rounded-full border-4 border-[#bca142]/20" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#bca142] animate-spin" />
          </div>
          <p className="text-slate-600 font-medium text-sm">Loading quote details…</p>
        </div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4"
        style={{ background: 'linear-gradient(145deg, #faf8f0 0%, #fdf6e8 50%, #f7f3e7 100%)' }}>
        <div className={`${GLASS} max-w-sm text-center px-10 py-10`}>
          <div className="mx-auto w-14 h-14 rounded-2xl bg-[#bca142]/15 text-[#bca142] flex items-center justify-center mb-4 text-2xl">
            <AiOutlineFileText />
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-1">Quote not found</h3>
          <p className="text-sm text-slate-500 mb-5">This quote may have been removed or the link is incorrect.</p>
          <Link
            to="/user/quotes"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold text-sm shadow-md"
            style={{ background: 'linear-gradient(135deg, #d4b55e, #bca142)' }}
          >
            <AiOutlineArrowLeft /> Back to Quotes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden"
      style={{ background: 'linear-gradient(145deg, #faf8f0 0%, #fdf6e8 50%, #f7f3e7 100%)' }}>

      {/* Soft gold orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[520px] h-[520px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(188,161,66,0.18) 0%, transparent 70%)', filter: 'blur(50px)' }} />
        <div className="absolute -bottom-40 -right-40 w-[440px] h-[440px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(188,161,66,0.14) 0%, transparent 70%)', filter: 'blur(50px)' }} />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Approved Banner */}
        {quote.status === 'approved' && (
          <div className={`${GLASS} p-6 border-[#bca142]/40`}>
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl shadow-md shrink-0"
                style={{ background: 'linear-gradient(135deg, #d4b55e, #bca142)' }}>
                <AiOutlineCheckCircle className="text-white text-xl" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-slate-900 mb-2">Quote Approved</h3>
                <p className="text-slate-600 leading-relaxed mb-4">
                  Your payment has been verified and your quote has been approved. The company will begin
                  working on your shipment as scheduled.
                </p>
                {(() => {
                  const acceptedResponse = findApprovedResponse();
                  return acceptedResponse ? (
                    <div className="bg-white/70 rounded-xl p-4 border border-[#bca142]/25">
                      <div className="flex items-center gap-3">
                        <AiOutlineApartment className="text-[#bca142] text-lg" />
                        <div>
                          <p className="text-slate-900 font-semibold">{acceptedResponse.company_name}</p>
                          <p className="text-slate-500 text-sm">{acceptedResponse.company_email}</p>
                          {acceptedResponse.company_phone && (
                            <p className="text-slate-500 text-sm flex items-center gap-1.5 mt-1">
                              <AiOutlinePhone /> <span>{acceptedResponse.company_phone}</span>
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="mt-3 text-sm text-slate-600">
                        {acceptedResponse.payment_status === 'verified' ? (
                          <p className="font-medium flex items-center gap-1.5"><AiOutlineCheckCircle className="text-emerald-600" /> Payment verified and approved by this company</p>
                        ) : acceptedResponse.user_response_status === 'accepted' ? (
                          <p className="font-medium flex items-center gap-1.5"><AiOutlineCheckCircle className="text-emerald-600" /> Quote accepted by this company</p>
                        ) : (
                          <p className="font-medium flex items-center gap-1.5"><AiOutlineCheckCircle className="text-emerald-600" /> This company is handling your approved quote</p>
                        )}
                        {acceptedResponse.verification_date && (
                          <p className="text-xs text-slate-400 mt-1">
                            Verified on: {formatDate(acceptedResponse.verification_date)}
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white/70 rounded-xl p-4 border border-[#bca142]/25">
                      <div className="flex items-center gap-3">
                        <AiOutlineApartment className="text-[#bca142] text-lg" />
                        <div>
                          <p className="text-slate-900 font-semibold">Approved Company</p>
                          <p className="text-slate-500 text-sm">Your quote has been approved and is being processed</p>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* Payment Rejection Banner */}
        {(() => {
          const rejectedResponse = getRejectedResponse();
          return rejectedResponse && (
            <div className={`${GLASS} p-6 sm:p-8 border-rose-200/80`}>
              <div className="flex items-start gap-5">
                <div className="p-4 bg-rose-500 rounded-2xl shrink-0 shadow-md">
                  <AiOutlineCloseCircle className="text-white text-2xl" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">Payment Verification Failed</h3>
                  <p className="text-slate-600 leading-relaxed mb-6">
                    Unfortunately, your payment proof was not accepted by the company. Please review the reason
                    below and take appropriate action.
                  </p>

                  <div className="bg-white/70 rounded-xl p-4 border border-slate-200/80 mb-6">
                    <div className="flex items-center gap-3">
                      <AiOutlineApartment className="text-slate-700 text-lg" />
                      <div>
                        <p className="text-slate-900 font-semibold">{rejectedResponse.company_name}</p>
                        <p className="text-slate-500 text-sm">{rejectedResponse.company_email}</p>
                      </div>
                    </div>
                  </div>

                  {rejectedResponse.payment_company_notes && (
                    <div className="bg-white/70 rounded-xl p-5 border border-slate-200/80 mb-6">
                      <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                        <AiOutlineWarning className="text-rose-500" /> Reason for Rejection
                      </h4>
                      <div className="bg-white rounded-lg p-4 border border-slate-200/80">
                        <p className="text-slate-700 leading-relaxed">"{rejectedResponse.payment_company_notes}"</p>
                      </div>
                    </div>
                  )}

                  {rejectedResponse.rejection_date && (
                    <div className="flex items-center gap-3 text-slate-500 mb-6">
                      <AiOutlineCalendar />
                      <p className="font-medium text-sm"><strong className="text-slate-700">Rejected on:</strong> {formatDate(rejectedResponse.rejection_date)}</p>
                    </div>
                  )}

                  <div className="bg-white/70 rounded-xl p-5 border border-[#bca142]/25">
                    <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                      <AiOutlineWarning className="text-[#bca142]" /> Next Steps
                    </h4>
                    <ul className="text-slate-600 space-y-2 text-sm">
                      {[
                        'Review the rejection reason above carefully',
                        'Contact the company directly for clarification if needed',
                        'Upload a new, clearer payment proof if possible',
                        'Consider accepting quotes from other companies'
                      ].map((step, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-[#bca142] font-bold">{i + 1}.</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Header */}
        <div className={`${GLASS} p-6`}>
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <Link
              to="/user/quotes"
              className="group flex items-center gap-2 text-slate-600 hover:text-[#bca142] transition-colors"
            >
              <span className="p-2 bg-white/80 rounded-xl border border-slate-200 shadow-sm group-hover:border-[#bca142]/50 transition-colors">
                <AiOutlineArrowLeft className="text-sm" />
              </span>
              <span className="font-semibold text-sm">Back to My Quotes</span>
            </Link>

            <div className="flex items-center gap-3">
              {/* Status pill */}
              <div className={`px-4 py-2 rounded-xl border font-semibold text-sm shadow-sm ${
                quote.status === 'pending' ? 'bg-white/80 text-[#8f7a2e] border-[#bca142]/40' :
                quote.status === 'approved' ? 'bg-[#bca142] text-white border-[#bca142]' :
                quote.status === 'running' ? 'bg-[#bca142] text-white border-[#bca142]' :
                quote.status === 'closed' ? 'bg-slate-700 text-white border-slate-700' :
                'bg-slate-800 text-white border-slate-800'
              }`}>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${
                    quote.status === 'pending' ? 'bg-[#bca142] animate-pulse' : 'bg-white'
                  }`} />
                  <span className="capitalize">
                    {quote.status}
                    {quote.status === 'approved' && ' ✓'}
                  </span>
                </div>
              </div>

              {/* Refresh */}
              <button
                onClick={async () => {
                  setLoading(true);
                  await fetchQuoteDetails();
                  await fetchQuoteResponses();
                  setLoading(false);
                  toast.success('Status updated!');
                }}
                className="flex items-center gap-2 text-white px-4 py-2 rounded-xl shadow-md transition-all hover:scale-[1.02]"
                style={{ background: 'linear-gradient(135deg, #d4b55e, #bca142)' }}
                title="Refresh status"
              >
                <AiOutlineSync />
                <span className="text-sm font-semibold">Refresh</span>
              </button>

              <div className="flex items-center gap-2 bg-white/80 px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
                <AiOutlineTeam className="text-[#bca142]" />
                <span className="text-slate-700 font-semibold text-sm">{responses.length} Responses</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl font-bold text-slate-900">Quote #{quote.id}</h1>

            <div className="flex flex-wrap items-center gap-3 text-slate-600">
              <div className="flex items-center gap-2 bg-white/80 px-3 py-1.5 rounded-lg border border-slate-200">
                <AiOutlineEnvironment className="text-[#bca142]" />
                <span className="font-semibold text-sm">
                  {quote.departure_city}
                  {quote.departure_state && `, ${quote.departure_state}`}
                </span>
              </div>
              <AiOutlineArrowRight className="text-[#bca142]" />
              <div className="flex items-center gap-2 bg-white/80 px-3 py-1.5 rounded-lg border border-slate-200">
                <AiOutlineEnvironment className="text-[#bca142]" />
                <span className="font-semibold text-sm">
                  {quote.arrival_city}
                  {quote.arrival_state && `, ${quote.arrival_state}`}
                </span>
              </div>
              <div className="h-4 w-px bg-slate-300" />
              <div className="flex items-center gap-2 bg-white/80 px-3 py-1.5 rounded-lg border border-slate-200">
                <AiOutlineCar className="text-[#bca142]" />
                <span className="font-semibold text-sm">{quote.shipping_mode}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Company Responses */}
        {Array.isArray(responses) && responses.length > 0 ? (
          <div className={`${GLASS} p-6`}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl shadow-md"
                  style={{ background: 'linear-gradient(135deg, #d4b55e, #bca142)' }}>
                  <AiOutlineTeam className="text-white text-lg" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Company Responses</h2>
                  {(() => {
                    const approvedCompany = (quote && quote.status === 'approved') ? findApprovedResponse() : null;
                    return approvedCompany && (
                      <p className="text-sm text-[#8f7a2e] font-semibold flex items-center gap-1.5 mt-0.5">
                        <AiOutlineTrophy />
                        <span>Approved: {approvedCompany.company_name}</span>
                      </p>
                    );
                  })()}
                </div>
              </div>
              <div className="text-sm text-slate-500 font-medium">
                {responses.length} Response{responses.length !== 1 ? 's' : ''}
              </div>
            </div>

            <div className="space-y-4">
              {(() => {
                // Filter responses based on quote status
                let filteredResponses = Array.isArray(responses) ? responses : [];

                // If quote is approved, show only the company that accepted the payment
                if (quote && quote.status === 'approved') {
                  filteredResponses = responses.filter(response => {
                    const isAccepted = response.user_response_status === 'accepted';
                    const hasVerifiedPayment = response.payment_status === 'verified';
                    const hasVerifiedPaymentStatus = response.payment_verification_status === 'verified';
                    const hasPaymentProof = Boolean(response.payment_proof_uploaded);

                    return isAccepted || hasVerifiedPayment || hasVerifiedPaymentStatus || hasPaymentProof;
                  });

                  if (filteredResponses.length === 0) {
                    filteredResponses = responses.filter(response =>
                      Boolean(response.payment_proof_uploaded) || response.user_response_status
                    );
                  }
                }

                // Sort responses to put approved company first
                const sortedResponses = filteredResponses.sort((a, b) => {
                  if (a.user_response_status === 'accepted' && b.user_response_status !== 'accepted') return -1;
                  if (b.user_response_status === 'accepted' && a.user_response_status !== 'accepted') return 1;
                  return 0;
                });

                return sortedResponses.map((response) => (
                  <CompactResponseRow
                    key={response.id}
                    response={response}
                    quote={quote}
                    onAccept={() => handleAcceptResponse(response.id, response.company_id)}
                    onReject={() => handleRejectResponse(response.id, response.company_id)}
                    onViewCompany={() => {
                      setSelectedCompanyId(response.company_id);
                      setShowCompanyProfileModal(true);
                    }}
                    onUploadPayment={() => {
                      setSelectedResponseForPayment({
                        ...response,
                        quote_id: quote.id,
                        amount: response.price,
                        company_name: response.company_name,
                        bank_details: {
                          bank_name: response.bank_name,
                          account_holder_name: response.account_holder_name,
                          account_number: response.account_number,
                          routing_number: response.routing_number,
                          swift_code: response.swift_code,
                          ifsc_code: response.ifsc_code,
                          branch_name: response.branch_name,
                          branch_address: response.branch_address,
                          instructions: response.bank_instructions
                        }
                      });
                      setShowPaymentModal(true);
                    }}
                    onMessageCompany={() => handleMessageCompany(response.company_id, response.company_name)}
                    actionLoading={actionLoading}
                    hasAcceptedResponse={hasAcceptedResponse}
                    hasUploadedPaymentToAnyCompany={hasUploadedPaymentToAnyCompany}
                    formatDate={formatDate}
                  />
                ));
              })()}
            </div>
          </div>
        ) : (
          <div className={`${GLASS} p-6`}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl shadow-md"
                style={{ background: 'linear-gradient(135deg, #d4b55e, #bca142)' }}>
                <AiOutlineTeam className="text-white text-lg" />
              </div>
              <h2 className="text-xl font-bold text-slate-800">Company Responses</h2>
            </div>
            <div className="text-center py-10">
              <div className="bg-[#bca142]/12 rounded-2xl p-6 w-16 h-16 mx-auto mb-4 flex items-center justify-center text-[#bca142]">
                <AiOutlineInbox className="text-3xl" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Awaiting Company Responses</h3>
              <p className="text-slate-500 text-sm max-w-md mx-auto">
                Freight companies are reviewing your quote request. You'll receive notifications as responses arrive.
              </p>
            </div>
          </div>
        )}

        {/* Shipment Details */}
        <div className={`${GLASS} p-6`}>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl shadow-md"
              style={{ background: 'linear-gradient(135deg, #d4b55e, #bca142)' }}>
              <AiOutlineContainer className="text-white text-lg" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Shipment Details</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white/70 rounded-xl p-5 border border-slate-200/80">
              <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2 text-sm">
                <AiOutlineContainer className="text-[#bca142]" />
                <span>Product Information</span>
              </h3>
              <div className="space-y-3">
                {[
                  ['Product', quote.product_description],
                  ['Shipping Mode', quote.shipping_mode],
                  ['Arrival Date', formatDate(quote.arrival_date)],
                  ['Quantity', quote.quantity],
                  ['Weight', quote.weight]
                ].filter(([, v]) => v).map(([label, value]) => (
                  <div key={label} className="flex justify-between items-start gap-4">
                    <span className="text-slate-500 font-medium text-sm shrink-0">{label}:</span>
                    <span className="text-slate-800 font-semibold text-sm text-right">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/70 rounded-xl p-5 border border-slate-200/80">
              <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2 text-sm">
                <AiOutlineGlobal className="text-[#bca142]" />
                <span>Route Information</span>
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-start gap-4">
                  <span className="text-slate-500 font-medium text-sm shrink-0">From:</span>
                  <span className="text-slate-800 font-semibold text-sm text-right">
                    {quote.departure_city}
                    {quote.departure_state && `, ${quote.departure_state}`}
                    {quote.departure_country && `, ${quote.departure_country}`}
                  </span>
                </div>
                <div className="flex justify-between items-start gap-4">
                  <span className="text-slate-500 font-medium text-sm shrink-0">To:</span>
                  <span className="text-slate-800 font-semibold text-sm text-right">
                    {quote.arrival_city}
                    {quote.arrival_state && `, ${quote.arrival_state}`}
                    {quote.arrival_country && `, ${quote.arrival_country}`}
                  </span>
                </div>
                {quote.incoterms && (
                  <div className="flex justify-between items-start gap-4">
                    <span className="text-slate-500 font-medium text-sm shrink-0">Incoterms:</span>
                    <span className="text-slate-800 font-semibold text-sm text-right">{quote.incoterms}</span>
                  </div>
                )}
                {quote.packing && (
                  <div className="flex justify-between items-start gap-4">
                    <span className="text-slate-500 font-medium text-sm shrink-0">Packing:</span>
                    <span className="text-slate-800 font-semibold text-sm text-right">{quote.packing}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {quote.notes && (
            <div className="mt-6 bg-white/70 rounded-xl p-5 border border-slate-200/80">
              <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2 text-sm">
                <AiOutlineCalendar className="text-[#bca142]" />
                <span>Additional Notes</span>
              </h3>
              <p className="text-slate-600 leading-relaxed text-sm">{quote.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedResponseForPayment && (
        <QuotePaymentModal
          quote={selectedResponseForPayment}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedResponseForPayment(null);
          }}
          onSuccess={() => {
            setShowPaymentModal(false);
            setSelectedResponseForPayment(null);
            fetchQuoteResponses(); // Refresh to show updated payment status
          }}
        />
      )}

      {/* Company Profile Modal */}
      {showCompanyProfileModal && selectedCompanyId && (
        <CompanyProfileModal
          companyId={selectedCompanyId}
          onClose={() => {
            setShowCompanyProfileModal(false);
            setSelectedCompanyId(null);
          }}
        />
      )}
    </div>
  );
};

export default QuoteDetails;
