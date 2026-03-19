import React from 'react';
import Sidebar from './Sidebar';
import { useAuth } from '../../state/AuthContext';

const AppShell = ({ children }) => {
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen bg-background text-slate-100">
      <Sidebar />
      <main className="flex-1 flex flex-col">
        <header className="flex items-center justify-between border-b border-slate-800 px-6 py-3 bg-slate-950/60 backdrop-blur">
          <h1 className="text-sm font-semibold text-slate-200">
            Welcome back, <span className="text-sky-400">{user?.name}</span>
          </h1>
          <span className="text-xs text-slate-400">
            DevInsight AI &mdash; code analytics and review
          </span>
        </header>
        <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>
      </main>
    </div>
  );
};

export default AppShell;


