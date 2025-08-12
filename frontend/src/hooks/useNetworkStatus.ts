import { useState, useEffect, useCallback } from 'react';

interface NetworkStatus {
  isOnline: boolean;
  isServerReachable: boolean;
  lastChecked: Date | null;
  retryCount: number;
}

export const useNetworkStatus = (healthCheckUrl: string = '/') => {
  const [status, setStatus] = useState<NetworkStatus>({
    isOnline: navigator.onLine,
    isServerReachable: true,
    lastChecked: null,
    retryCount: 0
  });

  const checkServerHealth = useCallback(async (): Promise<boolean> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(healthCheckUrl, {
        method: 'HEAD',
        cache: 'no-cache',
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.warn('Server health check failed:', error);
      return false;
    }
  }, [healthCheckUrl]);

  const performHealthCheck = useCallback(async () => {
    const isReachable = await checkServerHealth();
    setStatus(prev => ({
      ...prev,
      isServerReachable: isReachable,
      lastChecked: new Date(),
      retryCount: isReachable ? 0 : prev.retryCount + 1
    }));
  }, [checkServerHealth]);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setStatus(prev => ({ ...prev, isOnline: true }));
      // Perform health check when coming back online
      setTimeout(performHealthCheck, 1000);
    };

    const handleOffline = () => {
      setStatus(prev => ({ ...prev, isOnline: false, isServerReachable: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [performHealthCheck]);

  // Initial health check
  useEffect(() => {
    performHealthCheck();
  }, [performHealthCheck]);

  // Periodic health checks when online
  useEffect(() => {
    if (!status.isOnline) return;

    const interval = setInterval(() => {
      performHealthCheck();
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [status.isOnline, performHealthCheck]);

  // Auto-retry with exponential backoff when server is unreachable
  useEffect(() => {
    if (status.isOnline && !status.isServerReachable && status.retryCount > 0) {
      const delay = Math.min(1000 * Math.pow(2, status.retryCount - 1), 30000); // Max 30 seconds
      
      const timeoutId = setTimeout(() => {
        performHealthCheck();
      }, delay);

      return () => clearTimeout(timeoutId);
    }
  }, [status.isOnline, status.isServerReachable, status.retryCount, performHealthCheck]);

  const retry = useCallback(() => {
    setStatus(prev => ({ ...prev, retryCount: 0 }));
    performHealthCheck();
  }, [performHealthCheck]);

  return {
    ...status,
    retry,
    performHealthCheck
  };
};
