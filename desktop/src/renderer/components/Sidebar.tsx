/**
 * @fileoverview Navigation Sidebar Component
 *
 * Fixed left sidebar providing app navigation and user account controls.
 * Uses React Router's NavLink for automatic active state styling.
 *
 * @module components/Sidebar
 */

import { NavLink, useNavigate } from 'react-router-dom';
import {
  Home,
  Target,
  Calendar,
  CalendarDays,
  MessageSquare,
  LogOut,
  User,
} from 'lucide-react';

/**
 * Props for individual navigation items.
 */
interface NavItemProps {
  /** Route path to navigate to */
  to: string;
  /** Icon element to display */
  icon: React.ReactNode;
  /** Text label for the nav item */
  label: string;
}

/**
 * Individual navigation link with active state styling.
 * Automatically highlights when the current route matches.
 */
function NavItem({ to, icon, label }: NavItemProps) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
          isActive
            ? 'bg-gray-100 text-gray-900'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        }`
      }
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  );
}

/**
 * Props for the Sidebar component.
 */
interface SidebarProps {
  /** Current user's email to display in the user section */
  userEmail?: string;
  /** Callback when logout button is clicked */
  onLogout?: () => void;
}

/**
 * Main navigation sidebar displayed on all authenticated pages.
 *
 * Structure:
 * - Brand header at top
 * - Navigation links in the middle (scrollable if needed)
 * - User info and logout button at bottom
 *
 * @param props - Component props
 * @param props.userEmail - Email to display in user section
 * @param props.onLogout - Logout handler called before redirecting to login
 */
export function Sidebar({ userEmail, onLogout }: SidebarProps) {
  const navigate = useNavigate();

  /**
   * Handles logout by calling the provided callback
   * and redirecting to the login page.
   */
  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
    navigate('/login');
  };

  // Navigation items configuration
  const navItems = [
    { to: '/', icon: <Home size={20} />, label: 'Dashboard' },
    { to: '/goals', icon: <Target size={20} />, label: 'Goals' },
    { to: '/daily', icon: <Calendar size={20} />, label: 'Daily Planning' },
    { to: '/weekly', icon: <CalendarDays size={20} />, label: 'Weekly Planning' },
    { to: '/chat', icon: <MessageSquare size={20} />, label: 'Agent Chat' },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Brand header */}
      <div className="px-4 py-5 border-b border-gray-200">
        <h1 className="text-lg font-semibold text-gray-900">EF Helper</h1>
        <p className="text-xs text-gray-500 mt-0.5">Executive Functioning</p>
      </div>

      {/* Main navigation - scrollable if content overflows */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavItem key={item.to} {...item} />
        ))}
      </nav>

      {/* User section - pinned to bottom */}
      <div className="border-t border-gray-200 px-3 py-4">
        {/* User avatar and email */}
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
            <User size={16} className="text-gray-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {userEmail || 'User'}
            </p>
          </div>
        </div>
        {/* Logout button */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-md text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
        >
          <LogOut size={20} />
          <span>Log out</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
