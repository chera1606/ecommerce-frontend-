export const ADMIN_ROLES = ['ADMIN', 'SUPER_ADMIN', 'PRIVILEGED'];

const normalizeRole = (role) => String(role || '').toUpperCase();

export const isAdminLikeRole = (role) => ADMIN_ROLES.includes(normalizeRole(role));

export const isSuperAdminRole = (role) => normalizeRole(role) === 'SUPER_ADMIN';

export const getRoleLabel = (role) => {
  const normalized = normalizeRole(role);

  if (normalized === 'SUPER_ADMIN') return 'Super Admin';
  if (normalized === 'ADMIN') return 'Admin';
  if (normalized === 'PRIVILEGED') return 'Privileged';
  return '';
};

export const getRoleClass = (role) => normalizeRole(role).toLowerCase().replace(/_/g, '-');

export const getAccountRoute = (role) => {
  const normalized = normalizeRole(role);

  if (normalized === 'SUPER_ADMIN') return '/admin/team';
  if (normalized === 'ADMIN' || normalized === 'PRIVILEGED') return '/admin/overview';
  return '/profile';
};

export const getPostLoginRoute = (role) => {
  const normalized = normalizeRole(role);

  if (normalized === 'SUPER_ADMIN') return '/admin/team';
  if (normalized === 'ADMIN' || normalized === 'PRIVILEGED') return '/admin/overview';
  return '/';
};
