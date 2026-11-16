import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  FiCreditCard, FiChevronDown, FiChevronUp, FiSearch, FiMail,
  FiCheckCircle, FiXCircle, FiCopy
} from 'react-icons/fi';
import { FaPaypal } from 'react-icons/fa';
import { walletAPI } from '../../utils/api';
import toast from 'react-hot-toast';

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : '—');

const AdminCompanyBankDetails = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(null);

  const load = useCallback(async (q = '') => {
    setLoading(true);
    try {
      const data = await walletAPI.admin.listCompanyBankDetails(q ? { search: q } : {});
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      toast.error(e.message || 'Failed to load company bank details');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Group rows (one per bank account) by company
  const companies = useMemo(() => {
    const map = new Map();
    rows.forEach(r => {
      if (!map.has(r.company_id)) {
        map.set(r.company_id, {
          company_id: r.company_id,
          company_name: r.company_name,
          company_email: r.company_email,
          company_phone: r.company_phone,
          paypal_email: r.paypal_email,
          account_status: r.account_status,
          registered_at: r.registered_at,
          accounts: [],
        });
      }
      if (r.bank_detail_id) {
        map.get(r.company_id).accounts.push({
          id: r.bank_detail_id,
          bank_name: r.bank_name,
          branch_name: r.branch_name,
          account_holder_name: r.account_holder_name,
          account_number: r.account_number,
          iban_number: r.iban_number,
          swift_code: r.swift_code,
          ifsc_code: r.ifsc_code,
          payment_instructions: r.payment_instructions,
          is_active: r.is_active,
          is_default: r.is_default,
          created_at: r.bank_detail_created_at,
        });
      }
    });
    return Array.from(map.values());
  }, [rows]);

  const copy = (text) => { navigator.clipboard.writeText(text || ''); toast.success('Copied'); };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Company Bank Accounts</h1>
        <p className="text-gray-500 mt-1 text-sm">
          All registered companies with their bank account details and PayPal (optional).
        </p>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && load(search)}
            placeholder="Search by company name or email…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#bca142]" />
        </div>
        <button onClick={() => load(search)}
          className="px-4 py-2.5 rounded-xl bg-[#bca142] text-white text-sm font-medium">Search</button>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>{companies.length} compan{companies.length === 1 ? 'y' : 'ies'}</span>
      </div>

      {loading ? (
        <div className="py-16 text-center text-gray-400">Loading…</div>
      ) : companies.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm py-16 text-center text-gray-400">
          No companies found.
        </div>
      ) : (
        <div className="space-y-3">
          {companies.map(c => {
            const open = expanded === c.company_id;
            const primary = c.accounts.find(a => a.is_default) || c.accounts[0];
            return (
              <div key={c.company_id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Company header */}
                <button onClick={() => setExpanded(open ? null : c.company_id)}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-gray-50/60 transition">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-[#bca142]/10 flex items-center justify-center shrink-0">
                      <FiCreditCard className="text-[#bca142]" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-800 truncate">{c.company_name}</p>
                      <p className="text-xs text-gray-400 truncate flex items-center gap-2">
                        <span className="inline-flex items-center gap-1"><FiMail className="w-3 h-3" />{c.company_email}</span>
                        {c.company_phone && <span>· {c.company_phone}</span>}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${
                      c.account_status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {c.account_status === 'active' ? <FiCheckCircle className="w-3 h-3" /> : <FiXCircle className="w-3 h-3" />}
                      {c.account_status || 'unknown'}
                    </span>
                    <span className="text-xs text-gray-400">
                      {c.accounts.length} account{c.accounts.length === 1 ? '' : 's'}
                    </span>
                    {open ? <FiChevronUp className="text-gray-400" /> : <FiChevronDown className="text-gray-400" />}
                  </div>
                </button>

                {/* Summary line: PayPal + primary bank */}
                <div className="px-5 pb-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm border-t border-gray-50 pt-3">
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">PayPal (optional)</p>
                    {c.paypal_email ? (
                      <p className="font-medium text-gray-700 truncate flex items-center gap-1">
                        <FaPaypal className="text-[#009cde] w-3 h-3 shrink-0" />
                        <span className="truncate">{c.paypal_email}</span>
                        <button onClick={(e) => { e.stopPropagation(); copy(c.paypal_email); }} className="text-gray-300 hover:text-gray-500"><FiCopy className="w-3 h-3" /></button>
                      </p>
                    ) : <p className="text-gray-400">Not provided</p>}
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">Primary Bank</p>
                    <p className="font-medium text-gray-700 truncate">{primary ? primary.bank_name : '—'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">Account Holder</p>
                    <p className="font-medium text-gray-700 truncate">{primary ? primary.account_holder_name : '—'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">Registered</p>
                    <p className="font-medium text-gray-700">{fmtDate(c.registered_at)}</p>
                  </div>
                </div>

                {/* Expanded bank accounts */}
                {open && (
                  <div className="border-t border-gray-100 bg-gray-50/50 px-5 py-4">
                    {c.accounts.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-4">This company has not added any bank account yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {c.accounts.map(a => (
                          <div key={a.id} className="bg-white rounded-xl border border-gray-100 p-4">
                            <div className="flex items-center justify-between mb-3">
                              <p className="font-semibold text-gray-800">
                                {a.bank_name} <span className="text-gray-400 font-normal">· {a.branch_name}</span>
                              </p>
                              <div className="flex items-center gap-2">
                                {a.is_default && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#bca142]/10 text-[#9d8635]">DEFAULT</span>}
                                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                                  a.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                                }`}>{a.is_active ? 'Active' : 'Inactive'}</span>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3">
                              {[
                                ['Account Holder', a.account_holder_name],
                                ['Account Number', a.account_number],
                                ['IBAN', a.iban_number],
                                ['SWIFT', a.swift_code],
                                ['IFSC', a.ifsc_code],
                                ['Added On', fmtDate(a.created_at)],
                              ].map(([l, v]) => (
                                <div key={l}>
                                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">{l}</p>
                                  <p className="text-sm font-medium text-gray-700 break-all flex items-center gap-1">
                                    {v || '—'}
                                    {v && l !== 'Added On' && (
                                      <button onClick={() => copy(v)} className="text-gray-300 hover:text-gray-500"><FiCopy className="w-3 h-3" /></button>
                                    )}
                                  </p>
                                </div>
                              ))}
                            </div>
                            {a.payment_instructions && (
                              <div className="mt-3 rounded-lg px-3 py-2 bg-amber-50 border border-amber-100">
                                <p className="text-[10px] font-semibold text-amber-700 uppercase tracking-wide">Payment Instructions</p>
                                <p className="text-xs text-amber-600 mt-0.5">{a.payment_instructions}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminCompanyBankDetails;
