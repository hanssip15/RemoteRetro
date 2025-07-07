// LoginButton.tsx
const LoginButton = () => {
    const handleLogin = () => {
      window.location.href = 'http://localhost:3001/auth/google';
    };
  
    return <button onClick={handleLogin}>Login with Google</button>;
  };
  
  export default LoginButton;
  