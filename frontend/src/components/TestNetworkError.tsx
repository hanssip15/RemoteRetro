import React from 'react';
import { useNavigate } from 'react-router-dom';

const TestNetworkError: React.FC = () => {
  const navigate = useNavigate();

  const testNetworkError = () => {
    // Simulate network error
    const error = new Error('Network error test');
    error.name = 'TypeError';
    error.message = 'fetch failed';
    throw error;
  };

  const testServerError = () => {
    // Simulate server error
    const error = new Error('Server error test');
    (error as any).status = 500;
    (error as any).name = 'ServerError';
    throw error;
  };

  const test404Error = () => {
    // Simulate 404 error
    const error = new Error('Not found test');
    (error as any).status = 404;
    (error as any).name = 'ServerError';
    throw error;
  };

  const goToNetworkErrorPage = () => {
    navigate('/error/network');
  };

  const goToGeneralErrorPage = () => {
    navigate('/error/general');
  };

  const goTo404Page = () => {
    navigate('/404');
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Error Handling Test</h1>
      
      <div className="space-y-6">
        <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-yellow-800 mb-2">Test Error Pages</h2>
          <div className="space-y-2">
            <button
              onClick={goToNetworkErrorPage}
              className="block w-full bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
            >
              Go to Network Error Page
            </button>
            <button
              onClick={goToGeneralErrorPage}
              className="block w-full bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
            >
              Go to General Error Page
            </button>
            <button
              onClick={goTo404Page}
              className="block w-full bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
            >
              Go to 404 Page
            </button>
          </div>
        </div>

        <div className="bg-red-100 border border-red-300 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Test Error Throwing</h2>
          <p className="text-red-700 mb-4">
            These buttons will trigger errors that should be caught by ErrorBoundary
          </p>
          <div className="space-y-2">
            <button
              onClick={testNetworkError}
              className="block w-full bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Trigger Network Error
            </button>
            <button
              onClick={testServerError}
              className="block w-full bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Trigger Server Error
            </button>
            <button
              onClick={test404Error}
              className="block w-full bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Trigger 404 Error
            </button>
          </div>
        </div>

        <div className="bg-blue-100 border border-blue-300 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-blue-800 mb-2">Test Invalid Routes</h2>
          <p className="text-blue-700 mb-4">
            Try accessing these invalid routes to test 404 handling
          </p>
          <div className="space-y-2">
            <a
              href="/invalid-page"
              className="block w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 text-center"
            >
              Go to Invalid Page
            </a>
            <a
              href="/random/123/456"
              className="block w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 text-center"
            >
              Go to Random Invalid Route
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestNetworkError;
