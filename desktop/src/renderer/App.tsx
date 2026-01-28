import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Signup from './pages/Signup';
import WeeklyPlanning from './pages/WeeklyPlanning';
import Chat from './pages/Chat';
import Goals from './pages/Goals';
import DailyPlanning from './pages/DailyPlanning';
import Dashboard from './pages/Dashboard';
import { useAuthStore } from './stores/authStore';

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
        <Route path="/" element={<Dashboard />} />
        <Route path="/goals" element={<Goals />} />
        <Route path="/daily" element={<DailyPlanning />} />
        <Route path="/weekly" element={<WeeklyPlanning />} />
        <Route path="/chat" element={<Chat />} />
      </Route>
    </Routes>
  );
}
