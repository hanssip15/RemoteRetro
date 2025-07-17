// LoginButton.tsx
const LoginButton = () => {
    const handleLogin = () => {
      window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`;
    };
  
    return <button onClick={handleLogin}>Login with Google</button>;
  };
  
  export default LoginButton;
  