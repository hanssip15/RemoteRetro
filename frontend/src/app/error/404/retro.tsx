import { useNavigate } from 'react-router-dom';

const NotRetroFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* 404 Icon */}
        <div className="mb-8">
          <div className="mx-auto w-24 h-24 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
        </div>

        {/* Error Message */}
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Retro Tidak Ditemukan</h2>
        <p className="text-gray-600 mb-8">
          Pastikan URL retro valid.
        </p>

        {/* Action Buttons */}
        <div className="space-y-4">
          <button
            onClick={() => navigate(-1)}
            className="w-full bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors duration-200"
          >
            Kembali ke Halaman Sebelumnya
          </button>
          
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors duration-200"
          >
            Kembali ke Dashboard
          </button>
        </div>

        {/* Additional Help */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-2">Butuh bantuan?</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
          >
            Akses Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotRetroFoundPage;
