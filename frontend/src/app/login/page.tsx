'use client';

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';

const LoginPage = () => {
  const navigate = useNavigate();

useEffect(() => {
  const checkAuth = async () => {
    try {
      const isAuth = await api.isAuthenticated();
      if (isAuth) {
        const user = await api.getCurrentUser(); // Tambahkan ini
        if (user) {
          // Simpan user ke storage/context jika perlu
          navigate('/dashboard');
        } else {
          await api.removeAuthToken();
        }
      }
    } catch (e) {
      await api.removeAuthToken();
    }
  };

  checkAuth();
}, []);

const handleGoogleLogin = () => {
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`;
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh',
      backgroundColor: '#f5f5f5'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '10px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        textAlign: 'center',
        maxWidth: '400px',
        width: '100%'
      }}>
        <h1 style={{ 
          marginBottom: '30px', 
          color: '#333',
          fontSize: '28px'
        }}>
          Welcome to RetroSprint
        </h1>
        
        <p style={{ 
          marginBottom: '30px', 
          color: '#666',
          lineHeight: '1.5'
        }}>
          Please sign in to continue to your dashboard
        </p>

        <button
          onClick={handleGoogleLogin}
          style={{ 
            padding: '12px 24px', 
            fontSize: '16px', 
            cursor: 'pointer',
            backgroundColor: '#4285f4',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            width: '100%',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#3367d6'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#4285f4'}
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Sign in with Google
        </button>
      </div>
    </div>
  );
};

export default LoginPage; 