import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './app/page';
import DashboardPage from './app/dashboard/page';
import RetroPage from './app/retro/[id]/page';
import NewRetroPage from './app/retro/new/page';
import LobbyPage from './app/retro/[id]/lobby/page';
import DebugPage from './app/debug-db/page';
import TestApiPage from './app/test-api/page';
import LoginPage from './app/login/page';
import AuthCallbackPage from './app/auth/callback/page';
import { SocketProvider } from './contexts/SocketContext';

import './index.css';

function App() {
  return (
    <SocketProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/retro/new" element={<NewRetroPage />} />
          <Route path="/retro/:id" element={<RetroPage />} />
          <Route path="/retro/:id/lobby" element={<LobbyPage />} />
          <Route path="/debug-db" element={<DebugPage />} />
          <Route path="/test-api" element={<TestApiPage />} />
        </Routes>
      </Router>
    </SocketProvider>
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