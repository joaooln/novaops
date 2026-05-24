'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { fetcher, getApiUrl } from '@/lib/api';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';

interface CpuData {
  total_percent: number;
  per_core: number[];
  core_count: number;
  frequency_mhz: number | null;
  timestamp: string;
}

interface MemoryData {
  ram: {
    total_gb: number;
    available_gb: number;
    used_gb: number;
    percent: number;
  };
  swap: {
    total_gb: number;
    used_gb: number;
    percent: number;
  };
  timestamp: string;
}

interface DiskData {
  usage: {
    total_gb: number;
    used_gb: number;
    free_gb: number;
    percent: number;
  };
  io: {
    read_mb: number | null;
    write_mb: number | null;
  };
  timestamp: string;
}

interface NetworkData {
  bytes_sent_mb: number;
  bytes_recv_mb: number;
  packets_sent: number;
  packets_recv: number;
  active_connections: number;
  timestamp: string;
}

export default function MetricsPage() {
  const [mounted, setMounted] = useState(false);
  const [cpuHistory, setCpuHistory] = useState<any[]>([]);
  const [memHistory, setMemHistory] = useState<any[]>([]);
  const [netHistory, setNetHistory] = useState<any[]>([]);

  // SWR Hooks
  const { data: cpu } = useSWR<CpuData>(getApiUrl('/api/v1/metrics/cpu'), fetcher, { refreshInterval: 2000 });
  const { data: memory } = useSWR<MemoryData>(getApiUrl('/api/v1/metrics/memory'), fetcher, { refreshInterval: 2000 });
  const { data: network } = useSWR<NetworkData>(getApiUrl('/api/v1/metrics/network'), fetcher, { refreshInterval: 2000 });
  const { data: disk } = useSWR<DiskData>(getApiUrl('/api/v1/metrics/disk'), fetcher, { refreshInterval: 5000 });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Update CPU History
  useEffect(() => {
    if (cpu) {
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setCpuHistory((prev) => {
        const next = [...prev, { time: now, cpu: cpu.total_percent }];
        return next.slice(-15);
      });
    }
  }, [cpu]);

  // Update Memory History
  useEffect(() => {
    if (memory) {
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setMemHistory((prev) => {
        const next = [...prev, { time: now, ram: memory.ram.percent, swap: memory.swap.percent }];
        return next.slice(-15);
      });
    }
  }, [memory]);

  // Update Network History (calculate throughput speeds)
  useEffect(() => {
    if (network) {
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setNetHistory((prev) => {
        let sentSpeed = 0;
        let recvSpeed = 0;
        if (prev.length > 0) {
          const last = prev[prev.length - 1];
          // Calculate delta in MB/s (polling interval is 2s)
          sentSpeed = Math.max(0, Math.round(((network.bytes_sent_mb - last.rawSent) / 2) * 100) / 100);
          recvSpeed = Math.max(0, Math.round(((network.bytes_recv_mb - last.rawRecv) / 2) * 100) / 100);
        }
        const next = [
          ...prev,
          {
            time: now,
            sentSpeed,
            recvSpeed,
            connections: network.active_connections,
            rawSent: network.bytes_sent_mb,
            rawRecv: network.bytes_recv_mb,
          },
        ];
        return next.slice(-15);
      });
    }
  }, [network]);

  if (!mounted) {
    return <div className="h-96 rounded-2xl glass-panel animate-pulse bg-white/[0.02]" />;
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* CPU Section */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-bold text-white">CPU Utilisation History</h2>
              <p className="text-xs text-slate-400">Total processor utilization over time</p>
            </div>
            {cpu && (
              <div className="text-right">
                <span className="text-2xl font-bold font-mono text-glowCyan">{cpu.total_percent}%</span>
                <span className="text-[10px] text-slate-500 block">
                  {cpu.frequency_mhz ? `${Math.round(cpu.frequency_mhz / 1000 * 10) / 10} GHz` : 'N/A'} • {cpu.core_count} Cores
                </span>
              </div>
            )}
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cpuHistory}>
                <defs>
                  <linearGradient id="cpuGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="time" stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} />
                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgba(15,15,20,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  labelClassName="text-slate-400 text-xs font-mono"
                />
                <Area type="monotone" dataKey="cpu" name="CPU Usage" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#cpuGlow)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CPU cores list */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col">
          <h2 className="text-lg font-bold text-white mb-4">Core breakdown</h2>
          <div className="space-y-4 overflow-y-auto max-h-[268px] pr-2">
            {cpu?.per_core.map((coreVal, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-400">Core {i}</span>
                  <span className="text-white font-mono">{coreVal}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-glowCyan h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${coreVal}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Memory Section */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-bold text-white">Memory Allocation</h2>
              <p className="text-xs text-slate-400">RAM and Swap usage history</p>
            </div>
            {memory && (
              <div className="text-right">
                <span className="text-2xl font-bold font-mono text-glowIndigo">{memory.ram.percent}%</span>
                <span className="text-[10px] text-slate-500 block">
                  {memory.ram.used_gb} / {memory.ram.total_gb} GB RAM used
                </span>
              </div>
            )}
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={memHistory}>
                <defs>
                  <linearGradient id="ramGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="time" stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} />
                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgba(15,15,20,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  labelClassName="text-slate-400 text-xs font-mono"
                />
                <Area type="monotone" dataKey="ram" name="RAM %" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#ramGlow)" />
                <Area type="monotone" dataKey="swap" name="Swap %" stroke="#a855f7" strokeWidth={1} fillOpacity={0} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Disk Info panel */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-white mb-2">Storage Usage</h2>
            <p className="text-xs text-slate-400 mb-6">Physical volume and IO operations</p>
            {disk ? (
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-xs text-slate-300 font-semibold mb-1">
                    <span>Root Partition (/)</span>
                    <span className="font-mono">{disk.usage.percent}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden mb-2">
                    <div
                      className="bg-glowGreen h-2 rounded-full transition-all duration-500"
                      style={{ width: `${disk.usage.percent}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium">
                    {disk.usage.used_gb} GB used out of {disk.usage.total_gb} GB ({disk.usage.free_gb} GB free)
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-panelBorder pt-4">
                  <div>
                    <span className="text-[10px] text-slate-500 font-mono block">IO Read bytes</span>
                    <span className="text-sm font-bold font-mono text-white">{disk.io.read_mb ?? 'N/A'} MB</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-mono block">IO Write bytes</span>
                    <span className="text-sm font-bold font-mono text-white">{disk.io.write_mb ?? 'N/A'} MB</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-32 animate-pulse bg-white/[0.02] rounded-xl" />
            )}
          </div>
        </div>
      </section>

      {/* Network Section */}
      <section className="glass-panel p-6 rounded-2xl flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-lg font-bold text-white">Network Traffic & Connections</h2>
            <p className="text-xs text-slate-400">Live outbound/inbound speeds and sockets count</p>
          </div>
          {network && (
            <div className="text-right">
              <span className="text-2xl font-bold font-mono text-glowGreen">
                {network.active_connections}
              </span>
              <span className="text-[10px] text-slate-500 block">Active Connections</span>
            </div>
          )}
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={netHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
              <XAxis dataKey="time" stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} />
              <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: 'rgba(15,15,20,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                labelClassName="text-slate-400 text-xs font-mono"
              />
              <Line type="monotone" dataKey="sentSpeed" name="Sent (MB/s)" stroke="#10b981" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="recvSpeed" name="Received (MB/s)" stroke="#06b6d4" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="connections" name="Sockets" stroke="#eab308" strokeWidth={1} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
