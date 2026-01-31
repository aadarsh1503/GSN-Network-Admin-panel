import { useState, useEffect } from 'react';
import { FiUsers, FiDollarSign, FiFileText, FiLogIn, FiDownload, FiCalendar } from 'react-icons/fi';
import api from '../../utils/api';

const ReportsPage = () => {
  const [activeTab, setActiveTab] = useState('membership');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });

  useEffect(() => {
    fetchReport();
  }, [activeTab]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateRange.startDate) params.append('startDate', dateRange.startDate);
      if (dateRange.endDate) params.append('endDate', dateRange.endDate);

      const data = await api.get(`/api/reports/${activeTab}?${params.toString()}`);
      setReportData(data);
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateFilter = () => {
    fetchReport();
  };

  const tabs = [
    { id: 'membership', label: 'Membership Report', icon: <FiUsers /> },
    { id: 'transactions', label: 'Transactions Report', icon: <FiDollarSign /> },
    { id: 'quotes', label: 'Quotes Report', icon: <FiFileText /> },
    { id: 'logins', label: 'Logins Report', icon: <FiLogIn /> }
  ];

  const renderMembershipReport = () => (
    <div>
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-blue-600">Total Users</p>
          <p className="text-2xl font-bold text-blue-800">{reportData?.summary?.total_users || 0}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm text-green-600">Companies</p>
          <p className="text-2xl font-bold text-green-800">{reportData?.summary?.total_companies || 0}</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <p className="text-sm text-purple-600">Businesses</p>
          <p className="text-2xl font-bold text-purple-800">{reportData?.summary?.total_businesses || 0}</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <p className="text-sm text-yellow-600">Active</p>
          <p className="text-2xl font-bold text-yellow-800">{reportData?.summary?.total_active || 0}</p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <p className="text-sm text-red-600">Blacklisted</p>
          <p className="text-2xl font-bold text-red-800">{reportData?.summary?.total_blacklisted || 0}</p>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead className="bg-[#e0c58a]">
            <tr>
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-left">Registrations</th>
              <th className="p-3 text-left">Companies</th>
              <th className="p-3 text-left">Businesses</th>
              <th className="p-3 text-left">Active</th>
              <th className="p-3 text-left">Blacklisted</th>
            </tr>
          </thead>
          <tbody>
            {reportData?.report?.length === 0 ? (
              <tr><td colSpan="6" className="p-4 text-center text-gray-500">No data available</td></tr>
            ) : (
              reportData?.report?.map((row, idx) => (
                <tr key={idx} className="border-b hover:bg-gray-50">
                  <td className="p-3">{new Date(row.date).toLocaleDateString()}</td>
                  <td className="p-3">{row.total_registrations}</td>
                  <td className="p-3">{row.companies}</td>
                  <td className="p-3">{row.businesses}</td>
                  <td className="p-3">{row.active}</td>
                  <td className="p-3">{row.blacklisted}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderTransactionsReport = () => (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-blue-600">Total Transactions</p>
          <p className="text-2xl font-bold text-blue-800">{reportData?.summary?.total_transactions || 0}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm text-green-600">Total Amount</p>
          <p className="text-2xl font-bold text-green-800">${reportData?.summary?.total_amount || 0}</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <p className="text-sm text-purple-600">Completed</p>
          <p className="text-2xl font-bold text-purple-800">${reportData?.summary?.total_completed || 0}</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead className="bg-[#e0c58a]">
            <tr>
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-left">Transactions</th>
              <th className="p-3 text-left">Total Amount</th>
              <th className="p-3 text-left">Completed</th>
              <th className="p-3 text-left">Pending</th>
              <th className="p-3 text-left">Failed</th>
            </tr>
          </thead>
          <tbody>
            {reportData?.report?.length === 0 ? (
              <tr><td colSpan="6" className="p-4 text-center text-gray-500">No data available</td></tr>
            ) : (
              reportData?.report?.map((row, idx) => (
                <tr key={idx} className="border-b hover:bg-gray-50">
                  <td className="p-3">{new Date(row.date).toLocaleDateString()}</td>
                  <td className="p-3">{row.total_transactions}</td>
                  <td className="p-3">${row.total_amount || 0}</td>
                  <td className="p-3">${row.completed_amount || 0}</td>
                  <td className="p-3">{row.pending_count}</td>
                  <td className="p-3">{row.failed_count}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderQuotesReport = () => (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-blue-600">Total Quotes</p>
          <p className="text-2xl font-bold text-blue-800">{reportData?.summary?.total_quotes || 0}</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <p className="text-sm text-yellow-600">Pending</p>
          <p className="text-2xl font-bold text-yellow-800">{reportData?.summary?.total_pending || 0}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm text-green-600">Approved</p>
          <p className="text-2xl font-bold text-green-800">{reportData?.summary?.total_approved || 0}</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <p className="text-sm text-purple-600">Responses</p>
          <p className="text-2xl font-bold text-purple-800">{reportData?.summary?.total_responses || 0}</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead className="bg-[#e0c58a]">
            <tr>
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-left">Total</th>
              <th className="p-3 text-left">Pending</th>
              <th className="p-3 text-left">Approved</th>
              <th className="p-3 text-left">Rejected</th>
              <th className="p-3 text-left">Running</th>
              <th className="p-3 text-left">Closed</th>
            </tr>
          </thead>
          <tbody>
            {reportData?.report?.length === 0 ? (
              <tr><td colSpan="7" className="p-4 text-center text-gray-500">No data available</td></tr>
            ) : (
              reportData?.report?.map((row, idx) => (
                <tr key={idx} className="border-b hover:bg-gray-50">
                  <td className="p-3">{new Date(row.date).toLocaleDateString()}</td>
                  <td className="p-3">{row.total_quotes}</td>
                  <td className="p-3">{row.pending}</td>
                  <td className="p-3">{row.approved}</td>
                  <td className="p-3">{row.rejected}</td>
                  <td className="p-3">{row.running}</td>
                  <td className="p-3">{row.closed}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderLoginsReport = () => (
    <div>
      <div className="overflow-x-auto mb-6">
        <table className="min-w-full bg-white">
          <thead className="bg-[#e0c58a]">
            <tr>
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-left">Total Logins</th>
              <th className="p-3 text-left">Unique Users</th>
              <th className="p-3 text-left">Successful</th>
              <th className="p-3 text-left">Failed</th>
            </tr>
          </thead>
          <tbody>
            {reportData?.report?.length === 0 ? (
              <tr><td colSpan="5" className="p-4 text-center text-gray-500">No data available</td></tr>
            ) : (
              reportData?.report?.map((row, idx) => (
                <tr key={idx} className="border-b hover:bg-gray-50">
                  <td className="p-3">{new Date(row.date).toLocaleDateString()}</td>
                  <td className="p-3">{row.total_logins}</td>
                  <td className="p-3">{row.unique_users}</td>
                  <td className="p-3">{row.successful}</td>
                  <td className="p-3">{row.failed}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {reportData?.recentLogins?.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Recent Logins</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 text-left">User</th>
                  <th className="p-3 text-left">Role</th>
                  <th className="p-3 text-left">Time</th>
                  <th className="p-3 text-left">IP Address</th>
                  <th className="p-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {reportData.recentLogins.map((login, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <div>{login.user_name}</div>
                      <div className="text-xs text-gray-500">{login.user_email}</div>
                    </td>
                    <td className="p-3 capitalize">{login.user_role}</td>
                    <td className="p-3">{new Date(login.login_time).toLocaleString()}</td>
                    <td className="p-3">{login.ip_address || 'N/A'}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        login.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {login.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  const renderReport = () => {
    switch (activeTab) {
      case 'membership': return renderMembershipReport();
      case 'transactions': return renderTransactionsReport();
      case 'quotes': return renderQuotesReport();
      case 'logins': return renderLoginsReport();
      default: return null;
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Reports</h2>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === tab.id
                ? 'bg-[#bca142] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Date Filter */}
      <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2">
          <FiCalendar className="text-gray-500" />
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
            className="border border-gray-300 rounded-md px-3 py-2"
          />
          <span>to</span>
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
            className="border border-gray-300 rounded-md px-3 py-2"
          />
        </div>
        <button
          onClick={handleDateFilter}
          className="bg-[#bca142] text-white px-4 py-2 rounded-md hover:bg-opacity-90"
        >
          Apply Filter
        </button>
      </div>

      {/* Report Content */}
      {loading ? (
        <div className="text-center py-8">Loading report...</div>
      ) : (
        renderReport()
      )}
    </div>
  );
};

export default ReportsPage;
