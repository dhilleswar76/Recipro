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
  GraduationCap, 
  BookOpen, 
  Users, 
  AlertCircle, 
  ArrowRight, 
  CheckCircle2 
} from 'lucide-react';

function LoginComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  // Login Form States (Initially empty per specifications)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<'ANY' | 'STUDENT' | 'TEACHER' | 'TEACHER_LEARNER'>('ANY');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [roleMismatchNotice, setRoleMismatchNotice] = useState<{
    actualType: string;
    intendedRole: string;
    message: string;
  } | null>(null);

  // Handle Login Submission
  const handleLoginSubmit = async (e: React.FormEvent, forceContinueAsActual = false) => {
    if (e) e.preventDefault();
    
    if (!email.trim() || !password) {
      setErrorMsg('Please enter both your campus email and password.');
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

          // Admin / Moderator redirect
          if (userRole === 'ADMIN' || userRole === 'MODERATOR') {
            router.push('/admin');
            return;
          }

          // Role intention validation
          if (!forceContinueAsActual && selectedRole !== 'ANY') {
            if (selectedRole === 'TEACHER' && userType === 'LEARNER') {
              setRoleMismatchNotice({
                actualType: 'Student',
                intendedRole: 'Mentor',
                message: 'This account is registered as a Student only.',
              });
              setLoading(false);
              return;
            }
            if (selectedRole === 'STUDENT' && userType === 'TEACHER') {
              setRoleMismatchNotice({
                actualType: 'Mentor',
                intendedRole: 'Student',
                message: 'This account is registered as a Mentor only.',
              });
              setLoading(false);
              return;
            }
          }

          // Successful login redirection
          const redirectUrl = searchParams.get('redirect') || '/profile';
          router.push(redirectUrl);
        } else {
          router.push('/profile');
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

  // Handle Role Upgrade
  const handleUpgradeToBoth = async () => {
    setUpgrading(true);
    try {
      const res = await fetch('/api/auth/upgrade', { method: 'POST' });
      if (res.ok) {
        router.push('/profile');
      } else {
        router.push('/profile');
      }
    } catch (err) {
      router.push('/profile');
    } finally {
      setUpgrading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] max-w-lg mx-auto px-4 py-12 flex flex-col justify-center">
      
      {/* Header */}
      <div className="text-center mb-8 space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>SkillSwap Campus</span>
        </div>
        <h1 className="text-3xl font-display font-extrabold text-white tracking-tight">
          Welcome Back
        </h1>
        <p className="text-xs text-slate-400">
          Sign in to access your skills, scheduled sessions, and campus peer network.
        </p>
      </div>

      {/* Main Login Card */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl space-y-6">
        
        {/* Error Alert */}
        {errorMsg && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-3 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <div className="flex-1">{errorMsg}</div>
          </div>
        )}

        {/* Role Mismatch Notice Modal/Card */}
        {roleMismatchNotice && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center gap-2 font-bold text-amber-300">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Role Mismatch Detected</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              {roleMismatchNotice.message} You selected <strong className="text-white">{roleMismatchNotice.intendedRole}</strong> during login.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <button
                type="button"
                onClick={(e) => handleLoginSubmit(e, true)}
                className="flex-1 py-2 px-3 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 font-semibold text-xs border border-amber-500/40 transition-colors"
              >
                Continue as {roleMismatchNotice.actualType}
              </button>
              <button
                type="button"
                disabled={upgrading}
                onClick={handleUpgradeToBoth}
                className="flex-1 py-2 px-3 rounded-lg bg-brand-500 hover:bg-brand-400 text-dark-bg font-bold text-xs transition-colors"
              >
                {upgrading ? 'Upgrading...' : 'Upgrade to Mentor + Student'}
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleLoginSubmit} className="space-y-4">
          
          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Campus Email</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@campus.edu"
                className="w-full bg-slate-900/80 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300">Password</label>
              <span className="text-[11px] text-slate-400 hover:text-slate-300 cursor-pointer">
                Forgot password?
              </span>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <input 
                type={showPassword ? 'text' : 'password'} 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-900/80 border border-slate-700 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 p-0.5"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Role Intention Radio Selector */}
          <div className="pt-2">
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              I am logging in as:
            </label>
            <div className="grid grid-cols-3 gap-2 p-1 rounded-xl bg-slate-950/80 border border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedRole('STUDENT')}
                className={`py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  selectedRole === 'STUDENT' 
                    ? 'bg-brand-500 text-dark-bg font-bold shadow-sm' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Student</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedRole('TEACHER')}
                className={`py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  selectedRole === 'TEACHER' 
                    ? 'bg-sky-500 text-dark-bg font-bold shadow-sm' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Mentor</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedRole('TEACHER_LEARNER')}
                className={`py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  selectedRole === 'TEACHER_LEARNER' 
                    ? 'bg-gradient-to-r from-brand-500 to-accent-500 text-dark-bg font-bold shadow-sm' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Both</span>
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-400 hover:to-brand-500 text-dark-bg font-extrabold text-xs tracking-wide shadow-glow-brand transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-3 h-3 border-2 border-dark-bg border-t-transparent rounded-full animate-spin" />
                Signing In...
              </span>
            ) : (
              <>
                <span>Log In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Create Account Link (Separate Registration Page) */}
        <div className="pt-4 border-t border-slate-800 text-center text-xs text-slate-400">
          <span>Don't have an account? </span>
          <Link href="/register" className="text-brand-400 hover:underline font-semibold">
            Create Account
          </Link>
        </div>

      </div>

    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginComponent />
    </Suspense>
  );
}
