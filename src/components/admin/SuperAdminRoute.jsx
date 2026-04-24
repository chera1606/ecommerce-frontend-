import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { getPostLoginRoute, isSuperAdminRole } from '../../utils/roles';

const SuperAdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-10 h-10 animate-spin text-[#2d6a4f]" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isSuperAdminRole(user.role)) {
    console.warn('Unauthorized access attempt to Super Admin section');
    return <Navigate to={getPostLoginRoute(user.role)} replace />;
  }

  return children;
};

export default SuperAdminRoute;
