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
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  ShieldCheck, 
  KeyRound,
  BookOpen,
  Users
} from 'lucide-react';

function LoginComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, refreshUser } = useAuth();

  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>(() => {
    return searchParams.get('tab') === 'register' ? 'REGISTER' : 'LOGIN';
  });

  // Login Form States (Initially empty per requirements)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<'ANY' | 'STUDENT' | 'TEACHER' | 'TEACHER_LEARNER'>('ANY');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [roleMismatchNotice, setRoleMismatchNotice] = useState<{
    actualType: string;
    message: string;
  } | null>(null);

  // Register Form States
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regCollege, setRegCollege] = useState('School of Engineering');
  const [regMajor, setRegMajor] = useState('Computer Science');
  const [regYear, setRegYear] = useState('Junior');
  const [regUserType, setRegUserType] = useState('TEACHER_LEARNER');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Handle Login Submission
  const handleLoginSubmit = async (e: React.FormEvent, forceContinueAsActual = false) => {
    if (e) e.preventDefault();
    
    if (!email.trim() || !password) {
      setErrorMsg('Please enter both your student email and password.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setRoleMismatchNotice(null);

    try {
      const success = await login(email.trim().toLowerCase(), password);
      if (success) {
        // Fetch current user details to verify role
        const meRes = await fetch('/api/auth/me');
        if (meRes.ok) {
          const meData = await meRes.json();
          const userType = meData.user?.user_type || 'TEACHER_LEARNER';
          const userRole = meData.user?.role || 'STUDENT';

          // Admin redirect
          if (userRole === 'ADMIN' || userRole === 'MODERATOR') {
            router.push('/admin');
            return;
          }

          // Check role intention if user selected a specific role and not forcing
          if (!forceContinueAsActual && selectedRole !== 'ANY') {
            if (selectedRole === 'TEACHER' && userType === 'LEARNER') {
              setRoleMismatchNotice({
                actualType: 'Student',
                message: 'This account is registered as a Student only.',
              });
              setLoading(false);
              return;
            }
            if (selectedRole === 'STUDENT' && userType === 'TEACHER') {
              setRoleMismatchNotice({
                actualType: 'Mentor',
                message: 'This account is registered as a Mentor only.',
              });
              setLoading(false);
              return;
            }
          }

          // Successful login redirection
          const redirectUrl = searchParams.get('redirect') || (userType === 'TEACHER' ? '/explore' : '/explore');
          router.push(redirectUrl);
        } else {
          router.push('/explore');
        }
      } else {
        setErrorMsg('Invalid email or password. Please check your credentials.');
      }
    } catch (err: any) {
      setErrorMsg('An unexpected network error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Register Submission (Public registration strictly creates STUDENT role with selected userType)
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
          displayName: regName.trim(),
          email: regEmail.trim().toLowerCase(),
          password: regPassword,
          college: regCollege,
          major: regMajor.trim(),
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
        setErrorMsg(data.error || 'Failed to create student account.');
      }
    } catch (err: any) {
      setErrorMsg('Network error occurred during registration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] max-w-7xl mx-auto px-4 lg:px-8 py-12 flex flex-col justify-center items-center">
      
      {/* Title Header */}
      <div className="text-center max-w-lg mx-auto mb-8 space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>SkillSwap Campus Peer Network</span>
        </div>
        <h1 className="text-3xl font-display font-extrabold text-white tracking-tight">
          Welcome to SkillSwap
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Sign in with your campus student account to discover peer mentors, exchange skills, and schedule 1-on-1 sessions.
        </p>
      </div>

      {/* Main Clean Authentication Box */}
      <div className="w-full max-w-md">
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl space-y-6 relative overflow-hidden bg-slate-900/80">
          
          {/* Ambient Glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-accent-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Mode Tabs */}
          <div className="flex items-center bg-slate-950/80 p-1 rounded-2xl border border-slate-800 text-xs font-semibold relative z-10">
            <button
              type="button"
              onClick={() => { setMode('LOGIN'); setErrorMsg(null); setSuccessMsg(null); setRoleMismatchNotice(null); }}
              className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 ${
                mode === 'LOGIN' 
                  ? 'bg-brand-500 text-dark-bg font-bold shadow-glow-brand' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Log In</span>
            </button>
            <button
              type="button"
              onClick={() => { setMode('REGISTER'); setErrorMsg(null); setSuccessMsg(null); setRoleMismatchNotice(null); }}
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

          {/* Role Mismatch Modal / Banner (Requirement 22) */}
          {roleMismatchNotice && (
            <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs space-y-3 animate-in fade-in">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                <div>
                  <div className="font-bold text-white">{roleMismatchNotice.message}</div>
                  <p className="text-[11px] text-amber-300/90 mt-0.5">
                    You can continue logging in under your active role, or upgrade your profile at any time.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={(e) => handleLoginSubmit(e, true)}
                  className="flex-1 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-dark-bg font-bold text-xs transition-colors"
                >
                  Continue as {roleMismatchNotice.actualType}
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/profile')}
                  className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors border border-slate-700"
                >
                  Upgrade to Mentor + Student
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* 1. CLEAN LOGIN FORM */}
          {/* ============================================================ */}
          {mode === 'LOGIN' && (
            <form onSubmit={(e) => handleLoginSubmit(e)} className="space-y-4 relative z-10">
              
              {/* Role Intention Selector */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  I am logging in as:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedRole('STUDENT')}
                    className={`py-2 px-2 rounded-xl text-[11px] font-semibold transition-all border text-center flex flex-col items-center gap-1 ${
                      selectedRole === 'STUDENT'
                        ? 'bg-brand-500/20 text-brand-300 border-brand-500 shadow-sm'
                        : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Student</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedRole('TEACHER')}
                    className={`py-2 px-2 rounded-xl text-[11px] font-semibold transition-all border text-center flex flex-col items-center gap-1 ${
                      selectedRole === 'TEACHER'
                        ? 'bg-brand-500/20 text-brand-300 border-brand-500 shadow-sm'
                        : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <GraduationCap className="w-3.5 h-3.5" />
                    <span>Mentor</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedRole('TEACHER_LEARNER')}
                    className={`py-2 px-2 rounded-xl text-[11px] font-semibold transition-all border text-center flex flex-col items-center gap-1 ${
                      selectedRole === 'TEACHER_LEARNER'
                        ? 'bg-brand-500/20 text-brand-300 border-brand-500 shadow-sm'
                        : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Both</span>
                  </button>
                </div>
              </div>

              {/* Email Field */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Campus Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input 
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. name@campus.edu"
                    className="w-full bg-slate-950/90 border border-slate-700/80 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                    Password
                  </label>
                  <span className="text-[11px] text-slate-400 hover:text-white cursor-pointer">
                    Forgot Password?
                  </span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input 
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-slate-950/90 border border-slate-700/80 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors font-mono"
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

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-brand-500 hover:bg-brand-400 text-dark-bg font-bold text-xs shadow-glow-brand transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-3"
              >
                {loading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-dark-bg border-t-transparent rounded-full animate-spin" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <span>Log In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="pt-2 text-center text-xs text-slate-400">
                <span>Don&rsquo;t have an account yet? </span>
                <button
                  type="button"
                  onClick={() => { setMode('REGISTER'); setErrorMsg(null); }}
                  className="text-brand-400 hover:underline font-semibold"
                >
                  Create Account
                </button>
              </div>

            </form>
          )}

          {/* ============================================================ */}
          {/* 2. REGISTRATION FORM */}
          {/* ============================================================ */}
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
                    className="w-full bg-slate-950/90 border border-slate-700/80 rounded-xl pl-10 pr-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
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
                    className="w-full bg-slate-950/90 border border-slate-700/80 rounded-xl pl-10 pr-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Faculty / College
                  </label>
                  <select
                    value={regCollege}
                    onChange={(e) => setRegCollege(e.target.value)}
                    className="w-full bg-slate-950/90 border border-slate-700 text-slate-200 text-xs rounded-xl px-2.5 py-2 focus:outline-none"
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
                    className="w-full bg-slate-950/90 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Academic Year
                  </label>
                  <select
                    value={regYear}
                    onChange={(e) => setRegYear(e.target.value)}
                    className="w-full bg-slate-950/90 border border-slate-700 text-slate-200 text-xs rounded-xl px-2.5 py-2 focus:outline-none"
                  >
                    <option value="Freshman">Freshman</option>
                    <option value="Sophomore">Sophomore</option>
                    <option value="Junior">Junior</option>
                    <option value="Senior">Senior</option>
                    <option value="Graduate">Graduate</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Participation Role
                  </label>
                  <select
                    value={regUserType}
                    onChange={(e) => setRegUserType(e.target.value)}
                    className="w-full bg-slate-950/90 border border-slate-700 text-slate-200 text-xs rounded-xl px-2.5 py-2 focus:outline-none"
                  >
                    <option value="TEACHER_LEARNER">Mentor + Student</option>
                    <option value="TEACHER">Mentor Only</option>
                    <option value="LEARNER">Student Only</option>
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
                    className="w-full bg-slate-950/90 border border-slate-700/80 rounded-xl pl-10 pr-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 font-mono"
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

              <div className="pt-2 text-center text-xs text-slate-400">
                <span>Already registered? </span>
                <button
                  type="button"
                  onClick={() => { setMode('LOGIN'); setErrorMsg(null); }}
                  className="text-brand-400 hover:underline font-semibold"
                >
                  Log In
                </button>
              </div>

            </form>
          )}

          <div className="pt-2 border-t border-slate-800/80 text-center text-[11px] text-slate-500">
            <span>SkillSwap Campus • Academic Honor &amp; Sybil-Protected Network</span>
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
