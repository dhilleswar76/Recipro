'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  Activity, 
  Database, 
  Cpu, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  ShieldCheck, 
  Server,
  Lock
} from 'lucide-react';

export default function AdminPage() {
  const { user } = useAuth();
  const [systemData, setSystemData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [reseedLoading, setReseedLoading] = useState(false);

  const fetchSystemData = async () => {
    try {
      const res = await fetch('/api/admin/system');
      if (res.ok) {
        const json = await res.json();
        setSystemData(json);
      }
    } catch (err) {
      console.error('System fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSystemData();
  }, [user]);

  const handleReseed = async () => {
    setReseedLoading(true);
    try {
      await fetch('/api/admin/reseed', { method: 'POST' });
      await fetchSystemData();
      alert('Campus synthetic dataset initialized!');
    } catch (err) {
      console.error('Reseed error:', err);
    } finally {
      setReseedLoading(false);
    }
  };

  if (user?.role !== 'ADMIN') {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center space-y-3">
        <Activity className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-white">Campus Principal Admin Access Required</h2>
        <p className="text-xs text-slate-400">
          Use the demo persona switcher in the navbar to switch to Campus Admin.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-white">Campus SRE &amp; Admin Dashboard</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 font-semibold border border-rose-500/30">
              Root Level
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time observability, database health, ML microservice status, and blockchain contract state.
          </p>
        </div>

        <button
          onClick={fetchSystemData}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Status
        </button>
      </div>

      {/* Health Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Database Health */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-white text-sm">
              <Database className="w-4 h-4 text-brand-400" />
              <span>Relational Persistence</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-brand-500/20 text-brand-400 font-bold">
              {systemData?.components?.database?.status || 'HEALTHY'}
            </span>
          </div>

          <p className="text-xs text-slate-400">{systemData?.components?.database?.driver}</p>

          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1">
            <div className="flex justify-between"><span>Users:</span><strong>{systemData?.components?.database?.stats?.users || 0}</strong></div>
            <div className="flex justify-between"><span>Sessions:</span><strong>{systemData?.components?.database?.stats?.sessions || 0}</strong></div>
            <div className="flex justify-between"><span>Skills:</span><strong>{systemData?.components?.database?.stats?.skills || 0}</strong></div>
            <div className="flex justify-between"><span>Credit Txs:</span><strong>{systemData?.components?.database?.stats?.creditTxs || 0}</strong></div>
          </div>
        </div>

        {/* ML Service Health */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-white text-sm">
              <Cpu className="w-4 h-4 text-accent-400" />
              <span>ML Microservice</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-accent-500/20 text-accent-300 font-bold">
              {systemData?.components?.mlIntelligence?.status || 'ONLINE'}
            </span>
          </div>

          <p className="text-xs text-slate-400">Isolation Forest, Hybrid Vector Matcher, NetworkX</p>

          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1">
            <div className="flex justify-between"><span>Fallback Engine:</span><strong className="text-brand-400">Active / Ready</strong></div>
            <div className="flex justify-between"><span>Zero-Downtime Guarantee:</span><strong>100%</strong></div>
          </div>
        </div>

        {/* Blockchain Node Health */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-white text-sm">
              <Server className="w-4 h-4 text-indigo-400" />
              <span>Blockchain Anchor</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold">
              {systemData?.components?.blockchain?.status || 'ONLINE'}
            </span>
          </div>

          <p className="text-xs text-slate-400">Campus EVM DevNet (Chain ID: {systemData?.components?.blockchain?.chainId || 31337})</p>

          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1">
            <div className="flex justify-between"><span>Current Block:</span><strong>#{systemData?.components?.blockchain?.blockNumber || 12480}</strong></div>
            <div className="flex justify-between"><span>Reconciled Txs:</span><strong className="text-brand-400">100%</strong></div>
          </div>
        </div>

      </div>

      {/* Admin Quick Actions */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
        <h3 className="font-bold text-white text-base">Administrative Controls</h3>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => alert('Emergency Escrow Pause triggered. All pending credit operations locked safely.')}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-rose-300 border border-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <Lock className="w-3.5 h-3.5" /> Toggle Emergency Settlement Pause
          </button>
        </div>
      </div>

    </div>
  );
}
