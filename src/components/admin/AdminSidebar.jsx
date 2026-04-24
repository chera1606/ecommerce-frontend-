import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingBag, 
  Users, 
  ExternalLink,
  Mail,
  BarChart3,
  Settings
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useAppSettings } from '../../contexts/AppSettingsContext';
import { isSuperAdminRole } from '../../utils/roles';
import './AdminSidebar.css';

const AdminSidebar = ({ isHidden, onNavigate }) => {
  const { user } = useAuth();
  const { t } = useAppSettings();
  const showSuperAdminSection = isSuperAdminRole(user?.role);
  const handleNavClick = () => {
    if (typeof onNavigate === 'function') {
      onNavigate();
    }
  };

  return (
    <aside className={`admin-sidebar ${isHidden ? 'hidden' : ''}`}>
      <div className="sidebar-brand">
        <div className="brand-logo">EG</div>
        <div className="brand-text">
          <span className="brand-name">Efoy Gabeya</span>
          <span className="brand-sub">{t('Admin Console')}</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-group">
          <span className="nav-label">{t('Main Menu')}</span>
          <NavLink to="/admin/overview" onClick={handleNavClick} className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
            <LayoutDashboard size={20} />
            <span>{t('Dashboard')}</span>
          </NavLink>
          <NavLink to="/admin/products" onClick={handleNavClick} className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
            <Package size={20} />
            <span>{t('Inventory')}</span>
          </NavLink>
          <NavLink to="/admin/orders" onClick={handleNavClick} className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
            <ShoppingBag size={20} />
            <span>{t('Orders')}</span>
          </NavLink>
        </div>

        <div className="nav-group">
          <span className="nav-label">{t('Insights')}</span>
          <NavLink to="/admin/performance" onClick={handleNavClick} className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
            <BarChart3 size={20} />
            <span>{t('Performance')}</span>
          </NavLink>
          <NavLink to="/admin/customers" onClick={handleNavClick} className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
            <Users size={20} />
            <span>{t('Customers')}</span>
          </NavLink>
          <NavLink to="/admin/messages" onClick={handleNavClick} className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
            <Mail size={20} />
            <span>{t('Messages')}</span>
          </NavLink>
        </div>

        <div className="nav-group secondary">
          <NavLink to="/" onClick={handleNavClick} className="nav-item external" style={{ marginTop: '0', paddingTop: '0', borderTop: 'none' }}>
            <ExternalLink size={20} />
            <span>{t('Go To Website')}</span>
          </NavLink>
        </div>

        {showSuperAdminSection ? (
          <div className="nav-group">
            <span className="nav-label">{t('Super Admin')}</span>
            <NavLink to="/admin/team" onClick={handleNavClick} className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
              <Settings size={20} />
              <span>{t('Admin Team')}</span>
            </NavLink>
          </div>
        ) : null}
      </nav>

      <div className="sidebar-footer">
        <div className="version-tag">v2.1.0-PRO</div>
      </div>
    </aside>
  );
};

export default AdminSidebar;
