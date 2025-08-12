import { ReactNode, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAuth?: boolean;
  roles?: string[];
}

const ProtectedRoute = ({ children, requireAuth = true, roles = [] }: ProtectedRouteProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if user is authenticated
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        
        if (!token && requireAuth) {
          navigate('/login');
          return;
        }

        if (token) {
          // You can add token validation here
          // For now, we'll assume the token is valid
          setIsAuthenticated(true);
          
          // Get user role from token or API
          const userRoleFromStorage = localStorage.getItem('userRole');
          setUserRole(userRoleFromStorage);
          
          // Check if user has required role
          if (roles.length > 0 && userRoleFromStorage && !roles.includes(userRoleFromStorage)) {
            navigate('/login');
            return;
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        if (requireAuth) {
          navigate('/login');
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [requireAuth, roles, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!requireAuth || isAuthenticated) {
    return <>{children}</>;
  }

  return null;
};

export default ProtectedRoute;
