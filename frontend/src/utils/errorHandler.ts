import { NavigateFunction } from 'react-router-dom';

export interface ApiError {
  status: number;
  message: string;
  code?: string;
}

export class NetworkError extends Error {
  constructor(message: string = 'Network error occurred') {
    super(message);
    this.name = 'NetworkError';
  }
}

export class ServerError extends Error {
  public status: number;
  
  constructor(status: number, message: string = 'Server error occurred') {
    super(message);
    this.name = 'ServerError';
    this.status = status;
  }
}

export const handleApiError = (
  error: any, 
  navigate: NavigateFunction,
  showNotification?: (message: string, type: 'error' | 'warning' | 'success') => void
) => {
  console.error('API Error:', error);

  let errorMessage = 'Terjadi kesalahan yang tidak terduga';
  let shouldRedirect = false;
  let redirectPath = '';

  // Handle different types of errors
  if (error instanceof NetworkError) {
    errorMessage = 'Koneksi jaringan terputus. Silakan periksa koneksi internet Anda.';
    shouldRedirect = true;
    redirectPath = '/error/network';
  } else if (error instanceof ServerError) {
    switch (error.status) {
      case 401:
        errorMessage = 'Sesi Anda telah berakhir. Silakan login kembali.';
        shouldRedirect = true;
        redirectPath = '/auth/callback';
        break;
      case 403:
        errorMessage = 'Anda tidak memiliki izin untuk mengakses resource ini.';
        break;
      case 404:
        errorMessage = 'Resource yang diminta tidak ditemukan.';
        shouldRedirect = true;
        redirectPath = '/404';
        break;
      case 500:
        errorMessage = 'Terjadi kesalahan pada server. Silakan coba lagi nanti.';
        shouldRedirect = true;
        redirectPath = '/error/general';
        break;
      case 502:
      case 503:
      case 504:
        errorMessage = 'Server sedang tidak tersedia. Silakan coba lagi nanti.';
        shouldRedirect = true;
        redirectPath = '/error/network';
        break;
      default:
        errorMessage = `Server error (${error.status}): ${error.message}`;
        shouldRedirect = true;
        redirectPath = '/error/general';
    }
  } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
    errorMessage = 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.';
    shouldRedirect = true;
    redirectPath = '/error/network';
  } else if (error.name === 'AbortError') {
    errorMessage = 'Request dibatalkan karena timeout.';
  } else {
    errorMessage = error.message || 'Terjadi kesalahan yang tidak terduga';
  }

  // Show notification if provided
  if (showNotification) {
    showNotification(errorMessage, 'error');
  }

  // Redirect if needed
  if (shouldRedirect && redirectPath) {
    navigate(redirectPath);
  }

  return {
    message: errorMessage,
    shouldRedirect,
    redirectPath
  };
};

export const createApiError = (response: Response, data?: any): ServerError => {
  const message = data?.message || `HTTP ${response.status}: ${response.statusText}`;
  return new ServerError(response.status, message);
};

export const handleFetchError = async (response: Response): Promise<never> => {
  let errorData;
  try {
    errorData = await response.json();
  } catch {
    errorData = { message: response.statusText };
  }
  
  throw createApiError(response, errorData);
};

export const withErrorHandling = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  navigate: NavigateFunction,
  showNotification?: (message: string, type: 'error' | 'warning' | 'success') => void
) => {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      handleApiError(error, navigate, showNotification);
      throw error;
    }
  };
};

// Global error handler for unhandled promise rejections
export const setupGlobalErrorHandling = (navigate: NavigateFunction) => {
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    handleApiError(event.reason, navigate);
    event.preventDefault();
  });

  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    handleApiError(event.error, navigate);
  });
};
