import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useAppSettings } from '../contexts/AppSettingsContext';
import { userAPI, orderAPI } from '../services/api';
import './Profile.css';
import {
  LayoutDashboard,
  Package,
  Settings,
  MapPin,
  LogOut,
  ShoppingBag,
  Truck,
  Loader2,
  Camera,
  Shield,
  Plus,
  Star,
  User,
  Bell,
  CreditCard as PaymentIcon,
  CheckCircle,
  ChevronRight,
  ClipboardList,
  Activity
} from 'lucide-react';

const Profile = () => {
  const { user, token, logout, login } = useAuth();
  const { cartCount } = useCart();
  const { formatPrice, t } = useAppSettings();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('overview');
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [profileInfo, setProfileInfo] = useState(null);
  
  const [formData, setFormData] = useState({ firstName: user?.firstName || '', lastName: user?.lastName || '' });
  const [updating, setUpdating] = useState(false);
  const [updateMsg, setUpdateMsg] = useState('');

  const [passData, setPassData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [updatingPass, setUpdatingPass] = useState(false);
  const [passMsg, setPassMsg] = useState('');

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [newAddress, setNewAddress] = useState({ contactName: '', phone: '', country: '', address: '', isDefault: false });
  const [updatingAddress, setUpdatingAddress] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoMsg, setPhotoMsg] = useState('');

  useEffect(() => {
    if (!token || !user) {
      navigate('/login');
      return;
    }

    let cancelled = false;

    const loadDashboard = async () => {
      try {
        const profileRes = await userAPI.getProfile();
        if (!cancelled && profileRes.success) {
          setProfileInfo(profileRes.data);
        }
      } catch {
        console.error('Failed to load profile');
      }

      if (!cancelled) {
        setLoadingOrders(true);
      }

      try {
        const ordersRes = await orderAPI.getMyOrders();
        if (!cancelled && ordersRes?.success) {
          setOrders(ordersRes.data);
        }
      } catch {
        console.error('Failed to fetch orders');
      } finally {
        if (!cancelled) {
          setLoadingOrders(false);
        }
      }
    };

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [token, user, navigate]);

  const refreshProfile = async () => {
    try {
      const res = await userAPI.getProfile();
      if (res.success) {
        setProfileInfo(res.data);
      }
    } catch {
      console.error('Failed to load profile');
    }
  };

  const totalSpent = orders.filter(o => o.status !== 'CANCELLED').reduce((sum, o) => sum + (o.totalAmount || o.totalPrice || 0), 0);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('image', file);
    setUploadingPhoto(true);
    setPhotoMsg('');
    try {
      const response = await userAPI.updateProfilePhoto(fd);
      const nextProfile = response?.data?.user || response?.user || {
        ...user,
        profilePicture: response?.data?.profilePicture || user?.profilePicture
      };
      login(nextProfile, token);
      setProfileInfo(nextProfile);
      setPhotoMsg('Profile photo updated successfully.');
      refreshProfile();
    } catch (error) {
      setPhotoMsg(error.message || 'Photo upload failed.');
    }
    finally { setUploadingPhoto(false); }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdating(true); setUpdateMsg('');
    try {
      await userAPI.updateProfile(formData);
      login({ ...user, firstName: formData.firstName, lastName: formData.lastName }, token);
      setUpdateMsg('Profile updated successfully.');
    } catch {
      setUpdateMsg('Failed to update profile.');
    }
    finally { setUpdating(false); }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setUpdatingPass(true); setPassMsg('');
    if ((passData.newPassword || '').length < 8) {
      setPassMsg('New password must be at least 8 characters long.');
      setUpdatingPass(false);
      return;
    }
    if (passData.confirmPassword && passData.newPassword !== passData.confirmPassword) {
      setPassMsg('New password and confirmation must match.');
      setUpdatingPass(false);
      return;
    }
    try {
      await userAPI.updatePassword(passData);
      setPassMsg('Password updated successfully.');
      setPassData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      setPassMsg(error.message || 'Failed to update password.');
    }
    finally { setUpdatingPass(false); }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    setUpdatingAddress(true);
    try {
      if (editingAddressId) {
        await userAPI.updateAddress(editingAddressId, newAddress);
      } else {
        await userAPI.addAddress(newAddress);
      }
      setShowAddForm(false);
      setEditingAddressId(null);
      setNewAddress({ contactName: '', phone: '', country: '', address: '', isDefault: false });
      refreshProfile();
    } catch {
      console.error('Failed to save address');
    }
    finally { setUpdatingAddress(false); }
  };

  const handleStartEdit = (addr) => {
    setEditingAddressId(addr._id);
    setNewAddress({
      contactName: addr.contactName,
      phone: addr.phone,
      country: addr.country,
      address: addr.address,
      isDefault: addr.isDefault
    });
    setShowAddForm(true);
    window.scrollTo({ top: document.querySelector('.addresses-tab')?.offsetTop - 100, behavior: 'smooth' });
  };

  const handleDeleteAddress = async (id) => {
    if (!window.confirm("Are you sure you want to delete this address?")) return;
    try { await userAPI.deleteAddress(id); refreshProfile(); }
    catch {
      console.error('Failed to delete address');
    }
  };

  // Helper to treat confirmed orders as PAID visually
  const getPaymentStatus = (order) => {
    if (order.paymentStatus === 'PAID') return 'PAID';
    if (order.status !== 'CANCELLED') return 'PAID'; // Treat as PAID for demo/logic
    return order.paymentStatus || 'UNPAID';
  };

  if (!user) return null;
  const currentProfilePic = profileInfo?.profilePicture || user?.profilePicture;

  return (
    <div className="profile-page animate-fade">
      <div className="profile-container">
        
        {/* Sidebar */}
        <div className="profile-sidebar">
          <div className="user-quick-info">
              <div className="user-avatar-wrap">
                {uploadingPhoto ? <Loader2 className="animate-spin" size={24} /> : currentProfilePic ? <img src={currentProfilePic} alt="avatar" /> : <User size={40} />}
                <label className="avatar-overlay">
                  <Camera size={18} />
                  <input type="file" accept="image/*" style={{display: 'none'}} onChange={handlePhotoUpload} disabled={uploadingPhoto} />
                </label>
              </div>
              {photoMsg ? <p style={{ marginTop: '0.85rem', fontSize: '0.9rem', fontWeight: 700, color: photoMsg.includes('success') ? 'var(--brand-primary)' : '#b91c1c' }}>{photoMsg}</p> : null}
              <h2 className="user-name">{user.firstName} {user.lastName}</h2>
              <p className="user-email">{user.email}</p>
            </div>

          <div className="profile-nav-list">
            {[
              { id: 'overview', label: 'Overview', icon: LayoutDashboard },
              { id: 'orders', label: 'My Orders', icon: Package },
              { id: 'addresses', label: 'Addresses', icon: MapPin },
              { id: 'settings', label: 'Settings', icon: Settings },
              { id: 'security', label: 'Security', icon: Shield }
            ].map(tab => (
              <button key={tab.id} className={`profile-nav-item ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
                <tab.icon size={18} /> {tab.label}
              </button>
            ))}
            <button className="profile-nav-item logout-btn" onClick={() => logout('/login')}>
              <LogOut size={18} /> Logout
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="profile-content">
          
          {/* OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="dashboard-overview animate-fade">
              <div className="dashboard-header">
                <h1>Welcome back, {user.firstName}</h1>
                <p>Monitor your performance and track your latest purchase tracking IDs.</p>
              </div>

              <div className="overview-stats-grid">
                <div className="stat-card-clean">
                  <div className="stat-icon-wrap"><Package size={22} /></div>
                  <div className="stat-content">
                    <span className="stat-label">Total Purchases</span>
                    <span className="stat-value">{orders.length}</span>
                  </div>
                </div>
                <div className="stat-card-clean">
                  <div className="stat-icon-wrap"><PaymentIcon size={22} /></div>
                  <div className="stat-content">
                    <span className="stat-label">Total Spend</span>
                    <span className="stat-value">{formatPrice(totalSpent)}</span>
                  </div>
                </div>
                <div className="stat-card-clean">
                  <div className="stat-icon-wrap"><ShoppingBag size={22} /></div>
                  <div className="stat-content">
                    <span className="stat-label">Cart Count</span>
                    <span className="stat-value">{cartCount}</span>
                  </div>
                </div>
              </div>

              <div className="dashboard-row-main" style={{ gridTemplateColumns: '1fr' }}>
                <div className="recent-activity">
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Activity size={18} /> Latest Order Trace</h3>
                  {orders.length > 0 ? (
                    <div className="latest-order-card">
                      <div className="latest-order-img">
                        <img src={orders[0].items[0]?.productId?.imageUrl || 'https://via.placeholder.com/200'} alt="latest" />
                      </div>
                      <div className="latest-order-info">
                        <div className="latest-order-meta">
                          <span className="tracking-label">ID: {orders[0].trackingId || 'TRK-NEW-ORDER'}</span>
                          <span className="order-date-label">{new Date(orders[0].createdAt).toLocaleDateString()}</span>
                        </div>
                        <h4 className="latest-order-title">{orders[0].items[0]?.productId?.name || 'Store Item'}</h4>
                        <div className="latest-order-footer">
                          <span className="price-label">{formatPrice(orders[0].totalAmount || 0)}</span>
                          <button className="btn-outline" style={{ padding: '8px 20px', fontSize: '0.85rem' }} onClick={() => setActiveTab('orders')}>
                            Full Details <ChevronRight size={14} style={{ marginLeft: '4px' }} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="stat-card-clean" style={{ justifyContent: 'center', padding: '4rem', borderStyle: 'dashed' }}>
                      <p style={{ color: 'var(--profile-text-muted)', fontWeight: 600 }}>No recent purchase activity found.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* MY ORDERS */}
          {activeTab === 'orders' && (
            <div className="orders-tab animate-fade">
              <div className="dashboard-header">
                <h1>Order History & Tracking</h1>
                <p>Trace your shipments and view detailed billing with Tracking IDs.</p>
              </div>
              {loadingOrders ? <div style={{ textAlign: 'center', padding: '6rem' }}><Loader2 className="animate-spin" size={40} color="var(--brand-primary)" /></div> 
              : orders.length === 0 ? <div style={{ textAlign: 'center', padding: '6rem', color: 'var(--profile-text-muted)' }}>You have no orders yet.</div> 
              : <div className="orders-list">
                  {orders.map(order => (
                    <div key={order._id} className="order-card">
                      <div className="order-header">
                        <div className="meta-grid">
                          <div className="meta-block"><p>Tracking ID</p><p>{order.trackingId || 'TRK-GENERATING'}</p></div>
                          <div className="meta-block"><p>{t('subtotal')}</p><p>{formatPrice(order.totalAmount || 0)}</p></div>
                          <div className="meta-block"><p>Purchased On</p><p>{new Date(order.createdAt).toLocaleDateString()}</p></div>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                          <button className="view-trace-btn" onClick={() => setExpandedOrder(expandedOrder === order._id ? null : order._id)}>
                            {expandedOrder === order._id ? 'Close Trace' : 'View Trace'}
                          </button>
                          <span className={`status-pill status-${order.status && order.status.toLowerCase()}`}>{order.status}</span>
                        </div>
                      </div>

                      {expandedOrder === order._id && (
                        <div className="order-detail-expander animate-fade">
                          <div className="detail-grid">
                            <div className="detail-block">
                              <h5><Truck size={14} style={{marginRight: '8px'}} /> Shipping To</h5>
                              <p>{order.shippingAddress?.contactName}<br/>{order.shippingAddress?.address}<br/>{order.shippingAddress?.country}<br/>{order.shippingAddress?.phone}</p>
                            </div>
                            <div className="detail-block">
                              <h5><PaymentIcon size={14} style={{marginRight: '8px'}} /> Payment Status</h5>
                              <p>Method: {order.paymentMethod}<br/>Status: <strong>{getPaymentStatus(order)}</strong><br/>Tracking Ref: {order.trackingId || 'Pending'}</p>
                            </div>
                            <div className="detail-block">
                              <h5><ClipboardList size={14} style={{marginRight: '8px'}} /> Final Invoice</h5>
                              <p style={{ display: 'flex', justifyContent: 'space-between' }}>{t('Items Subtotal')}: <span>{formatPrice(order.subtotal || 0)}</span></p>
                              {order.urgentDelivery && <p style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--brand-primary)' }}>{t('Priority Handling')}: <span>{formatPrice(5)}</span></p>}
                              <p style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #ddd', paddingTop: '10px', marginTop: '10px', fontWeight: 900, fontSize: '1.1rem' }}>{t('Total Paid')}: <span>{formatPrice(order.totalAmount || 0)}</span></p>
                            </div>
                          </div>
                        </div>
                      )}

                      <div style={{ padding: '2rem' }}>
                        {order.items.map((item, idx) => (
                          <div key={idx} style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', marginBottom: idx !== order.items.length - 1 ? '1.5rem' : 0 }}>
                            <img src={item.productId?.imageUrl || 'https://via.placeholder.com/100'} alt="item" className="order-item-img" />
                            <div style={{ flex: 1 }}>
                              <p style={{ fontWeight: 800, margin: 0, color: 'var(--profile-text-main)' }}>{item.productId?.name}</p>
                              <p style={{ fontSize: '0.85rem', color: 'var(--profile-text-muted)', margin: 0, fontWeight: 600 }}>Quantity: {item.quantity}</p>
                            </div>
                            <Link to={`/product/${item.productId?._id}`} className="btn-outline" style={{ padding: '8px 16px', fontSize: '0.8rem' }}>Review Item</Link>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              }
            </div>
          )}

          {/* ADDRESSES */}
          {activeTab === 'addresses' && (
            <div className="addresses-tab animate-fade">
              <div className="dashboard-header">
                <h1>Saved Addresses</h1>
                <p>Manage your delivery locations for faster, optimized checkout.</p>
              </div>
              <div className="addresses-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {profileInfo?.addresses?.map(addr => (
                  <div key={addr._id} className={`address-card-hifi ${addr.isDefault ? 'default' : ''}`}>
                    {addr.isDefault && <span style={{ position: 'absolute', top: '-10px', right: '20px', background: 'var(--brand-primary)', color: 'white', fontSize: '0.65rem', fontWeight: 900, padding: '4px 12px', borderRadius: '100px' }}>PRIMARY HUB</span>}
                    <h4 style={{ fontWeight: 900, marginBottom: '8px', color: 'var(--profile-text-main)' }}>{addr.contactName}</h4>
                    <p style={{ fontSize: '0.95rem', color: 'var(--profile-text-muted)', lineHeight: '1.6', marginBottom: '1.5rem', fontWeight: 600 }}>{addr.address}<br/>{addr.country}<br/>Phone: {addr.phone}</p>
                    <div style={{ display: 'flex', gap: '1.5rem', borderTop: '1px solid var(--profile-border)', paddingTop: '1.25rem' }}>
                      <button onClick={() => handleStartEdit(addr)} className="profile-nav-item" style={{ width: 'auto', padding: 0, fontSize: '0.85rem', color: 'var(--brand-primary)' }}>Edit Hub</button>
                      <button onClick={() => handleDeleteAddress(addr._id)} className="profile-nav-item" style={{ width: 'auto', padding: 0, fontSize: '0.85rem', color: '#b91c1c' }}>De-register</button>
                    </div>
                  </div>
                ))}
                
                <div onClick={() => setShowAddForm(true)} className="add-address-placeholder">
                  <Plus size={24} color="var(--brand-primary)" />
                  <span style={{ fontWeight: 800, color: 'var(--profile-text-main)' }}>Add Delivery Location</span>
                </div>
              </div>

              {showAddForm && (
                <div className="address-form-wrap">
                  <h3 style={{ marginBottom: '2rem', fontWeight: 900 }}>{editingAddressId ? 'Update Delivery Point' : 'New Location Setup'}</h3>
                  <form onSubmit={handleAddAddress}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem' }}>
                      <div className="profile-input-group"><label>Receiver Name</label><input type="text" className="profile-input-hifi" required value={newAddress.contactName} onChange={e => setNewAddress({...newAddress, contactName: e.target.value})} /></div>
                      <div className="profile-input-group"><label>Interface Phone</label><input type="text" className="profile-input-hifi" required value={newAddress.phone} onChange={e => setNewAddress({...newAddress, phone: e.target.value})} /></div>
                      <div className="profile-input-group"><label>Country/Region</label><input type="text" className="profile-input-hifi" required value={newAddress.country} onChange={e => setNewAddress({...newAddress, country: e.target.value})} /></div>
                    </div>
                    <div className="profile-input-group"><label>Full Delivery Address</label><textarea className="profile-input-hifi" rows="3" required value={newAddress.address} onChange={e => setNewAddress({...newAddress, address: e.target.value})} /></div>
                    <div style={{ display: 'flex', gap: '1.5rem' }}>
                      <button type="submit" className="btn-primary">{updatingAddress ? <Loader2 className="animate-spin" size={18} /> : 'Save Location'}</button>
                      <button type="button" onClick={() => setShowAddForm(false)} className="profile-nav-item" style={{ width: 'auto', padding: '0 24px' }}>Cancel</button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* SETTINGS */}
          {activeTab === 'settings' && (
            <div style={{ maxWidth: '650px' }} className="animate-fade">
              <div className="dashboard-header">
                <h1>Profile Information</h1>
                <p>Update your personal account details and display name.</p>
              </div>
              <form onSubmit={handleUpdateProfile}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem' }}>
                  <div className="profile-input-group"><label>First Name</label><input type="text" className="profile-input-hifi" required value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} /></div>
                  <div className="profile-input-group"><label>Last Name</label><input type="text" className="profile-input-hifi" required value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} /></div>
                </div>
                <div className="profile-input-group"><label>Registered Email</label><input type="email" className="profile-input-hifi disabled" value={user.email} disabled /></div>
                <button type="submit" className="btn-primary" disabled={updating}>{updating ? <Loader2 className="animate-spin" size={18}/> : 'Save Changes'}</button>
                {updateMsg && <p style={{marginTop: '1.5rem', color: 'var(--brand-primary)', fontWeight: 900}}>{updateMsg}</p>}
              </form>
            </div>
          )}

          {/* SECURITY */}
          {activeTab === 'security' && (
            <div style={{ maxWidth: '650px' }} className="animate-fade">
              <div className="dashboard-header">
                <h1>Security Settings</h1>
                <p>Enhance your account integrity with updated credentials.</p>
              </div>
              <form onSubmit={handleUpdatePassword}>
                <div className="profile-input-group"><label>Current Password</label><input type="password" className="profile-input-hifi" required value={passData.currentPassword} onChange={e => setPassData({...passData, currentPassword: e.target.value})} /></div>
                <div className="profile-input-group"><label>New Authorization Phrase</label><input type="password" className="profile-input-hifi" required value={passData.newPassword} onChange={e => setPassData({...passData, newPassword: e.target.value})} /></div>
                <div className="profile-input-group"><label>Confirm New Password</label><input type="password" className="profile-input-hifi" required value={passData.confirmPassword || ''} onChange={e => setPassData({...passData, confirmPassword: e.target.value})} /></div>
                <button type="submit" className="btn-primary" disabled={updatingPass}>{updatingPass ? <Loader2 className="animate-spin" size={18}/> : 'Update Password'}</button>
                {passMsg && <p style={{ marginTop: '1.5rem', fontWeight: 900, color: passMsg.includes('success') ? 'var(--brand-primary)' : '#b91c1c' }}>{passMsg}</p>}
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Profile;
