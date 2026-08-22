'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { 
  Search, 
  Filter, 
  Sparkles, 
  Star, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  Repeat, 
  ChevronRight, 
  X, 
  Coins, 
  Layers, 
  UserCheck, 
  ShieldCheck, 
  Info,
  ExternalLink
} from 'lucide-react';

function ExploreComponent() {
  const searchParams = useSearchParams();
  const initialQ = searchParams.get('q') || '';
  const initialMode = searchParams.get('mode') || 'ALL';

  const { user, refreshUser } = useAuth();

  const [query, setQuery] = useState(initialQ);
  const [selectedMode, setSelectedMode] = useState<string>(initialMode);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [minProficiency, setMinProficiency] = useState<string>('');
  const [selectedDay, setSelectedDay] = useState<string>('');
  const [verifiedOnly, setVerifiedOnly] = useState<boolean>(false);
  const [minRating, setMinRating] = useState<string>('');

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    modeA: any[];
    modeB: any[];
    modeC: any[];
  }>({ modeA: [], modeB: [], modeC: [] });

  // Booking Modal State
  const [bookingCandidate, setBookingCandidate] = useState<any | null>(null);
  const [bookingDate, setBookingDate] = useState<string>('');
  const [bookingTime, setBookingTime] = useState<string>('18:00');
  const [bookingNotes, setBookingNotes] = useState<string>('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Fetch search results from API
  const executeSearch = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set('q', query.trim());
      if (selectedMode !== 'ALL') params.set('mode', selectedMode);
      if (selectedCategory) params.set('skillCategory', selectedCategory);
      if (minProficiency) params.set('minProficiency', minProficiency);
      if (selectedDay) params.set('dayOfWeek', selectedDay);
      if (verifiedOnly) params.set('verifiedOnly', 'true');
      if (minRating) params.set('minRating', minRating);

      const res = await fetch(`/api/search?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setResults({
          modeA: data.results.modeA_knownPerson || [],
          modeB: data.results.modeB_skillMatches || [],
          modeC: data.results.modeC_exchangeCycles || [],
        });
      }
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    executeSearch();
  }, [query, selectedMode, selectedCategory, minProficiency, selectedDay, verifiedOnly, minRating]);

  // Handle Booking Submission
  const handleConfirmBooking = async () => {
    if (!bookingCandidate) return;
    setBookingLoading(true);
    setBookingError(null);
    setBookingSuccess(null);

    try {
      const scheduledDateTime = new Date(`${bookingDate || new Date().toISOString().substring(0, 10)}T${bookingTime}:00`);
      const scheduledEnd = new Date(scheduledDateTime.getTime() + 60 * 60 * 1000); // 1 hour duration

      const payload = {
        teacherId: bookingCandidate.userId,
        skillId: bookingCandidate.matchedSkill?.skillId || 'skill-python',
        title: `1-on-1 Mentorship: ${bookingCandidate.matchedSkill?.skillName || 'Skill Session'}`,
        scheduledStart: scheduledDateTime.toISOString(),
        scheduledEnd: scheduledEnd.toISOString(),
        durationHours: 1.0,
        creditsAmount: 1,
        mode: 'ONLINE',
        notes: bookingNotes || 'Excited to learn from you!',
      };

      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setBookingError(data.error || 'Booking failed');
      } else {
        setBookingSuccess(data.message || 'Session booked successfully!');
        await refreshUser();
        setTimeout(() => {
          setBookingCandidate(null);
          setBookingSuccess(null);
        }, 1800);
      }
    } catch (err: any) {
      setBookingError('Network error while booking session');
    } finally {
      setBookingLoading(false);
    }
  };

  const categories = ['Computer Science', 'Design', 'Languages', 'Mathematics', 'Business'];
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
      
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-white">
              Campus Peer Discovery
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Find verified mentors, compare ML compatibility scores, or discover multi-person exchange cycles.
            </p>
          </div>

          {/* Mode Selector Tabs */}
          <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
            <button
              onClick={() => setSelectedMode('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                selectedMode === 'ALL' ? 'bg-brand-500 text-dark-bg' : 'text-slate-400 hover:text-white'
              }`}
            >
              All Results
            </button>
            <button
              onClick={() => setSelectedMode('MODE_A')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
                selectedMode === 'MODE_A' ? 'bg-brand-500 text-dark-bg' : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" /> Mode A (Person)
            </button>
            <button
              onClick={() => setSelectedMode('MODE_B')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
                selectedMode === 'MODE_B' ? 'bg-brand-500 text-dark-bg' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" /> Mode B (ML Skill)
            </button>
            <button
              onClick={() => setSelectedMode('MODE_C')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
                selectedMode === 'MODE_C' ? 'bg-brand-500 text-dark-bg' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Repeat className="w-3.5 h-3.5" /> Mode C (Cycles)
            </button>
          </div>
        </div>
      </div>

      {/* Central Search Bar & Category Pills */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 mb-8 space-y-3">
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input 
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by mentor name ('Rahul', 'Alice') or skill ('Python', 'Solidity', 'Figma', 'Calculus')..."
            className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-brand-500 transition-colors"
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Pills & Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setSelectedCategory('')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                selectedCategory === '' ? 'bg-brand-500/20 text-brand-400 border border-brand-500/40' : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
              }`}
            >
              All Categories
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(selectedCategory === cat ? '' : cat)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  selectedCategory === cat ? 'bg-brand-500/20 text-brand-400 border border-brand-500/40' : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-300 rounded-lg px-2.5 py-1 focus:outline-none"
            >
              <option value="">Any Day</option>
              {days.map(d => <option key={d} value={d}>{d}</option>)}
            </select>

            <select
              value={minProficiency}
              onChange={(e) => setMinProficiency(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-300 rounded-lg px-2.5 py-1 focus:outline-none"
            >
              <option value="">Any Level</option>
              <option value="Beginner">Beginner+</option>
              <option value="Intermediate">Intermediate+</option>
              <option value="Advanced">Advanced+</option>
              <option value="Expert">Expert Only</option>
            </select>

            <label className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 text-slate-300 rounded-lg px-2.5 py-1 cursor-pointer select-none">
              <input 
                type="checkbox"
                checked={verifiedOnly}
                onChange={(e) => setVerifiedOnly(e.target.checked)}
                className="rounded text-brand-500 focus:ring-0"
              />
              <span>Verified Only</span>
            </label>
          </div>
        </div>
      </div>

      {/* Results Feed */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-400">Querying deterministic catalog and calculating hybrid ML compatibility features...</p>
        </div>
      ) : (
        <div className="space-y-10">
          
          {/* ============================================================ */}
          {/* 1. MODE A: KNOWN PERSON (Deterministic Exact Identity Lookup) */}
          {/* ============================================================ */}
          {(selectedMode === 'ALL' || selectedMode === 'MODE_A') && results.modeA.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-brand-400" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-brand-300">
                  Mode A — Exact Known Person Matches ({results.modeA.length})
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded bg-brand-500/20 text-brand-400 border border-brand-500/30">
                  Deterministic Priority — ML ranking does not bury exact people
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.modeA.map((cand) => (
                  <div key={cand.userId} className="glass-panel p-5 rounded-2xl border border-brand-500/40 bg-gradient-to-br from-brand-950/30 to-slate-900/60 shadow-glass">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-brand-500 to-accent-600 flex items-center justify-center text-dark-bg font-extrabold text-base shadow-md">
                          {cand.displayName.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-white text-base">{cand.displayName}</h3>
                            {cand.isVerifiedStudent && (
                              <span className="flex items-center gap-1 text-[11px] text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded-full border border-brand-500/20 font-medium">
                                <CheckCircle2 className="w-3 h-3" /> Verified Student
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400">{cand.college} • {cand.major} ({cand.year})</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="flex items-center gap-1 text-amber-400 text-xs font-bold justify-end">
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                          <span>{cand.reputation.bayesianRating.toFixed(1)}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{cand.reputation.totalSessionsTaught} sessions taught</div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 mt-3 line-clamp-2">{cand.bio}</p>

                    {/* Matched Primary Skill */}
                    <div className="mt-3.5 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-slate-400 text-[11px]">Primary Skill: </span>
                        <span className="font-semibold text-white">{cand.matchedSkill.skillName}</span>
                        <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-300 font-medium">
                          {cand.matchedSkill.proficiency}
                        </span>
                      </div>
                      <span className="text-[11px] text-brand-400 font-semibold">1 Credit / hr</span>
                    </div>

                    {/* Availability Pills */}
                    {cand.availability.length > 0 && (
                      <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>Available: </span>
                        {cand.availability.map((a: any, idx: number) => (
                          <span key={idx} className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                            {a.dayOfWeek} {a.startTime}-{a.endTime}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
                      <div className="text-[11px] text-slate-400 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-brand-400" />
                        <span>Trust Score: <strong className="text-white">{cand.trustScore}%</strong></span>
                      </div>

                      <button
                        onClick={() => setBookingCandidate(cand)}
                        className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-400 text-dark-bg font-bold text-xs shadow-glow-brand transition-all flex items-center gap-1.5"
                      >
                        Request Session <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* 2. MODE B: KNOWN SKILL & HYBRID ML RANKING */}
          {/* ============================================================ */}
          {(selectedMode === 'ALL' || selectedMode === 'MODE_B') && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-accent-400" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-accent-300">
                  Mode B — Skill Candidate Matches & ML Ranking ({results.modeB.length})
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded bg-accent-500/20 text-accent-300 border border-accent-500/30">
                  Ranked by ML Feature Compatibility (30% Skill, 20% Schedule, 15% Level, 10% Trust)
                </span>
              </div>

              {results.modeB.length === 0 ? (
                <div className="glass-panel p-8 rounded-2xl border border-slate-800 text-center space-y-3">
                  <p className="text-sm text-slate-300">No mentors match your selected filters.</p>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Try adjusting your availability schedule or explore Mode C Multi-Person Barter loops!
                  </p>
                  <button 
                    onClick={() => { setSelectedCategory(''); setMinProficiency(''); setSelectedDay(''); setVerifiedOnly(false); }}
                    className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white border border-slate-700"
                  >
                    Reset All Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {results.modeB.map((cand) => (
                    <div key={`${cand.userId}-${cand.matchedSkill.skillId}`} className="glass-panel p-5 rounded-2xl border border-slate-800 glass-panel-hover flex flex-col justify-between">
                      <div>
                        {/* Top: ML Match Score Pill & Avatar */}
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-accent-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                              {cand.displayName.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <h3 className="font-bold text-white text-sm leading-snug">{cand.displayName}</h3>
                              <p className="text-[11px] text-slate-400 truncate max-w-[140px]">{cand.college}</p>
                            </div>
                          </div>

                          {/* Match Score Badge */}
                          <div className="text-right">
                            <div className="px-2.5 py-1 rounded-xl bg-accent-500/20 text-accent-300 font-extrabold text-xs border border-accent-500/30">
                              {cand.matchScore}% Match
                            </div>
                          </div>
                        </div>

                        {/* Matched Skill & Proficiency */}
                        <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs space-y-1 mb-3">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-white">{cand.matchedSkill.skillName}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-brand-500/20 text-brand-300 font-bold">
                              {cand.matchedSkill.proficiency}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 italic">&ldquo;{cand.teachingStyle}&rdquo;</p>
                        </div>

                        {/* Explainability Breakdown (Why ML scored this match) */}
                        <div className="space-y-1.5 mb-3 bg-slate-950/40 p-2.5 rounded-xl border border-slate-900 text-[11px]">
                          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                            Explainable Match Signals:
                          </div>
                          {cand.explanationPoints.slice(0, 3).map((pt: string, idx: number) => (
                            <div key={idx} className="text-slate-300 flex items-start gap-1.5 leading-tight">
                              <span className="text-brand-400 font-bold">{pt}</span>
                            </div>
                          ))}
                        </div>

                        {/* Availability */}
                        {cand.availability.length > 0 && (
                          <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mb-2">
                            <Calendar className="w-3 h-3 text-slate-500" />
                            <span>{cand.availability.map((a: any) => a.dayOfWeek).slice(0, 2).join(', ')}</span>
                          </div>
                        )}
                      </div>

                      {/* Card Footer: Rating & Request Button */}
                      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2 mt-2">
                        <div className="flex items-center gap-1 text-amber-400 text-xs font-bold">
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                          <span>{cand.reputation.bayesianRating.toFixed(1)}</span>
                          <span className="text-[10px] text-slate-500 font-normal">({cand.reputation.totalSessionsTaught})</span>
                        </div>

                        <button
                          onClick={() => setBookingCandidate(cand)}
                          className="px-3.5 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-400 text-dark-bg font-bold text-xs transition-colors flex items-center gap-1 shadow-sm"
                        >
                          Book (1 Credit)
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ============================================================ */}
          {/* 3. MODE C: MULTI-PERSON NETWORK EXCHANGE CYCLES */}
          {/* ============================================================ */}
          {(selectedMode === 'ALL' || selectedMode === 'MODE_C') && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-indigo-300">
                  Mode C — Multi-Person Network Exchange Cycles ({results.modeC.length})
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Directed Barter Graph Discovery (No Direct 1:1 Match Needed)
                </span>
              </div>

              {results.modeC.length === 0 ? (
                <div className="glass-panel p-6 rounded-2xl border border-slate-800 text-center text-xs text-slate-400">
                  No active circular barter loops currently detected. Add more learning goals to your profile to trigger network cycle discovery!
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {results.modeC.map((cycle) => (
                    <div key={cycle.cycleId} className="glass-panel p-5 rounded-2xl border border-indigo-500/40 bg-gradient-to-br from-indigo-950/30 to-slate-900/60 shadow-glass">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs">
                            <Repeat className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="font-bold text-white text-sm">{cycle.cycleLength}-Person Skill Exchange Loop</h3>
                            <p className="text-[11px] text-slate-400">Mutual Barter Feasibility: {cycle.feasibilityScore}%</p>
                          </div>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">
                          {cycle.status}
                        </span>
                      </div>

                      {/* Cyclic Flow Timeline */}
                      <div className="space-y-2 bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                        {cycle.skillsFlow.map((flow: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between text-xs text-slate-300">
                            <div className="flex items-center gap-1.5 font-medium">
                              <span className="text-brand-400">{flow.fromName}</span>
                              <span className="text-slate-500">&rarr; teaches {flow.skillName} &rarr;</span>
                              <span className="text-indigo-300">{flow.toName}</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      <p className="text-[11px] text-slate-400 mt-3 leading-relaxed">
                        {cycle.explanation}
                      </p>

                      <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                        <span className="text-[11px] text-slate-400">Every student earns &amp; spends 1 credit</span>
                        <button 
                          onClick={() => alert(`Exchange Cycle ${cycle.cycleId} proposal opted-in! Other participants will be notified to confirm schedules.`)}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors"
                        >
                          Opt-In to Exchange Loop
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {/* ============================================================ */}
      {/* BOOKING MODAL (1-Click Escrow Credit Reservation) */}
      {/* ============================================================ */}
      {bookingCandidate && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-lg rounded-3xl border border-slate-700 shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-200">
            
            <button 
              onClick={() => { setBookingCandidate(null); setBookingError(null); }}
              className="absolute right-4 top-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-500 to-brand-600 flex items-center justify-center text-dark-bg font-extrabold text-lg shadow-glow-brand">
                <Coins className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Book Skill Session</h3>
                <p className="text-xs text-slate-400">Mentor: {bookingCandidate.displayName}</p>
              </div>
            </div>

            {bookingSuccess ? (
              <div className="py-8 text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-brand-400 mx-auto animate-bounce" />
                <h4 className="text-base font-bold text-white">Session Requested &amp; Escrow Reserved!</h4>
                <p className="text-xs text-slate-300">{bookingSuccess}</p>
              </div>
            ) : (
              <div className="space-y-4">
                
                {/* Skill Summary Capsule */}
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400">Skill: </span>
                    <span className="font-bold text-white">{bookingCandidate.matchedSkill.skillName}</span>
                    <span className="ml-2 text-[10px] px-2 py-0.5 rounded bg-brand-500/20 text-brand-300">
                      {bookingCandidate.matchedSkill.proficiency}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-brand-400">1 Credit</span>
                    <div className="text-[10px] text-slate-400">Held in Escrow</div>
                  </div>
                </div>

                {/* Date & Time Selection */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Session Date
                    </label>
                    <input 
                      type="date"
                      value={bookingDate}
                      onChange={(e) => setBookingDate(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Time Window
                    </label>
                    <input 
                      type="time"
                      value={bookingTime}
                      onChange={(e) => setBookingTime(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>

                {/* Session Notes */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Learning Goal / Questions for Mentor
                  </label>
                  <textarea 
                    value={bookingNotes}
                    onChange={(e) => setBookingNotes(e.target.value)}
                    placeholder="E.g., I want to review smart contract test suites and reentrancy prevention..."
                    rows={3}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-brand-500 placeholder-slate-500"
                  />
                </div>

                {/* Escrow Terms Notice */}
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Zero-Risk Escrow Guarantee</span>
                  </div>
                  <p className="text-slate-300 leading-snug">
                    Your 1 Skill Credit will be locked in the escrow state machine. It is only released to the mentor after both parties confirm the completed session.
                  </p>
                </div>

                {bookingError && (
                  <div className="p-2.5 rounded-lg bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs">
                    {bookingError}
                  </div>
                )}

                {/* Submit Action */}
                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setBookingCandidate(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleConfirmBooking}
                    disabled={bookingLoading}
                    className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-dark-bg font-bold text-xs shadow-glow-brand transition-all flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {bookingLoading ? 'Reserving Escrow...' : 'Confirm & Reserve 1 Credit'}
                  </button>
                </div>

              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-xs text-slate-450">Loading discovery feed...</div>}>
      <ExploreComponent />
    </Suspense>
  );
}
