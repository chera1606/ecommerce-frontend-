import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, User, Search, Store, Menu, X, Bell, CheckCircle2, Moon, Sun } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useAppSettings } from '../../contexts/AppSettingsContext';
import { notificationAPI } from '../../services/api';
import { getAccountRoute, getRoleClass, getRoleLabel } from '../../utils/roles';
import './Navbar.css';

const NAV_LINKS = [
  { key: 'home', path: '/' },
  { key: 'shop', path: '/shop' },
  { key: 'about', path: '/about' },
  { key: 'contact', path: '/contact' }
];

const Navbar = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, logout } = useAuth();
  const { cartCount, setIsCartOpen } = useCart();
  const {
    language,
    setLanguage,
    currency,
    setCurrency,
    theme,
    toggleTheme,
    t,
    supportedLanguages,
    supportedCurrencies
  } = useAppSettings();
  const navigate = useNavigate();
  const location = useLocation();
  const roleLabel = getRoleLabel(user?.role);

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const visibleNotifications = user ? notifications : [];
  const visibleUnreadCount = user ? unreadCount : 0;

  const loadNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const res = await notificationAPI.getNotifications();
      if (res.success) {
        setNotifications(res.data || []);
        setUnreadCount(res.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to load notifications', err);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return undefined;

    const timer = window.setTimeout(() => {
      loadNotifications();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [user, loadNotifications]);

  useEffect(() => {
    if (!user) return undefined;

    const interval = setInterval(loadNotifications, 15000);
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
  }, [user, loadNotifications]);

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

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchTerm)}`);
      setMobileOpen(false);
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className={`main-navbar ${scrolled ? 'is-scrolled' : ''}`}>
      <div className="navbar-inner">

        {/* Brand */}
        <Link to="/" className="nav-brand" onClick={() => setMobileOpen(false)}>
          <Store size={22} strokeWidth={1.5} />
          <span>Efoy Gabeya</span>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="nav-links desktop-only">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`nav-link ${isActive(link.path) ? 'active' : ''}`}
            >
              {t(link.key)}
            </Link>
          ))}
        </nav>

        {/* Search Bar */}
        {!location.pathname.includes('/profile') && !location.pathname.includes('/admin') && !location.pathname.includes('/login') && !location.pathname.includes('/register') && (
          <form className="nav-search" onSubmit={handleSearch}>
            <Search size={17} className="nav-search-icon" />
            <input
              type="text"
              placeholder={t('searchProducts')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button type="submit" className="nav-search-btn">{t('search')}</button>
          </form>
        )}

        <div className="nav-preferences desktop-only">
          <select
            className="nav-select"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            aria-label={t('language')}
            title={t('language')}
          >
            {supportedLanguages.map((entry) => (
              <option key={entry.code} value={entry.code}>{entry.label}</option>
            ))}
          </select>

          <select
            className="nav-select"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            aria-label={t('currency')}
            title={t('currency')}
          >
            {supportedCurrencies.map((entry) => (
              <option key={entry.code} value={entry.code}>{entry.label}</option>
            ))}
          </select>

          <button
            type="button"
            className="theme-toggle-btn"
            onClick={toggleTheme}
            title={theme === 'dark' ? t('lightMode') : t('darkMode')}
            aria-label={theme === 'dark' ? t('lightMode') : t('darkMode')}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>

        {/* Action Icons */}
        <div className="nav-actions">
          {user ? (
            <>
              {roleLabel ? <span className={`nav-role-badge role-${getRoleClass(user.role)}`}>{roleLabel}</span> : null}
              <div style={{ position: 'relative' }}>
                <button 
                  className="nav-icon-btn" 
                  title={t('notifications')}
                  onClick={() => {
                    setShowNotifications(!showNotifications);
                    loadNotifications();
                  }}
                >
                  <div className="cart-icon-wrap">
                    <Bell size={22} strokeWidth={1.5} />
                    {visibleUnreadCount > 0 && <span className="cart-badge">{visibleUnreadCount}</span>}
                  </div>
                  <span className="nav-icon-label">{t('alerts')}</span>
                </button>
                
                {/* Notification Dropdown */}
                {showNotifications && (
                  <div className="user-notification-dropdown">
                    <div className="un-header">
                      <h4>{t('notifications')}</h4>
                      {visibleUnreadCount > 0 && (
                        <button onClick={handleMarkAllRead} className="un-mark-all">
                          <CheckCircle2 size={14} /> {t('markAllRead')}
                        </button>
                      )}
                    </div>
                    <div className="un-list">
                      {visibleNotifications.length === 0 ? (
                        <div className="un-empty">{t('noNotificationsYet')}</div>
                      ) : (
                        visibleNotifications.map(notif => (
                          <div 
                            key={notif._id} 
                            className={`un-item ${!notif.isRead ? 'unread' : ''}`}
                            onClick={() => handleMarkAsRead(notif._id, notif.link)}
                          >
                            <div className="un-item-content">
                              <strong>{notif.title}</strong>
                              <p>{notif.message}</p>
                              <span className="un-time">{new Date(notif.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="un-item-actions">
                              {!notif.isRead && <span className="un-dot"></span>}
                              <button 
                                className="un-delete-btn" 
                                onClick={(e) => handleDeleteNotification(e, notif._id)}
                                title="Hide notification"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
              <Link 
                to={getAccountRoute(user.role)} 
                className="nav-icon-btn desktop-only" 
                title={t('account')}
                onClick={() => setShowNotifications(false)}
              >
                <User size={22} strokeWidth={1.5} />
                <span className="nav-icon-label">{t('account')}</span>
              </Link>
            </>
          ) : (
            <Link to="/login" className="nav-auth-btn desktop-only">
              {t('signIn')}
            </Link>
          )}

          <button className="nav-icon-btn cart-nav-btn" onClick={() => setIsCartOpen(true)}>
            <div className="cart-icon-wrap">
              <ShoppingCart size={22} strokeWidth={1.5} />
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </div>
            <span className="nav-icon-label">{t('cart')}</span>
          </button>

          {/* Mobile menu toggle */}
          <button
            className="nav-icon-btn mobile-menu-btn mobile-only"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

      </div>

      {/* Mobile Dropdown Menu */}
      {mobileOpen && (
        <div className="mobile-nav">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`mobile-nav-link ${isActive(link.path) ? 'active' : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              {t(link.key)}
            </Link>
          ))}
          <div className="mobile-nav-divider" />
          <div className="mobile-pref-row">
            <label htmlFor="mobile-language">{t('language')}</label>
            <select
              id="mobile-language"
              className="mobile-nav-select"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              {supportedLanguages.map((entry) => (
                <option key={entry.code} value={entry.code}>{entry.label}</option>
              ))}
            </select>
          </div>
          <div className="mobile-pref-row">
            <label htmlFor="mobile-currency">{t('currency')}</label>
            <select
              id="mobile-currency"
              className="mobile-nav-select"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            >
              {supportedCurrencies.map((entry) => (
                <option key={entry.code} value={entry.code}>{entry.label}</option>
              ))}
            </select>
          </div>
          <button
            type="button"
            className="mobile-nav-link"
            onClick={toggleTheme}
          >
            {theme === 'dark' ? t('lightMode') : t('darkMode')}
          </button>
          <div className="mobile-nav-divider" />
          {user ? (
            <>
              {roleLabel ? <div className={`mobile-role-note role-${getRoleClass(user.role)}`}>{roleLabel} {t('access')}</div> : null}
              <Link to={getAccountRoute(user.role)} className="mobile-nav-link" onClick={() => setMobileOpen(false)}>
                {t('myProfile')}
              </Link>
              <button className="mobile-nav-link" style={{color: '#ef4444', textAlign: 'left', width: '100%'}} onClick={() => { setMobileOpen(false); logout('/login'); }}>
                {t('signOut')}
              </button>
            </>
          ) : (
            <Link to="/login" className="mobile-nav-link" onClick={() => setMobileOpen(false)}>
              {t('accountSignIn')}
            </Link>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
