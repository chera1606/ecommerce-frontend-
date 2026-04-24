import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { getPostLoginRoute, isAdminLikeRole } from '../../utils/roles';

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-10 h-10 animate-spin text-[#2d6a4f]" />
      </div>
    );
  }

  // Check if user is logged in
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Logged-in non-admin users should be redirected to their own area
  if (!isAdminLikeRole(user.role)) {
    console.warn("Unauthorized access attempt to Admin Dashboard");
    return <Navigate to={getPostLoginRoute(user.role)} replace />;
  }

  return children;
};

export default AdminRoute;
