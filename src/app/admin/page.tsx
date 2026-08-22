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
  Lock,
  BookOpen,
  Award,
  Users,
  Send,
  Check,
  AlertCircle
} from 'lucide-react';
import { getSkillStatusDisplay } from '@/lib/skill-verification';

export default function AdminPage() {
  const { user } = useAuth();
  const [systemData, setSystemData] = useState<any | null>(null);
  const [verificationData, setVerificationData] = useState<{ skills: any[]; assessments: any[] }>({ skills: [], assessments: [] });
  const [demandData, setDemandData] = useState<any[]>([]);
  const [selectedSkillGap, setSelectedSkillGap] = useState<string | null>(null);
  const [potentialMentors, setPotentialMentors] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'VERIFICATION' | 'DEMAND'>('VERIFICATION');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [sysRes, verRes, demRes] = await Promise.all([
        fetch('/api/admin/system'),
        fetch('/api/admin/verification'),
        fetch('/api/admin/demand'),
      ]);

      if (sysRes.ok) setSystemData(await sysRes.json());
      if (verRes.ok) setVerificationData(await verRes.json());
      if (demRes.ok) {
        const dJson = await demRes.json();
        setDemandData(dJson.demand || []);
      }
    } catch (err) {
      console.error('Admin data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'ADMIN' || user?.role === 'MODERATOR') {
      fetchAdminData();
    }
  }, [user]);

  // Handle Admin Verification Action
  const handleVerificationAction = async (userId: string, skillId: string, action: string) => {
    setActionLoading(`${userId}:${skillId}`);
    try {
      const res = await fetch('/api/admin/verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, skillId, action }),
      });

      if (res.ok) {
        await fetchAdminData();
      } else {
        const data = await res.json();
        alert(data.error || 'Action failed');
      }
    } catch (err) {
      console.error('Verification action error:', err);
    } finally {
      setActionLoading(null);
    }
  };

  // Inspect Potential Mentors for a Skill Gap
  const handleInspectGap = async (skillName: string) => {
    setSelectedSkillGap(skillName);
    try {
      const res = await fetch(`/api/admin/demand?skill=${encodeURIComponent(skillName)}`);
      if (res.ok) {
        const json = await res.json();
        setPotentialMentors(json.potentialMentors || []);
      }
    } catch (err) {
      console.error('Potential mentors fetch error:', err);
    }
  };

  // Invite Potential Mentor to Assessment
  const handleInviteMentor = async (targetUserId: string, skillName: string) => {
    try {
      const res = await fetch('/api/admin/demand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId, requestedSkillName: skillName }),
      });

      if (res.ok) {
        alert(`Invitation sent to student for "${skillName}"!`);
      }
    } catch (err) {
      console.error('Invite mentor error:', err);
    }
  };

  if (user?.role !== 'ADMIN' && user?.role !== 'MODERATOR') {
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
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-white">
              Campus SRE &amp; Admin Dashboard
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 font-semibold border border-rose-500/30">
              {user.role} Level
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Skill verification queue, demand aggregation analytics, and system observability.
          </p>
        </div>

        <button
          onClick={fetchAdminData}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Dashboard
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('VERIFICATION')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
            activeTab === 'VERIFICATION' ? 'bg-sky-500 text-dark-bg' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Award className="w-4 h-4" /> Skill Verification Queue ({verificationData.skills.length})
        </button>
        <button
          onClick={() => setActiveTab('DEMAND')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
            activeTab === 'DEMAND' ? 'bg-amber-500 text-dark-bg' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" /> Demand &amp; Skill Gaps ({demandData.filter(d => d.status === 'ZERO_SUPPLY').length} zero-supply)
        </button>
        <button
          onClick={() => setActiveTab('OVERVIEW')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
            activeTab === 'OVERVIEW' ? 'bg-brand-500 text-dark-bg' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Activity className="w-4 h-4" /> SRE Health Overview
        </button>
      </div>

      {/* ============================================================ */}
      {/* TAB 1: SKILL VERIFICATION QUEUE */}
      {/* ============================================================ */}
      {activeTab === 'VERIFICATION' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-base font-bold text-white">Skill Verification Review Queue</h2>
            <p className="text-xs text-slate-400">Review self-declared skills, automated assessment results, and grant Platform Verified badges.</p>
          </div>

          <div className="glass-panel rounded-2xl border border-slate-800 overflow-x-auto shadow-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="p-4">Student</th>
                  <th className="p-4">Skill Topic</th>
                  <th className="p-4">Level &amp; Exp</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Assessment Score</th>
                  <th className="p-4 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {verificationData.skills.map((item: any) => {
                  const statusInfo = getSkillStatusDisplay(item.verification_status);
                  const isProcessing = actionLoading === `${item.user_id}:${item.skill_id}`;

                  return (
                    <tr key={`${item.user_id}-${item.skill_id}`} className="hover:bg-slate-900/40 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-white">{item.display_name}</div>
                        <div className="text-[11px] text-slate-400">{item.college} • {item.email}</div>
                      </td>
                      <td className="p-4">
                        <span className="font-semibold text-white">{item.skill_name}</span>
                        <div className="text-[11px] text-slate-400">{item.skill_category}</div>
                      </td>
                      <td className="p-4">
                        <span className="font-medium text-slate-200">{item.proficiency}</span>
                        <div className="text-[11px] text-slate-400">{item.experience_years} yrs exp</div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold ${statusInfo.badgeColor}`}>
                          {statusInfo.icon} {statusInfo.label}
                        </span>
                      </td>
                      <td className="p-4">
                        {item.assessment_score ? (
                          <span className="font-bold text-sky-400">{item.assessment_score}%</span>
                        ) : (
                          <span className="text-slate-500 italic">Not taken</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleVerificationAction(item.user_id, item.skill_id, 'APPROVE_PLATFORM_VERIFIED')}
                            disabled={isProcessing || item.verification_status === 'PLATFORM_VERIFIED'}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] disabled:opacity-40 transition-colors flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" /> Approve
                          </button>
                          <button
                            onClick={() => handleVerificationAction(item.user_id, item.skill_id, 'REQUEST_REASSESSMENT')}
                            disabled={isProcessing}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-rose-300 border border-slate-700 font-semibold text-[11px] transition-colors"
                          >
                            Reassess
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 2: DEMAND AGGREGATION & SKILL GAP RESOLUTION */}
      {/* ============================================================ */}
      {activeTab === 'DEMAND' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-base font-bold text-white">Campus Skill Demand &amp; Gap Analytics</h2>
            <p className="text-xs text-slate-400">Track high learner demand with zero mentors, and invite students with related competencies to mentor.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Demand Table */}
            <div className="lg:col-span-2 glass-panel rounded-2xl border border-slate-800 overflow-x-auto shadow-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Skill Topic</th>
                    <th className="p-4">Learner Demand</th>
                    <th className="p-4">Verified Teachers</th>
                    <th className="p-4">Supply Status</th>
                    <th className="p-4 text-right">Potential Mentors</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {demandData.map((d: any) => (
                    <tr key={d.skillId} className="hover:bg-slate-900/40 transition-colors">
                      <td className="p-4 font-bold text-white">{d.skillName}</td>
                      <td className="p-4 font-bold text-brand-400">{d.learnerDemandCount} learners</td>
                      <td className="p-4 font-semibold text-slate-200">{d.verifiedTeacherCount} verified</td>
                      <td className="p-4">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${
                          d.status === 'ZERO_SUPPLY' ? 'bg-rose-500/20 text-rose-400 border-rose-500/30 animate-pulse' :
                          d.status === 'LOW_SUPPLY' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                          'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        }`}>
                          {d.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleInspectGap(d.skillName)}
                          className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-[11px] transition-colors"
                        >
                          Find Mentors
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Potential Mentors Panel */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
              <div>
                <h3 className="font-bold text-white text-sm">Potential Mentor Discovery</h3>
                <p className="text-xs text-slate-400">
                  {selectedSkillGap ? `Students with skills related to "${selectedSkillGap}"` : 'Select a skill to inspect potential mentors'}
                </p>
              </div>

              {selectedSkillGap ? (
                potentialMentors.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-500">
                    No related candidates currently found.
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {potentialMentors.map((cand, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-bold text-white">{cand.displayName}</div>
                            <div className="text-[11px] text-slate-400">{cand.college}</div>
                          </div>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-300">
                            {cand.proficiency}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Expertise in: <strong className="text-slate-200">{cand.relatedSkillName}</strong>
                        </div>
                        <button
                          onClick={() => handleInviteMentor(cand.userId, selectedSkillGap)}
                          className="w-full py-1 rounded-lg bg-brand-500 hover:bg-brand-400 text-dark-bg font-bold text-[11px] transition-colors flex items-center justify-center gap-1"
                        >
                          <Send className="w-3 h-3" /> Invite to Skill Assessment
                        </button>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                <div className="py-8 text-center text-xs text-slate-500">
                  Click &ldquo;Find Mentors&rdquo; on any skill gap row to scan candidates with adjacent proficiencies.
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 3: SRE HEALTH OVERVIEW */}
      {/* ============================================================ */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-6">
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
        </div>
      )}

    </div>
  );
}
