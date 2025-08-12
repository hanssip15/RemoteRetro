import { useErrorHandler } from '../hooks/useErrorHandler';

export interface ApiError {
  status: number;
  message: string;
  code?: string;
}

export const createApiErrorHandler = () => {
  const { handleError, handleNetworkError, handleNotFound } = useErrorHandler();

  const handleApiError = (error: any) => {
    console.error('API Error:', error);

    // Handle network errors
    if (!navigator.onLine) {
      handleNetworkError();
      return;
    }

    // Handle fetch errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      handleNetworkError();
      return;
    }

    // Handle response errors
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
        case 403:
          // Redirect to login instead of unauthorized page
          window.location.href = '/login';
          break;
        case 404:
          handleNotFound();
          break;
        case 500:
        case 502:
        case 503:
        case 504:
          handleError({ status, message: data?.message || 'Server error' });
          break;
        default:
          handleError({ status, message: data?.message || 'An error occurred' });
          break;
      }
    } else if (error.request) {
      // Request was made but no response received
      handleNetworkError();
    } else {
      // Something else happened
      handleError(error);
    }
  };

  return { handleApiError };
};

// Utility function to wrap API calls with error handling
export const withErrorHandling = async <T>(
  apiCall: () => Promise<T>,
  errorHandler: (error: any) => void
): Promise<T | null> => {
  try {
    return await apiCall();
  } catch (error) {
    errorHandler(error);
    return null;
  }
};
