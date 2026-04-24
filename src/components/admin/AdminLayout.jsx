import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import { useAuth } from '../../contexts/AuthContext';
import { useAppSettings } from '../../contexts/AppSettingsContext';
import { LogOut, User, Bell, Sun, Moon, Menu, UserCog, ChevronDown, CheckCircle2, X } from 'lucide-react';
import { notificationAPI } from '../../services/api';
import { getRoleClass, getRoleLabel, isAdminLikeRole, isSuperAdminRole } from '../../utils/roles';
import './AdminLayout.css';

const MOBILE_BREAKPOINT = 1024;

const isMobileViewportNow = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`).matches;
};

const AdminLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const { t } = useAppSettings();
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const notificationRef = useRef(null);
  
  // Theme & Sidebar States
  const [isMobileViewport, setIsMobileViewport] = useState(isMobileViewportNow);
  const [isSidebarVisible, setIsSidebarVisible] = useState(() => !isMobileViewportNow());
  const [theme, setTheme] = useState(() => localStorage.getItem('adminTheme') || 'light');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const roleLabel = getRoleLabel(user?.role) || 'Admin';
  const isAdminAccess = isAdminLikeRole(user?.role);
  const isSuperAdmin = isSuperAdminRole(user?.role);

  const loadNotifications = useCallback(async () => {
    if (!user || !isAdminAccess) return;
    try {
      const res = await notificationAPI.getNotifications();
      if (res.success) {
        setNotifications(res.data || []);
        setUnreadCount(res.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to load notifications', err);
    }
  }, [user, isAdminAccess]);

  useEffect(() => {
    localStorage.setItem('adminTheme', theme);
  }, [theme]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const mediaQuery = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`);
    const handleViewportChange = (event) => {
      const mobile = event.matches;
      setIsMobileViewport(mobile);
      setIsSidebarVisible(!mobile);
      setShowProfileMenu(false);
      setShowNotifications(false);
    };

    handleViewportChange(mediaQuery);

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleViewportChange);
      return () => mediaQuery.removeEventListener('change', handleViewportChange);
    }

    mediaQuery.addListener(handleViewportChange);
    return () => mediaQuery.removeListener(handleViewportChange);
  }, []);

  useEffect(() => {
    if (!isMobileViewport) {
      document.body.style.overflow = '';
      return undefined;
    }

    document.body.style.overflow = isSidebarVisible ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileViewport, isSidebarVisible]);

  useEffect(() => {
    if (!user || !isAdminAccess) {
      const timer = window.setTimeout(() => {
        setNotifications([]);
        setUnreadCount(0);
      }, 0);
      return () => window.clearTimeout(timer);
    }

    const timer = window.setTimeout(() => {
      loadNotifications();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [user, loadNotifications, isAdminAccess]);

  useEffect(() => {
    if (!user || !isAdminAccess) return undefined;

    const interval = setInterval(loadNotifications, 10000);
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadNotifications();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [user, loadNotifications, isAdminAccess]);

  const handleMarkAsRead = async (id, link) => {
    try {
      await notificationAPI.markAsRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
      setShowNotifications(false);
      if (link) navigate(link);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async (e) => {
    e.stopPropagation();
    try {
      await notificationAPI.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteNotification = async (e, id) => {
    e.stopPropagation();
    try {
      await notificationAPI.deleteNotification(id);
      const deleted = notifications.find(n => n._id === id);
      if (deleted && !deleted.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      setNotifications(prev => prev.filter(n => n._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  // Handle outside clicks for profile and notification menus
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setShowProfileMenu(false);
    setShowNotifications(false);
    logout('/login');
  };

  const toggleSidebarVisibility = () => {
    setIsSidebarVisible(!isSidebarVisible);
  };

  const handleSidebarNavigate = () => {
    if (isMobileViewport) {
      setIsSidebarVisible(false);
    }
  };

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  return (
    <div
      className={`admin-layout ${theme === 'dark' ? 'dark-theme' : ''} ${!isSidebarVisible ? 'sidebar-hidden' : ''} ${isMobileViewport ? 'mobile-viewport' : ''} ${isMobileViewport && isSidebarVisible ? 'mobile-sidebar-open' : ''}`}
    >
      <AdminSidebar isHidden={!isSidebarVisible} onNavigate={handleSidebarNavigate} />

      {isMobileViewport && isSidebarVisible ? (
        <button
          type="button"
          className="admin-sidebar-backdrop"
          aria-label="Close navigation menu"
          onClick={() => setIsSidebarVisible(false)}
        />
      ) : null}
      
      <div className="admin-main">
        <header className="admin-header">
          <div className="header-left">
            <button className="sidebar-toggle" onClick={toggleSidebarVisibility} title={t('Toggle Sidebar')}>
              <Menu size={20} />
            </button>
          </div>
          
          <div className="header-right">
            <button className="header-icon-btn" onClick={toggleTheme} title={t('Toggle Dark Mode')}>
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            
            <div style={{ position: 'relative' }} ref={notificationRef}>
              <button 
                className="header-icon-btn" 
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowProfileMenu(false);
                  loadNotifications();
                }}
              >
                <Bell size={20} />
                {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
              </button>
              
              <div className={`dropdown-panel notifications-panel ${showNotifications ? 'active' : ''}`} style={{ padding: '0', cursor: 'default', overflow: 'hidden' }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--admin-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--admin-input-bg)' }}>
                  <h4 style={{ margin: '0', fontSize: '0.95rem', color: 'var(--admin-text-main)' }}>{t('Admin Alerts')}</h4>
                  {unreadCount > 0 && (
                    <button onClick={handleMarkAllRead} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: 'var(--admin-primary)', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer', padding: '0' }}>
                      <CheckCircle2 size={14} /> {t('markAllRead')}
                    </button>
                  )}
                </div>
                
                <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--admin-text-muted)', fontSize: '0.9rem' }}>
                      {t('No new alerts.')}
                    </div>
                  ) : (
                    notifications.map(notif => (
                      <div 
                        key={notif._id} 
                        className={`admin-notif-item ${!notif.isRead ? 'unread' : ''}`}
                        onClick={() => handleMarkAsRead(notif._id, notif.link)}
                      >
                        <div className="notif-item-header">
                          <div className="notif-title-wrap">
                            {!notif.isRead && <span className="notif-unread-dot" />}
                            <p className="notif-title">{notif.title}</p>
                          </div>
                          <div className="notif-item-actions">
                            <span style={{ fontSize: '0.7rem', color: 'var(--admin-text-muted)' }}>{new Date(notif.createdAt).toLocaleDateString()}</span>
                            <button 
                              className="notif-delete-btn"
                              onClick={(e) => handleDeleteNotification(e, notif._id)}
                              title={t('Hide notification')}
                            >
                              <X size={12} />
                            </button>
                          </div>
                        </div>
                        <p className="notif-msg">{notif.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
            
            <div className="admin-profile-dropdown" ref={menuRef}>
              <div className="admin-info">
                <span className="admin-name">{user?.firstName} {user?.lastName}</span>
                <span className={`admin-role ${isSuperAdmin ? `super-admin role-${getRoleClass(user?.role)}` : 'admin'}`}>{roleLabel}</span>
              </div>
              <div className="profile-actions-wrapper" onClick={() => { setShowProfileMenu(!showProfileMenu); setShowNotifications(false); }}>
                <div className="admin-avatar">
                  {user?.profilePicture ? (
                    <img src={user.profilePicture} alt="admin" />
                  ) : (
                    <User size={20} />
                  )}
                </div>
                <ChevronDown size={14} className={`dropdown-arrow ${showProfileMenu ? 'active' : ''}`} />
                
                {/* Profile Link and Logout Actions */}
                <div className={`dropdown-panel ${showProfileMenu ? 'active' : ''}`}>
                  <Link to="/admin/profile" className="dropdown-link" onClick={() => setShowProfileMenu(false)}>
                    <UserCog size={16} />
                    <span>{t('myProfile')}</span>
                  </Link>
                  <button onClick={handleLogout} className="dropdown-link logout">
                    <LogOut size={16} />
                    <span>{t('signOut')}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>
        
        <div className="admin-content">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
