'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { 
  Sparkles, 
  BookOpen, 
  GraduationCap, 
  Users, 
  Building2, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

export default function OnboardingPage() {
  const router = useRouter();
  const { user, refreshUser, loading: authLoading } = useAuth();

  const [userType, setUserType] = useState<'LEARNER' | 'TEACHER' | 'TEACHER_LEARNER'>('TEACHER_LEARNER');
  const [college, setCollege] = useState('Stanford University');
  const [major, setMajor] = useState('Computer Science');
  const [year, setYear] = useState<'Freshman' | 'Sophomore' | 'Junior' | 'Senior' | 'Graduate' | 'PhD'>('Sophomore');
  const [teachingPreference, setTeachingPreference] = useState<'Anyone' | 'Women' | 'Men'>('Anyone');
  const [bio, setBio] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      if (user.college) setCollege(user.college);
      if (user.major) setMajor(user.major);
      if (user.year && ['Freshman', 'Sophomore', 'Junior', 'Senior', 'Graduate', 'PhD'].includes(user.year)) {
        setYear(user.year as any);
      }
      if (user.user_type && ['LEARNER', 'TEACHER', 'TEACHER_LEARNER'].includes(user.user_type)) {
        setUserType(user.user_type as any);
      }
    }
  }, [user]);

  const handleCompleteOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userType,
          college: college.trim() || 'SkillSwap Campus',
          major: major.trim() || 'General Studies',
          year,
          teachingPreference,
          bio: bio.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to save onboarding preferences.');
        setSaving(false);
        return;
      }

      await refreshUser();
      router.push('/profile');
    } catch (err: any) {
      setError('A network error occurred. Please try again.');
      setSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center text-xs text-slate-400">
        Loading campus onboarding...
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
      
      {/* Top Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Step 2: Campus Onboarding</span>
        </div>
        <h1 className="text-3xl font-display font-extrabold text-white tracking-tight">
          What would you like to do on SkillSwap?
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
          Choose your initial platform capabilities. You can update this anytime in your settings.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-3">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
          <div className="flex-1">{error}</div>
        </div>
      )}

      <form onSubmit={handleCompleteOnboarding} className="space-y-8">
        
        {/* 3 Capability Choices */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* 1. LEARN ONLY */}
          <div 
            onClick={() => setUserType('LEARNER')}
            className={`cursor-pointer p-5 rounded-3xl border transition-all flex flex-col justify-between space-y-4 ${
              userType === 'LEARNER' 
                ? 'bg-brand-500/10 border-brand-500 shadow-glow-brand' 
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-brand-500/20 text-brand-400 flex items-center justify-center font-bold">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Learn Skills</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Book 1-on-1 sessions with verified mentors, use Smart Slots, and spend starter credits.
                </p>
              </div>
            </div>
            {userType === 'LEARNER' && (
              <span className="text-[11px] text-brand-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Selected
              </span>
            )}
          </div>

          {/* 2. TEACH ONLY */}
          <div 
            onClick={() => setUserType('TEACHER')}
            className={`cursor-pointer p-5 rounded-3xl border transition-all flex flex-col justify-between space-y-4 ${
              userType === 'TEACHER' 
                ? 'bg-sky-500/10 border-sky-500 shadow-glow-accent' 
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Teach Skills</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Offer mentoring sessions, verify skills with assessments, and earn Skill Credits.
                </p>
              </div>
            </div>
            {userType === 'TEACHER' && (
              <span className="text-[11px] text-sky-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Selected
              </span>
            )}
          </div>

          {/* 3. BOTH TEACH + LEARN */}
          <div 
            onClick={() => setUserType('TEACHER_LEARNER')}
            className={`cursor-pointer p-5 rounded-3xl border transition-all flex flex-col justify-between space-y-4 relative ${
              userType === 'TEACHER_LEARNER' 
                ? 'bg-gradient-to-b from-brand-500/15 via-slate-900 to-slate-950 border-brand-500 shadow-glow-brand' 
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-500 to-accent-500 text-dark-bg flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-white text-sm">Teach &amp; Learn</h3>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-brand-500 text-dark-bg font-extrabold uppercase">Popular</span>
                </div>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Full peer barter experience. Teach what you know, earn credits, and learn new skills.
                </p>
              </div>
            </div>
            {userType === 'TEACHER_LEARNER' && (
              <span className="text-[11px] text-brand-300 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Selected
              </span>
            )}
          </div>

        </div>

        {/* Profile Details Container */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-5">
          <h3 className="text-sm font-bold text-white">Campus Information</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* College */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">College / University</label>
              <input 
                type="text"
                required
                value={college}
                onChange={(e) => setCollege(e.target.value)}
                placeholder="E.g. Stanford University"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />
            </div>

            {/* Major */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Major / Department</label>
              <input 
                type="text"
                required
                value={major}
                onChange={(e) => setMajor(e.target.value)}
                placeholder="E.g. Computer Science & AI"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />
            </div>

            {/* Year of Study */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Year of Study</label>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-500"
              >
                <option value="Freshman">Freshman</option>
                <option value="Sophomore">Sophomore</option>
                <option value="Junior">Junior</option>
                <option value="Senior">Senior</option>
                <option value="Graduate">Graduate</option>
                <option value="PhD">PhD</option>
              </select>
            </div>

            {/* Teaching Preference */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Teaching Preference</label>
              <select
                value={teachingPreference}
                onChange={(e) => setTeachingPreference(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-500"
              >
                <option value="Anyone">Anyone (Default)</option>
                <option value="Women">Women</option>
                <option value="Men">Men</option>
              </select>
            </div>

          </div>

          {/* Short Bio */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Short Bio (Optional)</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={2}
              placeholder="Tell your peers a bit about your interests, skills, or what you want to learn..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={saving}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-400 hover:to-brand-500 text-dark-bg font-extrabold text-xs shadow-glow-brand transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <span>Saving Profile...</span>
            ) : (
              <>
                <span>Complete Setup &amp; Enter Campus</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

        </div>

      </form>

    </div>
  );
}
