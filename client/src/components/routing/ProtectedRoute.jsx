import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../state/AuthContext';

const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-slate-200">
        <div className="animate-pulse rounded-lg border border-slate-800 px-6 py-4 text-sm text-slate-400">
          Loading DevInsight AI...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;


