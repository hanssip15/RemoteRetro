// AuthCallback.tsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (token) {
      sessionStorage.setItem('auth_token', token); // 👈 store the JWT
      navigate('/dashboard'); // or home page
    } else {
      navigate('/login'); // fallback
    }
  }, [navigate]);

  return <p>Logging in...</p>;
};

export default AuthCallback;
