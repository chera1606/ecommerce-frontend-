import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  Users,
  Shield,
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Crown,
  Save
} from 'lucide-react';
import { adminAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useAppSettings } from '../../contexts/AppSettingsContext';
import { getRoleLabel, isSuperAdminRole } from '../../utils/roles';
import './SuperAdmin.css';

const ROLE_OPTIONS = ['REGULAR', 'ADMIN', 'SUPER_ADMIN'];
const getRoleClass = (role) => String(role || 'REGULAR').toLowerCase().replace(/_/g, '-');
const getStatusClass = (status) => String(status || 'ACTIVE').toLowerCase();

const SuperAdmin = () => {
  const { user } = useAuth();
  const { t } = useAppSettings();
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [pendingRole, setPendingRole] = useState({});
  const [savingId, setSavingId] = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: String(page),
        limit: '10',
        search
      });

      if (roleFilter !== 'ALL') {
        query.set('role', roleFilter);
      }

      if (statusFilter !== 'ALL') {
        query.set('status', statusFilter);
      }

      const res = await adminAPI.getUsers(query.toString());
      const list = res.users || [];
      setUsers(list);
      setStats(res.stats);
      setTotalPages(res.pages || 1);

      setPendingRole((prev) => {
        const next = {};
        list.forEach((entry) => {
          const normalized = entry.role === 'PRIVILEGED' ? 'ADMIN' : (entry.role || 'REGULAR');
          next[entry._id] = prev[entry._id] || normalized;
        });
        return next;
      });
    } catch (err) {
      console.error('Super admin users fetch failed:', err);
    } finally {
      setLoading(false);
    }
  }, [page, roleFilter, search, statusFilter]);

  useEffect(() => {
    const delay = setTimeout(() => {
      fetchUsers();
    }, 350);

    return () => clearTimeout(delay);
  }, [fetchUsers]);

  const summaryCards = useMemo(() => ([
    { label: t('All Users'), value: stats?.totalUsers || 0, icon: Users },
    { label: t('Admins'), value: stats?.adminUsers || 0, icon: Shield },
    { label: t('Super Admins'), value: stats?.superAdminUsers || 0, icon: Crown }
  ]), [stats, t]);

  const handleSaveRole = async (userId, entryId, currentRole) => {
    const nextRole = pendingRole[entryId];

    if (!nextRole || nextRole === currentRole) return;

    setSavingId(userId);
    try {
      await adminAPI.updateUserRole(userId, nextRole);
      await fetchUsers();
    } catch (err) {
      alert(err.message || 'Role update failed');
    } finally {
      setSavingId(null);
    }
  };

  if (loading && page === 1 && !search && roleFilter === 'ALL') {
    return (
      <div className="super-admin-loader">
        <Loader2 className="animate-spin text-emerald-500" size={48} />
        <p>{t('Loading Super Admin Console...')}</p>
      </div>
    );
  }

  return (
    <div className="super-admin-shell animate-fade-in">
      <div className="super-admin-hero">
        <div>
          <span className="super-admin-kicker">
            <Crown size={14} /> {t('Super Admin Mode')}
          </span>
          <h2>{t('Admin Team & Access Control')}</h2>
          <p>{t('Manage admin accounts and control who can access platform-level tools.')}</p>
        </div>
        <div className="super-admin-note">
          {t('Signed in as')} <strong>{user?.firstName} {user?.lastName}</strong> · {getRoleLabel(user?.role)}
        </div>
      </div>

      <div className="super-admin-stats">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <article key={card.label} className="super-stat-card">
              <span className="super-stat-icon"><Icon size={18} /></span>
              <div>
                <span className="super-stat-label">{card.label}</span>
                <strong className="super-stat-value">{card.value}</strong>
              </div>
            </article>
          );
        })}
      </div>

      <div className="super-admin-controls">
        <div className="super-search">
          <Search size={18} />
          <input
            type="text"
            placeholder={t('Search by name or email...')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="super-filter-row">
          <label htmlFor="roleFilter">{t('Role filter')}</label>
          <select id="roleFilter" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="ALL">{t('All roles')}</option>
            <option value="REGULAR">{t('Regular users')}</option>
            <option value="ADMIN">{t('Admins')}</option>
            <option value="SUPER_ADMIN">{t('Super admins')}</option>
          </select>
        </div>

        <div className="super-filter-row">
          <label htmlFor="statusFilter">{t('Status filter')}</label>
          <select id="statusFilter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="ALL">{t('All status')}</option>
            <option value="ACTIVE">{t('Active')}</option>
            <option value="SUSPENDED">{t('Suspended')}</option>
          </select>
        </div>
      </div>

      <div className="super-table-wrap admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Current Role</th>
              <th>Change Role</th>
              <th>Status</th>
              <th>Last Saved</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--admin-text-muted)' }}>
                  {loading ? t('Loading page data...') : t('No admin accounts found on this page.')}
                </td>
              </tr>
            ) : users.map((entry) => {
              const isCurrentUser = entry.email?.toLowerCase() === user?.email?.toLowerCase();
              const rawRole = entry.role || 'REGULAR';
              const displayRole = rawRole === 'PRIVILEGED' ? 'ADMIN' : rawRole;
              const canEdit = isSuperAdminRole(user?.role) && !isCurrentUser;
              const selectedRole = pendingRole[entry._id] || displayRole;
              const statusLabel = entry.status || 'ACTIVE';

              return (
                <tr key={entry._id || entry.guestId}>
                  <td>
                    <div className="super-user-cell">
                      <span className="super-user-name">{entry.fullName || t('Unknown User')}</span>
                      <span className="super-user-email">{entry.email || t('No email')}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`super-role-badge role-${getRoleClass(rawRole)}`}>
                      {rawRole}
                    </span>
                  </td>
                  <td>
                    <select
                      className="role-select"
                      value={selectedRole}
                      disabled={!canEdit}
                      onChange={(e) => setPendingRole((prev) => ({ ...prev, [entry._id]: e.target.value }))}
                    >
                      {ROLE_OPTIONS.map((roleOption) => (
                        <option key={roleOption} value={roleOption}>
                          {roleOption}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <span className={`super-status status-${getStatusClass(statusLabel)}`}>
                      {statusLabel}
                    </span>
                  </td>
                  <td>{entry.joined || '-'}</td>
                  <td>
                    <button
                      type="button"
                      className="save-role-btn"
                      disabled={!canEdit || savingId === entry._id || selectedRole === rawRole}
                      onClick={() => handleSaveRole(entry._id, entry._id, rawRole)}
                    >
                      {savingId === entry._id ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                      {t('Save')}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 ? (
        <div className="super-pagination">
          <button type="button" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
            <ChevronLeft size={18} />
          </button>
          <span>{t('Page')} {page} {t('of')} {totalPages}</span>
          <button type="button" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
            <ChevronRight size={18} />
          </button>
        </div>
      ) : null}
    </div>
  );
};

export default SuperAdmin;
