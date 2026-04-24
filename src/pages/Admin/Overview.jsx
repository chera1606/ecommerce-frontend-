import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  ShoppingBag, 
  Users, 
  Package,
  TrendingUp,
  ArrowRight,
  Clock,
  MapPin,
  MoreVertical,
  Loader2
} from 'lucide-react';
import { adminAPI } from '../../services/api';
import { useAppSettings } from '../../contexts/AppSettingsContext';
import StatCard from '../../components/admin/StatCard';
import './AdminOverview.css';

const Overview = () => {
  const [data, setData] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const { formatPrice, t } = useAppSettings();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [overview, orders, stream] = await Promise.all([
          adminAPI.getOverview(),
          adminAPI.getRecentOrders(),
          adminAPI.getInventoryStream()
        ]);
        
        setData(overview || null);
        setRecentOrders(orders?.orders || []);
        setInventory(stream?.products || []);
      } catch (err) {
        console.error("Dashboard data load failure:", err);
        setRecentOrders([]);
        setInventory([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="admin-loader-container">
        <Loader2 className="animate-spin text-emerald-500" size={48} />
        <p>{t('loadingDashboard')}</p>
      </div>
    );
  }

  return (
    <div className="admin-overview animate-fade-in">
      <div className="overview-header">
        <div className="header-titles">
          <h2>{t('Dashboard')}</h2>
          <p>{t('Real-time performance metrics and store activity.')}</p>
        </div>
        <div className="header-date">
          <Clock size={16} />
          <span>{t('Last updated')}: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      <div className="stats-grid">
          <StatCard 
          title={t('Total Revenue')} 
          value={formatPrice(data?.revenue || 0)}
          icon={DollarSign}
          trend={data?.growth?.startsWith('+') ? 'up' : 'down'}
          trendValue={data?.growth || '+0%'}
          color="emerald"
        />
        <StatCard 
          title={t('Active Orders')} 
          value={data?.orders || 0}
          icon={ShoppingBag}
          trend="up"
          trendValue="+4.2%"
          color="blue"
        />
        <StatCard 
          title={t('Total Customers')} 
          value={data?.customers || 0}
          icon={Users}
          trend="up"
          trendValue="+8.1%"
          color="purple"
        />
        <StatCard 
          title={t('Inventory Items')} 
          value={data?.products || 0}
          icon={Package}
          color="amber"
        />
      </div>

      <div className="overview-main-grid">
        {/* Recent Orders Table */}
        <div className="dashboard-card orders-card">
          <div className="card-header">
            <h3>{t('Recent Orders')}</h3>
          </div>
          <div className="card-content">
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>{t('Order ID')}</th>
                    <th>{t('Customer')}</th>
                    <th>{t('Location')}</th>
                    <th>{t('Amount')}</th>
                    <th>{t('Status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(recentOrders) && recentOrders.map(order => (
                    <tr key={order._id}>
                      <td className="order-id">#{order._id?.slice(-6).toUpperCase() || t('N/A')}</td>
                      <td>{order.customer || t('Unknown')}</td>
                      <td className="location-cell">
                        <MapPin size={12} /> {order.location || t('N/A')}
                      </td>
                      <td className="amount-cell">{formatPrice(order.totalPrice || 0)}</td>
                      <td className="status-cell">
                        <span className={`status-pill status-${order.status?.toLowerCase() || 'pending'}`}>{order.status || t('Pending')}</span>
                      </td>
                    </tr>
                  ))}
                  {(!recentOrders || recentOrders.length === 0) && (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '1rem', color: '#64748b' }}>
                        {t('No recent orders.')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Live Inventory Feed */}
        <div className="dashboard-card inventory-card">
          <div className="card-header">
            <h3>{t('Inventory Stream')}</h3>
            <span className="live-tag">LIVE</span>
          </div>
          <div className="card-content">
            <div className="inventory-feed">
              {Array.isArray(inventory) && inventory.map(product => (
                <div className="inventory-item" key={product._id || product.id}>
                  <div className="item-img">
                    <img src={product.imageUrl || product.image} alt={product.name} />
                  </div>
                  <div className="item-details">
                    <span className="item-name">{product.name || t('Untitled Product')}</span>
                    <div className="item-meta">
                      <span className="item-price">{formatPrice(product.price || 0)}</span>
                      <span className={`item-stock ${(product.stock || 0) < 10 ? 'low' : ''}`}>
                        {t('{count} in stock', { count: product.stock || 0 })}
                      </span>
                    </div>
                  </div>
                  <button className="item-more" style={{ visibility: 'hidden' }}>
                    <MoreVertical size={16} />
                  </button>
                </div>
              ))}
              {(!inventory || inventory.length === 0) && (
                <p className="empty-feed">{t('No data in inventory stream.')}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;
