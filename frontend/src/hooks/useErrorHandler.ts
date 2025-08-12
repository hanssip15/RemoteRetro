import { useNavigate } from 'react-router-dom';

interface ErrorResponse {
  status?: number;
  message?: string;
  code?: string;
}

export const useErrorHandler = () => {
  const navigate = useNavigate();

  const handleError = (error: ErrorResponse | Error | unknown) => {
    console.error('Error handled:', error);

    // Handle different types of errors
    if (error instanceof Error) {
      // JavaScript errors
      if (error.message.includes('Network Error') || error.message.includes('fetch')) {
        navigate('/500');
        return;
      }
    }

    // Handle API errors
    if (typeof error === 'object' && error !== null) {
      const errorObj = error as ErrorResponse;
      
      switch (errorObj.status) {
        case 401:
        case 403:
          // Redirect to login instead of unauthorized page
          navigate('/login');
          break;
        case 404:
          navigate('/404');
          break;
        case 500:
        case 502:
        case 503:
        case 504:
          navigate('/500');
          break;
        default:
          // For other errors, show a generic error or redirect to 500
          navigate('/500');
          break;
      }
    }
  };

  const handleNetworkError = () => {
    navigate('/500');
  };

  const handleNotFound = () => {
    navigate('/404');
  };

  return {
    handleError,
    handleNetworkError,
    handleNotFound,
  };
};
