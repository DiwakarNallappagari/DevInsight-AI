import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../state/AuthContext';

const linkBase =
  'flex items-center gap-3 px-4 py-2 rounded-md text-sm font-medium transition-colors';

const Sidebar = () => {
  const { logout } = useAuth();

  const linkClass = ({ isActive }) =>
    `${linkBase} ${
      isActive
        ? 'bg-sky-600 text-white'
        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
    }`;

  return (
    <aside className="flex h-full w-64 flex-col border-r border-slate-800 bg-slate-950/80">
      <div className="flex items-center gap-2 px-4 py-4 border-b border-slate-800">
        <div className="h-8 w-8 rounded-lg bg-sky-500/20 flex items-center justify-center text-sky-400 font-bold">
          DI
        </div>
        <div>
          <div className="text-sm font-semibold text-white">DevInsight AI</div>
          <div className="text-xs text-slate-400">Developer analytics</div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        <NavLink to="/app/dashboard" className={linkClass}>
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/app/review" className={linkClass}>
          <span>AI Code Review</span>
        </NavLink>
        <NavLink to="/app/history" className={linkClass}>
          <span>History</span>
        </NavLink>
        <NavLink to="/app/settings" className={linkClass}>
          <span>Settings</span>
        </NavLink>
      </nav>

      <div className="border-t border-slate-800 p-3">
        <button
          type="button"
          onClick={logout}
          className="w-full rounded-md bg-slate-800 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700"
        >
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;


