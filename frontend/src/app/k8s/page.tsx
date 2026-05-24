'use client';

import useSWR from 'swr';
import { fetcher, getApiUrl } from '@/lib/api';

interface PVC {
  name: string;
  namespace: string;
  status: string;
  capacity_gb: number;
  used_gb: number;
  volume_name: string;
  storage_class: string;
  creation_timestamp: string | null;
}

export default function K8sPvcsPage() {
  const { data: pvcs, error } = useSWR<PVC[]>(
    getApiUrl('/api/v1/k8s/pvcs'),
    fetcher,
    { refreshInterval: 5000 }
  );

  const isLoading = !pvcs && !error;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <svg className="w-5 h-5 text-glowCyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          Kubernetes Persistent Volumes
        </h2>
        <p className="text-xs text-slate-400">Monitor cluster storage claims (PVCs) and binding states</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-44 rounded-2xl glass-panel animate-pulse bg-white/[0.02]" />
          ))}
        </div>
      ) : error ? (
        <div className="glass-panel p-6 text-center text-red-400">
          Failed to fetch cluster PVC metrics. Check Kubernetes connection.
        </div>
      ) : pvcs && pvcs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {pvcs.map((pvc) => {
            const usagePercent = pvc.capacity_gb > 0 ? Math.round((pvc.used_gb / pvc.capacity_gb) * 100) : 0;
            const isBound = pvc.status.toLowerCase() === 'bound';
            const isPending = pvc.status.toLowerCase() === 'pending';
            
            return (
              <div key={pvc.name} className="p-6 rounded-2xl glass-panel relative group hover:scale-[1.01] transition-all duration-300">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-mono font-semibold bg-glowCyan/10 text-glowCyan border border-glowCyan/20 mb-1.5 uppercase">
                      Namespace: {pvc.namespace}
                    </span>
                    <h3 className="text-base font-bold text-white group-hover:text-glowCyan transition-colors">
                      {pvc.name}
                    </h3>
                  </div>
                  
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                    isBound
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : isPending
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      isBound ? 'bg-emerald-400' : isPending ? 'bg-amber-400' : 'bg-rose-400'
                    }`} />
                    {pvc.status}
                  </span>
                </div>

                {/* Storage Capacity Progress */}
                {isBound && (
                  <div className="space-y-1.5 mb-4">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-400">Allocated Space Usage</span>
                      <span className="text-white font-mono">{usagePercent}% ({pvc.used_gb} / {pvc.capacity_gb} GiB)</span>
                    </div>
                    <div className="w-full bg-slate-800/80 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-glowCyan h-2 rounded-full transition-all duration-500"
                        style={{ width: `${usagePercent}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Meta details */}
                <div className="border-t border-panelBorder pt-4 mt-2 space-y-2 text-[11px] font-mono text-slate-400">
                  <div className="flex justify-between">
                    <span>Volume Name:</span>
                    <span className="text-slate-300 break-all select-all text-right max-w-[200px] truncate">{pvc.volume_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Storage Class:</span>
                    <span className="text-slate-300">{pvc.storage_class}</span>
                  </div>
                  {pvc.creation_timestamp && (
                    <div className="flex justify-between">
                      <span>Created At:</span>
                      <span className="text-slate-300">{new Date(pvc.creation_timestamp).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass-panel p-6 text-center text-slate-400">No volume claims found in the cluster.</div>
      )}
    </div>
  );
}
