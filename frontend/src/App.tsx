import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { SocketProvider } from './contexts/SocketContext';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';

import './index.css';

// Lazy load components untuk mengurangi initial bundle size
const HomePage = lazy(() => import('./app/page'));
const DashboardPage = lazy(() => import('./app/dashboard/page'));
const RetroPage = lazy(() => import('./app/retro/[id]/page'));
const NewRetroPage = lazy(() => import('./app/retro/new/page'));
const DebugPage = lazy(() => import('./app/debug-db/page'));
const TestApiPage = lazy(() => import('./app/test-api/page'));
const LoginPage = lazy(() => import('./app/login/page'));
const AuthCallbackPage = lazy(() => import('./app/auth/callback/page'));

// Error pages
const NotFoundPage = lazy(() => import('./app/404/page'));
const ServerErrorPage = lazy(() => import('./app/500/page'));

// Loading component
const LoadingSpinner = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
);

function App() {
  return (
    <ErrorBoundary>
      <SocketProvider>
        <Router>
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/auth/callback" element={<AuthCallbackPage />} />
              
              {/* Protected routes */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              } />
              <Route path="/retro/new" element={
                <ProtectedRoute>
                  <NewRetroPage />
                </ProtectedRoute>
              } />
              <Route path="/retro/:id" element={
                <ProtectedRoute>
                  <RetroPage />
                </ProtectedRoute>
              } />
              <Route path="/debug-db" element={
                <ProtectedRoute>
                  <DebugPage />
                </ProtectedRoute>
              } />
              <Route path="/test-api" element={
                <ProtectedRoute>
                  <TestApiPage />
                </ProtectedRoute>
              } />
              
              {/* Error pages */}
              <Route path="/404" element={<NotFoundPage />} />
              <Route path="/500" element={<ServerErrorPage />} />
              
              {/* Catch all route - 404 */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </Router>
      </SocketProvider>
    </ErrorBoundary>
  );
}

export default App;
// import { BrowserRouter, Routes, Route } from 'react-router-dom';
// import LoginPage from './app/login/page';
// import DashboardPage from './app/dashboard/page';
// import AuthCallbackPage from './app/auth/callback/page';

// function App() {
//   return (
//     <BrowserRouter>
//       <Routes>
//         <Route path="/login" element={<LoginPage />} />
//         <Route path="/dashboard" element={<DashboardPage />} />
//         <Route path="/auth/callback" element={<AuthCallbackPage />} />
//       </Routes>
//     </BrowserRouter>
//   );
// }

// export default App;