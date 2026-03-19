import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../utils/api';

const HistoryPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get('/history?limit=50');
        setItems(res.data.items || []);
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to load history');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return <div className="text-sm text-slate-400">Loading history…</div>;
  }

  if (error) {
    return <div className="text-sm text-rose-400">{error}</div>;
  }

  const chartData = [...items].reverse().map(item => ({
    date: new Date(item.createdAt).toLocaleDateString(),
    score: item.qualityScore || 0,
  }));

  return (
    <div className="space-y-6">
      {/* Visual Graphs (Wow Feature #5) */}
      <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4">
        <h2 className="mb-4 text-sm font-bold text-sky-400 flex items-center gap-2">
          <span>📈</span> Score Progression
        </h2>
        
        {items.length > 0 ? (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} stroke="#64748b" tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#f8fafc' }}
                  itemStyle={{ color: '#38bdf8' }}
                />
                <Line type="monotone" dataKey="score" stroke="#38bdf8" strokeWidth={3} dot={{ r: 4, fill: '#0ea5e9' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex h-32 items-center justify-center text-xs text-slate-500 italic">
            Not enough data to display graph.
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-slate-100">Recent analyses</h2>
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950/80">
        <table className="min-w-full text-xs">
          <thead className="bg-slate-900 text-slate-400">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Date</th>
              <th className="px-3 py-2 text-left font-medium">Language</th>
              <th className="px-3 py-2 text-left font-medium">Summary</th>
              <th className="px-3 py-2 text-left font-medium">Score</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-3 py-4 text-center text-xs text-slate-400"
                >
                  No analyses yet. Run your first code review to see it here.
                </td>
              </tr>
            )}
            {items.map((item) => (
              <tr
                key={item.id}
                className="border-t border-slate-800/70 hover:bg-slate-900/60"
              >
                <td className="px-3 py-2 text-slate-200">
                  {new Date(item.createdAt).toLocaleString()}
                </td>
                <td className="px-3 py-2 text-slate-300">{item.language}</td>
                <td className="px-3 py-2 text-slate-300">
                  {item.summary || '—'}
                </td>
                <td className="px-3 py-2 text-slate-200">
                  <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                    item.qualityScore >= 90 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                    item.qualityScore >= 70 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                    'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}>
                    {item.qualityScore ?? '—'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
    </div>
  );
};

export default HistoryPage;


