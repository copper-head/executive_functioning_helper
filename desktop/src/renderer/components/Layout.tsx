import { Outlet } from 'react-router-dom';

export default function Layout() {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar placeholder */}
      <aside className="w-64 bg-gray-900 text-white">
        <div className="p-4">
          <h1 className="text-xl font-bold">Exec Func Helper</h1>
        </div>
        {/* Navigation will be added here */}
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
