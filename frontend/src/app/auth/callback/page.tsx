import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../services/api'; // pastikan path ini benar

const AuthCallbackPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await api.getCurrentUser();
        if (user) {
          api.setUser(user);
          const redirect = localStorage.getItem("redirect") || "/dashboard";
          // localStorage.removeItem("redirect");
          navigate(redirect);
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
