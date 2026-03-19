import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../state/AuthContext';

const AuthPage = () => {
  const location = useLocation();
  const isRegisterDefault = location.pathname === '/register';
  const [mode, setMode] = useState(isRegisterDefault ? 'register' : 'login');
  const { login } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'register') {
        const res = await api.post('/auth/register', form);
        login(res.data);
      } else {
        const res = await api.post('/auth/login', {
          email: form.email,
          password: form.password,
        });
        login(res.data);
      }
    } catch (err) {
      const msg = err?.response?.data?.message || 'Something went wrong';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode((prev) => (prev === 'login' ? 'register' : 'login'));
    setError('');
  };

  const isRegister = mode === 'register';

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-950 to-slate-900 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950/80 p-6 shadow-xl">
        <div className="mb-4 flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-sky-500/20 flex items-center justify-center text-sky-400 font-bold">
            DI
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-100">DevInsight AI</div>
            <div className="text-xs text-slate-400">
              {isRegister ? 'Create your account' : 'Welcome back'}
            </div>
          </div>
        </div>

        <div className="mb-4 flex gap-1 rounded-md bg-slate-900 p-1 text-xs">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`flex-1 rounded px-2 py-1 ${
              !isRegister ? 'bg-slate-800 text-slate-100' : 'text-slate-400'
            }`}
          >
            Log in
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            className={`flex-1 rounded px-2 py-1 ${
              isRegister ? 'bg-slate-800 text-slate-100' : 'text-slate-400'
            }`}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {isRegister && (
            <div>
              <label className="block text-xs text-slate-300" htmlFor="name">
                Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required={isRegister}
                value={form.name}
                onChange={handleChange}
                className="mt-1 w-full rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-500"
              />
            </div>
          )}
          <div>
            <label className="block text-xs text-slate-300" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={form.email}
              onChange={handleChange}
              className="mt-1 w-full rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-500"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-300" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={handleChange}
              className="mt-1 w-full rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-500"
            />
          </div>
          {error && <p className="text-xs text-rose-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-md bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-60"
          >
            {loading ? 'Please wait…' : isRegister ? 'Create account' : 'Log in'}
          </button>
        </form>

        <button
          type="button"
          onClick={toggleMode}
          className="mt-3 w-full text-center text-xs text-slate-400 hover:text-slate-200"
        >
          {isRegister ? 'Already have an account? Log in' : "Don't have an account? Register"}
        </button>
      </div>
    </div>
  );
};

export default AuthPage;


