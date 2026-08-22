'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { 
  Sparkles, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  User, 
  GraduationCap, 
  Building, 
  BookOpen, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Copy, 
  Check, 
  ShieldCheck, 
  Zap,
  KeyRound
} from 'lucide-react';

const DEMO_ACCOUNTS = [
  {
    name: 'Alice Chen',
    email: 'alice@campus.edu',
    password: 'Password123!',
    role: 'Student (Learner/Mentor)',
    college: 'School of Engineering',
    major: 'Computer Science',
    skills: 'React, Node.js, Web Development',
    badge: 'Verified Student',
    badgeColor: 'bg-brand-500/20 text-brand-300 border-brand-500/30',
    avatarGradient: 'from-brand-500 to-accent-600',
  },
  {
    name: 'Rahul Kumar',
    email: 'rahul.kumar@campus.edu',
    password: 'Password123!',
    role: 'Senior Peer Mentor',
    college: 'School of Engineering',
    major: 'Computer Science & AI',
    skills: 'Python, Solidity, PyTorch',
    badge: 'Top Mentor (96% Trust)',
    badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
    avatarGradient: 'from-sky-500 to-indigo-600',
  },
  {
    name: 'Elena Rostova',
    email: 'elena.rostova@campus.edu',
    password: 'Password123!',
    role: 'Design TA',
    college: 'Faculty of Arts & Media',
    major: 'Digital Product Design',
    skills: 'Figma, UI/UX, Design Systems',
    badge: 'Design Specialist',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    avatarGradient: 'from-purple-500 to-pink-600',
  },
  {
    name: 'David Kim',
    email: 'david.kim@campus.edu',
    password: 'Password123!',
    role: 'Applied Math Tutor',
    college: 'Faculty of Mathematics',
    major: 'Applied Mathematics',
    skills: 'Calculus, Linear Algebra, Statistics',
    badge: 'Math TA',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    avatarGradient: 'from-emerald-500 to-teal-600',
  },
  {
    name: 'Sarah Jenkins',
    email: 'moderator.sarah@campus.edu',
    password: 'Password123!',
    role: 'Campus Moderator',
    college: 'Campus Trust & Safety',
    major: 'Moderation & Safety Office',
    skills: 'Dispute Resolution, Sybil Defense',
    badge: 'Moderator',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    avatarGradient: 'from-amber-500 to-orange-600',
  },
  {
    name: 'Campus Admin',
    email: 'admin@skillswap.campus.edu',
    password: 'Password123!',
    role: 'System Administrator',
    college: 'IT & Systems Operations',
    major: 'Platform SRE',
    skills: 'System SRE, Escrow Overrides',
    badge: 'Admin',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    avatarGradient: 'from-rose-500 to-red-600',
  },
];

function LoginComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, refreshUser } = useAuth();

  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>(() => {
    return searchParams.get('tab') === 'register' ? 'REGISTER' : 'LOGIN';
  });

  // Login Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Register Form States
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regCollege, setRegCollege] = useState('School of Engineering');
  const [regMajor, setRegMajor] = useState('Computer Science');
  const [regYear, setRegYear] = useState('Junior');
  const [regUserType, setRegUserType] = useState('TEACHER_LEARNER');

  // Copy helper
  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  // Fill credentials into the form fields
  const handleFillCredentials = (acc: typeof DEMO_ACCOUNTS[0]) => {
    setMode('LOGIN');
    setEmail(acc.email);
    setPassword(acc.password);
    setErrorMsg(null);
    setSuccessMsg(`Credentials for ${acc.name} populated! Click "Log In to Campus" below.`);
  };

  // Handle Login Submission
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const success = await login(email.trim(), password);
      if (success) {
        setSuccessMsg('Authentication successful! Redirecting to campus...');
        const redirectUrl = searchParams.get('redirect') || '/explore';
        setTimeout(() => {
          router.push(redirectUrl);
        }, 600);
      } else {
        setErrorMsg('Invalid email or password. Please verify your credentials.');
      }
    } catch (err: any) {
      setErrorMsg('An unexpected error occurred during login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Register Submission
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: regName,
          email: regEmail.trim().toLowerCase(),
          password: regPassword,
          college: regCollege,
          major: regMajor,
          year: regYear,
          userType: regUserType,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMsg('Account created successfully with 4 Welcome Skill Credits! Logging in...');
        await refreshUser();
        setTimeout(() => {
          router.push('/explore');
        }, 800);
      } else {
        setErrorMsg(data.error || 'Failed to create account.');
      }
    } catch (err: any) {
      setErrorMsg('Network error occurred during registration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] max-w-7xl mx-auto px-4 lg:px-8 py-10 flex flex-col justify-center">
      
      {/* Title Header */}
      <div className="text-center max-w-2xl mx-auto mb-8 space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Campus Authentication &amp; Identity</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-white tracking-tight">
          Welcome to SkillSwap Campus
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Enter your student credentials or choose a pre-configured demo account to explore skills, smart scheduling, and peer mentorship.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-6xl mx-auto w-full">
        
        {/* ============================================================ */}
        {/* LEFT COLUMN: AUTHENTIC LOGIN & REGISTER FORM */}
        {/* ============================================================ */}
        <div className="lg:col-span-6 w-full">
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl space-y-6 relative overflow-hidden">
            
            {/* Glow ambient background */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-accent-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Mode Switcher Tabs */}
            <div className="flex items-center bg-slate-900/90 p-1 rounded-2xl border border-slate-800 text-xs font-semibold relative z-10">
              <button
                type="button"
                onClick={() => { setMode('LOGIN'); setErrorMsg(null); setSuccessMsg(null); }}
                className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 ${
                  mode === 'LOGIN' 
                    ? 'bg-brand-500 text-dark-bg font-bold shadow-glow-brand' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
              <button
                type="button"
                onClick={() => { setMode('REGISTER'); setErrorMsg(null); setSuccessMsg(null); }}
                className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 ${
                  mode === 'REGISTER' 
                    ? 'bg-brand-500 text-dark-bg font-bold shadow-glow-brand' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Create Account</span>
              </button>
            </div>

            {/* Feedback Alerts */}
            {errorMsg && (
              <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2.5 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* ========================================== */}
            {/* 1. SIGN IN FORM */}
            {/* ========================================== */}
            {mode === 'LOGIN' && (
              <form onSubmit={handleLoginSubmit} className="space-y-4 relative z-10">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Student Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input 
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. alice@campus.edu"
                      className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                      Password
                    </label>
                    <span className="text-[10px] text-slate-400">
                      Default: <code className="text-brand-300 font-mono">Password123!</code>
                    </span>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input 
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input type="checkbox" defaultChecked className="rounded text-brand-500 focus:ring-0" />
                    <span>Keep me logged in</span>
                  </label>
                  <span className="text-[11px] text-brand-400 hover:underline cursor-pointer">
                    Academic Single Sign-On (SSO)
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-brand-500 hover:bg-brand-400 text-dark-bg font-bold text-xs shadow-glow-brand transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
                >
                  {loading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-dark-bg border-t-transparent rounded-full animate-spin" />
                      <span>Authenticating Credentials...</span>
                    </>
                  ) : (
                    <>
                      <span>Log In to Campus</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* ========================================== */}
            {/* 2. REGISTRATION FORM */}
            {/* ========================================== */}
            {mode === 'REGISTER' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5 relative z-10">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input 
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="e.g. Jordan Lee"
                      className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-10 pr-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Campus Student Email (.edu)
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input 
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="e.g. jordan.lee@campus.edu"
                      className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-10 pr-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                      College / Faculty
                    </label>
                    <select
                      value={regCollege}
                      onChange={(e) => setRegCollege(e.target.value)}
                      className="w-full bg-slate-900/90 border border-slate-700 text-slate-200 text-xs rounded-xl px-2.5 py-2 focus:outline-none"
                    >
                      <option value="School of Engineering">School of Engineering</option>
                      <option value="Faculty of Arts & Media">Faculty of Arts & Media</option>
                      <option value="Faculty of Mathematics">Faculty of Mathematics</option>
                      <option value="School of Business">School of Business</option>
                      <option value="Faculty of Sciences">Faculty of Sciences</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                      Major
                    </label>
                    <input 
                      type="text"
                      required
                      value={regMajor}
                      onChange={(e) => setRegMajor(e.target.value)}
                      placeholder="e.g. Computer Science"
                      className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                      Year
                    </label>
                    <select
                      value={regYear}
                      onChange={(e) => setRegYear(e.target.value)}
                      className="w-full bg-slate-900/90 border border-slate-700 text-slate-200 text-xs rounded-xl px-2.5 py-2 focus:outline-none"
                    >
                      <option value="Freshman">Freshman</option>
                      <option value="Sophomore">Sophomore</option>
                      <option value="Junior">Junior</option>
                      <option value="Senior">Senior</option>
                      <option value="Graduate">Graduate</option>
                      <option value="PhD">PhD</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                      Role
                    </label>
                    <select
                      value={regUserType}
                      onChange={(e) => setRegUserType(e.target.value)}
                      className="w-full bg-slate-900/90 border border-slate-700 text-slate-200 text-xs rounded-xl px-2.5 py-2 focus:outline-none"
                    >
                      <option value="TEACHER_LEARNER">Teacher &amp; Learner</option>
                      <option value="TEACHER">Teacher Only</option>
                      <option value="LEARNER">Learner Only</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Password (minimum 8 characters)
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input 
                      type="password"
                      required
                      minLength={8}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-10 pr-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-brand-500/10 border border-brand-500/20 text-[11px] text-brand-300 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 shrink-0 text-brand-400" />
                  <span>New accounts receive 4 Free Skill Credits to start learning immediately.</span>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-brand-500 hover:bg-brand-400 text-dark-bg font-bold text-xs shadow-glow-brand transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? 'Creating Student Account...' : 'Register & Claim 4 Skill Credits'}
                </button>
              </form>
            )}

            <div className="pt-2 border-t border-slate-800/80 text-center text-xs text-slate-400">
              <span>By signing in, you agree to the </span>
              <span className="text-slate-300 hover:text-white underline cursor-pointer">Campus Academic Integrity &amp; Sybil Rules</span>.
            </div>

          </div>
        </div>

        {/* ============================================================ */}
        {/* RIGHT COLUMN: DEMO CREDENTIALS PALETTE */}
        {/* ============================================================ */}
        <div className="lg:col-span-6 w-full space-y-4">
          
          <div className="glass-panel p-5 rounded-3xl border border-brand-500/30 bg-gradient-to-br from-brand-950/20 via-slate-900/90 to-slate-950 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center font-bold">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">Pre-Configured Demo Credentials</h2>
                  <p className="text-[11px] text-slate-400">Click &ldquo;Use Credentials&rdquo; to auto-fill the form with real seed accounts.</p>
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {DEMO_ACCOUNTS.length} Test Personas
              </span>
            </div>
          </div>

          <div className="space-y-2.5 max-h-[580px] overflow-y-auto pr-1">
            {DEMO_ACCOUNTS.map((acc, idx) => {
              const isCurrentSelected = email === acc.email;
              return (
                <div 
                  key={idx}
                  className={`glass-panel p-4 rounded-2xl border transition-all text-xs space-y-2.5 ${
                    isCurrentSelected 
                      ? 'border-brand-500 bg-brand-950/30 shadow-glow-brand ring-1 ring-brand-500' 
                      : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${acc.avatarGradient} flex items-center justify-center text-dark-bg font-extrabold text-xs shadow-md`}>
                        {acc.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-bold text-white text-xs">{acc.name}</h3>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold border ${acc.badgeColor}`}>
                            {acc.badge}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400">{acc.role} • {acc.college}</div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleFillCredentials(acc)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1 ${
                        isCurrentSelected 
                          ? 'bg-brand-500 text-dark-bg shadow-sm' 
                          : 'bg-slate-800 hover:bg-brand-500 hover:text-dark-bg text-slate-200 border border-slate-700'
                      }`}
                    >
                      {isCurrentSelected ? (
                        <>
                          <Check className="w-3 h-3" />
                          <span>Selected</span>
                        </>
                      ) : (
                        <span>Use Credentials</span>
                      )}
                    </button>
                  </div>

                  {/* Credentials Box */}
                  <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 space-y-1 text-[11px] font-mono">
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-500">Email:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-brand-300">{acc.email}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(acc.email, `email-${idx}`)}
                          className="text-slate-500 hover:text-white p-0.5"
                          title="Copy email"
                        >
                          {copiedKey === `email-${idx}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-500">Password:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-200">{acc.password}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(acc.password, `pass-${idx}`)}
                          className="text-slate-500 hover:text-white p-0.5"
                          title="Copy password"
                        >
                          {copiedKey === `pass-${idx}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>Expertise: <strong className="text-slate-300 font-normal">{acc.skills}</strong></span>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

      </div>

    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-xs text-slate-400">Loading campus authentication...</div>}>
      <LoginComponent />
    </Suspense>
  );
}
