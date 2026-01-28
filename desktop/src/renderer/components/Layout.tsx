import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useAuthStore } from '../stores/authStore';

export default function Layout() {
  const { user, logout } = useAuthStore();

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar userEmail={user?.email} onLogout={logout} />
      <main className="flex-1 ml-64 flex flex-col h-screen overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
