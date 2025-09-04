import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../services/api'; // pastikan path ini benar

const AuthCallbackPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        // Ambil user dari backend (cookie httpOnly otomatis ikut)
        const user = await api.getCurrentUser();

        if (user) {
          // simpan user ke cache (api.ts) / context
          api.setUser(user);
          const redirect = localStorage.getItem("redirect") || "/dashboard";
          navigate(redirect);
          // localStorage.removeItem("redirect");

        } 
      } catch (err) {
        console.error("Failed to fetch user:", err);
        navigate("/");
      }
    };

    fetchUser();
  }, [navigate]);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      fontSize: '18px'
    }}>
      Processing login...
    </div>
  );
};

export default AuthCallbackPage;
