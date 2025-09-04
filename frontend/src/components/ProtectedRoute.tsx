// ProtectedRoute.tsx
import { useEffect, useState } from "react";
import { api, apiService } from "@/services/api";
import { useParams } from "react-router-dom";
import NotRetroFoundPage from "@/app/error/404/retro";

type ProtectedRouteProps = {
  children: React.ReactNode;
  checkRetroId?: boolean; // optional flag
};

export default function ProtectedRoute({ children, checkRetroId = false }: ProtectedRouteProps) {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isValidRetro, setIsValidRetro] = useState<boolean | null>(null);
  const { id } = useParams();

  useEffect(() => {
    const checkAuthAndRetro = async () => {
      const currentPath = window.location.pathname + window.location.search;
      try {
        // ✅ Cek Auth
        const currentUser = await api.getCurrentUser();
        const userData = currentUser ? await apiService.getUserByUserId(currentUser.id) : null;
        if (!currentUser || !userData) {
          await api.removeAuthToken();
          localStorage.setItem("redirect", currentPath);
          window.location.replace(`${import.meta.env.VITE_API_URL}/auth/google`);
          return;
        }
        setIsAuthenticated(true);

        // ✅ Cek retroId kalau dibutuhkan
        if (checkRetroId && id) {
          try {
            await api.getRetro(id);
            setIsValidRetro(true);
          } catch (err) {
            // console.error("Retro ID invalid:", err);
            setIsValidRetro(false);
            return;
          }
        }
      } catch {
        await api.removeAuthToken();
        localStorage.setItem("redirect", currentPath);
        window.location.replace(`${import.meta.env.VITE_API_URL}/auth/google`);
        return;
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndRetro();
  }, [id, checkRetroId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Checking authentication...</p>
      </div>
    );
  }

  if (!isAuthenticated) return null;
  if (checkRetroId && isValidRetro === false) return <NotRetroFoundPage />;

  return <>{children}</>;
}
