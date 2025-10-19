import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useUserAuth } from '@/context/UserAuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  redirectTo?: string;
}

export const ProtectedRoute = ({ children, redirectTo = '/' }: ProtectedRouteProps) => {
  const { isAuthenticated } = useUserAuth();

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};
