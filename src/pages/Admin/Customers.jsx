import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  Mail, 
  Shield, 
  UserX, 
  UserCheck,
  ChevronLeft,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { adminAPI } from '../../services/api';
import { useAppSettings } from '../../contexts/AppSettingsContext';
import './Customers.css';

const getRoleClass = (role) => String(role || 'REGULAR').toLowerCase().replace(/_/g, '-');
const getStatusClass = (status) => String(status || 'ACTIVE').toLowerCase();

const Customers = () => {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [updating, setUpdating] = useState(null);
  const { t } = useAppSettings();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: String(page),
        limit: '10',
        search
      });

      if (statusFilter !== 'ALL') {
        query.set('status', statusFilter);
      }

      const res = await adminAPI.getUsers(query.toString());
      setUsers(res.users || []);
      setStats(res.stats);
      setTotalPages(res.pages || 1);
    } catch (err) {
      console.error("Users fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchUsers();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [fetchUsers]);

  const handleStatusToggle = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    setUpdating(userId);
    try {
      await adminAPI.updateUserStatus(userId, newStatus);
      await fetchUsers(); // Refresh
    } catch (err) {
      alert(err.message || "Status update failed");
    } finally {
      setUpdating(null);
    }
  };

  if (loading && page === 1 && !search) {
    return (
      <div className="admin-loader-container">
        <Loader2 className="animate-spin text-emerald-500" size={48} />
        <p>{t('loadingCustomers')}</p>
      </div>
    );
  }

  return (
    <div className="admin-customers animate-fade-in">
      <div className="customers-header">
        <div className="header-titles">
          <h2>{t('Customers')}</h2>
          <p>{t('Manage your customers and user accounts.')}</p>
        </div>
        
        <div className="stats-row">
          <div className="mini-stat">
            <span className="mini-label">{t('Total Users')}</span>
            <span className="mini-value">{stats?.totalUsers || 0}</span>
          </div>
          <div className="mini-stat">
            <span className="mini-label">{t('Active Now')}</span>
            <span className="mini-value active">{stats?.activeNow || 0}</span>
          </div>
          <div className="mini-stat">
            <span className="mini-label">{t('New Today')}</span>
            <span className="mini-value new">+{stats?.newToday || 0}</span>
          </div>
        </div>
      </div>

      <div className="customers-controls" style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div className="search-box">
          <Search size={18} />
          <input 
            type="text" 
            placeholder={t('Search customers...')} 
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
            <option value="ACTIVE">{t('Active')}</option>
            <option value="SUSPENDED">{t('Suspended')}</option>
          </select>
        </div>
      </div>

      <div className="customers-table-wrapper admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>{t('Customer')}</th>
              <th>{t('Role')}</th>
              <th>{t('Joined Date')}</th>
              <th>{t('Account Status')}</th>
              <th>{t('Actions')}</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--admin-text-muted)' }}>
                  {loading ? t('Loading page data...') : t('No customers found on this page.')}
                </td>
              </tr>
            ) : users.map((user) => {
              const roleLabel = user.role || 'REGULAR';
              const statusLabel = user.status || 'ACTIVE';

              return (
                <tr key={user._id || user.guestId}>
                  <td className="id-cell">{user.guestId || '-'}</td>
                  <td>
                    <div className="u-info">
                      <span className="u-name">{user.fullName || t('Unknown User')}</span>
                      <span className="u-email"><Mail size={12} /> {user.email || t('No email')}</span>
                    </div>
                  </td>
                  <td>
                    <div className="role-cell">
                      <span className={`role-badge ${getRoleClass(roleLabel)}`}>
                        <Shield size={14} />
                        {roleLabel}
                      </span>
                    </div>
                  </td>
                  <td className="date-cell">{user.joined || '-'}</td>
                  <td>
                    <span className={`status-pill ${getStatusClass(statusLabel)}`}>
                      {statusLabel}
                    </span>
                  </td>
                  <td>
                    <div className="actions-cell">
                      <button 
                        className={`act-btn-sm ${statusLabel === 'ACTIVE' ? 'suspend' : 'activate'}`}
                        onClick={() => handleStatusToggle(user._id, statusLabel)}
                        disabled={updating === user._id}
                        title={statusLabel === 'ACTIVE' ? t('Suspend Account') : t('Activate Account')}
                      >
                        {updating === user._id ? <Loader2 size={16} className="animate-spin" /> : (statusLabel === 'ACTIVE' ? <UserX size={16} /> : <UserCheck size={16} />)}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination-bar">
          <button 
            disabled={page === 1} 
            onClick={() => setPage(p => p - 1)}
            className="pag-btn"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="pag-numbers">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
              <button 
                key={n} 
                className={`pag-n ${page === n ? 'active' : ''}`}
                onClick={() => setPage(n)}
              >
                {n}
              </button>
            ))}
          </div>
          <button 
            disabled={page === totalPages} 
            onClick={() => setPage(p => p + 1)}
            className="pag-btn"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
};

export default Customers;
