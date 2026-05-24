'use client';

import useSWR from 'swr';
import { fetcher, getApiUrl } from '@/lib/api';
import Link from 'next/link';
import { useSettings } from '@/context/SettingsContext';

interface SystemOverview {
  cpu_percent: number;
  memory: {
    total_gb: number;
    used_gb: number;
    percent: number;
  };
  disk: {
    total_gb: number;
    used_gb: number;
    percent: number;
  };
  network: {
    bytes_sent_mb: number;
    bytes_recv_mb: number;
  };
  uptime_seconds: number;
  timestamp: string;
}

interface Service {
  name: string;
  image: string;
  port: number;
  status: string;
  uptime_hours: number;
  cpu_percent: number;
  memory_mb: number;
  restarts: number;
  last_checked: string;
}

function CircularMeter({ value, label }: { value: number; label: string }) {
  const { warningThreshold, criticalThreshold } = useSettings();
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  let strokeColor = 'stroke-glowCyan';
  let glowColor = 'from-glowCyan to-transparent';
  let textColor = 'text-white';
  let labelColor = 'text-slate-300';
  let alertBorderColor = '';

  if (value >= criticalThreshold) {
    strokeColor = 'stroke-glowRed';
    glowColor = 'from-glowRed to-transparent';
    textColor = 'text-rose-500';
    labelColor = 'text-rose-400 font-bold';
    alertBorderColor = 'border-rose-500/20 bg-rose-500/[0.01]';
  } else if (value >= warningThreshold) {
    strokeColor = 'stroke-glowYellow';
    glowColor = 'from-glowYellow to-transparent';
    textColor = 'text-amber-500';
    labelColor = 'text-amber-400';
    alertBorderColor = 'border-amber-500/20 bg-amber-500/[0.01]';
  }

  return (
    <div className={`flex flex-col items-center justify-center p-6 rounded-2xl glass-panel relative group hover:scale-[1.02] transition-all duration-300 ${alertBorderColor}`}>
      <div className={`absolute -inset-px rounded-2xl bg-gradient-to-r ${glowColor} opacity-0 group-hover:opacity-10 transition-opacity duration-300 -z-10`} />
      <div className="relative w-28 h-28 flex items-center justify-center mb-3">
        <svg className="w-full h-full transform -rotate-90">
          <circle cx="56" cy="56" r={radius} className="stroke-slate-800/80" strokeWidth="7" fill="transparent" />
          <circle
            cx="56"
            cy="56"
            r={radius}
            className={`${strokeColor} transition-all duration-500 ease-out`}
            strokeWidth="7"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute text-center">
          <span className={`text-xl font-extrabold ${textColor}`}>{value}%</span>
        </div>
      </div>
      <span className={`text-xs font-semibold tracking-wide uppercase ${labelColor}`}>{label}</span>
    </div>
  );
}

