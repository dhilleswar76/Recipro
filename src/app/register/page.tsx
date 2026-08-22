'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Sparkles, 
  BookOpen, 
  GraduationCap, 
  Users, 
  ArrowRight, 
  ShieldCheck, 
  Coins, 
  CheckCircle2 
} from 'lucide-react';

export default function RegisterLandingPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] max-w-7xl mx-auto px-4 lg:px-8 py-12 flex flex-col justify-center items-center">
      
      {/* Header */}
      <div className="text-center max-w-xl mx-auto mb-10 space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Join SkillSwap Campus</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-white tracking-tight">
          Create Your Campus Account
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          How do you want to participate in the student skill-sharing economy?
        </p>
      </div>

      {/* 3 Role Choice Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full">
        
        {/* 1. STUDENT ONLY */}
        <Link 
          href="/register/student"
          className="group glass-panel p-6 rounded-3xl border border-slate-800 hover:border-brand-500/60 bg-slate-900/60 hover:bg-slate-900 transition-all flex flex-col justify-between space-y-6 hover:shadow-glow-brand"
        >
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-500/20 text-brand-400 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
              <BookOpen className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <div className="text-xs font-bold text-brand-400 uppercase tracking-wider">Learner Path</div>
              <h2 className="text-xl font-bold text-white group-hover:text-brand-300 transition-colors">
                I Want to Learn
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Find verified peer mentors, use Smart Slot scheduling, and learn topics from Python to Calculus using your starter credits.
              </p>
            </div>

            <ul className="space-y-2 text-xs text-slate-300 pt-2 border-t border-slate-800">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                <span>4 Starter Skill Credits included</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                <span>1-on-1 peer mentor bookings</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                <span>AI Study Coach &amp; roadmaps</span>
              </li>
            </ul>
          </div>

          <div className="w-full py-3 rounded-xl bg-slate-800 group-hover:bg-brand-500 group-hover:text-dark-bg text-white font-bold text-xs transition-all flex items-center justify-center gap-2">
            <span>Register as Student</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* 2. MENTOR ONLY */}
        <Link 
          href="/register/mentor"
          className="group glass-panel p-6 rounded-3xl border border-slate-800 hover:border-sky-500/60 bg-slate-900/60 hover:bg-slate-900 transition-all flex flex-col justify-between space-y-6 hover:shadow-glow-accent"
        >
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <div className="text-xs font-bold text-sky-400 uppercase tracking-wider">Teacher Path</div>
              <h2 className="text-xl font-bold text-white group-hover:text-sky-300 transition-colors">
                I Want to Teach
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Share your skills with classmates, get verified through skill assessments, set your availability, and earn zero-fee Skill Credits.
              </p>
            </div>

            <ul className="space-y-2 text-xs text-slate-300 pt-2 border-t border-slate-800">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span>Earn 1 credit per teaching hour</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span>Python &amp; Skill Assessments</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span>Verifiable on-chain badges</span>
              </li>
            </ul>
          </div>

          <div className="w-full py-3 rounded-xl bg-slate-800 group-hover:bg-sky-500 group-hover:text-dark-bg text-white font-bold text-xs transition-all flex items-center justify-center gap-2">
            <span>Register as Mentor</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* 3. MENTOR + STUDENT */}
        <Link 
          href="/register/mentor-student"
          className="group glass-panel p-6 rounded-3xl border border-brand-500/40 bg-gradient-to-b from-brand-950/20 via-slate-900 to-slate-950 hover:border-brand-500 transition-all flex flex-col justify-between space-y-6 shadow-xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 bg-brand-500 text-dark-bg text-[10px] font-extrabold px-3 py-1 rounded-bl-xl uppercase tracking-wider">
            Recommended
          </div>

          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-500 to-accent-500 text-dark-bg flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <div className="text-xs font-bold text-brand-300 uppercase tracking-wider">Full Experience</div>
              <h2 className="text-xl font-bold text-white group-hover:text-brand-300 transition-colors">
                Teach &amp; Learn
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                The full peer-barter experience. Teach what you already know to earn credits, and spend them mastering new subjects.
              </p>
            </div>

            <ul className="space-y-2 text-xs text-slate-200 pt-2 border-t border-slate-800">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                <span>Earn credits &amp; spend credits</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                <span>Multi-person barter cycles (Mode C)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                <span>4 Starter Credits upon signup</span>
              </li>
            </ul>
          </div>

          <div className="w-full py-3 rounded-xl bg-brand-500 text-dark-bg font-bold text-xs shadow-glow-brand transition-all flex items-center justify-center gap-2">
            <span>Register as Mentor + Student</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

      </div>

      {/* Footer Navigation */}
      <div className="mt-10 text-center text-xs text-slate-400">
        <span>Already have a campus account? </span>
        <Link href="/login" className="text-brand-400 hover:underline font-semibold">
          Log In here
        </Link>
      </div>

    </div>
  );
}
