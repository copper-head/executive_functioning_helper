/**
 * @fileoverview Root Application Component
 *
 * Defines the application's route structure and handles initial
 * authentication verification. Routes are split between public
 * (login, signup) and protected (all other pages) sections.
 *
 * @module App
 */

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

/**
 * Root application component that sets up routing and authentication.
 *
 * Route structure:
 * - /login, /signup: Public authentication pages
 * - /: Dashboard (protected)
 * - /goals: Goals management (protected)
 * - /daily: Daily planning (protected)
 * - /weekly: Weekly planning (protected)
 * - /chat: AI assistant chat (protected)
 *
 * On mount, validates any stored authentication token to restore the session.
 */
export default function App() {
  const checkAuth = useAuthStore((state) => state.checkAuth);

  // Validate stored auth token on app initialization
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <Routes>
      {/* Public routes - accessible without authentication */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Protected routes - require authentication */}
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
