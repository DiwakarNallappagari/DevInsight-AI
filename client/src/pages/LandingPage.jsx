import React from 'react';
import { Link } from 'react-router-dom';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 text-slate-100">
      <div className="mx-auto flex max-w-6xl flex-col px-6 py-6">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-sky-500/20 flex items-center justify-center text-sky-400 font-bold">
              DI
            </div>
            <span className="text-sm font-semibold">DevInsight AI</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="rounded-md px-3 py-1.5 text-sm text-slate-300 hover:text-white"
            >
              Log in
            </Link>
            <Link
              to="/register"
              className="rounded-md bg-sky-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-sky-500"
            >
              Get started
            </Link>
          </div>
        </header>

        <main className="mt-16 grid gap-10 md:grid-cols-2">
          <div>
            <p className="inline-flex rounded-full border border-sky-500/40 bg-slate-900/60 px-3 py-1 text-xs font-medium text-sky-300">
              AI-powered code analytics for modern dev teams
            </p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
              Understand your codebase in <span className="text-sky-400">seconds</span>, not days.
            </h1>
            <p className="mt-4 text-sm text-slate-300">
              DevInsight AI reviews your code, surfaces issues, and tracks quality trends so your
              team ships faster with confidence.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                to="/register"
                className="rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500"
              >
                Start free
              </Link>
              <span className="text-xs text-slate-400">
                No credit card. 5 AI reviews per day on the free tier.
              </span>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950/80 p-4 shadow-xl">
              <div className="mb-3 flex items-center justify-between text-xs text-slate-400">
                <span>Live project health</span>
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-emerald-400">
                  92% quality
                </span>
              </div>
              <div className="h-40 rounded-lg bg-gradient-to-br from-slate-800 to-slate-900" />
              <p className="mt-4 text-xs text-slate-400">
                Visualize issues, refactors, and quality trends across your repositories in one
                place.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default LandingPage;


