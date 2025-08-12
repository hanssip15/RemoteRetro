import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

const NetworkErrorPage = () => {
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const checkConnection = async () => {
    try {
      const response = await fetch('/api/health', { 
        method: 'HEAD',
        cache: 'no-cache'
      });
      return response.ok;
    } catch {
      return false;
    }
  };

  const handleCheckConnection = async () => {
    const isConnected = await checkConnection();
    if (isConnected) {
      window.location.reload();
    } else {
      setRetryCount(prev => prev + 1);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        {/* Network Error Icon */}
        <div className="mb-8">
          <div className="mx-auto w-24 h-24 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 100 19.5 9.75 9.75 0 000-19.5z" />
            </svg>
          </div>
        </div>

        {/* Error Message */}
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Koneksi Terputus</h1>
        <h2 className="text-xl font-semibold text-gray-700 mb-4">
          {isOnline ? 'Server Tidak Dapat Diakses' : 'Tidak Ada Koneksi Internet'}
        </h2>
        
        <div className="mb-6">
          {isOnline ? (
            <p className="text-gray-600">
              Koneksi internet Anda aktif, tetapi server tidak dapat diakses. 
              Silakan coba lagi dalam beberapa saat.
            </p>
          ) : (
            <p className="text-gray-600">
              Periksa koneksi internet Anda dan coba lagi.
            </p>
          )}
        </div>

        {/* Connection Status */}
        <div className="mb-6 p-4 bg-gray-100 rounded-lg">
          <div className="flex items-center justify-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-700">
              Status: {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
          {retryCount > 0 && (
            <p className="text-xs text-gray-500 mt-2">
              Percobaan ke-{retryCount}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <button
            onClick={handleCheckConnection}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200"
          >
            Coba Lagi
          </button>
          
          <button
            onClick={() => navigate('/')}
            className="w-full bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors duration-200"
          >
            Kembali ke Beranda
          </button>
        </div>

        {/* Troubleshooting Tips */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Tips Troubleshooting:</h3>
          <ul className="text-xs text-gray-600 space-y-1 text-left">
            <li>• Periksa koneksi internet Anda</li>
            <li>• Coba refresh halaman (F5)</li>
            <li>• Bersihkan cache browser</li>
            <li>• Coba akses dari browser lain</li>
            <li>• Hubungi administrator jika masalah berlanjut</li>
          </ul>
        </div>

        {/* Auto-retry indicator */}
        {retryCount > 0 && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              Mencoba menghubungkan kembali secara otomatis...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NetworkErrorPage;