function formatUptime(seconds: number) {
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function Dashboard() {
  const { warningThreshold, criticalThreshold } = useSettings();

  const { data: overview, error: overviewError } = useSWR<SystemOverview>(getApiUrl('/api/v1/overview'), fetcher, {
    refreshInterval: 2000,
  });

  const { data: services, error: servicesError } = useSWR<Service[]>(getApiUrl('/api/v1/services/'), fetcher, {
    refreshInterval: 5000,
  });

  const isOverviewLoading = !overview && !overviewError;
  const isServicesLoading = !services && !servicesError;

  // Compute status counts
  const totalServices = services?.length || 0;
  const runningServices = services?.filter(s => s.status === 'running').length || 0;
  const degradedServices = services?.filter(s => s.status === 'degraded').length || 0;
  const stoppedServices = services?.filter(s => s.status === 'stopped').length || 0;

  // Check alert limits
  const hasCriticalAlert = overview && (overview.cpu_percent >= criticalThreshold || overview.memory.percent >= criticalThreshold);
  const hasWarningAlert = overview && !hasCriticalAlert && (overview.cpu_percent >= warningThreshold || overview.memory.percent >= warningThreshold);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Alert Warning Bar */}
      {overview && (hasCriticalAlert || hasWarningAlert) && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 animate-pulse-slow ${
          hasCriticalAlert
            ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
            : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
        }`}>
          <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div className="text-xs font-semibold">
            {hasCriticalAlert ? (
              <span>CRITICAL: High resource consumption detected! Exceeded critical limit of {criticalThreshold}%.</span>
            ) : (
              <span>WARNING: System resources are highly loaded. Warning threshold of {warningThreshold}% crossed.</span>
            )}
          </div>
        </div>
      )}

      {/* Metrics Row */}
      <section>
        <h2 className="text-lg font-semibold text-slate-300 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-glowCyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Resource Allocation
        </h2>
        {isOverviewLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[1, 2, 3].map(n => (
              <div key={n} className="h-44 rounded-2xl glass-panel animate-pulse bg-white/[0.02]" />
            ))}
          </div>
        ) : overview ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <CircularMeter
              value={Math.round(overview.cpu_percent)}
              label="CPU Usage"
            />
            <CircularMeter
              value={Math.round(overview.memory.percent)}
              label={`RAM (${overview.memory.used_gb}/${overview.memory.total_gb} GB)`}
            />
            <CircularMeter
              value={Math.round(overview.disk.percent)}
              label={`Disk (${overview.disk.used_gb}/${overview.disk.total_gb} GB)`}
            />
          </div>
        ) : (
          <div className="glass-panel p-6 text-center text-red-400">Failed to load system metrics.</div>
        )}
      </section>

      {/* Network & Uptime Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 glass-panel p-6 rounded-2xl flex flex-col relative group overflow-hidden">
          <h2 className="text-lg font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-glowCyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 009 11M5 14H3m14 0h-2m-4-7a1 1 0 11-2 0 1 1 0 012 0z" />
            </svg>
            Network Throughput
          </h2>
          {overview ? (
            <div className="grid grid-cols-2 gap-4 my-auto">
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <span className="text-xs text-slate-400 block mb-1">Total Data Sent</span>
                <span className="text-2xl font-bold font-mono text-white">{overview.network.bytes_sent_mb} MB</span>
              </div>
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <span className="text-xs text-slate-400 block mb-1">Total Data Received</span>
                <span className="text-2xl font-bold font-mono text-white">{overview.network.bytes_recv_mb} MB</span>
              </div>
            </div>
          ) : (
            <div className="h-24 animate-pulse bg-white/[0.02] rounded-xl" />
          )}
        </section>

        <section className="glass-panel p-6 rounded-2xl flex flex-col relative group overflow-hidden">
          <h2 className="text-lg font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-glowCyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            System Uptime
          </h2>
          {overview ? (
            <div className="my-auto text-center py-2">
              <span className="text-3xl font-extrabold text-glowGreen font-mono tracking-tight">
                {formatUptime(overview.uptime_seconds)}
              </span>
              <p className="text-xs text-slate-400 mt-2">Continuous operations since last reboot</p>
            </div>
          ) : (
            <div className="h-24 animate-pulse bg-white/[0.02] rounded-xl" />
          )}
        </section>
      </div>

      {/* Services Row */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-slate-300 flex items-center gap-2">
            <svg className="w-5 h-5 text-glowCyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Microservices Overview
          </h2>
          <Link href="/services" className="text-xs text-glowCyan hover:underline flex items-center gap-1">
            View service panel
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Status Counts cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 rounded-xl glass-panel relative group hover:scale-[1.02] transition-all">
            <span className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">Total Configured</span>
            <span className="text-3xl font-extrabold text-white block mt-1">{isServicesLoading ? '...' : totalServices}</span>
          </div>
          <div className="p-4 rounded-xl glass-panel relative group hover:scale-[1.02] transition-all border-l-2 border-l-emerald-500">
            <span className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">Healthy</span>
            <span className="text-3xl font-extrabold text-emerald-500 block mt-1">{isServicesLoading ? '...' : runningServices}</span>
          </div>
          <div className="p-4 rounded-xl glass-panel relative group hover:scale-[1.02] transition-all border-l-2 border-l-amber-500">
            <span className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">Degraded</span>
            <span className="text-3xl font-extrabold text-amber-500 block mt-1">{isServicesLoading ? '...' : degradedServices}</span>
          </div>
          <div className="p-4 rounded-xl glass-panel relative group hover:scale-[1.02] transition-all border-l-2 border-l-rose-500">
            <span className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">Stopped</span>
            <span className="text-3xl font-extrabold text-rose-500 block mt-1">{isServicesLoading ? '...' : stoppedServices}</span>
          </div>
        </div>

        {/* Mini Table */}
        <div className="glass-panel rounded-2xl overflow-hidden">
          {isServicesLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3].map(n => (
                <div key={n} className="h-10 animate-pulse bg-white/[0.02] rounded-lg" />
              ))}
            </div>
          ) : services ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-panelBorder bg-white/[0.01]">
                    <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Service</th>
                    <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Port</th>
                    <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">CPU</th>
                    <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Memory</th>
                    <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Uptime</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-panelBorder">
                  {services.map((svc) => (
                    <tr key={svc.name} className="hover:bg-white/[0.01] transition-colors">
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-white">{svc.name}</span>
                          <span className="text-xs text-slate-500 font-mono">{svc.image}</span>
                        </div>
                      </td>
                      <td className="p-4 text-sm font-mono text-slate-300">{svc.port}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                          svc.status === 'running'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : svc.status === 'degraded'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            svc.status === 'running'
                              ? 'bg-emerald-400'
                              : svc.status === 'degraded'
                              ? 'bg-amber-400'
                              : 'bg-rose-400'
                          }`} />
                          {svc.status}
                        </span>
                      </td>
                      <td className="p-4 text-sm font-mono text-slate-300">{svc.cpu_percent}%</td>
                      <td className="p-4 text-sm font-mono text-slate-300">{svc.memory_mb} MB</td>
                      <td className="p-4 text-sm font-mono text-slate-300">{svc.uptime_hours} hrs</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 text-center text-red-400">Failed to load services.</div>
          )}
        </div>
      </section>
    </div>
  );
}
