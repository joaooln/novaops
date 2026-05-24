'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const menuItems = [
  {
    name: 'Overview',
    path: '/',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
      </svg>
    ),
  },
  {
    name: 'Metrics',
    path: '/metrics',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    name: 'Services',
    path: '/services',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed bottom-0 left-0 z-40 w-full h-16 md:h-screen md:w-64 glass-panel border-t md:border-t-0 md:border-r border-panelBorder flex flex-row md:flex-col p-2 md:p-6 transition-all duration-300">
      <div className="hidden md:flex items-center gap-3 mb-10 px-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-glowCyan to-glowIndigo flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-wider bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            NOVAOPS
          </h1>
          <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">Monitoring</p>
        </div>
      </div>

      <nav className="flex flex-row md:flex-col justify-around md:justify-start w-full gap-1 md:gap-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative ${
                isActive
                  ? 'text-white bg-gradient-to-r from-white/10 to-transparent border border-white/10'
                  : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r bg-glowCyan hidden md:block" />
              )}
              <span className={`transition-colors duration-200 ${isActive ? 'text-glowCyan' : 'text-slate-400 group-hover:text-white'}`}>
                {item.icon}
              </span>
              <span className="hidden md:inline">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="hidden md:flex flex-col mt-auto p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04] text-center">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mx-auto mb-2" />
        <p className="text-xs font-semibold text-slate-300">All Systems Live</p>
        <p className="text-[10px] text-slate-500 mt-1">Refreshes every 2s</p>
      </div>
    </aside>
  );
}
