'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { 
  Sparkles, 
  Search, 
  Calendar, 
  Award, 
  Coins, 
  Brain, 
  ShieldAlert, 
  GraduationCap, 
  User, 
  LogOut, 
  ChevronDown, 
  CheckCircle2, 
  Activity,
  Layers
} from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const { user, logout, switchDemoUser } = useAuth();
  const [demoMenuOpen, setDemoMenuOpen] = useState(false);

  const demoPersonas = [
    { email: 'alice@campus.edu', name: 'Alice Chen', role: 'Student (React/Node)', badge: 'Learner/Mentor' },
    { email: 'rahul.kumar@campus.edu', name: 'Rahul Kumar', role: 'Senior Mentor (Python/Solidity)', badge: 'Top Mentor' },
    { email: 'elena.rostova@campus.edu', name: 'Elena Rostova', role: 'Design TA (Figma/UX)', badge: 'Top Designer' },
    { email: 'david.kim@campus.edu', name: 'David Kim', role: 'Applied Math Tutor', badge: 'Calculus TA' },
    { email: 'botfarm1@external-temp.net', name: 'QuickSwap Pro', role: 'Suspicious Ring Account', badge: 'Flagged / Sybil' },
    { email: 'moderator.sarah@campus.edu', name: 'Sarah Jenkins', role: 'Campus Moderator', badge: 'Moderator' },
    { email: 'admin@skillswap.campus.edu', name: 'Campus Admin', role: 'System SRE & Admin', badge: 'Admin' },
  ];

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80 px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-500 to-accent-500 flex items-center justify-center shadow-glow-brand group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5 text-dark-bg" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display font-bold text-xl tracking-tight text-white">SKILLSWAP</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-400 font-semibold border border-brand-500/30">CAMPUS</span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium tracking-wide">Exchange skills instead of money</p>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800">
          <Link 
            href="/explore" 
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              pathname === '/explore' ? 'bg-brand-500 text-dark-bg shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            Explore Skills
          </Link>

          <Link 
            href="/studysphere" 
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              pathname === '/studysphere' ? 'bg-accent-500 text-white shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            StudySphere
          </Link>

          <Link 
            href="/sessions" 
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              pathname === '/sessions' ? 'bg-slate-800 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            Sessions
          </Link>

          <Link 
            href="/study-coach" 
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              pathname === '/study-coach' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            AI Coach
          </Link>

          <Link 
            href="/credentials" 
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              pathname === '/credentials' ? 'bg-slate-800 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            Badges
          </Link>

          <Link 
            href="/wallet" 
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              pathname === '/wallet' ? 'bg-slate-800 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            Ledger
          </Link>

          {/* Moderator / Admin Access */}
          {(user?.role === 'MODERATOR' || user?.role === 'ADMIN') && (
            <Link 
              href="/moderator" 
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                pathname === '/moderator' ? 'bg-amber-500 text-dark-bg' : 'text-amber-400 hover:bg-amber-500/20'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              Moderation
            </Link>
          )}

          {user?.role === 'ADMIN' && (
            <Link 
              href="/admin" 
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                pathname === '/admin' ? 'bg-rose-600 text-white' : 'text-rose-400 hover:bg-rose-500/20'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              Admin
            </Link>
          )}
        </nav>

        {/* Right Section: Skill Credit Balance, Demo Persona Switcher & Profile */}
        <div className="flex items-center gap-3">
          
          {/* Skill Credit Balance Capsule */}
          {user && (
            <Link href="/wallet" className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-brand-950/60 border border-brand-500/30 hover:border-brand-500/60 transition-colors">
              <Coins className="w-4 h-4 text-brand-400 animate-pulse-subtle" />
              <div className="text-left">
                <div className="text-xs font-bold text-brand-300 leading-none">
                  {user.balance} <span className="text-[10px] font-normal text-slate-300">Credits</span>
                </div>
                {user.escrow_balance > 0 && (
                  <div className="text-[9px] text-amber-400 leading-none mt-0.5">
                    ({user.escrow_balance} in escrow)
                  </div>
                )}
              </div>
            </Link>
          )}

          {/* Demo Persona Switcher Dropdown (Essential for testing all flows) */}
          <div className="relative">
            <button 
              onClick={() => setDemoMenuOpen(!demoMenuOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-colors"
            >
              <span className="w-2 h-2 rounded-full bg-brand-400"></span>
              <span className="hidden sm:inline">Demo:</span>
              <span className="font-semibold text-white truncate max-w-[90px]">{user?.display_name?.split(' ')[0] || 'Alice'}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {demoMenuOpen && (
              <div className="absolute right-0 mt-2 w-72 glass-panel rounded-xl shadow-2xl p-2 border border-slate-700 z-50">
                <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Switch Campus Persona
                </div>
                <div className="divide-y divide-slate-800">
                  {demoPersonas.map((p) => (
                    <button
                      key={p.email}
                      onClick={async () => {
                        await switchDemoUser(p.email);
                        setDemoMenuOpen(false);
                      }}
                      className={`w-full text-left p-2 rounded-lg text-xs flex items-center justify-between hover:bg-slate-800/80 transition-colors ${
                        user?.email === p.email ? 'bg-slate-800 text-brand-400 font-semibold' : 'text-slate-300'
                      }`}
                    >
                      <div>
                        <div className="font-medium text-white flex items-center gap-1.5">
                          {p.name}
                          {user?.email === p.email && <CheckCircle2 className="w-3.5 h-3.5 text-brand-400" />}
                        </div>
                        <div className="text-[11px] text-slate-400">{p.role}</div>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-700">
                        {p.badge}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User Profile / Logout */}
          {user ? (
            <div className="flex items-center gap-2">
              <Link 
                href="/profile" 
                className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-accent-600 flex items-center justify-center text-dark-bg font-extrabold text-xs shadow-md hover:scale-105 transition-transform"
                title={`${user.display_name} • View Profile`}
              >
                {user.display_name?.substring(0, 2).toUpperCase() || 'U'}
              </Link>
              <button
                onClick={() => logout()}
                className="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link 
                href="/login" 
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors border border-slate-700"
              >
                Log In
              </Link>
              <Link 
                href="/login?tab=register" 
                className="px-3.5 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-400 text-dark-bg font-bold text-xs transition-colors shadow-glow-brand"
              >
                Sign Up
              </Link>
            </div>
          )}

        </div>
      </div>
    </header>
  );
}
