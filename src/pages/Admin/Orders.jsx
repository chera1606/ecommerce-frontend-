import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  Truck, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Calendar,
  User,
  MapPin,
  CreditCard,
  ShoppingBag,
  ExternalLink
} from 'lucide-react';
import { adminAPI } from '../../services/api';
import { useAppSettings } from '../../contexts/AppSettingsContext';
import AdminModal from '../../components/admin/AdminModal';
import './AdminOrders.css';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const { formatPrice, t } = useAppSettings();

  const fetchOrders = async () => {
    try {
      const query = new URLSearchParams();
      if (search) query.set('search', search);
      if (statusFilter !== 'ALL') query.set('status', statusFilter);
      
      const res = await adminAPI.getOrders(query.toString());
      setOrders(res.data || []);
      setStats(res.stats || null);
    } catch (err) {
      console.error("Order fetch error:", err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delay = setTimeout(() => {
      fetchOrders();
    }, 400);
    return () => clearTimeout(delay);
  }, [search, statusFilter]);

  const handleStatusUpdate = async (orderId, newStatus) => {
    setUpdating(orderId);
    try {
      await adminAPI.updateOrderStatus(orderId, newStatus);
      await fetchOrders(); // Refresh data
    } catch (err) {
      alert(err.message || "Status update failed");
    } finally {
      setUpdating(null);
    }
  };

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="admin-loader-container">
        <Loader2 className="animate-spin text-emerald-500" size={48} />
        <p>{t('loadingOrders')}</p>
      </div>
    );
  }

  return (
    <div className="admin-orders animate-fade-in">
      <div className="orders-header">
        <div className="header-titles">
          <h2>{t('Orders')}</h2>
          <p>{t('Manage and process customer orders.')}</p>
        </div>
        
        <div className="quick-stats-bar">
          <div className="q-stat">
            <span className="q-label">{t('In Transit')}</span>
            <span className="q-value">{stats?.activeShipments || 0}</span>
          </div>
          <div className="q-stat">
            <span className="q-label">{t('Urgent Orders')}</span>
            <span className="q-value urgent">{stats?.urgentOrders || 0}</span>
          </div>
        </div>
      </div>

      <div className="orders-controls" style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div className="search-box">
          <Search size={18} />
          <input 
            type="text" 
            placeholder={t('Search by Order ID or Customer name...')} 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-box" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--admin-card-bg)', border: '1px solid var(--admin-border)', borderRadius: '8px', padding: '0.5rem 1rem' }}>
          <label htmlFor="statusFilter" style={{ fontSize: '0.875rem', color: 'var(--admin-text-muted)', fontWeight: '500' }}>{t('Status')}:</label>
          <select 
            id="statusFilter" 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ background: 'transparent', border: 'none', color: 'var(--admin-text)', fontSize: '0.875rem', outline: 'none', cursor: 'pointer' }}
          >
            <option value="ALL">{t('All Statuses')}</option>
            <option value="PENDING">{t('Pending')}</option>
            <option value="CONFIRMED">{t('Confirmed')}</option>
            <option value="SHIPPED">{t('Shipped')}</option>
            <option value="DELIVERED">{t('Delivered')}</option>
            <option value="CANCELLED">{t('Cancelled')}</option>
          </select>
        </div>
      </div>

      <div className="orders-table-card">
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t('Tracking ID')}</th>
                <th>{t('Order')}</th>
                <th>{t('Customer')}</th>
                <th>{t('Date')}</th>
                <th>{t('Amount')}</th>
                <th>{t('Logistics')}</th>
                <th>{t('Action')}</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(orders) && orders.map(order => (
                <tr key={order._id}>
                  <td className="tracking-id-cell">
                    <span className="trk-text">{order.trackingId || t('N/A')}</span>
                  </td>
                  <td className="order-id-cell">
                    <span className="id-text">#{order.orderId || (order._id && order._id.slice(-6).toUpperCase())}</span>
                    {order.urgentDelivery && <span className="urgent-tag">URGENT</span>}
                  </td>
                  <td>
                    <div className="customer-info">
                      <span className="c-name">{order.guest || t('Unknown Customer')}</span>
                    </div>
                  </td>
                  <td className="date-cell">
                    {order.date ? new Date(order.date).toLocaleDateString() : t('N/A')}
                  </td>
                  <td className="amount-cell">{formatPrice(order.total || order.totalPrice || 0)}</td>
                  <td>
                    <div className="status-selector-wrapper">
                      <select 
                        className={`status-select status-${order.status?.toLowerCase()}`}
                        value={order.status}
                        disabled={updating === order._id || order.status === 'DELIVERED' || order.status === 'CANCELLED'}
                        onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                      >
                        <option value="PENDING">{t('Pending')}</option>
                        <option value="CONFIRMED">{t('Confirmed')}</option>
                        <option value="SHIPPED">{t('Shipped')}</option>
                        <option value="DELIVERED">{t('Delivered')}</option>
                        <option value="CANCELLED">{t('Cancelled')}</option>
                      </select>
                      {updating === order._id && <Loader2 className="select-loader animate-spin" size={14} />}
                    </div>
                  </td>
                  <td>
                    <button className="action-btn-circle" onClick={() => handleViewDetails(order)}>
                      <ExternalLink size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {(!orders || orders.length === 0) && (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                    {t('No orders have been placed yet.')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Modal */}
      <AdminModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`${t('Order Details')}: ${selectedOrder?.trackingId || selectedOrder?.orderId}`}
        footer={
          <button className="btn-emerald" onClick={() => setIsModalOpen(false)}>{t('Close Summary')}</button>
        }
      >
        {selectedOrder && (
          <div className="order-details-view">
            <div className="details-section">
              <div className="section-title"><User size={16} /> {t('Customer Information')}</div>
              <div className="info-grid">
                <div className="info-item">
                  <span className="label">{t('Full Name')}</span>
                  <span className="value">{selectedOrder.guest}</span>
                </div>
                <div className="info-item">
                  <span className="label">{t('Contact Phone')}</span>
                  <span className="value">{selectedOrder.shippingAddress?.phone || t('N/A')}</span>
                </div>
              </div>
            </div>

            <div className="details-section">
              <div className="section-title"><MapPin size={16} /> {t('Delivery Destination')}</div>
              <div className="address-box">
                <p>{selectedOrder.shippingAddress?.address}</p>
                <p>{selectedOrder.shippingAddress?.country}</p>
              </div>
            </div>

            <div className="details-section">
              <div className="section-title"><CreditCard size={16} /> {t('Payment & Logistics')}</div>
              <div className="info-grid">
                <div className="info-item">
                  <span className="label">{t('Payment Method')}</span>
                  <span className="value badge">{selectedOrder.paymentMethod}</span>
                </div>
                <div className="info-item">
                  <span className="label">{t('Status')}</span>
                  <span className={`value status-text status-${selectedOrder.status && selectedOrder.status.toLowerCase()}`}>{selectedOrder.status}</span>
                </div>
                <div className="info-item">
                  <span className="label">{t('Total Amount')}</span>
                  <span className="value highlight">{formatPrice(selectedOrder.total || 0)}</span>
                </div>
              </div>
            </div>

            <div className="details-section">
              <div className="section-title"><ShoppingBag size={16} /> {t('Purchased Assets')}</div>
              <div className="order-items-list">
                <div className="item-row header">
                  <span style={{ flex: 3 }}>{t('Product')}</span>
                  <span style={{ flex: 1, textAlign: 'center' }}>{t('Qty')}</span>
                  <span style={{ flex: 1, textAlign: 'right' }}>{t('Price')}</span>
                </div>
                {selectedOrder.items && selectedOrder.items.length > 0 ? (
                  selectedOrder.items.map((item, index) => {
                    const productInfo = selectedOrder.productDetails?.find(p => p._id === item.productId) || {};
                    return (
                      <div className="item-row" key={index} style={{ alignItems: 'center' }}>
                        <div style={{ flex: 3, display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <img 
                            src={productInfo.imageUrl || 'https://via.placeholder.com/40'} 
                            alt={productInfo.name || t('Product')} 
                            style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--admin-border)' }}
                          />
                          <div>
                            <span className="item-name" style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem' }}>{productInfo.name || t('Unknown Product')}</span>
                            {(item.size || item.color) && (
                              <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>
                                {item.size && `${t('Size')}: ${item.size}`} {item.color && `${t('Color')}: ${item.color}`}
                              </span>
                            )}
                          </div>
                        </div>
                        <span style={{ flex: 1, textAlign: 'center', fontWeight: 600 }}>{item.quantity}</span>
                        <span style={{ flex: 1, textAlign: 'right', fontWeight: 600 }}>{formatPrice(item.price * item.quantity)}</span>
                      </div>
                    );
                  })
                ) : (
                  <div className="item-row">
                    <span className="item-name">{selectedOrder.product}</span>
                    <span className="item-cat" style={{ flex: 1, textAlign: 'center' }}>-</span>
                    <span className="item-cat" style={{ flex: 1, textAlign: 'right' }}>-</span>
                  </div>
                )}
                <p className="items-meta-note">{t('Note: For bulk product logs, please check the system audit directory.')}</p>
              </div>
            </div>
          </div>
        )}
      </AdminModal>
    </div>
  );
};

export default Orders;
