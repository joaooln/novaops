'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { fetcher, getApiUrl } from '@/lib/api';

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

interface ServiceDetail {
  name: string;
  image: string;
  port: number;
  status: string;
  uptime_hours: number;
  logs: string[];
}

export default function ServicesPage() {
  const { data: services, error, mutate: mutateServices } = useSWR<Service[]>(
    getApiUrl('/api/v1/services/'),
    fetcher,
    { refreshInterval: 5000 }
  );

  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [localServices, setLocalServices] = useState<Record<string, Partial<Service>>>({});
  const [logsState, setLogsState] = useState<Record<string, string[]>>({});
  const [isPerformingAction, setIsPerformingAction] = useState<string | null>(null);

  // Load logs when a service is selected
  const { data: serviceDetail } = useSWR<ServiceDetail>(
    selectedService ? getApiUrl(`/api/v1/services/${selectedService}`) : null,
    fetcher
  );

  // Sync serviceDetail logs into local log state
  useEffect(() => {
    if (serviceDetail && selectedService) {
      setLogsState((prev) => {
        // If we already have logs for this service (e.g. from mock actions), keep them.
        if (prev[selectedService]) return prev;
        return {
          ...prev,
          [selectedService]: serviceDetail.logs,
        };
      });
    }
  }, [serviceDetail, selectedService]);

  // Combine fetched services with local modifications (e.g. mock states)
  const displayServices = services?.map((svc) => {
    const local = localServices[svc.name] || {};
    return {
      ...svc,
      ...local,
    };
  }) || [];

  const handleAction = async (serviceName: string, action: 'start' | 'stop' | 'restart') => {
    setIsPerformingAction(action);
    const timestamp = new Date().toISOString();
    
    // Add command sent log
    setLogsState((prev) => {
      const currentLogs = prev[serviceName] || [];
      return {
        ...prev,
        [serviceName]: [
          ...currentLogs,
          `[ACTION] ${timestamp} User sent CLI command: docker-compose ${action} ${serviceName}`,
        ],
      };
    });

    if (action === 'stop') {
      // Transition to stopped
      setTimeout(() => {
        setLocalServices((prev) => ({
          ...prev,
          [serviceName]: {
            ...prev[serviceName],
            status: 'stopped',
            cpu_percent: 0,
            memory_mb: 0,
          },
        }));
        setLogsState((prev) => ({
          ...prev,
          [serviceName]: [
            ...(prev[serviceName] || []),
            `[INFO] ${new Date().toISOString()} Service stopped gracefully. Port ${displayServices.find(s => s.name === serviceName)?.port} closed.`,
          ],
        }));
        setIsPerformingAction(null);
      }, 1500);
    } else if (action === 'start') {
      // Transition to running
      setTimeout(() => {
        setLocalServices((prev) => ({
          ...prev,
          [serviceName]: {
            ...prev[serviceName],
            status: 'running',
            cpu_percent: 1.5,
            memory_mb: 45.0,
            last_checked: new Date().toISOString(),
          },
        }));
        setLogsState((prev) => ({
          ...prev,
          [serviceName]: [
            ...(prev[serviceName] || []),
            `[INFO] ${new Date().toISOString()} Spawning container...`,
            `[INFO] ${new Date().toISOString()} Port binding complete. Listening on 0.0.0.0:${displayServices.find(s => s.name === serviceName)?.port}`,
            `[INFO] ${new Date().toISOString()} Service started successfully. Status: RUNNING`,
          ],
        }));
        setIsPerformingAction(null);
      }, 1800);
    } else if (action === 'restart') {
      // Transition to restarting -> running
      setLocalServices((prev) => ({
        ...prev,
        [serviceName]: {
          ...prev[serviceName],
          status: 'degraded',
          cpu_percent: 0.1,
        },
      }));
      
      setTimeout(() => {
        setLocalServices((prev) => {
          const currentRestarts = (prev[serviceName]?.restarts ?? displayServices.find(s => s.name === serviceName)?.restarts ?? 0) + 1;
          return {
            ...prev,
            [serviceName]: {
              ...prev[serviceName],
              status: 'running',
              cpu_percent: 4.2,
              restarts: currentRestarts,
              uptime_hours: 0.1,
              last_checked: new Date().toISOString(),
            },
          };
        });
        setLogsState((prev) => ({
          ...prev,
          [serviceName]: [
            ...(prev[serviceName] || []),
            `[INFO] ${new Date().toISOString()} Terminated container process safely`,
            `[INFO] ${new Date().toISOString()} Creating a new container instance...`,
            `[INFO] ${new Date().toISOString()} Re-attached volumes and network interfaces`,
            `[INFO] ${new Date().toISOString()} Service restarted successfully.`,
          ],
        }));
        setIsPerformingAction(null);
      }, 2000);
    }
  };

  const activeService = displayServices.find((s) => s.name === selectedService);
  const activeLogs = selectedService ? logsState[selectedService] || [] : [];

  return (
    <div className="flex flex-col xl:flex-row gap-6 items-start animate-fade-in relative min-h-[500px]">
      {/* Services List Panel */}
      <div className="flex-1 w-full space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-white">Docker Containers</h2>
            <p className="text-xs text-slate-400">Manage infrastructure microservices</p>
          </div>
          <button
            onClick={() => {
              setLocalServices({});
              mutateServices();
            }}
            className="px-3 py-1.5 rounded-lg border border-panelBorder hover:bg-white/5 transition-all text-xs font-semibold text-slate-300"
          >
            Reset States
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayServices.length > 0 ? (
            displayServices.map((svc) => (
              <div
                key={svc.name}
                onClick={() => setSelectedService(svc.name)}
                className={`p-6 rounded-2xl glass-panel relative group cursor-pointer transition-all duration-300 ${
                  selectedService === svc.name
                    ? 'border-glowCyan/50 ring-1 ring-glowCyan/20 bg-glowCyan/[0.02]'
                    : 'hover:border-white/20'
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-glowCyan transition-colors">
                      {svc.name}
                    </h3>
                    <span className="text-[10px] text-slate-500 font-mono block mt-0.5">{svc.image}</span>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                    svc.status === 'running'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : svc.status === 'degraded'
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}>
                    {svc.status}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 border-t border-panelBorder pt-4 mt-2">
                  <div>
                    <span className="text-[9px] text-slate-500 font-mono block">CPU</span>
                    <span className="text-xs font-bold text-white font-mono">{svc.cpu_percent}%</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 font-mono block">Memory</span>
                    <span className="text-xs font-bold text-white font-mono">{svc.memory_mb} MB</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 font-mono block">Restarts</span>
                    <span className="text-xs font-bold text-white font-mono">{svc.restarts}</span>
                  </div>
                </div>
              </div>
            ))
          ) : error ? (
            <div className="col-span-2 glass-panel p-6 text-center text-red-400">Failed to connect to Docker agent.</div>
          ) : (
            [1, 2, 3, 4].map((n) => (
              <div key={n} className="h-36 rounded-2xl glass-panel animate-pulse bg-white/[0.02]" />
            ))
          )}
        </div>
      </div>

      {/* Details Side Drawer */}
      {selectedService && activeService && (
        <div className="w-full xl:w-96 glass-panel rounded-2xl p-6 flex flex-col space-y-6 xl:sticky xl:top-6 self-start animate-fade-in border-glowCyan/30">
          <div className="flex justify-between items-center border-b border-panelBorder pb-4">
            <div>
              <h2 className="text-lg font-bold text-white">{activeService.name}</h2>
              <span className="text-[10px] text-slate-400 font-mono">Port: {activeService.port}</span>
            </div>
            <button
              onClick={() => setSelectedService(null)}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Metrics summary */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-white/[0.02] border border-white/[0.04] rounded-xl text-center">
              <span className="text-[10px] text-slate-500 block">Uptime</span>
              <span className="text-sm font-bold font-mono text-white">{activeService.uptime_hours} hrs</span>
            </div>
            <div className="p-3 bg-white/[0.02] border border-white/[0.04] rounded-xl text-center">
              <span className="text-[10px] text-slate-500 block">Health checks</span>
              <span className="text-xs font-semibold text-emerald-400 font-mono">PASSED</span>
            </div>
          </div>

          {/* Docker actions */}
          <div className="space-y-2">
            <span className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">Container Commands</span>
            <div className="grid grid-cols-3 gap-2">
              <button
                disabled={activeService.status === 'running' || isPerformingAction !== null}
                onClick={() => handleAction(activeService.name, 'start')}
                className="py-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-semibold border border-emerald-500/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                Start
              </button>
              <button
                disabled={activeService.status === 'stopped' || isPerformingAction !== null}
                onClick={() => handleAction(activeService.name, 'stop')}
                className="py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold border border-rose-500/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                Stop
              </button>
              <button
                disabled={isPerformingAction !== null}
                onClick={() => handleAction(activeService.name, 'restart')}
                className="py-2 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-xs font-semibold border border-indigo-500/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                Restart
              </button>
            </div>
          </div>

          {/* Log terminal */}
          <div className="flex flex-col flex-1 min-h-[220px]">
            <span className="text-[10px] text-slate-400 font-mono tracking-wider uppercase mb-2">Stdout logs</span>
            <div className="bg-[#050507] border border-panelBorder rounded-xl p-4 flex-1 font-mono text-[10px] text-slate-300 overflow-y-auto max-h-[300px] space-y-2 select-text">
              {activeLogs.length > 0 ? (
                activeLogs.map((log, index) => {
                  let colorClass = 'text-slate-300';
                  if (log.includes('[ACTION]')) colorClass = 'text-glowCyan font-bold';
                  else if (log.includes('[WARN]')) colorClass = 'text-amber-400';
                  else if (log.includes('[ERROR]')) colorClass = 'text-rose-400';
                  else if (log.includes('[INFO]')) colorClass = 'text-emerald-400/90';

                  return (
                    <div key={index} className={`${colorClass} break-all whitespace-pre-wrap leading-relaxed`}>
                      {log}
                    </div>
                  );
                })
              ) : (
                <div className="text-slate-600 text-center py-10">Waiting for logs...</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
