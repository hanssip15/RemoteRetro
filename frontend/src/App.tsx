// import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// import HomePage from './app/page';
// import DashboardPage from './app/dashboard/page';
// import RetroPage from './app/retro/[id]/page';
// import NewRetroPage from './app/retro/new/page';
// import LobbyPage from './app/retro/[id]/lobby/page';
// import DebugPage from './app/debug-db/page';
// import TestApiPage from './app/test-api/page';
// import './index.css';

// function App() {
//   return (
//     <Router>
//       <Routes>
//         <Route path="/" element={<HomePage />} />
//         <Route path="/dashboard" element={<DashboardPage />} />
//         <Route path="/retro/new" element={<NewRetroPage />} />
//         <Route path="/retro/:id" element={<RetroPage />} />
//         <Route path="/retro/:id/lobby" element={<LobbyPage />} />
//         <Route path="/debug-db" element={<DebugPage />} />
//         <Route path="/test-api" element={<TestApiPage />} />
//       </Routes>
//     </Router>
//   );
// }

// export default App;

// App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginButton from './test/loginButton';
import AuthCallback from './test/AuthCallBack';
import Dashboard from './app/dashboard/page';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginButton />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
