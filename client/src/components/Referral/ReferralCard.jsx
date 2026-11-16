import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Copy, Gift, Users, Wallet, ExternalLink, CheckCircle } from 'lucide-react';
import referralApi from '../../utils/referralApi';
import { walletAPI } from '../../utils/api';
import { useCurrency } from '../../contexts/CurrencyContext';
import toast from 'react-hot-toast';

/**
 * Shared ReferralCard — used on the Company dashboard (referral program is company-only).
 * Shows referral code, wallet balance, and quick stats.
 * Links to the full ReferralPage for details.
 */
const ReferralCard = () => {
  const { format, formatUsd } = useCurrency();
  const [data, setData] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    Promise.all([
      referralApi.getMyCode(),
      walletAPI.getWallet().catch(() => null),
    ])
      .then(([d, wallet]) => {
        setData(d);
        setWalletBalance(Number(wallet?.balance || 0));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const copyCode = () => {
    if (!data?.referralCode) return;
    navigator.clipboard.writeText(data.referralCode);
    setCopied(true);
    toast.success('Referral code copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const copyLink = () => {
    if (!data?.shareLink) return;
    navigator.clipboard.writeText(data.shareLink);
    toast.success('Share link copied!');
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 h-48 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-12 bg-gray-200 rounded mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
        <p className="text-gray-400 text-sm">Referral data unavailable</p>
      </div>
    );
  }

  const stats = data.stats || {};
  const roleLabel = data.role === 'user' ? 'users' : data.role === 'business' ? 'businesses' : 'companies';

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <Gift className="w-5 h-5 text-[#bca142]" />
          Referral Program
        </h3>
        <Link
          to="./referrals"
          className="text-xs text-[#bca142] hover:text-black font-medium flex items-center gap-1"
        >
          View Details <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      {/* Referral Code */}
      <div
        className="flex items-center p-4 bg-[#bca142]/10 rounded-xl cursor-pointer hover:bg-[#bca142]/20 transition-all duration-200 border border-[#bca142] mb-4"
        onClick={copyCode}
      >
        <div className="p-2 bg-[#bca142] rounded-lg mr-3">
          {copied
            ? <CheckCircle className="text-white h-5 w-5" />
            : <Copy className="text-white h-5 w-5" />
          }
        </div>
        <div className="flex-1">
          <span className="text-[#bca142] font-semibold block text-xs uppercase tracking-wide">Your Referral Code</span>
          <span className="text-gray-800 text-lg font-mono font-bold">{data.referralCode}</span>
        </div>
      </div>

      {/* Share Link */}
      <button
        onClick={copyLink}
        className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors mb-4 text-sm"
      >
        <span className="text-gray-400 text-xs truncate flex-1 text-left">{data.shareLink}</span>
        <Copy className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 ml-2" />
      </button>

      {/* Wallet + Referrals */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gradient-to-br from-[#bca142] to-[#9d8635] rounded-xl p-4 text-white">
          <Wallet className="w-5 h-5 mb-1 opacity-80" />
          <p className="text-xs opacity-80">Wallet Balance</p>
          <p className="text-xl font-bold">{format(walletBalance)}</p>
          <p className="text-xs opacity-70">≈ {formatUsd(walletBalance)} · available</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-4">
          <Users className="w-5 h-5 mb-1 text-gray-400" />
          <p className="text-xs text-gray-400">Total Referrals</p>
          <p className="text-xl font-bold text-gray-800">{stats.totalReferrals || 0}</p>
          <p className="text-xs text-gray-400">{stats.totalRewarded || 0} rewarded</p>
        </div>
      </div>

      {/* Info */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700">
        Share your code with other {roleLabel} only. Wallet rewards are credited when they register or subscribe.
      </div>
    </div>
  );
};

export default ReferralCard;
