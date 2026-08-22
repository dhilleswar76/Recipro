'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Coins, 
  Star, 
  AlertTriangle, 
  ExternalLink, 
  Video, 
  X, 
  ShieldAlert, 
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  MessageSquare,
  Lock,
  Check,
  HelpCircle
} from 'lucide-react';

export default function SessionsPage() {
  const { user, refreshUser } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Exchange Return Modal State
  const [exchangeModalSession, setExchangeModalSession] = useState<any | null>(null);
  const [exchangeDetails, setExchangeDetails] = useState<any | null>(null);
  const [exchangeLoading, setExchangeLoading] = useState(false);
  const [proposeSkillName, setProposeSkillName] = useState('');
  const [proposeNotes, setProposeNotes] = useState('');
  const [alternativeSkillName, setAlternativeSkillName] = useState('');
  const [exchangeSubmitting, setExchangeSubmitting] = useState(false);
  const [exchangeError, setExchangeError] = useState<string | null>(null);

  // Rating Modal State
  const [ratingSession, setRatingSession] = useState<any | null>(null);
  const [ratingScore, setRatingScore] = useState<number>(5);
  const [punctualityScore, setPunctualityScore] = useState<number>(5);
  const [clarityScore, setClarityScore] = useState<number>(5);
  const [reviewText, setReviewText] = useState<string>('');
  const [ratingSubmitting, setRatingSubmitting] = useState(false);

  // Dispute Modal State
  const [disputeSession, setDisputeSession] = useState<any | null>(null);
  const [disputeReason, setDisputeReason] = useState<string>('NO_SHOW');
  const [disputeDetails, setDisputeDetails] = useState<string>('');
  const [disputeSubmitting, setDisputeSubmitting] = useState(false);

  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/sessions');
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
      }
    } catch (err) {
      console.error('Failed to load sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [user]);

  // Open Exchange Confirmation Modal & Fetch Live Agreement Details
  const openExchangeModal = async (session: any) => {
    setExchangeModalSession(session);
    setExchangeLoading(true);
    setExchangeError(null);
    setProposeSkillName('');
    setAlternativeSkillName('');
    setProposeNotes('');
    
    try {
      const res = await fetch(`/api/sessions/${session.id}/exchange`);
      if (res.ok) {
        const data = await res.json();
        setExchangeDetails(data);
        if (data.agreement?.requested_return_skill_name) {
          setProposeSkillName(data.agreement.requested_return_skill_name);
        }
      } else {
        const errData = await res.json();
        setExchangeError(errData.error || 'Failed to load exchange details');
      }
    } catch (err: any) {
      console.error('Failed to fetch exchange details:', err);
      setExchangeError(err.message || 'Unable to load exchange information. Please retry.');
    } finally {
      setExchangeLoading(false);
    }
  };

  // Mentor Proposes Return Skill
  const handleProposeReturnSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exchangeModalSession || !proposeSkillName.trim()) return;
    setExchangeSubmitting(true);
    setExchangeError(null);

    try {
      const res = await fetch(`/api/sessions/${exchangeModalSession.id}/return-skill`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skillName: proposeSkillName.trim(),
          notes: proposeNotes,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        await fetchSessions();
        await openExchangeModal(exchangeModalSession);
      } else {
        setExchangeError(data.error || 'Unable to save the return skill.');
      }
    } catch (err: any) {
      setExchangeError(err.message || 'Unable to save the return skill. Please retry.');
    } finally {
      setExchangeSubmitting(false);
    }
  };

  // Learner / Mentor Responds to Return Proposal
  const handleRespondReturnProposal = async (action: string, altSkill?: string) => {
    if (!exchangeModalSession) return;
    setExchangeSubmitting(true);
    setExchangeError(null);

    try {
      let endpoint = `/api/sessions/${exchangeModalSession.id}/exchange/respond`;
      if (action === 'ACCEPT_SKILL') {
        endpoint = `/api/sessions/${exchangeModalSession.id}/return-skill/accept`;
      } else if (action === 'DECLINE') {
        endpoint = `/api/sessions/${exchangeModalSession.id}/return-skill/reject`;
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          alternativeSkillName: altSkill || alternativeSkillName,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        await fetchSessions();
        await refreshUser();
        await openExchangeModal(exchangeModalSession);
      } else {
        setExchangeError(data.error || 'Your response could not be saved.');
      }
    } catch (err: any) {
      setExchangeError(err.message || 'Your response could not be saved. Please retry.');
    } finally {
      setExchangeSubmitting(false);
    }
  };

  // Handle Session State Action
  const handleSessionAction = async (sessionId: string, action: string) => {
    setActionLoading(sessionId);
    try {
      const idempotencyKey = `act-${sessionId}-${action}-${Date.now()}`;
      const res = await fetch(`/api/sessions/${sessionId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, idempotencyKey }),
      });

      if (res.ok) {
        await fetchSessions();
        await refreshUser();
      } else {
        const data = await res.json();
        alert(data.error || 'Action failed');
      }
    } catch (err) {
      console.error('Action error:', err);
    } finally {
      setActionLoading(null);
    }
  };

  // Submit Rating & Review
  const handleSubmitRating = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ratingSession) return;
    setRatingSubmitting(true);

    try {
      const res = await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: ratingSession.id,
          score: ratingScore,
          punctualityScore,
          clarityScore,
          review: reviewText,
        }),
      });

      if (res.ok) {
        setRatingSession(null);
        setReviewText('');
        await fetchSessions();
        await refreshUser();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to submit rating');
      }
    } catch (err) {
      console.error('Rating error:', err);
    } finally {
      setRatingSubmitting(false);
    }
  };

  // Submit Dispute
  const handleSubmitDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeSession) return;
    setDisputeSubmitting(true);

    try {
      const res = await fetch('/api/disputes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: disputeSession.id,
          reason: disputeReason,
          details: disputeDetails,
        }),
      });

      if (res.ok) {
        setDisputeSession(null);
        setDisputeDetails('');
        await fetchSessions();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to open dispute');
      }
    } catch (err) {
      console.error('Dispute error:', err);
    } finally {
      setDisputeSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-400 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Campus Skill Exchange Network</span>
          </div>
          <h1 className="text-3xl font-display font-extrabold text-white tracking-tight">
            My Learning &amp; Teaching Sessions
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage upcoming peer sessions, set return skill requirements, and enter live video classrooms.
          </p>
        </div>

        <Link
          href="/explore"
          className="self-start md:self-auto py-2 px-4 rounded-xl bg-brand-500 hover:bg-brand-400 text-dark-bg font-bold text-xs shadow-glow-brand transition-colors flex items-center gap-1.5"
        >
          <span>Find New Skill Peer</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Sessions Content */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : sessions.length === 0 ? (
        <div className="glass-panel p-12 rounded-3xl border border-slate-800 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 text-slate-500 flex items-center justify-center mx-auto">
            <Calendar className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">No Sessions Scheduled</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              You don't have any active learning or teaching sessions. Explore skills or respond to learner requests to get started!
            </p>
          </div>
          <Link
            href="/explore"
            className="inline-block py-2.5 px-6 rounded-xl bg-brand-500 hover:bg-brand-400 text-dark-bg font-extrabold text-xs shadow-glow-brand transition-all"
          >
            Explore Campus Mentors
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((sess) => {
            const isTeacher = (sess.teacher_id === user?.id);
            const counterpartyName = isTeacher ? sess.learner_name : sess.teacher_name;
            const counterpartyCollege = isTeacher ? sess.learner_college : sess.teacher_college;
            const isDirectExchange = (sess.agreement_return_type === 'SKILL' || !sess.agreement_return_type);
            const isAgreementAccepted = sess.agreement_status === 'ACCEPTED';
            const isPendingAgreement = !isAgreementAccepted && sess.status !== 'CANCELLED' && sess.status !== 'DISPUTED';

            return (
              <div 
                key={sess.id}
                className={`glass-panel p-6 rounded-3xl border transition-all space-y-4 ${
                  sess.status === 'COMPLETED' || sess.status === 'CREDIT_SETTLED'
                    ? 'border-slate-800/80 bg-slate-950/40 opacity-90'
                    : sess.status === 'CANCELLED'
                    ? 'border-slate-800/50 bg-slate-950/20 opacity-60'
                    : sess.status === 'DISPUTED'
                    ? 'border-rose-500/40 bg-rose-950/10'
                    : isAgreementAccepted
                    ? 'border-brand-500/40 bg-slate-900/60 shadow-lg shadow-brand-500/5'
                    : 'border-amber-500/30 bg-slate-900/60'
                }`}
              >
                
                {/* Top Row: Meta info & State Badge */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                      isTeacher 
                        ? 'bg-sky-500/10 text-sky-400 border-sky-500/30' 
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    }`}>
                      {isTeacher ? '🧑‍🏫 You are Teaching' : '🎓 You are Learning'}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {sess.duration_hours || 1} Hour Session ({sess.mode})
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold tracking-wide border ${
                      sess.status === 'COMPLETED' || sess.status === 'CREDIT_SETTLED' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                      sess.status === 'IN_PROGRESS' ? 'bg-accent-500/20 text-accent-300 border-accent-500/40 animate-pulse' :
                      sess.status === 'CANCELLED' ? 'bg-slate-800 text-slate-500 border-slate-700' :
                      sess.status === 'DISPUTED' ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' :
                      'bg-brand-500/20 text-brand-300 border-brand-500/40'
                    }`}>
                      {sess.status}
                    </span>
                  </div>
                </div>

                {/* Main Session Content Grid */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                  
                  {/* Left Column: Skill & Time */}
                  <div className="md:col-span-4 space-y-1">
                    <h2 className="text-lg font-bold text-white group-hover:text-brand-300 transition-colors">
                      {sess.title || `${sess.skill_name} Peer Session`}
                    </h2>
                    <div className="text-xs text-brand-400 font-semibold flex items-center gap-1.5">
                      <span>Target Skill:</span>
                      <span className="px-2 py-0.5 rounded bg-brand-500/10 border border-brand-500/20 font-bold">
                        {sess.skill_name}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 flex items-center gap-1 pt-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>{new Date(sess.scheduled_start).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at {new Date(sess.scheduled_start).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
                    </div>
                  </div>

                  {/* Middle Column: Peer Details */}
                  <div className="md:col-span-4 p-3 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1 text-xs">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                      {isTeacher ? 'Learner Peer' : 'Mentor Peer'}
                    </span>
                    <div className="font-bold text-white flex items-center justify-between">
                      <span>{counterpartyName}</span>
                      <span className="text-[11px] text-slate-400 font-normal">{counterpartyCollege}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-900">
                      <span>Settlement:</span>
                      <span className="font-semibold text-brand-400">
                        {isDirectExchange ? 'Direct Skill Exchange' : `${sess.credits_amount || 1} Skill Credit(s)`}
                      </span>
                    </div>
                  </div>

                  {/* Right Column: Pre-Session Agreement Status */}
                  <div className="md:col-span-4 p-3.5 rounded-2xl border bg-slate-950/80 space-y-2 text-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Return Agreement:</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                          isAgreementAccepted ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                          sess.agreement_status === 'PROPOSED' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                          sess.agreement_status === 'REJECTED' ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' :
                          'bg-slate-800 text-slate-400 border-slate-700'
                        }`}>
                          {isAgreementAccepted ? '✓ Confirmed' :
                           sess.agreement_status === 'PROPOSED' ? '⏳ Pending' :
                           sess.agreement_status === 'REJECTED' ? '⚠ Rejected' :
                           'Not Set'}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-300 mt-1.5">
                        {isAgreementAccepted ? (
                          <div className="space-y-0.5">
                            <div>You learn: <strong className="text-white">{isTeacher ? sess.agreement_return_skill : sess.skill_name}</strong></div>
                            <div>You teach: <strong className="text-white">{isTeacher ? sess.skill_name : sess.agreement_return_skill}</strong></div>
                          </div>
                        ) : sess.agreement_status === 'PROPOSED' ? (
                          isTeacher ? (
                            <span>Requested return: <strong className="text-amber-300">{sess.agreement_return_skill}</strong> (Waiting for learner)</span>
                          ) : (
                            <span>Mentor requested: <strong className="text-amber-300">{sess.agreement_return_skill}</strong> in return</span>
                          )
                        ) : sess.agreement_status === 'REJECTED' ? (
                          <span className="text-rose-300">Return skill was rejected. Please specify another return skill.</span>
                        ) : (
                          isTeacher ? (
                            <span className="text-amber-300">Set return skill before session starts.</span>
                          ) : (
                            <span className="text-slate-400">Waiting for mentor to set return skill.</span>
                          )
                        )}
                      </div>
                    </div>

                    {sess.status !== 'CANCELLED' && sess.status !== 'COMPLETED' && sess.status !== 'CREDIT_SETTLED' && (
                      <button
                        onClick={() => openExchangeModal(sess)}
                        className={`w-full py-1.5 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
                          isAgreementAccepted
                            ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                            : 'bg-brand-500 hover:bg-brand-400 text-dark-bg shadow-glow-brand'
                        }`}
                      >
                        {isAgreementAccepted 
                          ? 'View Agreement Terms' 
                          : isTeacher 
                          ? (sess.agreement_status === 'REJECTED' ? 'Set Another Return Skill' : 'Set Return Skill') 
                          : (sess.agreement_status === 'PROPOSED' ? 'Review & Confirm Agreement' : 'View Agreement')}
                      </button>
                    )}
                  </div>

                </div>

                {/* Bottom Row: Actions & Video Classroom Gate */}
                <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
                  
                  {/* Status Note / Explanation */}
                  <div className="text-[11px] text-slate-400 flex items-center gap-2">
                    {sess.status === 'REQUESTED' && <span>Awaiting mentor acceptance. Escrow locked.</span>}
                    {(sess.status === 'ACCEPTED' || sess.status === 'SCHEDULED') && (
                      isAgreementAccepted ? (
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Exchange terms confirmed. Video classroom is unlocked!
                        </span>
                      ) : (
                        <span className="text-amber-400 font-semibold flex items-center gap-1">
                          <Lock className="w-3.5 h-3.5" /> Room Locked: Return skill agreement must be confirmed before entering.
                        </span>
                      )
                    )}
                    {sess.status === 'PENDING_CONFIRMATION' && (
                      <span className="text-amber-300 font-semibold">
                        {isTeacher 
                          ? (sess.teacher_confirmed ? 'You confirmed completion. Waiting for learner.' : 'Please confirm completion to settle credit!')
                          : (sess.learner_confirmed ? 'You confirmed completion. Waiting for mentor.' : 'Please confirm completion to release escrow!')}
                      </span>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2">
                    
                    {/* Mentor Accept/Decline for REQUESTED status */}
                    {sess.status === 'REQUESTED' && isTeacher && (
                      <>
                        <button
                          onClick={() => handleSessionAction(sess.id, 'CANCEL')}
                          disabled={actionLoading === sess.id}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 font-semibold text-xs border border-slate-700"
                        >
                          Decline Request
                        </button>
                        <button
                          onClick={() => handleSessionAction(sess.id, 'ACCEPT')}
                          disabled={actionLoading === sess.id}
                          className="px-4 py-1.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-dark-bg font-bold text-xs shadow-glow-brand"
                        >
                          Accept Session Request
                        </button>
                      </>
                    )}

                    {/* Learner Cancel for REQUESTED status */}
                    {sess.status === 'REQUESTED' && !isTeacher && (
                      <button
                        onClick={() => handleSessionAction(sess.id, 'CANCEL')}
                        disabled={actionLoading === sess.id}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700"
                      >
                        Cancel Request &amp; Refund
                      </button>
                    )}

                    {/* Video Classroom Access: Gate Enforced */}
                    {(sess.status === 'ACCEPTED' || sess.status === 'SCHEDULED' || sess.status === 'IN_PROGRESS' || sess.status === 'PENDING_CONFIRMATION') && (
                      isAgreementAccepted || sess.status === 'IN_PROGRESS' || sess.status === 'PENDING_CONFIRMATION' ? (
                        <Link
                          href={`/live/${sess.id}`}
                          className="px-4 py-2 rounded-xl bg-accent-500 hover:bg-accent-400 text-white font-extrabold text-xs shadow-glow-accent flex items-center gap-1.5 transition-all"
                        >
                          <Video className="w-4 h-4" />
                          <span>Join Video Session</span>
                        </Link>
                      ) : (
                        <button
                          onClick={() => openExchangeModal(sess)}
                          className="px-4 py-2 rounded-xl bg-slate-800 text-amber-300 hover:bg-slate-700 font-bold text-xs border border-amber-500/30 flex items-center gap-1.5 transition-all"
                          title="Click to review and confirm return agreement"
                        >
                          <Lock className="w-3.5 h-3.5 text-amber-400" />
                          <span>Review Agreement to Unlock</span>
                        </button>
                      )
                    )}

                    {/* Completion Confirmation Buttons */}
                    {(sess.status === 'IN_PROGRESS' || sess.status === 'PENDING_CONFIRMATION') && (
                      <button
                        onClick={() => handleSessionAction(sess.id, 'CONFIRM')}
                        disabled={actionLoading === sess.id || (isTeacher ? sess.teacher_confirmed : sess.learner_confirmed)}
                        className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 ${
                          (isTeacher ? sess.teacher_confirmed : sess.learner_confirmed)
                            ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30 cursor-default'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-glow-brand'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{(isTeacher ? sess.teacher_confirmed : sess.learner_confirmed) ? 'Confirmed ✓' : 'Confirm Completion'}</span>
                      </button>
                    )}

                    {/* Rate & Review Button */}
                    {(sess.status === 'COMPLETED' || sess.status === 'CREDIT_SETTLED') && !sess.rating_id && (
                      <button
                        onClick={() => setRatingSession(sess)}
                        className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs border border-amber-500/40 flex items-center gap-1.5 transition-colors"
                      >
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        <span>Leave Peer Review</span>
                      </button>
                    )}

                    {/* Dispute Button */}
                    {(sess.status === 'SCHEDULED' || sess.status === 'ACCEPTED' || sess.status === 'IN_PROGRESS' || sess.status === 'PENDING_CONFIRMATION') && (
                      <button
                        onClick={() => setDisputeSession(sess)}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-rose-400 text-xs border border-slate-800 hover:border-rose-500/30 transition-colors"
                      >
                        Report Issue
                      </button>
                    )}

                  </div>

                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: SET RETURN SKILL / EXCHANGE AGREEMENT */}
      {/* ============================================================ */}
      {exchangeModalSession && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-xl rounded-3xl border border-slate-700 shadow-2xl p-6 sm:p-8 relative space-y-6 max-h-[90vh] overflow-y-auto">
            
            {/* Close Button */}
            <button 
              type="button" 
              onClick={() => { setExchangeModalSession(null); setExchangeDetails(null); }} 
              className="absolute right-5 top-5 p-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-400 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Direct Skill Exchange Agreement</span>
              </div>
              <h2 className="text-2xl font-display font-extrabold text-white">
                {exchangeDetails?.userRoleInSession === 'MENTOR' 
                  ? 'Set Return Skill Requirement' 
                  : 'Confirm Skill Return Agreement'}
              </h2>
              <p className="text-xs text-slate-400">
                Before this session can start, both peers must agree on what skill will be returned.
              </p>
            </div>

            {exchangeError && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{exchangeError}</span>
                </div>
                <button
                  onClick={() => openExchangeModal(exchangeModalSession)}
                  className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-200 text-[11px] font-bold hover:bg-rose-500/30"
                >
                  Retry
                </button>
              </div>
            )}

            {exchangeLoading ? (
              <div className="py-16 text-center space-y-3">
                <div className="w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-slate-400">Loading live agreement details from campus ledger...</p>
              </div>
            ) : (
              <>
                {/* Session Context Summary Card */}
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Teaching Mentor:</span>
                    <strong className="text-white">{exchangeDetails?.session?.teacher_name}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Skill Being Taught:</span>
                    <span className="px-2 py-0.5 rounded bg-brand-500/20 text-brand-300 font-bold border border-brand-500/30">
                      {exchangeDetails?.session?.skill_name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Learner Student:</span>
                    <strong className="text-white">{exchangeDetails?.session?.learner_name}</strong>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-800/80 pt-2">
                    <span className="text-slate-400">Agreement Status:</span>
                    <span className={`font-bold ${
                      exchangeDetails?.agreement?.status === 'ACCEPTED' ? 'text-emerald-400' :
                      exchangeDetails?.agreement?.status === 'PROPOSED' ? 'text-amber-400' :
                      exchangeDetails?.agreement?.status === 'REJECTED' ? 'text-rose-400' :
                      'text-slate-400'
                    }`}>
                      {exchangeDetails?.agreement?.status === 'ACCEPTED' ? '✓ Accepted & Ready to Start' :
                       exchangeDetails?.agreement?.status === 'PROPOSED' ? '⏳ Pending Learner Confirmation' :
                       exchangeDetails?.agreement?.status === 'REJECTED' ? '⚠ Rejected by Learner' :
                       'Not Specified'}
                    </span>
                  </div>
                </div>

                {/* ============================================================ */}
                {/* VIEW A: MENTOR RETURN SKILL FORM */}
                {/* ============================================================ */}
                {exchangeDetails?.userRoleInSession === 'MENTOR' && (
                  <form onSubmit={handleProposeReturnSkill} className="space-y-4">
                    <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                      <label className="block text-xs font-bold text-white">
                        What skill will you ask in return from {exchangeDetails?.session?.learner_name}?
                      </label>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Select a skill you want to learn in exchange. The learner will be notified to explicitly accept or offer credits.
                      </p>

                      {/* Dropdown / Quick Select */}
                      <div className="space-y-2">
                        <select
                          value={proposeSkillName}
                          onChange={(e) => setProposeSkillName(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-500"
                        >
                          <option value="">-- Choose from Campus Skills Catalog --</option>
                          {(exchangeDetails?.allCatalogSkills || []).map((sk: any) => (
                            <option key={sk.id} value={sk.name}>
                              {sk.name} ({sk.category})
                            </option>
                          ))}
                        </select>

                        <div className="text-[11px] text-slate-500 text-center">or type custom skill name:</div>

                        <input
                          type="text"
                          required
                          value={proposeSkillName}
                          onChange={(e) => setProposeSkillName(e.target.value)}
                          placeholder="e.g. UI/UX Design, Solidity, Python, Data Structures..."
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                        />
                      </div>

                      {/* Quick Chips */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        <span className="text-[10px] text-slate-500 self-center">Popular:</span>
                        {['UI/UX Design', 'Solidity', 'Python Programming', 'Machine Learning', 'Data Structures & Algorithms', 'React'].map((s) => (
                          <button
                            type="button"
                            key={s}
                            onClick={() => setProposeSkillName(s)}
                            className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 border border-slate-700 transition-colors"
                          >
                            {s}
                          </button>
                        ))}
                      </div>

                      {/* Optional Notes */}
                      <div className="pt-2">
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                          Notes / Topics to cover (Optional):
                        </label>
                        <input
                          type="text"
                          value={proposeNotes}
                          onChange={(e) => setProposeNotes(e.target.value)}
                          placeholder="e.g. Focus on Figma auto-layout and components"
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    {exchangeDetails?.agreement?.status === 'ACCEPTED' && (
                      <div className="p-3 rounded-xl bg-brand-500/10 border border-brand-500/30 text-brand-300 text-xs">
                        ✓ Currently confirmed exchange: <strong>{exchangeDetails.agreement.taught_skill_name}</strong> ↔ <strong>{exchangeDetails.agreement.requested_return_skill_name}</strong>. Proposing a new skill will require fresh confirmation from {exchangeDetails.session.learner_name}.
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setExchangeModalSession(null)}
                        className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={exchangeSubmitting || !proposeSkillName.trim()}
                        className="flex-2 py-2.5 px-6 rounded-xl bg-brand-500 hover:bg-brand-400 text-dark-bg font-extrabold text-xs shadow-glow-brand transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                      >
                        <Check className="w-4 h-4" />
                        <span>{exchangeSubmitting ? 'Saving...' : 'Save Return Skill'}</span>
                      </button>
                    </div>
                  </form>
                )}

                {/* ============================================================ */}
                {/* VIEW B: LEARNER CONFIRMATION / ACCEPTANCE PANEL */}
                {/* ============================================================ */}
                {exchangeDetails?.userRoleInSession === 'LEARNER' && (
                  <div className="space-y-4">
                    {exchangeDetails?.agreement?.status === 'ACCEPTED' ? (
                      <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-3 text-center">
                        <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30 shadow-glow-brand">
                          <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <h3 className="text-base font-extrabold text-white">Return Skill Confirmed!</h3>
                        <p className="text-xs text-slate-300 max-w-sm mx-auto">
                          You agreed to return <strong className="text-emerald-300">{exchangeDetails.agreement.requested_return_skill_name}</strong> to {exchangeDetails.session.teacher_name} for the <strong className="text-white">{exchangeDetails.session.skill_name}</strong> session.
                        </p>
                        <Link
                          href={`/live/${exchangeDetails.session.id}`}
                          className="inline-flex items-center gap-1.5 py-2.5 px-6 rounded-xl bg-accent-500 hover:bg-accent-400 text-white font-extrabold text-xs shadow-glow-accent transition-all"
                        >
                          <Video className="w-4 h-4" />
                          <span>Enter Video Classroom</span>
                        </Link>
                      </div>
                    ) : exchangeDetails?.agreement ? (
                      <div className="space-y-4">
                        
                        {/* Summary of Proposal */}
                        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                            Mentor's Return Request:
                          </span>
                          <div className="text-base font-extrabold text-white flex items-center gap-2">
                            <span>🤝 {exchangeDetails.agreement.requested_return_skill_name}</span>
                          </div>
                          <p className="text-xs text-slate-300">
                            {exchangeDetails.session.teacher_name} will teach you <strong>{exchangeDetails.session.skill_name}</strong>. In exchange, you will teach <strong>{exchangeDetails.agreement.requested_return_skill_name}</strong>.
                          </p>
                        </div>

                        {/* Option 1: Accept Exchange */}
                        <div className="p-4 rounded-2xl border border-brand-500/30 bg-brand-500/5 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-white text-xs">Option 1: Agree to Teach {exchangeDetails.agreement.requested_return_skill_name}</h4>
                            {exchangeDetails.learnerCanTeachRequestedSkill && (
                              <span className="text-[10px] px-2 py-0.5 rounded bg-brand-500/20 text-brand-400 font-bold border border-brand-500/30 flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3" /> Verified Skill
                              </span>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRespondReturnProposal('ACCEPT_SKILL')}
                            disabled={exchangeSubmitting}
                            className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-400 hover:to-brand-500 text-dark-bg font-extrabold text-xs shadow-glow-brand transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                            <Check className="w-4 h-4" />
                            <span>{exchangeSubmitting ? 'Confirming...' : `Accept Exchange (I will return ${exchangeDetails.agreement.requested_return_skill_name})`}</span>
                          </button>
                        </div>

                        {/* Option 2: Offer Skill Credits */}
                        <div className="p-4 rounded-2xl border border-slate-800 bg-slate-950/60 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-white text-xs">Option 2: Offer Skill Credits Instead</h4>
                            <span className="text-xs text-brand-400 font-bold flex items-center gap-1">
                              <Coins className="w-3.5 h-3.5" />
                              {exchangeDetails.requiredCredits} Credit(s)
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-slate-400 bg-slate-900 p-2 rounded-xl">
                            <span>Your Balance:</span>
                            <strong className="text-white font-bold">{exchangeDetails.learnerAvailableBalance} Credit(s)</strong>
                          </div>

                          {exchangeDetails.learnerAvailableBalance >= exchangeDetails.requiredCredits ? (
                            <button
                              type="button"
                              onClick={() => handleRespondReturnProposal('OFFER_CREDITS')}
                              disabled={exchangeSubmitting}
                              className="w-full py-2.5 rounded-xl bg-accent-500 hover:bg-accent-400 text-white font-bold text-xs shadow-glow-accent transition-all"
                            >
                              Offer {exchangeDetails.requiredCredits} Skill Credit(s) from Balance
                            </button>
                          ) : (
                            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px]">
                              Insufficient credits ({exchangeDetails.learnerAvailableBalance}/{exchangeDetails.requiredCredits}).
                            </div>
                          )}
                        </div>

                        {/* Option 3: Request Different Skill */}
                        <div className="p-4 rounded-2xl border border-slate-800 bg-slate-950/60 space-y-2.5">
                          <h4 className="font-bold text-white text-xs">Option 3: Request Different Return Skill</h4>
                          
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={alternativeSkillName}
                              onChange={(e) => setAlternativeSkillName(e.target.value)}
                              placeholder="e.g. Python, Solidity, UI/UX..."
                              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => handleRespondReturnProposal('PROPOSE_ALTERNATIVE')}
                              disabled={exchangeSubmitting || !alternativeSkillName.trim()}
                              className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 disabled:opacity-50"
                            >
                              Suggest
                            </button>
                          </div>
                        </div>

                        {/* Option 4: Reject */}
                        <button
                          type="button"
                          onClick={() => handleRespondReturnProposal('DECLINE')}
                          disabled={exchangeSubmitting}
                          className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-rose-400 font-semibold text-xs border border-slate-800 transition-colors"
                        >
                          Reject Return Requirement
                        </button>
                      </div>
                    ) : (
                      <div className="py-12 text-center space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-slate-900 text-slate-500 flex items-center justify-center mx-auto border border-slate-800">
                          <Clock className="w-6 h-6" />
                        </div>
                        <h3 className="text-sm font-bold text-white">
                          Waiting for {exchangeDetails?.session?.teacher_name}
                        </h3>
                        <p className="text-xs text-slate-400 max-w-sm mx-auto">
                          Your mentor has not yet specified what skill they'd like in return. You will receive an in-app notification once they propose the return skill.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: SUBMIT PEER RATING & REVIEW */}
      {/* ============================================================ */}
      {ratingSession && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <form onSubmit={handleSubmitRating} className="glass-panel w-full max-w-md rounded-3xl border border-slate-700 shadow-2xl p-6 relative space-y-4">
            <button type="button" onClick={() => setRatingSession(null)} className="absolute right-4 top-4 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                <Star className="w-5 h-5 fill-amber-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Peer Review &amp; Trust Rating</h3>
                <p className="text-xs text-slate-400">{ratingSession.title}</p>
              </div>
            </div>

            {/* Star Score Selector */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Overall Rating (1 - 5 Stars)</label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setRatingScore(star)}
                    className={`p-2 rounded-xl border transition-colors ${
                      ratingScore >= star ? 'bg-amber-500/20 border-amber-500/50 text-amber-400' : 'bg-slate-900 border-slate-800 text-slate-600'
                    }`}
                  >
                    <Star className={`w-5 h-5 ${ratingScore >= star ? 'fill-amber-400' : ''}`} />
                  </button>
                ))}
                <span className="ml-2 font-bold text-amber-300 text-sm">{ratingScore}.0</span>
              </div>
            </div>

            {/* Detailed Sliders */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Punctuality: {punctualityScore}/5</label>
                <input 
                  type="range" min="1" max="5" 
                  value={punctualityScore} 
                  onChange={(e) => setPunctualityScore(Number(e.target.value))}
                  className="w-full accent-brand-500"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Clarity &amp; Helpfulness: {clarityScore}/5</label>
                <input 
                  type="range" min="1" max="5" 
                  value={clarityScore} 
                  onChange={(e) => setClarityScore(Number(e.target.value))}
                  className="w-full accent-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Written Review</label>
              <textarea 
                required
                minLength={5}
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Share constructive feedback regarding topics covered, mentoring style, and takeaways..."
                rows={3}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <button
              type="submit"
              disabled={ratingSubmitting}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-dark-bg font-bold text-xs transition-colors"
            >
              {ratingSubmitting ? 'Recording Rating...' : 'Submit Rating & Update Bayesian Trust'}
            </button>
          </form>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: SUBMIT DISPUTE */}
      {/* ============================================================ */}
      {disputeSession && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <form onSubmit={handleSubmitDispute} className="glass-panel w-full max-w-md rounded-3xl border border-rose-500/40 shadow-2xl p-6 relative space-y-4">
            <button type="button" onClick={() => setDisputeSession(null)} className="absolute right-4 top-4 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Open Campus Dispute</h3>
                <p className="text-xs text-slate-400">Escrow credits will freeze pending moderator review</p>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Dispute Reason</label>
              <select
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2"
              >
                <option value="NO_SHOW">Participant No-Show</option>
                <option value="INCOMPLETE">Incomplete / Ended Prematurely</option>
                <option value="WRONG_SKILL">Skill Mismatch / Inaccurate Knowledge</option>
                <option value="CREDIT_FRAUD">Credit Farming / Unethical Activity</option>
                <option value="OTHER">Other Issue</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Details &amp; Evidence</label>
              <textarea 
                required
                minLength={10}
                value={disputeDetails}
                onChange={(e) => setDisputeDetails(e.target.value)}
                placeholder="Describe what occurred during the scheduled session window..."
                rows={3}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <button
              type="submit"
              disabled={disputeSubmitting}
              className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors"
            >
              {disputeSubmitting ? 'Opening Dispute...' : 'Submit Dispute to Moderator'}
            </button>
          </form>
        </div>
      )}

    </div>
  );
}
