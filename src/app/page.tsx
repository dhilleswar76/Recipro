'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Sparkles, 
  Search, 
  ShieldCheck, 
  Coins, 
  Award, 
  Brain, 
  ArrowRight, 
  CheckCircle2, 
  Repeat, 
  Zap, 
  Users, 
  GraduationCap 
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function LandingPage() {
  const { user } = useAuth();
  const [quickSearch, setQuickSearch] = useState('');

  return (
    <div className="relative overflow-hidden">
      
      {/* Background Decorative Gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-500/10 blur-[120px] rounded-full pointer-events-none -z-10" />
      <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-accent-500/10 blur-[100px] rounded-full pointer-events-none -z-10" />

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 lg:px-8 pt-16 pb-20 text-center">
        
        {/* Campus Live Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/80 text-xs font-semibold text-brand-300 shadow-glass mb-8 animate-float">
          <span className="w-2 h-2 rounded-full bg-brand-400 animate-ping" />
          <span>Campus Peer-Learning Network Active</span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-300">100% Free Skill Credits Barter</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-display font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.1]">
          Students exchange <br />
          <span className="bg-gradient-to-r from-brand-400 via-emerald-300 to-accent-400 bg-clip-text text-transparent">
            skills instead of money.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Teach what you know to earn Skill Credits, then spend them learning what you need. 
          Deterministic identity lookup, hybrid ML matching, and verifiable on-chain credentials.
        </p>

        {/* Quick Search Bar */}
        <div className="mt-10 max-w-xl mx-auto">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              window.location.href = `/explore?q=${encodeURIComponent(quickSearch)}`;
            }}
            className="flex items-center gap-2 p-2 rounded-2xl glass-panel border border-slate-700 shadow-2xl focus-within:border-brand-500 transition-colors"
          >
            <div className="pl-3 text-slate-400">
              <Search className="w-5 h-5" />
            </div>
            <input 
              type="text" 
              value={quickSearch}
              onChange={(e) => setQuickSearch(e.target.value)}
              placeholder="Search mentor ('Rahul') or skill ('Python', 'Solidity', 'Figma')..."
              className="flex-1 bg-transparent border-none text-sm text-white placeholder-slate-400 focus:outline-none px-2"
            />
            <button 
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-400 hover:to-brand-500 text-dark-bg font-bold text-xs tracking-wide shadow-glow-brand transition-all flex items-center gap-1.5"
            >
              Explore <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Quick tags */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-3 text-xs text-slate-400">
            <span>Try searching:</span>
            {['Rahul (Mode A)', 'Python', 'Solidity', 'UI/UX Design', 'Calculus'].map(tag => (
              <Link 
                key={tag} 
                href={`/explore?q=${encodeURIComponent(tag.split(' ')[0])}`}
                className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
              >
                {tag}
              </Link>
            ))}
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 mt-10">
          <Link 
            href="/explore" 
            className="px-6 py-3 rounded-xl bg-brand-500 hover:bg-brand-400 text-dark-bg font-bold text-sm shadow-glow-brand transition-all flex items-center gap-2"
          >
            <Zap className="w-4 h-4" /> Start Learning Now
          </Link>
          <Link 
            href="/study-coach" 
            className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm border border-slate-700 transition-colors flex items-center gap-2"
          >
            <Brain className="w-4 h-4 text-accent-400" /> AI Study Coach
          </Link>
        </div>

        {/* Live Campus Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mt-16 text-left">
          <div className="glass-panel p-5 rounded-2xl border border-slate-800">
            <div className="text-xs text-slate-400 font-medium">Starter Credits</div>
            <div className="text-2xl font-bold font-display text-brand-400 mt-1">3 Credits</div>
            <div className="text-[11px] text-slate-500 mt-1">Granted upon campus registration</div>
          </div>
          <div className="glass-panel p-5 rounded-2xl border border-slate-800">
            <div className="text-xs text-slate-400 font-medium">Exchange Rule</div>
            <div className="text-2xl font-bold font-display text-white mt-1">1h = 1 Credit</div>
            <div className="text-[11px] text-slate-500 mt-1">Held safely in escrow until completion</div>
          </div>
          <div className="glass-panel p-5 rounded-2xl border border-slate-800">
            <div className="text-xs text-slate-400 font-medium">Discovery Modes</div>
            <div className="text-2xl font-bold font-display text-accent-400 mt-1">3 Modes</div>
            <div className="text-[11px] text-slate-500 mt-1">Known person, ML match & cycle barter</div>
          </div>
          <div className="glass-panel p-5 rounded-2xl border border-slate-800">
            <div className="text-xs text-slate-400 font-medium">Verifiable Trust</div>
            <div className="text-2xl font-bold font-display text-amber-400 mt-1">On-Chain</div>
            <div className="text-[11px] text-slate-500 mt-1">Solidity smart contract anchors</div>
          </div>
        </div>

      </section>

      {/* The 3 Discovery Modes Section */}
      <section className="max-w-7xl mx-auto px-4 lg:px-8 py-16 border-t border-slate-800/60">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-white">
            Built with 3 Intelligent Discovery Modes
          </h2>
          <p className="text-slate-400 text-sm mt-2">
            Deterministic accuracy when you know who you want, ML ranking when you need the best mentor, and cyclic barter when no direct match exists.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Mode A */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 relative hover:border-brand-500/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center font-bold text-sm mb-4">
              A
            </div>
            <h3 className="font-bold text-white text-base">Mode A — Known Person</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              If you search for a specific classmate like &ldquo;Rahul&rdquo; or &ldquo;Alice&rdquo;, deterministic identity matching pins them first. ML ranking never buries exact people.
            </p>
            <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-brand-400 flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" /> Exact match prioritization
            </div>
          </div>

          {/* Mode B */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 relative hover:border-accent-500/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-accent-500/20 text-accent-400 flex items-center justify-center font-bold text-sm mb-4">
              B
            </div>
            <h3 className="font-bold text-white text-base">Mode B — Known Skill & ML Match</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Want to learn Python or Solidity? Deterministic filters ensure availability and capability, while ML ranks candidate compatibility with explainable &ldquo;Why&rdquo; scores.
            </p>
            <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-accent-400 flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" /> Hybrid feature vector ranking
            </div>
          </div>

          {/* Mode C */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 relative hover:border-indigo-500/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm mb-4">
              C
            </div>
            <h3 className="font-bold text-white text-base">Mode C — Multi-Person Barter Loops</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              No direct 1:1 match? Our directed graph cycle finder connects 3 or 4 students in a circular learning chain (A teaches B, B teaches C, C teaches A).
            </p>
            <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-indigo-400 flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" /> Network cycle barter discovery
            </div>
          </div>

        </div>
      </section>

      {/* Core Loop Architecture Banner */}
      <section className="max-w-7xl mx-auto px-4 lg:px-8 py-12 mb-10">
        <div className="glass-panel p-8 rounded-3xl border border-brand-500/30 bg-gradient-to-br from-brand-950/40 to-slate-900/60 relative overflow-hidden">
          <div className="max-w-3xl">
            <h3 className="font-display font-bold text-2xl text-white">The Campus Learning Economy Cycle</h3>
            <p className="text-slate-300 text-xs sm:text-sm mt-2 leading-relaxed">
              TEACH &rarr; EARN SKILL CREDITS &rarr; LEARN &rarr; COMPLETE SESSIONS &rarr; BUILD REPUTATION &rarr; EARN ON-CHAIN CREDENTIALS
            </p>
            <div className="flex flex-wrap gap-3 mt-6">
              <Link 
                href="/explore" 
                className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-dark-bg font-bold text-xs tracking-wide shadow-glow-brand transition-all"
              >
                Browse Campus Mentors
              </Link>
              <Link 
                href="/studysphere" 
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs border border-slate-700 transition-colors"
              >
                Open StudySphere Hub
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
