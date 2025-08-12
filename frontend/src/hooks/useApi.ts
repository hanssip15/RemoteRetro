import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { handleApiError, createApiError, NetworkError } from '../utils/errorHandler';

interface UseApiOptions {
  showNotification?: (message: string, type: 'error' | 'warning' | 'success') => void;
  retryCount?: number;
  retryDelay?: number;
  timeout?: number;
}

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  retryCount: number;
}

export const useApi = <T = any>(options: UseApiOptions = {}) => {
  const {
    showNotification,
    retryCount: maxRetries = 3,
    retryDelay = 1000,
    timeout = 10000
  } = options;

  const navigate = useNavigate();
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
    retryCount: 0
  });

  const makeRequest = useCallback(async (
    url: string,
    options: RequestInit = {}
  ): Promise<T> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    let currentRetry = 0;

    while (currentRetry <= maxRetries) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw createApiError(response);
        }

        const data = await response.json();
        
        setState({
          data,
          loading: false,
          error: null,
          retryCount: currentRetry
        });

        return data;

      } catch (error: any) {
        currentRetry++;
        
        // Don't retry on certain errors
        if (error.status === 401 || error.status === 403 || error.status === 404) {
          setState(prev => ({
            ...prev,
            loading: false,
            error: error.message,
            retryCount: currentRetry
          }));
          
          handleApiError(error, navigate, showNotification);
          throw error;
        }

        // Retry logic
        if (currentRetry <= maxRetries) {
          setState(prev => ({
            ...prev,
            retryCount: currentRetry
          }));

          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, retryDelay * currentRetry));
          continue;
        }

        // Max retries reached
        const finalError = error.name === 'AbortError' 
          ? new NetworkError('Request timeout')
          : error;

        setState(prev => ({
          ...prev,
          loading: false,
          error: finalError.message,
          retryCount: currentRetry
        }));

        handleApiError(finalError, navigate, showNotification);
        throw finalError;
      }
    }

    throw new Error('Unexpected error in useApi');
  }, [navigate, showNotification, maxRetries, retryDelay, timeout]);

  const get = useCallback((url: string) => makeRequest(url), [makeRequest]);

  const post = useCallback((url: string, data: any) => 
    makeRequest(url, {
      method: 'POST',
      body: JSON.stringify(data)
    }), [makeRequest]);

  const put = useCallback((url: string, data: any) => 
    makeRequest(url, {
      method: 'PUT',
      body: JSON.stringify(data)
    }), [makeRequest]);

  const del = useCallback((url: string) => 
    makeRequest(url, {
      method: 'DELETE'
    }), [makeRequest]);

  const patch = useCallback((url: string, data: any) => 
    makeRequest(url, {
      method: 'PATCH',
      body: JSON.stringify(data)
    }), [makeRequest]);

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
      retryCount: 0
    });
  }, []);

  const retry = useCallback(() => {
    if (state.error) {
      setState(prev => ({ ...prev, retryCount: 0 }));
    }
  }, [state.error]);

  return {
    ...state,
    get,
    post,
    put,
    del,
    patch,
    reset,
    retry
  };
};
