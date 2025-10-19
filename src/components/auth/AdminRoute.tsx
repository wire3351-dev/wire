import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useOwnerAuth } from '@/context/OwnerAuthContext';

interface AdminRouteProps {
  children: ReactNode;
}

export const AdminRoute = ({ children }: AdminRouteProps) => {
  const { isAuthenticated } = useOwnerAuth();

  if (!isAuthenticated) {
    return <Navigate to="/owner/login" replace />;
  }

  return <>{children}</>;
};
