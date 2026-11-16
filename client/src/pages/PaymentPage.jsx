import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaPaypal, FaUniversity, FaArrowLeft, FaShieldAlt, FaLock, FaWallet } from 'react-icons/fa';
import { FiAlertCircle, FiUpload, FiRefreshCw } from 'react-icons/fi';
import { subscriptionAPI, walletAPI, getPaypalClientId } from '../utils/api';
import { useCurrency } from '../contexts/CurrencyContext';
import toast from 'react-hot-toast';

const PaymentPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { plan, prorationDetails } = location.state || {};

  const [paymentMethod, setPaymentMethod] = useState('paypal');
  const [paypalLoaded, setPaypalLoaded] = useState(false);
  const [bankDetails, setBankDetails] = useState(null);
  const [transactionId, setTransactionId] = useState('');
  const [paymentProof, setPaymentProof] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [checkingPending, setCheckingPending] = useState(true);
  const paypalRef = useRef(null);
  const submitRef = useRef(false);

  // Wallet + live currency
  const [wallet, setWallet] = useState(null);
  const [walletLoading, setWalletLoading] = useState(true);
  const [walletError, setWalletError] = useState(false);
  const [rate, setRate] = useState(2.6526);
  const [applyWallet, setApplyWallet] = useState(false);
  const [walletAmount, setWalletAmount] = useState('');

  const { format, formatUsd } = useCurrency();

  const baseAmountBhd = prorationDetails ? Number(prorationDetails.amountToCharge) : (plan ? Number(plan.price) : 0);

  // ── Load ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!plan) { navigate('/subscription'); return; }
    getPaypalClientId().then((clientId) => loadPayPalScript(clientId));
    fetchBankDetails();
    checkPendingRequest();
    fetchWallet();
    fetchRate();
    const id = setInterval(fetchRate, 60000); // keep the live rate fresh
    return () => clearInterval(id);
  }, [plan, navigate]);

  const fetchWallet = async () => {
    try {
      setWalletLoading(true);
      setWalletError(false);
      setWallet(await walletAPI.getWallet());
    } catch (e) {
      console.error('wallet load failed', e);
      setWalletError(true);
    } finally {
      setWalletLoading(false);
    }
  };

  const fetchRate = async () => {
    try {
      const r = await walletAPI.getCurrencyRate();
      const live = Number(r?.bhdToUsd);
      if (live > 0) setRate(live);
    } catch { /* keep last known rate */ }
  };

  const refreshRate = async () => {
    try {
      const r = await walletAPI.getCurrencyRate(true);
      const live = Number(r?.bhdToUsd);
      if (live > 0) setRate(live);
      toast.success('Currency rate refreshed');
    } catch { toast.error('Could not refresh rate'); }
  };

  const loadPayPalScript = (clientId) => {
    if (!clientId) return;
    if (window.paypal) { setPaypalLoaded(true); return; }
    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD`;
    script.async = true;
    script.onload = () => setPaypalLoaded(true);
    script.onerror = () => toast.error('Failed to load PayPal. Please try bank transfer.');
    document.body.appendChild(script);
  };

  const fetchBankDetails = async () => {
    try { setBankDetails(await subscriptionAPI.getBankDetails()); }
    catch (e) { console.error(e); }
  };

  const checkPendingRequest = async () => {
    try {
      setCheckingPending(true);
      const r = await subscriptionAPI.getMySubscription();
      if (r && r.pending_request) {
        setHasPendingRequest(true);
        toast.error('You already have a pending subscription request.', { duration: 5000 });
      }
    } catch (e) { console.error(e); }
    finally { setCheckingPending(false); }
  };

  // ── Wallet math ───────────────────────────────────────────────────────────
  const settings = wallet?.settings || {};
  const walletBalance = Number(wallet?.balance || 0);
  const walletEnabled = !!settings.walletSubscriptionEnabled;
  const maxPct = Math.min(100, Math.max(0, Number(settings.walletMaxUsagePercent ?? 100)));
  const minUsage = Number(settings.walletMinUsageBhd || 0);
  const maxUsableByPct = Number(((baseAmountBhd * maxPct) / 100).toFixed(3));
  const maxWalletUsable = Math.max(0, Math.min(walletBalance, maxUsableByPct));

  const walletAppliedBhd = applyWallet
    ? Math.min(Number(walletAmount) || 0, maxWalletUsable, baseAmountBhd)
    : 0;
  const externalDueBhd = Number((baseAmountBhd - walletAppliedBhd).toFixed(3));
  const walletOnly = applyWallet && externalDueBhd <= 0.0005;

  // Default the wallet amount to the maximum usable when enabled
  useEffect(() => {
    if (applyWallet && (walletAmount === '' || Number(walletAmount) === 0)) {
      setWalletAmount(String(Math.min(maxWalletUsable, baseAmountBhd).toFixed(3)));
    }
    if (!applyWallet) setWalletAmount('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applyWallet, maxWalletUsable, baseAmountBhd]);

  // Re-render PayPal when the external amount changes (non wallet-only)
  useEffect(() => {
    if (paypalLoaded && paymentMethod === 'paypal' && plan && !checkingPending && !walletLoading && !walletError && !hasPendingRequest && !walletOnly) {
      const timer = setTimeout(() => renderPayPalButtons(), 100);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paypalLoaded, paymentMethod, plan, hasPendingRequest, checkingPending, walletLoading, walletError, externalDueBhd, walletOnly]);

  // ── PayPal ─────────────────────────────────────────────────────────────────
  const renderPayPalButtons = () => {
    if (!paypalRef.current || !window.paypal) return;
    paypalRef.current.innerHTML = '';
    const externalUsd = Number((externalDueBhd * rate).toFixed(2));
    if (!(externalUsd > 0)) return;

    window.paypal.Buttons({
      createOrder: async (data, actions) => {
        try {
          const r = await subscriptionAPI.getMySubscription();
          if (r && r.pending_request) { toast.error('⚠️ Pending request exists.', { duration: 10000 }); throw new Error('Pending request exists'); }
        } catch (e) { if (e.message === 'Pending request exists') throw e; }
        return actions.order.create({
          purchase_units: [{
            description: `${plan.name} Plan${walletAppliedBhd > 0 ? ' (balance applied)' : ''}`,
            amount: { currency_code: 'USD', value: externalUsd.toFixed(2) },
          }],
        });
      },
      onApprove: async (data, actions) => {
        try {
          const order = await actions.order.capture();
          await handlePayPalSuccess(order);
        } catch (e) {
          toast.error('Payment capture failed. Please contact support.', { duration: 10000 });
        }
      },
      onError: (err) => {
        const s = String(err?.message || err || '');
        if (s.includes('container element removed') || s.includes('Component closed') || s.includes('zoid') || s.includes('Pending request')) return;
        toast.error('Payment failed. Please try again or use bank transfer.', { duration: 10000 });
      },
      onCancel: () => toast.info('Payment cancelled'),
      style: { layout: 'vertical', color: 'gold', shape: 'rect', label: 'paypal' },
    }).render(paypalRef.current);
  };

  const handlePayPalSuccess = async (order) => {
    if (submitRef.current) return;
    submitRef.current = true;
    try {
      const t = toast.loading('Submitting your subscription request...');
      await subscriptionAPI.activateSubscription(plan.id, 'paypal', {
        orderId: order.id,
        payerId: order.payer?.payer_id,
        paymentDetails: order,
        prorationApplied: !!prorationDetails,
        prorationDetails,
        walletAmountApplied: walletAppliedBhd,
      });
      toast.dismiss(t);
      toast.success('✅ Payment successful! Awaiting admin approval.', { duration: 5000 });
      setTimeout(() => navigate('/company/dashboard'), 2000);
    } catch (e) {
      submitRef.current = false;
      toast.error(`❌ ${e.response?.data?.message || e.message || 'Failed to submit'}`, { duration: 10000 });
    }
  };

  // ── Full-wallet payment ────────────────────────────────────────────────────
  const payWithWallet = async () => {
    if (submitRef.current) return;
    submitRef.current = true;
    try {
      const t = toast.loading('Processing wallet payment...');
      if (prorationDetails) {
        // Proration + full wallet → go through the standard request flow
        await subscriptionAPI.activateSubscription(plan.id, 'wallet', {
          prorationApplied: true,
          prorationDetails,
          walletAmountApplied: walletAppliedBhd,
        });
        toast.dismiss(t);
        toast.success('✅ Wallet payment submitted! Awaiting admin approval.', { duration: 5000 });
      } else {
        const res = await walletAPI.paySubscriptionWithWallet({ planId: plan.id, walletAmount: walletAppliedBhd });
        toast.dismiss(t);
        toast.success(res?.message || '✅ Subscription activated using your wallet!', { duration: 5000 });
      }
      setTimeout(() => navigate('/company/dashboard'), 2000);
    } catch (e) {
      submitRef.current = false;
      toast.error(`❌ ${e.response?.data?.message || e.message || 'Payment failed'}`, { duration: 10000 });
    }
  };

  // ── Bank transfer ──────────────────────────────────────────────────────────
  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) { toast.error('Please upload an image file'); return; }
    if (f.size > 10 * 1024 * 1024) { toast.error('File too large (max 10MB)'); return; }
    setPaymentProof(f);
  };

  const handleBankTransferSubmit = async (e) => {
    e.preventDefault();
    if (hasPendingRequest) { toast.error('⚠️ Pending subscription request exists.'); return; }
    if (!transactionId.trim()) { toast.error('Enter transaction ID'); return; }
    if (!paymentProof) { toast.error('Upload payment proof'); return; }
    try {
      setUploading(true);
      const fd = new FormData();
      fd.append('planId', plan.id);
      fd.append('transactionId', transactionId);
      fd.append('paymentMethod', 'bank_transfer');
      fd.append('paymentProof', paymentProof);
      fd.append('walletAmountApplied', String(walletAppliedBhd));
      if (prorationDetails) { fd.append('prorationApplied', 'true'); fd.append('prorationDetails', JSON.stringify(prorationDetails)); }
      await subscriptionAPI.submitBankTransferRequest(fd);
      toast.success('✅ Payment proof submitted! Admin will review.', { duration: 5000 });
      setTimeout(() => navigate('/company/dashboard'), 2000);
    } catch (e2) {
      toast.error(`❌ ${e2.response?.data?.message || e2.message || 'Failed to submit'}`, { duration: 10000 });
    } finally { setUploading(false); }
  };

  if (!plan) return null;

  const fmtBhd = (v) => format(v);
  const toUsd = (v) => formatUsd(v);

  /* ─── UI ─────────────────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen mt-22 py-10 relative overflow-hidden"
      style={{ background: 'linear-gradient(145deg, #e8e0cc 0%, #ede5d0 50%, #e5dcc8 100%)' }}>

      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(188,161,66,0.25) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        <div className="absolute -bottom-40 -right-40 w-[400px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(188,161,66,0.2) 0%, transparent 70%)', filter: 'blur(40px)' }} />
      </div>

      <div className="relative z-10 max-w-xl mx-auto px-4">

        <button onClick={() => navigate('/company/subscriptions')}
          className="flex items-center gap-2 text-gray-600 hover:text-[#bca142] mb-6 transition-colors text-sm group">
          <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" />
          <span>Back to Plans</span>
        </button>

        <div className="rounded-2xl overflow-hidden"
          style={{
            background: 'rgba(255,255,255,0.55)',
            backdropFilter: 'blur(28px)',
            WebkitBackdropFilter: 'blur(28px)',
            border: '1px solid rgba(188,161,66,0.30)',
            boxShadow: '0 8px 40px rgba(120,100,40,0.18), 0 2px 12px rgba(0,0,0,0.08)',
          }}>

          {/* Header */}
          <div className="px-7 py-5 flex items-center justify-between"
            style={{ background: 'linear-gradient(135deg, rgba(188,161,66,0.18) 0%, rgba(188,161,66,0.06) 100%)', borderBottom: '1px solid rgba(188,161,66,0.22)' }}>
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <FaLock className="text-[#bca142]" style={{ fontSize: 10 }} />
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#bca142]">Secure Checkout</span>
              </div>
              <h1 className="text-xl font-bold text-gray-800">Complete Your Payment</h1>
              <p className="text-sm text-gray-400 mt-0.5">{plan.name} · {plan.duration_months} month{plan.duration_months > 1 ? 's' : ''}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Amount due</p>
              <p className="text-2xl font-extrabold leading-tight break-words text-[#bca142]">{fmtBhd(externalDueBhd)}</p>
              <p className="text-xs text-gray-400">{toUsd(externalDueBhd)}</p>
            </div>
          </div>

          <div className="px-6 py-5 space-y-4">

            {/* Live rate indicator */}
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/70"
              style={{ border: '1px solid rgba(188,161,66,0.2)' }}>
              <span className="text-xs text-gray-500">
                Live rate: <strong className="text-gray-700">1 BHD = {rate.toFixed(4)} USD</strong>
              </span>
              <button onClick={refreshRate} className="flex items-center gap-1 text-xs font-medium text-[#bca142] hover:underline">
                <FiRefreshCw className="w-3 h-3" /> Refresh
              </button>
            </div>

            {/* Proration */}
            {prorationDetails && (
              <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-blue-50 border border-blue-100">
                <FiAlertCircle className="text-blue-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-blue-700">Upgrade Credit Applied</p>
                  <p className="text-xs text-blue-500 mt-0.5">
                    {prorationDetails.daysRemaining} days remaining · Credited: {fmtBhd(prorationDetails.unusedValue)} ({toUsd(prorationDetails.unusedValue)})
                  </p>
                </div>
              </div>
            )}

            {/* Wallet + breakdown + checkout are all revealed together once the
                wallet has loaded, so the buyer can never proceed without knowing
                their balance (prevents the layout jump and accidental full-price
                payment). */}
            {(checkingPending || walletLoading) ? (
              <div className="flex flex-col items-center py-8 gap-3">
                <div className="w-9 h-9 rounded-full border-2 border-[#bca142]/20 border-t-[#bca142] animate-spin" />
                <p className="text-sm text-gray-400">Preparing your wallet…</p>
              </div>
            ) : walletError ? (
              <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-100">
                <FiAlertCircle className="text-red-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-red-700 mb-1">Could not load your wallet</p>
                  <p className="text-xs text-red-500 mb-2">We couldn't read your wallet balance, so checkout is paused — this prevents charging you the full amount while you still have wallet funds to use.</p>
                  <button onClick={fetchWallet}
                    className="text-xs font-semibold text-white bg-[#bca142] hover:bg-[#9d8635] px-3 py-1.5 rounded-lg transition-colors">
                    Retry
                  </button>
                </div>
              </div>
            ) : hasPendingRequest ? (
              <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-100">
                <FiAlertCircle className="text-red-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-red-700 mb-1">Pending Subscription Request</p>
                  <p className="text-xs text-red-500 mb-2">Please wait for admin to approve your current request before submitting a new one.</p>
                  <button onClick={() => navigate('/company/dashboard')}
                    className="text-xs font-semibold text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-lg transition-colors">
                    Go to Dashboard
                  </button>
                </div>
              </div>
            ) : (
              <>
            {/* Wallet */}
            {walletEnabled && (
              <div className="rounded-xl px-4 py-3 space-y-3" style={{ background: 'rgba(188,161,66,0.10)', border: '1px solid rgba(188,161,66,0.25)' }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FaWallet className="text-[#bca142]" />
                    <span className="text-sm font-bold text-[#9d8635]">Pay with Wallet</span>
                  </div>
                  <span className="text-xs text-gray-500 text-right">
                    Balance: <strong className="text-gray-700">{fmtBhd(walletBalance)}</strong>
                    <span className="block text-[10px] text-gray-400">{toUsd(walletBalance)}</span>
                  </span>
                </div>

                {maxWalletUsable > 0 ? (
                  <>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={applyWallet} onChange={e => setApplyWallet(e.target.checked)}
                        className="h-4 w-4 rounded text-[#bca142] focus:ring-[#bca142]" />
                      <span className="text-sm text-gray-700">Apply my wallet balance to this purchase</span>
                    </label>

                    {applyWallet && (
                      <>
                        <div className="flex items-center gap-2">
                          <input type="number" min="0" max={maxWalletUsable} step="0.001" value={walletAmount}
                            onChange={e => setWalletAmount(e.target.value)}
                            className="flex-1 px-3 py-2.5 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#bca142]"
                            style={{ border: '1px solid rgba(188,161,66,0.25)' }} />
                          <button onClick={() => setWalletAmount(String(Math.min(maxWalletUsable, baseAmountBhd).toFixed(3)))}
                            className="text-xs font-semibold px-3 py-2 rounded-lg bg-white text-[#bca142] hover:bg-white/80"
                            style={{ border: '1px solid rgba(188,161,66,0.3)' }}>
                            Max
                          </button>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Usable from wallet: up to {fmtBhd(maxWalletUsable)} <span className="text-gray-400">({toUsd(maxWalletUsable)})</span></span>
                          {minUsage > 0 && <span>Min {fmtBhd(minUsage)} <span className="text-gray-400">({toUsd(minUsage)})</span></span>}
                        </div>
                        {(Number(walletAmount) || 0) > maxWalletUsable + 0.001 && (
                          <p className="text-xs text-red-500">You can apply at most {fmtBhd(maxWalletUsable)}.</p>
                        )}
                      </>
                    )}
                  </>
                ) : (
                  <p className="text-xs text-gray-400">No wallet balance is available for this purchase.</p>
                )}
              </div>
            )}

            {/* Breakdown */}
            <div className="rounded-xl px-4 py-3 bg-black/5 space-y-2" style={{ border: '1px solid rgba(0,0,0,0.08)' }}>
              <Row label="Plan amount" value={fmtBhd(baseAmountBhd)} sub={toUsd(baseAmountBhd)} />
              {walletAppliedBhd > 0 && (
                <Row label="Wallet applied" value={`- ${fmtBhd(walletAppliedBhd)}`} sub={toUsd(walletAppliedBhd)} accent="text-emerald-600" />
              )}
              <div className="border-t border-black/10 pt-2">
                <Row
                  label={walletOnly ? 'Pay from wallet' : 'Pay now via gateway'}
                  value={fmtBhd(externalDueBhd)}
                  sub={toUsd(externalDueBhd)}
                  bold />
              </div>
            </div>

                {/* Wallet-only checkout */}
                {walletOnly ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-50 border border-emerald-100">
                      <span className="text-emerald-500 text-sm">✓</span>
                      <p className="text-xs text-emerald-700">Your wallet covers the full amount. No external payment needed.</p>
                    </div>
                    <button onClick={payWithWallet}
                      className="w-full py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all"
                      style={{ background: 'linear-gradient(135deg, #bca142 0%, #9d8635 100%)', boxShadow: '0 4px 16px rgba(188,161,66,0.25)' }}>
                      <FaWallet /> {prorationDetails ? 'Submit Wallet Payment' : `Pay ${fmtBhd(baseAmountBhd)} with Wallet`}
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Payment method toggle */}
                    <div className="flex gap-2 p-1 rounded-xl bg-black/10" style={{ border: '1px solid rgba(0,0,0,0.10)' }}>
                      {[{ key: 'paypal', label: 'PayPal', Icon: FaPaypal }, { key: 'bank', label: 'Bank Transfer', Icon: FaUniversity }].map(({ key, label, Icon }) => (
                        <button key={key} onClick={() => setPaymentMethod(key)}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all"
                          style={paymentMethod === key
                            ? { background: 'white', color: '#9d8635', border: '1px solid rgba(188,161,66,0.3)', boxShadow: '0 1px 6px rgba(188,161,66,0.15)' }
                            : { color: '#9ca3af', border: '1px solid transparent', background: 'transparent' }}>
                          <Icon size={14} />{label}
                        </button>
                      ))}
                    </div>

                    {paymentMethod === 'paypal' && (
                      <div className="space-y-3">
                        {bankDetails?.paypal_id && (
                          <div className="rounded-xl px-4 py-3 bg-black/5" style={{ border: '1px solid rgba(0,0,0,0.10)' }}>
                            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Payment received by</p>
                            <p className="text-sm font-semibold text-gray-700 break-all">{bankDetails.paypal_id}</p>
                          </div>
                        )}
                        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-amber-50 border border-amber-100">
                          <span className="text-amber-500 text-sm">⚡</span>
                          <p className="text-xs text-amber-700"><strong>Note:</strong> PayPal is charged in USD ({toUsd(externalDueBhd)}). Admin approval required after payment.</p>
                        </div>
                        {paypalLoaded
                          ? <div ref={paypalRef} className="w-full max-w-xs mx-auto pt-1" />
                          : (
                            <div className="flex flex-col items-center py-8 gap-3">
                              <div className="w-9 h-9 rounded-full border-2 border-[#bca142]/20 border-t-[#bca142] animate-spin" />
                              <p className="text-sm text-gray-400">Loading PayPal…</p>
                            </div>
                          )}
                      </div>
                    )}

                    {paymentMethod === 'bank' && (
                      <div className="space-y-4">
                        {bankDetails && (
                          <div className="rounded-xl p-4 space-y-3 bg-black/5" style={{ border: '1px solid rgba(0,0,0,0.10)' }}>
                            <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                              <FaUniversity className="text-[#bca142]" /> Bank Details
                            </p>
                            <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
                              {[
                                ['Bank Name', bankDetails.bank_name],
                                ['Branch', bankDetails.branch_name],
                                ['Account Holder', bankDetails.account_holder_name],
                                ['Account No.', bankDetails.account_number],
                                ['IBAN', bankDetails.iban_number || 'N/A'],
                                ['SWIFT', bankDetails.swift_code || 'N/A'],
                                ...(bankDetails.ifsc_code ? [['IFSC', bankDetails.ifsc_code]] : []),
                                ...(bankDetails.paypal_id ? [['PayPal', bankDetails.paypal_id]] : []),
                              ].map(([l, v]) => (
                                <div key={l}>
                                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">{l}</p>
                                  <p className="text-sm font-semibold text-gray-700 mt-0.5 break-all">{v || 'N/A'}</p>
                                </div>
                              ))}
                            </div>
                            <div className="rounded-lg px-4 py-3 bg-white" style={{ border: '1.5px solid rgba(188,161,66,0.3)' }}>
                              <p className="text-xs text-gray-400">Amount to Transfer</p>
                              <p className="text-2xl font-extrabold leading-tight break-words text-[#bca142]">{fmtBhd(externalDueBhd)}</p>
                              <p className="text-xs text-gray-400">≈ {toUsd(externalDueBhd)}</p>
                              {walletAppliedBhd > 0 && <p className="text-xs text-emerald-600 font-medium mt-0.5">Wallet applied: -{fmtBhd(walletAppliedBhd)}</p>}
                            </div>
                            {bankDetails.payment_instructions && (
                              <div className="rounded-lg px-3 py-2.5 bg-amber-50 border border-amber-100">
                                <p className="text-xs font-semibold text-amber-700 mb-0.5">Instructions</p>
                                <p className="text-xs text-amber-600">{bankDetails.payment_instructions}</p>
                              </div>
                            )}
                          </div>
                        )}

                        <form onSubmit={handleBankTransferSubmit} className="space-y-4">
                          <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Transaction ID *</label>
                            <input type="text" value={transactionId} onChange={e => setTransactionId(e.target.value)} required
                              placeholder="Enter reference / transaction ID"
                              className="w-full px-4 py-2.5 rounded-xl text-sm text-gray-800 placeholder-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#bca142]"
                              style={{ border: '1px solid #ddd8c8' }} />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Payment Proof *</label>
                            <label htmlFor="payment-proof" className="cursor-pointer block">
                              <input type="file" id="payment-proof" accept="image/*" onChange={handleFileChange} className="hidden" required />
                              <div className="rounded-xl p-5 text-center bg-white transition-all"
                                style={{ border: `2px dashed ${paymentProof ? '#bca142' : '#ddd8c8'}` }}>
                                <FiUpload className={`w-5 h-5 mx-auto mb-1.5 ${paymentProof ? 'text-[#bca142]' : 'text-gray-300'}`} />
                                <p className={`text-sm font-medium ${paymentProof ? 'text-[#bca142]' : 'text-gray-400'}`}>
                                  {paymentProof ? paymentProof.name : 'Click to upload screenshot / receipt'}
                                </p>
                                <p className="text-xs text-gray-300 mt-0.5">PNG, JPG up to 10 MB</p>
                              </div>
                            </label>
                          </div>
                          <button type="submit" disabled={uploading}
                            className="w-full py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
                            style={{ background: 'linear-gradient(135deg, #bca142 0%, #9d8635 100%)', boxShadow: '0 4px 16px rgba(188,161,66,0.25)' }}>
                            {uploading
                              ? <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Submitting…</>
                              : <><FaShieldAlt />Submit Payment Proof</>}
                          </button>
                        </form>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4 flex items-center justify-center gap-1.5">
          <FaLock className="text-[#bca142]/60" style={{ fontSize: 10 }} />
          Your payment information is secure and encrypted
        </p>
      </div>
    </div>
  );
};

const Row = ({ label, value, sub, bold, accent }) => (
  <div className="flex items-center justify-between">
    <span className={`text-sm ${bold ? 'font-semibold text-gray-800' : 'text-gray-500'}`}>{label}</span>
    <span className="text-right">
      <span className={`text-sm ${bold ? 'font-bold text-[#bca142]' : `font-semibold ${accent || 'text-gray-700'}`}`}>{value}</span>
      {sub && <span className="block text-[10px] text-gray-400">{sub}</span>}
    </span>
  </div>
);

export default PaymentPage;
