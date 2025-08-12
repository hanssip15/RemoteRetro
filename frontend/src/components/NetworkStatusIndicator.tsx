import { useNetworkStatus } from '../hooks/useNetworkStatus';

interface NetworkStatusIndicatorProps {
  showDetails?: boolean;
  className?: string;
}

const NetworkStatusIndicator = ({ showDetails = false, className = '' }: NetworkStatusIndicatorProps) => {
  const { isOnline, isServerReachable, lastChecked, retryCount } = useNetworkStatus();
  
  // Fallback jika hook gagal
  if (!isOnline && !isServerReachable) {
    return null;
  }

  const getStatusColor = () => {
    if (!isOnline) return 'bg-red-500';
    if (!isServerReachable) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    if (!isServerReachable) return 'Server Unreachable';
    return 'Connected';
  };

  const getStatusIcon = () => {
    if (!isOnline) {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 100 19.5 9.75 9.75 0 000-19.5z" />
        </svg>
      );
    }
    if (!isServerReachable) {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    }
    return (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    );
  };

  if (!showDetails) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className={`w-2 h-2 rounded-full ${getStatusColor()} animate-pulse`}></div>
        <span className="text-xs text-gray-600">{getStatusText()}</span>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-3 shadow-sm ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${getStatusColor()}`}></div>
          <span className="text-sm font-medium text-gray-900">{getStatusText()}</span>
        </div>
        {getStatusIcon()}
      </div>
      
      {showDetails && (
        <div className="text-xs text-gray-500 space-y-1">
          <div className="flex justify-between">
            <span>Internet:</span>
            <span className={isOnline ? 'text-green-600' : 'text-red-600'}>
              {isOnline ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Server:</span>
            <span className={isServerReachable ? 'text-green-600' : 'text-red-600'}>
              {isServerReachable ? 'Reachable' : 'Unreachable'}
            </span>
          </div>
          {lastChecked && (
            <div className="flex justify-between">
              <span>Last Check:</span>
              <span>{lastChecked.toLocaleTimeString()}</span>
            </div>
          )}
          {retryCount > 0 && (
            <div className="flex justify-between">
              <span>Retry Count:</span>
              <span className="text-yellow-600">{retryCount}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NetworkStatusIndicator;
