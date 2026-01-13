import { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, RadialBarChart, RadialBar
} from 'recharts';
import { 
  TrendingUp, 
  DollarSign, 
  Package, 
  Globe, 
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Target,
  Users,
  Truck
} from 'lucide-react';
import { 
  FaChartLine,
  FaGlobe,
  FaBoxes,
  FaDollarSign,
  FaCalendarAlt,
  FaTruck,
  FaUsers,
  FaBullseye
} from 'react-icons/fa';

const BusinessAnalytics = () => {
  const [timeRange, setTimeRange] = useState('6months');
  const [loading, setLoading] = useState(true);

  // Mock analytics data
  const analyticsData = {
    overview: {
      totalRevenue: 125000,
      totalShipments: 156,
      avgShipmentValue: 801,
      topDestination: 'United States',
      growthRate: 23.5,
      customerSatisfaction: 4.8
    },
    monthlyData: [
      { month: 'Jan', revenue: 18500, shipments: 22, avgCost: 840 },
      { month: 'Feb', revenue: 19200, shipments: 25, avgCost: 768 },
      { month: 'Mar', revenue: 21800, shipments: 28, avgCost: 779 },
      { month: 'Apr', revenue: 20500, shipments: 24, avgCost: 854 },
      { month: 'May', revenue: 22300, shipments: 29, avgCost: 769 },
      { month: 'Jun', revenue: 23700, shipments: 28, avgCost: 846 }
    ],
    categoryData: [
      { name: 'Electronics', value: 35, revenue: 43750, color: '#3b82f6' },
      { name: 'Textiles', value: 25, revenue: 31250, color: '#8b5cf6' },
      { name: 'Food & Beverages', value: 20, revenue: 25000, color: '#06b6d4' },
      { name: 'Automotive', value: 15, revenue: 18750, color: '#10b981' },
      { name: 'Others', value: 5, revenue: 6250, color: '#f59e0b' }
    ],
    destinationData: [
      { country: 'United States', shipments: 45, percentage: 28.8 },
      { country: 'Germany', shipments: 32, percentage: 20.5 },
      { country: 'Japan', shipments: 28, percentage: 17.9 },
      { country: 'United Kingdom', shipments: 24, percentage: 15.4 },
      { country: 'Australia', shipments: 18, percentage: 11.5 },
      { country: 'Others', shipments: 9, percentage: 5.9 }
    ],
    performanceMetrics: [
      { metric: 'On-Time Delivery', value: 94.2, target: 95, trend: 'up' },
      { metric: 'Cost Efficiency', value: 87.5, target: 85, trend: 'up' },
      { metric: 'Customer Rating', value: 4.8, target: 4.5, trend: 'up' },
      { metric: 'Quote Response Rate', value: 78.3, target: 80, trend: 'down' }
    ]
  };

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setLoading(false), 1000);
  }, []);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const MetricCard = ({ title, value, subtitle, icon: Icon, color, trend, prefix = '', suffix = '' }) => (
    <div className={`bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:shadow-xl transition-all duration-300 group`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-2xl bg-gradient-to-br ${color} text-white shadow-lg group-hover:shadow-xl transition-all duration-300`}>
          <Icon className="h-6 w-6" />
        </div>
        {trend && (
          <div className={`flex items-center space-x-1 text-sm ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
            {trend === 'up' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
            <span className="font-semibold">
              {trend === 'up' ? '+' : '-'}{Math.abs(Math.random() * 10).toFixed(1)}%
            </span>
          </div>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-slate-600 uppercase tracking-wider">{title}</p>
        <p className="text-3xl font-bold text-slate-800">
          {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
        </p>
        {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-500 mx-auto mb-4"></div>
          <p className="text-xl font-semibold text-slate-700">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-cyan-50 rounded-2xl p-8 border border-blue-200/50">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Business Analytics
            </h1>
            <p className="text-slate-600 text-lg">Comprehensive insights into your business performance and logistics data</p>
            <div className="flex items-center space-x-4 mt-4">
              <div className="flex items-center space-x-2 bg-white/50 backdrop-blur-sm px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-600">Real-time Data</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/50 backdrop-blur-sm px-3 py-1 rounded-full">
                <BarChart3 className="h-3 w-3 text-blue-500" />
                <span className="text-sm text-blue-600">Advanced Analytics</span>
              </div>
            </div>
          </div>
          <div className="flex space-x-3">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="bg-white/80 border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
            >
              <option value="1month">Last Month</option>
              <option value="3months">Last 3 Months</option>
              <option value="6months">Last 6 Months</option>
              <option value="1year">Last Year</option>
            </select>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <MetricCard
          title="Total Revenue"
          value={analyticsData.overview.totalRevenue}
          subtitle="Last 6 months"
          icon={DollarSign}
          color="from-green-500 to-emerald-500"
          trend="up"
          prefix="$"
        />
        <MetricCard
          title="Total Shipments"
          value={analyticsData.overview.totalShipments}
          subtitle="Completed deliveries"
          icon={Package}
          color="from-blue-500 to-cyan-500"
          trend="up"
        />
        <MetricCard
          title="Avg Shipment Value"
          value={analyticsData.overview.avgShipmentValue}
          subtitle="Per shipment"
          icon={TrendingUp}
          color="from-purple-500 to-indigo-500"
          trend="up"
          prefix="$"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue Trend */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white/20">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-slate-800">Revenue Trend</h3>
              <p className="text-slate-600">Monthly revenue performance</p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-slate-500">Live Data</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={analyticsData.monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                  border: 'none', 
                  borderRadius: '16px', 
                  boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                  backdropFilter: 'blur(10px)'
                }} 
              />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke="#3b82f6" 
                fill="url(#colorRevenue)" 
                strokeWidth={3}
              />
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05}/>
                </linearGradient>
              </defs>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Category Distribution */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white/20">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-slate-800">Business Categories</h3>
              <p className="text-slate-600">Revenue by product category</p>
            </div>
            <PieChartIcon className="h-5 w-5 text-purple-500" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analyticsData.categoryData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                paddingAngle={5}
                dataKey="value"
              >
                {analyticsData.categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                  border: 'none', 
                  borderRadius: '16px', 
                  boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                  backdropFilter: 'blur(10px)'
                }} 
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {analyticsData.categoryData.map((item, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                <span className="text-sm text-slate-600">{item.name}</span>
                <span className="text-sm font-semibold text-slate-800">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white/20">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-slate-800">Performance Metrics</h3>
            <p className="text-slate-600">Key performance indicators vs targets</p>
          </div>
          <FaBullseye className="h-5 w-5 text-green-500" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {analyticsData.performanceMetrics.map((metric, index) => (
            <div key={index} className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-slate-700">{metric.metric}</h4>
                <div className={`flex items-center space-x-1 text-xs ${
                  metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {metric.trend === 'up' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-slate-800">
                    {metric.value}{metric.metric.includes('Rating') ? '/5' : '%'}
                  </span>
                  <span className="text-sm text-slate-500">
                    Target: {metric.target}{metric.metric.includes('Rating') ? '/5' : '%'}
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      metric.value >= metric.target ? 'bg-green-500' : 'bg-orange-500'
                    }`}
                    style={{ width: `${Math.min((metric.value / (metric.metric.includes('Rating') ? 5 : 100)) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Destinations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white/20">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-slate-800">Top Destinations</h3>
              <p className="text-slate-600">Most shipped countries</p>
            </div>
            <Globe className="h-5 w-5 text-blue-500" />
          </div>
          <div className="space-y-4">
            {analyticsData.destinationData.map((destination, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{destination.country}</p>
                    <p className="text-sm text-slate-600">{destination.shipments} shipments</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-800">{destination.percentage}%</p>
                  <div className="w-16 bg-slate-200 rounded-full h-2 mt-1">
                    <div 
                      className="h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                      style={{ width: `${destination.percentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Shipment Trends */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white/20">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-slate-800">Shipment Volume</h3>
              <p className="text-slate-600">Monthly shipment count</p>
            </div>
            <Truck className="h-5 w-5 text-green-500" />
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={analyticsData.monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                  border: 'none', 
                  borderRadius: '16px', 
                  boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                  backdropFilter: 'blur(10px)'
                }} 
              />
              <Bar dataKey="shipments" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Export Options */}
      <div className="bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 rounded-2xl p-6 border border-green-200/50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Export Analytics</h3>
            <p className="text-slate-600">Download your business analytics data in various formats</p>
          </div>
          <div className="flex space-x-3">
            <button className="bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl border border-slate-200 transition-all duration-300">
              Export PDF
            </button>
            <button className="bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl border border-slate-200 transition-all duration-300">
              Export Excel
            </button>
            <button className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl">
              Generate Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessAnalytics;