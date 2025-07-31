import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../../../services/api'; // pastikan path ini benar

const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const userData = params.get('userData');

    if (token) {
      let userInfo = null;
      if (userData) {
        try {
          userInfo = JSON.parse(decodeURIComponent(userData));
        } catch (error) {
          console.error('Error parsing user data:', error);
        }
      }
      
      api.setAuthToken(token, userInfo);
      navigate('/dashboard');
    } else {
      console.error('No token found in URL');
      navigate('/login');
    }
  }, [location, navigate]);

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
