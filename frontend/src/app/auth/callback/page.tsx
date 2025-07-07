'use client';

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthCallbackPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (token) {
      localStorage.setItem('auth_token', token);
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  }, [navigate]);

  return <div>Processing login...</div>;
};

export default AuthCallbackPage;
