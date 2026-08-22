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
  ShieldCheck
} from 'lucide-react';

export default function SessionsPage() {
  const { user, refreshUser } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

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
          score: Number(ratingScore),
          review: reviewText,
          punctualityScore: Number(punctualityScore),
          clarityScore: Number(clarityScore),
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
      console.error('Rating submit error:', err);
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
      // 1. Transition session state to DISPUTED
      await fetch(`/api/sessions/${disputeSession.id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'DISPUTE',
          idempotencyKey: `disp-${disputeSession.id}-${Date.now()}`,
          reason: disputeDetails,
        }),
      });

      // 2. Record official report in moderation queue
      const reportedId = disputeSession.teacher_id === user?.id ? disputeSession.learner_id : disputeSession.teacher_id;
      await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportedId,
          sessionId: disputeSession.id,
          reason: disputeReason,
          details: disputeDetails,
        }),
      });

      setDisputeSession(null);
      setDisputeDetails('');
      await fetchSessions();
      await refreshUser();
    } catch (err) {
      console.error('Dispute submit error:', err);
    } finally {
      setDisputeSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-white">
            Session &amp; Escrow Manager
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Track your scheduled learning sessions, live rooms, and escrow credit settlements.
          </p>
        </div>

        <Link
          href="/explore"
          className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-400 text-dark-bg font-bold text-xs shadow-glow-brand transition-all self-start sm:self-auto flex items-center gap-1.5"
        >
          Book Another Session <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Escrow Rule Banner */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center font-bold">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-white">Automated Escrow Protection</span>
            <p className="text-slate-400 text-[11px]">1 Skill Credit reserved upon request &rarr; released to mentor upon double completion confirmation.</p>
          </div>
        </div>
        <Link href="/wallet" className="text-brand-400 font-semibold hover:underline text-[11px] whitespace-nowrap">
          View On-Chain Ledger &rarr;
        </Link>
      </div>

      {/* Sessions Feed */}
      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400">
          Loading active and historical campus sessions...
        </div>
      ) : sessions.length === 0 ? (
        <div className="glass-panel p-12 rounded-3xl border border-slate-800 text-center space-y-4">
          <Calendar className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No Sessions Scheduled Yet</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Find a peer mentor on the Explore page or add skills to your profile so other students can request sessions from you!
          </p>
          <Link
            href="/explore"
            className="inline-flex px-5 py-2.5 rounded-xl bg-brand-500 text-dark-bg font-bold text-xs shadow-glow-brand"
          >
            Explore Mentors Now
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((sess) => {
            const isTeacher = sess.teacher_id === user?.id;
            const counterpartyName = isTeacher ? sess.learner_name : sess.teacher_name;
            const counterpartyCollege = isTeacher ? sess.learner_college : sess.teacher_college;
            const roleBadge = isTeacher ? 'Teaching Mentor' : 'Learner';

            return (
              <div key={sess.id} className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4 glass-panel-hover">
                
                {/* Session Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center font-bold text-xs text-white">
                      {isTeacher ? 'TEACH' : 'LEARN'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-white text-base">{sess.title}</h3>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${
                          sess.status === 'CREDIT_SETTLED' ? 'bg-brand-500/20 text-brand-400 border-brand-500/30' :
                          sess.status === 'IN_PROGRESS' ? 'bg-accent-500/20 text-accent-400 border-accent-500/30 animate-pulse' :
                          sess.status === 'DISPUTED' ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' :
                          'bg-slate-800 text-slate-300 border-slate-700'
                        }`}>
                          {sess.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        With <strong className="text-slate-200">{counterpartyName}</strong> ({counterpartyCollege}) • <span className="text-brand-400">{roleBadge}</span>
                      </p>
                    </div>
                  </div>

                  {/* Scheduled Time & Credits */}
                  <div className="flex items-center gap-4 text-xs self-start sm:self-auto">
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>{new Date(sess.scheduled_start).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                    </div>
                    <div className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-brand-400 font-bold">
                      {sess.credits_amount} Credit
                    </div>
                  </div>
                </div>

                {sess.notes && (
                  <p className="text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80">
                    <span className="text-slate-400 font-medium">Session Goal: </span>{sess.notes}
                  </p>
                )}

                {/* State-Dependent Action Buttons */}
                <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  
                  {/* Left: State status indicators */}
                  <div className="text-[11px] text-slate-400 flex items-center gap-2">
                    {sess.status === 'REQUESTED' && <span>Awaiting mentor acceptance. Escrow locked.</span>}
                    {sess.status === 'ACCEPTED' && <span>Session accepted! Ready to start when scheduled.</span>}
                    {sess.status === 'PENDING_CONFIRMATION' && (
                      <span className="text-amber-300">
                        {isTeacher 
                          ? (sess.teacher_confirmed ? 'You confirmed. Waiting for learner confirmation.' : 'Learner has confirmed. Please confirm completion to settle credit!')
                          : (sess.learner_confirmed ? 'You confirmed. Waiting for mentor confirmation.' : 'Mentor has confirmed. Please confirm completion to release escrow!')
                        }
                      </span>
                    )}
                    {sess.status === 'CREDIT_SETTLED' && (
                      <span className="text-brand-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> 1 Credit Settled to Mentor
                      </span>
                    )}
                    {sess.status === 'DISPUTED' && (
                      <span className="text-rose-400 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> Under Moderator Review (Credits Frozen)
                      </span>
                    )}
                  </div>

                  {/* Right: Interactive Actions */}
                  <div className="flex flex-wrap items-center gap-2">
                    
                    {/* Teacher: Accept / Reject Request */}
                    {sess.status === 'REQUESTED' && isTeacher && (
                      <>
                        <button
                          onClick={() => handleSessionAction(sess.id, 'CANCEL')}
                          disabled={actionLoading === sess.id}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-300 font-semibold text-xs border border-slate-700"
                        >
                          Decline Request
                        </button>
                        <button
                          onClick={() => handleSessionAction(sess.id, 'ACCEPT')}
                          disabled={actionLoading === sess.id}
                          className="px-4 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-400 text-dark-bg font-bold text-xs shadow-glow-brand"
                        >
                          Accept Session Request
                        </button>
                      </>
                    )}

                    {/* Learner: Cancel Request before Accepted */}
                    {sess.status === 'REQUESTED' && !isTeacher && (
                      <button
                        onClick={() => handleSessionAction(sess.id, 'CANCEL')}
                        disabled={actionLoading === sess.id}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700"
                      >
                        Cancel Request &amp; Refund Escrow
                      </button>
                    )}

                    {/* Join Live Session Room */}
                    {(sess.status === 'ACCEPTED' || sess.status === 'IN_PROGRESS' || sess.status === 'PENDING_CONFIRMATION') && (
                      <Link
                        href={`/live/${sess.id}`}
                        className="px-4 py-1.5 rounded-lg bg-accent-500 hover:bg-accent-400 text-white font-bold text-xs shadow-glow-accent flex items-center gap-1.5"
                      >
                        <Video className="w-3.5 h-3.5" /> Enter Live Peer Room
                      </Link>
                    )}

                    {/* Confirm Completion */}
                    {(sess.status === 'IN_PROGRESS' || sess.status === 'PENDING_CONFIRMATION') && (
                      <button
                        onClick={() => handleSessionAction(sess.id, 'CONFIRM_COMPLETION')}
                        disabled={actionLoading === sess.id}
                        className="px-4 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-400 text-dark-bg font-bold text-xs shadow-glow-brand"
                      >
                        Confirm Session Complete
                      </button>
                    )}

                    {/* Submit Rating if Settled and not yet rated */}
                    {sess.status === 'CREDIT_SETTLED' && !sess.rating_id && (
                      <button
                        onClick={() => setRatingSession(sess)}
                        className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-dark-bg font-bold text-xs flex items-center gap-1"
                      >
                        <Star className="w-3.5 h-3.5 fill-dark-bg" /> Leave Peer Review
                      </button>
                    )}

                    {/* Flag Dispute if not resolved */}
                    {sess.status !== 'DISPUTED' && sess.status !== 'CANCELLED' && (
                      <button
                        onClick={() => setDisputeSession(sess)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-rose-400 text-xs border border-slate-800"
                        title="Report an issue with this session"
                      >
                        <ShieldAlert className="w-3.5 h-3.5" />
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
      {/* MODAL: SUBMIT PEER RATING & REVIEW */}
      {/* ============================================================ */}
      {ratingSession && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
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
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
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
              {disputeSubmitting ? 'Freezing Escrow...' : 'Submit to Campus Moderator Queue'}
            </button>
          </form>
        </div>
      )}

    </div>
  );
}
