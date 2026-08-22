'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { 
  Activity, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Coins, 
  Search, 
  Filter, 
  Download, 
  ArrowRight, 
  ShieldAlert, 
  Users, 
  BookOpen, 
  RefreshCw, 
  Lock,
  ChevronRight,
  TrendingUp,
  Award
} from 'lucide-react';

export default function AdminDashboardPage() {
  const { user, loading: authLoading, login } = useAuth();
  const router = useRouter();

  // Admin login portal state
  const [adminEmail, setAdminEmail] = useState('admin@skillswap.campus.edu');
  const [adminPassword, setAdminPassword] = useState('Password123!');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // Date selection state (Defaults to canonical date 2026-08-23 or today)
  const [selectedDate, setSelectedDate] = useState<string>('2026-08-23');
  const [dailyReport, setDailyReport] = useState<any | null>(null);
  const [reportLoading, setReportLoading] = useState(true);

  // User search & filters
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [userPage, setUserPage] = useState(1);
  const [usersData, setUsersData] = useState<any | null>(null);
  const [usersLoading, setUsersLoading] = useState(false);

  // Active View Tab
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'USERS' | 'SESSIONS'>('OVERVIEW');

  // Fetch Daily Report
  const fetchDailyReport = async (dateStr: string) => {
    setReportLoading(true);
    try {
      const res = await fetch(`/api/admin/reports/daily?date=${dateStr}`);
      if (res.ok) {
        const data = await res.json();
        setDailyReport(data);
      }
    } catch (err) {
      console.error('Failed to load daily report:', err);
    } finally {
      setReportLoading(false);
    }
  };

  // Fetch User Activity List
  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const query = new URLSearchParams({
        search: searchTerm,
        role: roleFilter,
        status: statusFilter,
        page: userPage.toString(),
        limit: '15',
      });
      const res = await fetch(`/api/admin/reports/users?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setUsersData(data);
      }
    } catch (err) {
      console.error('Failed to load users report:', err);
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchDailyReport(selectedDate);
      fetchUsers();
    }
  }, [user]);

  const handleGenerateReport = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDailyReport(selectedDate);
  };

  const handleUserSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setUserPage(1);
    fetchUsers();
  };

  const handleAdminLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);
    try {
      const ok = await login(adminEmail, adminPassword);
      if (!ok) {
        setLoginError('Invalid administrator credentials.');
      } else {
        fetchDailyReport(selectedDate);
        fetchUsers();
      }
    } catch (err: any) {
      setLoginError('Failed to sign in as Administrator');
    } finally {
      setLoginLoading(false);
    }
  };

  // Authorization Guard & Inline Admin Login Portal
  if (authLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center text-xs text-slate-400">
        Verifying administrative authorization...
      </div>
    );
  }

  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 space-y-6">
        <div className="glass-panel p-8 rounded-3xl border border-rose-500/30 bg-slate-950/80 shadow-2xl space-y-6 text-center">
          
          <div className="w-14 h-14 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>

          <div>
            <h2 className="text-xl font-extrabold text-white">Campus Administrator Portal</h2>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Access to <code className="text-rose-400 bg-slate-900 px-1.5 py-0.5 rounded font-mono">/admin</code> requires authenticated Administrator credentials.
            </p>
          </div>

          {user && (
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 text-left space-y-1">
              <div className="text-[11px] text-slate-500 uppercase tracking-wider font-bold">Currently Logged In As:</div>
              <div className="font-bold text-white">{user.display_name} ({user.email})</div>
              <div className="text-[11px] text-amber-400">Current Role: <span className="font-mono">{user.role}</span> (Non-Admin)</div>
            </div>
          )}

          {loginError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold text-left">
              {loginError}
            </div>
          )}

          {/* Inline Admin Login Form */}
          <form onSubmit={handleAdminLogin} className="space-y-4 text-left">
            <div>
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1">
                Admin Email
              </label>
              <input
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="admin@skillswap.campus.edu"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
                required
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1">
                Admin Password
              </label>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-glow-rose transition-all flex items-center justify-center gap-2"
            >
              <Lock className={`w-3.5 h-3.5 ${loginLoading ? 'animate-spin' : ''}`} />
              <span>{loginLoading ? 'Authenticating...' : 'Sign In as Campus Administrator'}</span>
            </button>
          </form>

          {/* Quick Access Switch */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => {
                setAdminEmail('admin@skillswap.campus.edu');
                setAdminPassword('Password123!');
                handleAdminLogin();
              }}
              className="text-brand-400 hover:underline font-semibold text-[11px]"
            >
              1-Click Admin Authenticate
            </button>

            <Link href="/" className="text-slate-400 hover:text-white transition-colors text-[11px]">
              Back to Campus Home &rarr;
            </Link>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8 space-y-6">
      
      {/* Header & Date Selector */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center font-bold text-xl">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-white">SkillSwap Campus Admin</h1>
              <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
                Authoritative Mode
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Real-time operational reporting, session state auditing, and credit flow visibility
            </p>
          </div>
        </div>

        {/* Date Filter Form & Export */}
        <form onSubmit={handleGenerateReport} className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs text-white focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={reportLoading}
            className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-400 text-dark-bg font-bold text-xs shadow-glow-brand transition-all flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${reportLoading ? 'animate-spin' : ''}`} />
            <span>Generate Day Report</span>
          </button>

          <a
            href={`/api/admin/reports/export?type=daily&date=${selectedDate}`}
            download
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-colors flex items-center gap-1.5"
            title="Download CSV report"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </a>
        </form>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('OVERVIEW')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            activeTab === 'OVERVIEW'
              ? 'bg-slate-800 text-white border border-slate-700'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          Daily Overview ({selectedDate})
        </button>
        <button
          onClick={() => {
            setActiveTab('USERS');
            fetchUsers();
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            activeTab === 'USERS'
              ? 'bg-slate-800 text-white border border-slate-700'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          User Activity Reports
        </button>
        <button
          onClick={() => setActiveTab('SESSIONS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            activeTab === 'SESSIONS'
              ? 'bg-slate-800 text-white border border-slate-700'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          Daily Sessions ({dailyReport?.sessions?.length || 0})
        </button>
      </div>

      {/* TAB 1: DAILY OVERVIEW & METRICS */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-6">
          
          {/* Main Stat Counters Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Sessions</span>
              <div className="text-2xl font-extrabold text-white">{dailyReport?.overview?.totalSessions ?? 0}</div>
            </div>

            <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-[11px] font-bold text-brand-400 uppercase tracking-wider">Completed</span>
              <div className="text-2xl font-extrabold text-brand-300">{dailyReport?.overview?.completedSessions ?? 0}</div>
            </div>

            <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider">Cancelled</span>
              <div className="text-2xl font-extrabold text-rose-300">{dailyReport?.overview?.cancelledSessions ?? 0}</div>
            </div>

            <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">Disputed</span>
              <div className="text-2xl font-extrabold text-amber-300">{dailyReport?.overview?.disputedSessions ?? 0}</div>
            </div>

            <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider">Skill Exchanges</span>
              <div className="text-2xl font-extrabold text-cyan-300">{dailyReport?.overview?.successfulSkillExchanges ?? 0}</div>
            </div>

            <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">Credit Sessions</span>
              <div className="text-2xl font-extrabold text-indigo-300">{dailyReport?.overview?.creditBasedSessions ?? 0}</div>
            </div>

            <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pending</span>
              <div className="text-2xl font-extrabold text-slate-200">{dailyReport?.overview?.pendingSessions ?? 0}</div>
            </div>
          </div>

          {/* Detailed Two-Col Breakdown: Session Outcomes & Credit Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Box A: Daily Session Classification */}
            <div className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-brand-400" />
                  <span>Session Outcome &amp; Settlement Classification</span>
                </h3>
                <span className="text-xs text-slate-400">{selectedDate}</span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="text-slate-300">Total Scheduled Sessions</span>
                  <strong className="text-white font-mono text-sm">{dailyReport?.sessionStats?.totalScheduled ?? 0}</strong>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="text-slate-300">Total Started / Live Sessions</span>
                  <strong className="text-cyan-300 font-mono text-sm">{dailyReport?.sessionStats?.totalStarted ?? 0}</strong>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="text-slate-300">Direct Skill-for-Skill Exchanges</span>
                  <strong className="text-brand-300 font-mono text-sm">{dailyReport?.sessionStats?.directSkillExchanges ?? 0}</strong>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="text-slate-300">Credit-Compensated Sessions</span>
                  <strong className="text-indigo-300 font-mono text-sm">{dailyReport?.sessionStats?.creditSettledSessions ?? 0}</strong>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="text-slate-300">No-Shows / Participant Fault</span>
                  <strong className="text-rose-300 font-mono text-sm">{dailyReport?.sessionStats?.totalNoShows ?? 0}</strong>
                </div>
              </div>
            </div>

            {/* Box B: Credit Activity Ledger */}
            <div className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Coins className="w-4 h-4 text-brand-400" />
                  <span>Daily Skill Credit Flows &amp; Escrow</span>
                </h3>
                <span className="text-xs text-slate-400">{dailyReport?.creditActivity?.transactionCount ?? 0} Transactions</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                  <span className="text-slate-400 text-[11px]">Credits Earned</span>
                  <div className="text-lg font-bold text-brand-400">+{dailyReport?.creditActivity?.creditsEarned ?? 0}</div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                  <span className="text-slate-400 text-[11px]">Credits Spent</span>
                  <div className="text-lg font-bold text-indigo-400">-{dailyReport?.creditActivity?.creditsSpent ?? 0}</div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                  <span className="text-slate-400 text-[11px]">Credits Refunded</span>
                  <div className="text-lg font-bold text-cyan-400">{dailyReport?.creditActivity?.creditsRefunded ?? 0}</div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                  <span className="text-slate-400 text-[11px]">Disputed Credits (Frozen)</span>
                  <div className="text-lg font-bold text-rose-400">{dailyReport?.creditActivity?.creditsDisputed ?? 0}</div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">Total Volume Transferred:</span>
                <strong className="text-brand-300 text-sm">{dailyReport?.creditActivity?.totalTransferred ?? 0} Skill Credits</strong>
              </div>
            </div>

          </div>

          {/* Quick Recent Sessions Table */}
          <div className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Daily Sessions Feed ({dailyReport?.sessions?.length || 0})</h3>
              <button
                onClick={() => setActiveTab('SESSIONS')}
                className="text-brand-400 font-semibold text-xs hover:underline flex items-center gap-1"
              >
                View Full Table <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {(!dailyReport?.sessions || dailyReport.sessions.length === 0) ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No session activity recorded for {selectedDate}.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-[11px] text-slate-400 uppercase border-b border-slate-800 bg-slate-900/40">
                    <tr>
                      <th className="py-2.5 px-3">Session ID</th>
                      <th className="py-2.5 px-3">Skill</th>
                      <th className="py-2.5 px-3">Participants</th>
                      <th className="py-2.5 px-3">Time</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Settlement</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {dailyReport.sessions.slice(0, 5).map((sess: any) => (
                      <tr key={sess.id} className="hover:bg-slate-900/30 transition-colors">
                        <td className="py-3 px-3 font-mono text-[11px] text-slate-300">{sess.id}</td>
                        <td className="py-3 px-3 font-bold text-white">{sess.skill_name}</td>
                        <td className="py-3 px-3 text-slate-300">
                          <div><strong className="text-brand-400">T:</strong> {sess.teacher_name}</div>
                          <div><strong className="text-indigo-400">L:</strong> {sess.learner_name}</div>
                        </td>
                        <td className="py-3 px-3 text-slate-300">{sess.scheduled_start.substring(11, 16)}</td>
                        <td className="py-3 px-3">
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${
                            sess.status === 'CREDIT_SETTLED' ? 'bg-brand-500/20 text-brand-400 border-brand-500/30' :
                            sess.status === 'DISPUTED' ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' :
                            'bg-slate-800 text-slate-300 border-slate-700'
                          }`}>
                            {sess.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-300 font-semibold">{sess.settlement_classification}</td>
                        <td className="py-3 px-3 text-right">
                          <Link
                            href={`/admin/sessions/${sess.id}`}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[11px] border border-slate-700 inline-flex items-center gap-1"
                          >
                            Inspect <ChevronRight className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* TAB 2: USER-WISE ACTIVITY REPORTS */}
      {activeTab === 'USERS' && (
        <div className="space-y-6">
          
          {/* User Search & Filters Bar */}
          <form onSubmit={handleUserSearch} className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[240px] relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search user name, email, or user ID..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-xs text-slate-300 rounded-xl px-3 py-2"
              >
                <option value="ALL">All Roles</option>
                <option value="STUDENT">Student</option>
                <option value="MODERATOR">Moderator</option>
                <option value="ADMIN">Admin</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-xs text-slate-300 rounded-xl px-3 py-2"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="SUSPENDED">Suspended</option>
              </select>

              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-400 text-dark-bg font-bold text-xs shadow-glow-brand"
              >
                Filter Users
              </button>
            </div>
          </form>

          {/* User List Table */}
          <div className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Platform Members ({usersData?.pagination?.totalUsers ?? 0})</h3>
            </div>

            {usersLoading ? (
              <div className="py-16 text-center text-xs text-slate-400">Loading user activity data...</div>
            ) : (!usersData?.users || usersData.users.length === 0) ? (
              <div className="py-16 text-center text-xs text-slate-400">No users found matching your criteria.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-[11px] text-slate-400 uppercase border-b border-slate-800 bg-slate-900/40">
                    <tr>
                      <th className="py-2.5 px-3">User</th>
                      <th className="py-2.5 px-3 text-center">Total Sessions</th>
                      <th className="py-2.5 px-3 text-center">Learner</th>
                      <th className="py-2.5 px-3 text-center">Trainer</th>
                      <th className="py-2.5 px-3 text-center">Completed</th>
                      <th className="py-2.5 px-3 text-center">Cancelled</th>
                      <th className="py-2.5 px-3 text-center">Disputed</th>
                      <th className="py-2.5 px-3 text-center">Credits (E / S)</th>
                      <th className="py-2.5 px-3 text-right">Report</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {usersData.users.map((u: any) => (
                      <tr key={u.id} className="hover:bg-slate-900/30 transition-colors">
                        <td className="py-3 px-3">
                          <div className="font-bold text-white">{u.display_name || 'Anonymous User'}</div>
                          <div className="text-[11px] text-slate-400">{u.email} • <span className="text-brand-400">{u.role}</span></div>
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-white">{u.total_sessions}</td>
                        <td className="py-3 px-3 text-center text-indigo-300 font-semibold">{u.learner_sessions}</td>
                        <td className="py-3 px-3 text-center text-brand-300 font-semibold">{u.trainer_sessions}</td>
                        <td className="py-3 px-3 text-center text-emerald-400">{u.completed_sessions}</td>
                        <td className="py-3 px-3 text-center text-rose-400">{u.cancelled_sessions}</td>
                        <td className="py-3 px-3 text-center text-amber-400">{u.disputed_sessions}</td>
                        <td className="py-3 px-3 text-center font-mono">
                          <span className="text-brand-400">+{u.credits_earned}</span> / <span className="text-indigo-400">-{u.credits_spent}</span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <Link
                            href={`/admin/users/${u.id}`}
                            className="px-3 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-400 text-dark-bg font-bold text-xs shadow-glow-brand inline-flex items-center gap-1"
                          >
                            <span>View Report</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {usersData?.pagination && usersData.pagination.totalPages > 1 && (
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span>Page {usersData.pagination.page} of {usersData.pagination.totalPages}</span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={userPage <= 1}
                    onClick={() => { setUserPage(p => p - 1); fetchUsers(); }}
                    className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    disabled={userPage >= usersData.pagination.totalPages}
                    onClick={() => { setUserPage(p => p + 1); fetchUsers(); }}
                    className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      )}

      {/* TAB 3: ALL SESSIONS TABLE */}
      {activeTab === 'SESSIONS' && (
        <div className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">All Sessions on {selectedDate}</h3>
            <a
              href={`/api/admin/reports/export?type=daily&date=${selectedDate}`}
              download
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-semibold border border-slate-700 flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> Export Table CSV
            </a>
          </div>

          {(!dailyReport?.sessions || dailyReport.sessions.length === 0) ? (
            <div className="py-16 text-center text-xs text-slate-400">
              No sessions scheduled for {selectedDate}.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-[11px] text-slate-400 uppercase border-b border-slate-800 bg-slate-900/40">
                  <tr>
                    <th className="py-2.5 px-3">Session ID</th>
                    <th className="py-2.5 px-3">Title &amp; Skill</th>
                    <th className="py-2.5 px-3">Teaching Mentor</th>
                    <th className="py-2.5 px-3">Learner</th>
                    <th className="py-2.5 px-3">Duration</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Settlement</th>
                    <th className="py-2.5 px-3 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {dailyReport.sessions.map((sess: any) => (
                    <tr key={sess.id} className="hover:bg-slate-900/30 transition-colors">
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-300">{sess.id}</td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-white">{sess.title}</div>
                        <div className="text-[11px] text-brand-400">{sess.skill_name}</div>
                      </td>
                      <td className="py-3 px-3 text-slate-200">{sess.teacher_name}</td>
                      <td className="py-3 px-3 text-slate-200">{sess.learner_name}</td>
                      <td className="py-3 px-3 text-slate-300">{sess.duration_hours}h</td>
                      <td className="py-3 px-3">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${
                          sess.status === 'CREDIT_SETTLED' ? 'bg-brand-500/20 text-brand-400 border-brand-500/30' :
                          sess.status === 'DISPUTED' ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' :
                          'bg-slate-800 text-slate-300 border-slate-700'
                        }`}>
                          {sess.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-300">{sess.settlement_classification}</td>
                      <td className="py-3 px-3 text-right">
                        <Link
                          href={`/admin/sessions/${sess.id}`}
                          className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[11px] border border-slate-700 inline-flex items-center gap-1"
                        >
                          Audit <ChevronRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
