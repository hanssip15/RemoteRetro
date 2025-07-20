import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../../../services/api'; // pastikan path ini benar

const AuthCallbackPage = () => {
  const navigate = useNavigate();

useEffect(() => {
  const fetchAndRedirect = async () => {
    try {
      const user = await api.getCurrentUser();
      if (user) {
        navigate('/dashboard');
      } else {
        navigate('/login');
      }
    } catch (err) {
      console.error('Error during auth callback:', err);
      navigate('/login');
    }
  };

  fetchAndRedirect();
}, []);


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
