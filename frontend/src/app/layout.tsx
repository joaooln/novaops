import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Sidebar from '@/components/Sidebar';
import { SettingsProvider } from '@/context/SettingsContext';
import SettingsModal from '@/components/SettingsModal';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'NovaOps — Infrastructure Monitoring Dashboard',
  description: 'Real-time infrastructure and services monitoring dashboard built with Next.js, Tailwind, FastAPI, and Docker.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-background text-slate-100 overflow-x-hidden min-h-screen bg-grid-pattern [background-size:24px_24px]`}>
        <SettingsProvider>
          <div className="flex flex-col md:flex-row min-h-screen">
            <Sidebar />
            <main className="flex-1 md:pl-64 pb-20 md:pb-6 p-4 md:p-8 max-w-7xl mx-auto w-full transition-all duration-300">
              <header className="flex justify-between items-center mb-8 border-b border-panelBorder pb-4">
                <div>
                  <span className="text-xs font-mono text-glowCyan uppercase tracking-widest">NovaOps Control Panel</span>
                  <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                    Infrastructure Monitor
                  </h1>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex flex-col text-right hidden sm:block">
                    <span className="text-xs text-slate-400 font-medium">Node ID</span>
                    <span className="text-[10px] text-glowCyan font-mono bg-glowCyan/5 px-2 py-0.5 rounded border border-glowCyan/10">nova-ops-node-01</span>
                  </div>
                </div>
              </header>
              {children}
            </main>
          </div>
          <SettingsModal />
        </SettingsProvider>
      </body>
    </html>
  );
}
