import React from 'react';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getAccountRoute, isAdminLikeRole } from '../../utils/roles';

const UserRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-10 h-10 animate-spin text-[#10b981]" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (isAdminLikeRole(user.role)) {
    return <Navigate to={getAccountRoute(user.role)} replace />;
  }

  return children;
};

export default UserRoute;
