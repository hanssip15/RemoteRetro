// ProtectedRoute.tsx
import { useEffect, useState } from "react";
import { api, apiService } from "@/services/api";
import { useParams, useNavigate } from "react-router-dom";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isValidRetro, setIsValidRetro] = useState<boolean | null>(null);
  const { id } = useParams(); // ambil param dari URL
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuthAndRetro = async () => {
      const currentPath = window.location.pathname + window.location.search;
      try {
        // ✅ Cek Auth
        const currentUser = await api.getCurrentUser();
        const userData = await apiService.getUserByUserId(currentUser.id);
        if (!currentUser && !userData) {
          await api.removeAuthToken();
          localStorage.setItem("redirect", currentPath);
          window.location.replace(`${import.meta.env.VITE_API_URL}/auth/google`);
          return;
        }
        setIsAuthenticated(true);

        // ✅ Cek retroId setelah login
        if (id) {
          try {
            await api.getRetro(`${id}`); // asumsi endpoint validasi retro
            setIsValidRetro(true);
          } catch (err) {
            console.error("Retro ID invalid:", err);
            setIsValidRetro(false);
            navigate("/404", { replace: true });
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
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Checking authentication...</p>
      </div>
    );
  }

  // kalau ga login → jangan render children
  if (!isAuthenticated) return null;

  // kalau retroId invalid → jangan render children
  if (isValidRetro === false) return null;

  return <>{children}</>;
}
