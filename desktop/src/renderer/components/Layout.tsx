/**
 * @fileoverview Main Application Layout Component
 *
 * Provides the shell layout for all protected pages, consisting of
 * a fixed sidebar for navigation and a main content area where
 * page components are rendered via React Router's Outlet.
 *
 * @module components/Layout
 */

import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useAuthStore } from '../stores/authStore';

/**
 * Layout wrapper for authenticated pages.
 *
 * Structure:
 * - Fixed 256px (w-64) sidebar on the left for navigation
 * - Main content area fills remaining space
 * - Full viewport height with overflow handling
 *
 * The Outlet component renders the matched child route's element.
 */
export default function Layout() {
  const { user, logout } = useAuthStore();

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar userEmail={user?.email} onLogout={logout} />
      {/* Main content offset by sidebar width (ml-64 = 256px) */}
      <main className="flex-1 ml-64 flex flex-col h-screen overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
