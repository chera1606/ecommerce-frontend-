import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  ShoppingBag, 
  Users, 
  Loader2,
  TrendingUp,
  TrendingDown,
  Activity,
  Download,
  Target,
  ArrowRight
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { adminAPI } from '../../services/api';
import { useAppSettings } from '../../contexts/AppSettingsContext';
import StatCard from '../../components/admin/StatCard';
import './Analytics.css';

const Analytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30D');
  const { formatPrice, t } = useAppSettings();

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const res = await adminAPI.getPerformanceAnalytics();
        setAnalytics(res.data || null);
      } catch (err) {
        console.error("Marketing dashboard failure:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [dateRange]);

  const handleExport = () => {
    if (!analytics?.charts?.revenueTrends) return;
    const headers = "Date,Revenue,Orders\n";
    const csvContent = analytics.charts.revenueTrends.map(row => `${row.name},${row.revenue},${row.orders}`).join("\n");
    const blob = new Blob([headers + csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `market-performance-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="admin-loader-container">
        <Loader2 className="animate-spin text-emerald-500" size={32} />
        <p className="loader-text">{t('loadingAnalytics')}</p>
      </div>
    );
  }

  const kpi = analytics?.kpi;
  const charts = analytics?.charts;

  return (
    <div className="admin-analytics animate-fade-in">
      {/* Dynamic Header */}
      <div className="analytics-header">
        <div className="header-titles">
          <h2>{t('Store Performance')}</h2>
          <p>{t('Analyze your store performance and trends.')}</p>
        </div>
        <div className="header-actions">
          <button className="export-alt-btn" onClick={handleExport}>
            <Download size={14} />
            {t('Export Data')}
          </button>
        </div>
      </div>

      {/* KPI Performance */}
      <div className="stats-grid">
        <StatCard 
          title={t('Revenue')} 
          value={formatPrice(kpi?.revenue || 0)}
          icon={DollarSign}
          trend={kpi?.growth >= 0 ? 'up' : 'down'}
          trendValue={`${kpi?.growth || 0}%`}
          color="emerald"
        />
        <StatCard 
          title={t('Total Orders')} 
          value={(kpi?.orders || 0).toLocaleString()}
          icon={ShoppingBag}
          trend="up"
          trendValue={t('Live')}
          color="blue"
        />
        <StatCard 
          title={t('Avg. Ticket')} 
          value={formatPrice(kpi?.avgOrderValue || 0)}
          icon={Target}
          trend="up"
          trendValue={t('AOV')}
          color="purple"
        />
      </div>

      <div className="analytics-layout-grid">
        {/* Revenue Performance Area */}
        <div className="chart-wrapper span-2">
          <div className="wrapper-header">
            <div className="header-text">
              <h3>{t('Revenue Overview')}</h3>
              <p>{t('Total revenue over the last 30 days.')}</p>
            </div>
            <div className="header-summary">
              <span className="big-val">{formatPrice(kpi?.revenue || 0)}</span>
              <span className={`pill ${kpi?.growth >= 0 ? 'up' : 'down'}`}>
                {kpi?.growth >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {kpi?.growth || 0}%
              </span>
            </div>
          </div>
          <div className="main-chart-area">
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={charts?.revenueTrends}>
                <defs>
                  <linearGradient id="areaColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(226,232,240,0.1)" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} tickLine={false} 
                  tick={{ fill: 'var(--admin-text-muted)', fontSize: 10 }}
                  dy={10}
                />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ background: 'var(--admin-panel-bg)', borderColor: 'var(--admin-border)', borderRadius: '12px', fontSize: '12px' }}
                  itemStyle={{ color: 'var(--admin-primary)' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#10b981" 
                  strokeWidth={2.5}
                  fill="url(#areaColor)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Market Share Donut (Replaces Inventory Flow List) */}
        <div className="chart-wrapper">
          <div className="wrapper-header">
            <h3>{t('Sales by Category')}</h3>
            <p>{t('Revenue breakdown by product category.')}</p>
          </div>
          <div className="donut-content">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={charts?.marketShare}
                  innerRadius={55} outerRadius={75}
                  paddingAngle={8} dataKey="value"
                >
                  {charts?.marketShare?.map((entry, index) => (
                    <Cell key={index} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="side-legend">
              {charts?.marketShare?.map((item) => (
                <div key={item.name} className="legend-row">
                  <div className="row-left">
                    <span className="dot" style={{ background: item.color }}></span>
                    <span className="n">{item.name}</span>
                  </div>
                  <span className="v">{item.percentage}%</span>
                </div>
              ))}
              {charts?.marketShare?.length === 0 && <p className="hint">{t('No Market Data')}</p>}
            </div>
          </div>
        </div>

        {/* Customer Retention (Replaces Payment Methods) */}
        <div className="chart-wrapper">
          <div className="wrapper-header">
            <h3>{t('Customer Mix')}</h3>
            <p>{t('Returning vs New Customers.')}</p>
          </div>
          <div className="retention-content">
            <div className="retention-stats">
              {charts?.retention?.map(item => (
                <div key={item.name} className="stat-item">
                  <span className="lab">{item.name}</span>
                  <span className="val" style={{ color: item.color }}>{item.value}</span>
                </div>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={charts?.retention} layout="vertical">
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" hide />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                  {charts?.retention?.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="footer-link" style={{ visibility: 'hidden' }}>
              <span>{t('View Customer Profiles')}</span> <ArrowRight size={14} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
