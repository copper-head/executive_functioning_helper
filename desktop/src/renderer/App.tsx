import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Signup from './pages/Signup';
import WeeklyPlanning from './pages/WeeklyPlanning';
import Chat from './pages/Chat';
import Goals from './pages/Goals';
import { useAuthStore } from './stores/authStore';

function DashboardPage() {
  return <div className="p-4">Dashboard</div>;
}

function DailyPage() {
  return <div className="p-4">Daily</div>;
}

export default function App() {
  const checkAuth = useAuthStore((state) => state.checkAuth);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<DashboardPage />} />
        <Route path="/goals" element={<Goals />} />
        <Route path="/daily" element={<DailyPage />} />
        <Route path="/weekly" element={<WeeklyPlanning />} />
        <Route path="/chat" element={<Chat />} />
      </Route>
    </Routes>
  );
}
