import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import Overview from './Overview';
import Orders from './Orders';
import Products from './Products';
import Analytics from './Analytics';
import Customers from './Customers';
import Profile from './Profile';
import Messages from './Messages';
import SuperAdmin from './SuperAdmin';
import SuperAdminRoute from '../../components/admin/SuperAdminRoute';
import { useAuth } from '../../contexts/AuthContext';
import { isSuperAdminRole } from '../../utils/roles';

const AdminDashboard = () => {
  const { user } = useAuth();
  const defaultAdminRoute = isSuperAdminRole(user?.role) ? 'team' : 'overview';

  return (
    <AdminLayout>
      <Routes>
        <Route path="/" element={<Navigate to={defaultAdminRoute} replace />} />
        <Route path="overview" element={<Overview />} />
        <Route path="orders" element={<Orders />} />
        <Route path="products" element={<Products />} />
        <Route path="performance" element={<Analytics />} />
        <Route path="customers" element={<Customers />} />
        <Route path="messages" element={<Messages />} />
        <Route
          path="team"
          element={
            <SuperAdminRoute>
              <SuperAdmin />
            </SuperAdminRoute>
          }
        />
        <Route path="profile" element={<Profile />} />
        <Route path="*" element={<Navigate to={defaultAdminRoute} replace />} />
      </Routes>
    </AdminLayout>
  );
};

export default AdminDashboard;
