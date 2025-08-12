import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    
    // Log error to external service (optional)
    this.logErrorToService(error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });
  }

  logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    // You can integrate with error reporting services here
    // Example: Sentry, LogRocket, etc.
    if (process.env.NODE_ENV === 'production') {
      // Send to error reporting service
      console.log('Sending error to reporting service:', {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString()
      });
    }
  };

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="max-w-lg w-full text-center">
            {/* Error Icon */}
            <div className="mb-8">
              <div className="mx-auto w-24 h-24 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>

            {/* Error Message */}
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Oops!</h1>
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Terjadi Kesalahan</h2>
            <p className="text-gray-600 mb-6">
              Maaf, terjadi kesalahan yang tidak terduga dalam aplikasi.
            </p>

            {/* Error Details (only in development) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-left">
                <h3 className="font-semibold text-red-800 mb-2">Error Details:</h3>
                <p className="text-red-700 text-sm mb-2">{this.state.error.message}</p>
                {this.state.error.stack && (
                  <details className="text-red-600 text-xs">
                    <summary className="cursor-pointer">Stack Trace</summary>
                    <pre className="mt-2 whitespace-pre-wrap">{this.state.error.stack}</pre>
                  </details>
                )}
                {this.state.errorInfo && (
                  <details className="text-red-600 text-xs mt-2">
                    <summary className="cursor-pointer">Component Stack</summary>
                    <pre className="mt-2 whitespace-pre-wrap">{this.state.errorInfo.componentStack}</pre>
                  </details>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-4">
              <button
                onClick={this.handleRetry}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200"
              >
                Coba Lagi
              </button>
              
              <button
                onClick={this.handleGoHome}
                className="w-full bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors duration-200"
              >
                Kembali ke Beranda
              </button>
            </div>

            {/* Contact Support */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-500 mb-2">Masih mengalami masalah?</p>
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
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
