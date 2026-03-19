import React, { useState, useEffect } from 'react';
import { useAuth } from '../state/AuthContext';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import api from '../utils/api';

const SettingsPage = () => {
  const { user } = useAuth();
  const [telemetry, setTelemetry] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTelemetry = async () => {
      try {
        const res = await api.get('/system-monitor');
        setTelemetry(res.data.data);
      } catch (err) {
        console.error('Telemetry Fetch Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 15000); // Update every 15s
    return () => clearInterval(interval);
  }, []);

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const usageData = telemetry ? [
    { name: 'Used', value: telemetry.memory.used },
    { name: 'Free', value: telemetry.memory.free }
  ] : [];

  const COLORS = ['#ef4444', '#10b981'];

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Card */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-6 shadow-xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-14 w-14 rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-xl font-bold text-white shadow-lg">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">{user?.name}</h2>
              <p className="text-sm text-slate-400">{user?.role} Account</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <span className="text-sm text-slate-400">Email Address</span>
              <span className="text-sm font-medium text-slate-200">{user?.email}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <span className="text-sm text-slate-400">Account Status</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Active
              </span>
            </div>
            <div className="flex justify-between items-center pt-1">
              <span className="text-sm text-slate-400">Analytics Limit</span>
              <span className="text-sm font-medium text-sky-400">100 / day</span>
            </div>
          </div>
        </div>

        {/* System Dashboard (telemetry) */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">System Intelligence</h2>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[10px] font-bold text-emerald-500 uppercase">Live Telemetry</span>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-48 opacity-50">
              <div className="animate-spin h-5 w-5 border-2 border-sky-500 border-t-transparent rounded-full"></div>
            </div>
          ) : telemetry ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800">
                  <p className="text-[10px] text-slate-500 uppercase mb-1">CPU Load</p>
                  <p className="text-xl font-bold text-sky-400">
                    {(telemetry.cpu.loadavg[0] * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800">
                  <p className="text-[10px] text-slate-500 uppercase mb-1">RAM Usage</p>
                  <p className="text-xl font-bold text-amber-500">
                    {telemetry.memory.usagePercent}%
                  </p>
                </div>
              </div>

              <div className="h-32 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={usageData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={55}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {usageData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(val) => formatBytes(val)}
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="flex justify-between items-center text-[10px] text-slate-500 uppercase font-bold tracking-widest border-t border-slate-800 pt-4">
                <span>Total RAM: {formatBytes(telemetry.memory.total)}</span>
                <span>Cores: {telemetry.cpu.cores}</span>
              </div>
            </div>
          ) : (
            <div className="text-slate-500 text-center py-12">Failed to load telemetry</div>
          )}
        </div>
      </div>

      {/* Advanced Settings Placeholder */}
      <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-6 shadow-xl">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-6">Advanced Configurations</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/20 opacity-50 cursor-not-allowed">
            <h3 className="text-sm font-semibold text-slate-200">API Access</h3>
            <p className="text-xs text-slate-500 mt-1">Generate API keys for DevInsight CI/CD</p>
          </div>
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/20 opacity-50 cursor-not-allowed">
            <h3 className="text-sm font-semibold text-slate-200">Organization</h3>
            <p className="text-xs text-slate-500 mt-1">Collaborate with your development team</p>
          </div>
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/20 opacity-50 cursor-not-allowed">
            <h3 className="text-sm font-semibold text-slate-200">Audit Logs</h3>
            <p className="text-xs text-slate-500 mt-1">Review account activity and events</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
