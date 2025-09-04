// ProtectedRoute.tsx
import { useEffect, useState } from "react";
import { api, apiService } from "@/services/api";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const currentPath = window.location.pathname + window.location.search;
      try {
        const currentUser = await api.getCurrentUser();
        const userData = await apiService.getUserByUserId(currentUser.id);
        if (!currentUser && !userData) {
          await api.removeAuthToken();
          localStorage.setItem("redirect", currentPath);
          // 🚨 langsung redirect, jangan setLoading(false)
          window.location.replace(`${import.meta.env.VITE_API_URL}/auth/google`);
          return;
        }
        setIsAuthenticated(true);
      } catch {
        await api.removeAuthToken();
        localStorage.setItem("redirect", currentPath);
        window.location.replace(`${import.meta.env.VITE_API_URL}/auth/google`);
        return;
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Checking authentication...</p>
      </div>
    );
  }

  // kalau ga login → jangan render children
  if (!isAuthenticated) return null;

  return <>{children}</>;
}
