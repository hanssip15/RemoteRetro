import { useNavigate } from 'react-router-dom';

interface GeneralErrorPageProps {
  error?: Error;
  errorInfo?: any;
  retry?: () => void;
}

const GeneralErrorPage = ({ error, retry }: GeneralErrorPageProps) => {
  const navigate = useNavigate();

  const handleRetry = () => {
    if (retry) {
      retry();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        {/* Error Icon */}
        <div className="mb-8">
          <div className="mx-auto w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        {/* Error Message */}
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Oops!</h1>
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Terjadi Kesalahan</h2>
        <p className="text-gray-600 mb-6">
          Maaf, terjadi kesalahan yang tidak terduga. Silakan coba lagi atau hubungi administrator.
        </p>

        {/* Error Details (only in development) */}
        {process.env.NODE_ENV === 'development' && error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-left">
            <h3 className="font-semibold text-red-800 mb-2">Error Details:</h3>
            <p className="text-red-700 text-sm mb-2">{error.message}</p>
            {error.stack && (
              <details className="text-red-600 text-xs">
                <summary className="cursor-pointer">Stack Trace</summary>
                <pre className="mt-2 whitespace-pre-wrap">{error.stack}</pre>
              </details>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-4">
          <button
            onClick={handleRetry}
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

        {/* Contact Support */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-2">Masih mengalami masalah?</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium mr-4"
          >
            Dashboard
          </button>
          <button
            onClick={() => window.open('mailto:support@example.com', '_blank')}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Hubungi Support
          </button>
        </div>
      </div>
    </div>
  );
};

export default GeneralErrorPage;
