'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { 
  Mail, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  RefreshCw, 
  ShieldCheck, 
  Sparkles,
  GraduationCap,
  ExternalLink,
  Zap,
  Copy,
  Check
} from 'lucide-react';

function VerifyEmailComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, refreshUser } = useAuth();

  const tokenParam = searchParams.get('token');

  const [status, setStatus] = useState<'IDLE' | 'VERIFYING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [message, setMessage] = useState<string>('');
  const [resending, setResending] = useState(false);
  const [verifyingInstant, setVerifyingInstant] = useState(false);
  const [activeToken, setActiveToken] = useState<string | null>(null);
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Automatically verify if token param is present
  useEffect(() => {
    if (tokenParam) {
      handleVerifyToken(tokenParam);
    } else if (user?.email_verified) {
      setStatus('SUCCESS');
      setMessage('Your email address is already verified.');
    }
  }, [tokenParam, user]);

  const handleVerifyToken = async (token: string) => {
    setStatus('VERIFYING');
    setMessage('Verifying your email token...');

    try {
      const res = await fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`);
      const data = await res.json();

      if (res.ok && data.success) {
        setStatus('SUCCESS');
        setMessage(data.message || 'Email verified successfully!');
        await refreshUser();
      } else {
        setStatus('ERROR');
        setMessage(data.error || 'Failed to verify email token. The link may have expired or is invalid.');
      }
    } catch (err) {
      setStatus('ERROR');
      setMessage('A network error occurred while verifying your email.');
    }
  };

  const handleInstantVerify = async () => {
    setVerifyingInstant(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'INSTANT_VERIFY' }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setStatus('SUCCESS');
        setMessage('Email verified successfully! You can now proceed to onboarding.');
        await refreshUser();
      } else {
        setStatus('ERROR');
        setMessage(data.error || 'Instant verification failed.');
      }
    } catch (err) {
      setStatus('ERROR');
      setMessage('Network error during instant verification.');
    } finally {
      setVerifyingInstant(false);
    }
  };

  const [error, setError] = useState<string | null>(null);

  const handleResend = async () => {
    setResending(true);
    setResendStatus(null);

    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'RESEND' }),
      });
      const data = await res.json();

      if (res.ok) {
        setResendStatus('A new verification email invitation has been dispatched.');
        if (data.verificationToken) {
          setActiveToken(data.verificationToken);
        }
      } else {
        setResendStatus(data.error || 'Failed to resend verification email.');
      }
    } catch (err) {
      setResendStatus('Network error while resending verification email.');
    } finally {
      setResending(false);
    }
  };

  const copyLink = (token: string) => {
    const url = `${window.location.origin}/verify-email?token=${token}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] max-w-lg mx-auto px-4 py-12 flex flex-col justify-center">
      
      {/* Header */}
      <div className="text-center mb-8 space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>SkillSwap Verification</span>
        </div>
        <h1 className="text-3xl font-display font-extrabold text-white tracking-tight">
          Verify Your Email
        </h1>
        <p className="text-xs text-slate-400">
          Confirm your email address to access your campus peer network and capabilities.
        </p>
      </div>

      {/* Main Card */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl space-y-6 text-center">
        
        {/* Verification Status Icon */}
        <div className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto border transition-all">
          {status === 'SUCCESS' || user?.email_verified ? (
            <div className="w-full h-full rounded-3xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-glow-brand">
              <CheckCircle2 className="w-8 h-8" />
            </div>
          ) : status === 'ERROR' ? (
            <div className="w-full h-full rounded-3xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
              <AlertCircle className="w-8 h-8" />
            </div>
          ) : status === 'VERIFYING' || verifyingInstant ? (
            <div className="w-full h-full rounded-3xl bg-brand-500/20 text-brand-400 border border-brand-500/30 flex items-center justify-center">
              <RefreshCw className="w-8 h-8 animate-spin" />
            </div>
          ) : (
            <div className="w-full h-full rounded-3xl bg-slate-900 text-brand-400 border border-slate-700 flex items-center justify-center">
              <Mail className="w-8 h-8" />
            </div>
          )}
        </div>

        {/* Status Message */}
        <div className="space-y-2">
          <h2 className="text-lg font-bold text-white">
            {status === 'SUCCESS' || user?.email_verified
              ? 'Email Verified Successfully!'
              : status === 'ERROR'
              ? 'Verification Failed'
              : status === 'VERIFYING' || verifyingInstant
              ? 'Verifying Token...'
              : 'Verification Invitation Link Ready'}
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
            {message || (user?.email ? (
              <>We've dispatched a verification link for <strong className="text-white">{user.email}</strong>. Use the direct link or instant button below to complete verification.</>
            ) : (
              'Click the button below to verify your email address.'
            ))}
          </p>
        </div>

        {/* Simulated Inbox / Direct Link Box when token is available */}
        {activeToken && status !== 'SUCCESS' && !user?.email_verified && (
          <div className="p-4 rounded-2xl bg-brand-500/10 border border-brand-500/30 text-left space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-brand-400 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" /> Simulated Email Link Generated
              </span>
              <button 
                onClick={() => copyLink(activeToken)}
                className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 bg-slate-800/80 px-2 py-0.5 rounded-lg border border-slate-700"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy Link'}</span>
              </button>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950 font-mono text-[11px] text-slate-300 break-all border border-slate-800">
              /verify-email?token={activeToken}
            </div>
            <button
              onClick={() => handleVerifyToken(activeToken)}
              className="w-full py-2 rounded-xl bg-brand-500 hover:bg-brand-400 text-dark-bg font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-glow-brand"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Apply Verification Link Now</span>
            </button>
          </div>
        )}

        {/* Academic Domain Badge & Verification Notice */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs text-left space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-semibold">Email Status:</span>
            {status === 'SUCCESS' || user?.email_verified ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Verified
              </span>
            ) : (
              <span className="text-amber-400 font-bold">Pending Confirmation</span>
            )}
          </div>

          {user?.is_academic_email && (
            <div className="flex items-center justify-between border-t border-slate-800/60 pt-2">
              <span className="text-slate-400 font-semibold">Academic Domain:</span>
              <span className="text-sky-300 font-semibold flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5" /> Academic Email Detected
              </span>
            </div>
          )}

          <div className="flex items-center justify-between border-t border-slate-800/60 pt-2 text-[11px] text-slate-400">
            <span>Campus Account:</span>
            <span className="text-slate-300">{user?.email || 'Logged In'}</span>
          </div>
        </div>

        {resendStatus && (
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200">
            {resendStatus}
          </div>
        )}

        {/* Action Controls */}
        <div className="space-y-3 pt-2">
          {status === 'SUCCESS' || user?.email_verified ? (
            <button
              onClick={() => router.push('/onboarding')}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-400 hover:to-brand-500 text-dark-bg font-extrabold text-xs shadow-glow-brand transition-all flex items-center justify-center gap-2"
            >
              <span>Continue to Onboarding</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <div className="space-y-2">
              <button
                onClick={handleInstantVerify}
                disabled={verifyingInstant}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-400 hover:to-brand-500 text-dark-bg font-extrabold text-xs shadow-glow-brand transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Zap className="w-4 h-4" />
                <span>{verifyingInstant ? 'Verifying...' : '⚡ Verify Email Instantly'}</span>
              </button>

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={handleResend}
                  disabled={resending}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
                  <span>{resending ? 'Sending...' : 'Get New Invitation Link'}</span>
                </button>
                
                <button
                  onClick={() => router.push('/onboarding')}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold text-xs border border-slate-800 transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>Skip to Onboarding</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          <div className="text-[11px] text-slate-500">
            Need help? <Link href="/explore" className="text-slate-400 hover:underline">Explore Skills as Guest</Link>
          </div>
        </div>

      </div>

    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <VerifyEmailComponent />
    </Suspense>
  );
}
