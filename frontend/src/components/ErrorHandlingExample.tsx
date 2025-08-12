import { useState, useEffect } from 'react';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { createApiErrorHandler, withErrorHandling } from '../utils/apiErrorHandler';

// Example component showing how to use error handling
const ErrorHandlingExample = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const { handleError, handleNetworkError } = useErrorHandler();
  const { handleApiError } = createApiErrorHandler();

  // Example 1: Using the error handler hook directly
  const fetchDataWithErrorHandling = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/data');
      if (!response.ok) {
        if (response.status === 401) {
          // This will redirect to /login
          handleError({ status: 401, message: 'Unauthorized' });
          return;
        }
        if (response.status === 404) {
          // This will redirect to /404
          handleError({ status: 404, message: 'Not found' });
          return;
        }
        if (response.status >= 500) {
          // This will redirect to /500
          handleError({ status: response.status, message: 'Server error' });
          return;
        }
      }
      const result = await response.json();
      setData(result);
    } catch (error) {
      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        handleNetworkError();
        return;
      }
      // Handle other errors
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  // Example 2: Using the API error handler
  const fetchDataWithApiErrorHandler = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/data');
      if (!response.ok) {
        throw {
          response: {
            status: response.status,
            data: { message: 'API Error' }
          }
        };
      }
      const result = await response.json();
      setData(result);
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  // Example 3: Using the withErrorHandling utility
  const fetchDataWithUtility = async () => {
    setLoading(true);
    const result = await withErrorHandling(
      async () => {
        const response = await fetch('/api/data');
        if (!response.ok) {
          throw {
            response: {
              status: response.status,
              data: { message: 'API Error' }
            }
          };
        }
        return response.json();
      },
      handleApiError
    );
    
    if (result) {
      setData(result);
    }
    setLoading(false);
  };

  // Example 4: Manual error handling for specific cases
  const handleSpecificError = (error: any) => {
    if (error.status === 403) {
      // Custom handling for forbidden
      console.log('Access forbidden');
      // You can show a custom message or redirect
    } else {
      // Use the general error handler for other cases
      handleError(error);
    }
  };

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-bold">Error Handling Examples</h2>
      
      <div className="space-y-2">
        <button
          onClick={fetchDataWithErrorHandling}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Fetch with Error Handler'}
        </button>
        
        <button
          onClick={fetchDataWithApiErrorHandler}
          disabled={loading}
          className="bg-green-500 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Fetch with API Error Handler'}
        </button>
        
        <button
          onClick={fetchDataWithUtility}
          disabled={loading}
          className="bg-purple-500 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Fetch with Utility'}
        </button>
      </div>

      {data && (
        <div className="bg-gray-100 p-4 rounded">
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default ErrorHandlingExample;
