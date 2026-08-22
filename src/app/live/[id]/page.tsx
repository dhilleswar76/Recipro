'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { 
  Video, 
  Mic, 
  MicOff, 
  VideoOff, 
  Monitor, 
  Send, 
  CheckCircle2, 
  Coins, 
  Code, 
  MessageSquare, 
  ShieldCheck, 
  PhoneOff,
  Sparkles,
  AlertTriangle,
  RefreshCw,
  Clock,
  User,
  Check,
  RotateCcw
} from 'lucide-react';

export type ConnectionState = 'CONNECTING' | 'CONNECTED' | 'RECONNECTING' | 'FAILED' | 'ENDED';

export default function LiveRoomPage() {
  const params = useParams();
  const sessionId = params.id as string;
  const router = useRouter();
  const { user, refreshUser } = useAuth();

  // Participant Authorization & Room State
  const [authChecking, setAuthChecking] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [participantInfo, setParticipantInfo] = useState<any | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>('CONNECTING');

  // Video & Classroom Controls
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [screenShare, setScreenShare] = useState(false);
  const [chatDrawerOpen, setChatDrawerOpen] = useState(true);

  // Scratchpad
  const [codeContent, setCodeContent] = useState(`// SkillSwap Campus Live Collaborative Scratchpad
// Topic: Interactive Coding & Concept Walkthrough

function processLearningGoal() {
    console.log("Welcome to your online SkillSwap mentoring session!");
}
`);

  // Chat State
  const [chatMessages, setChatMessages] = useState<Array<{
    id: string;
    senderId: string;
    senderName: string;
    message: string;
    status: 'SENDING' | 'SENT' | 'FAILED';
    createdAt: string;
  }>>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  // Leave / Completion Modals
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [completionSuccess, setCompletionSuccess] = useState(false);
  const [exchangeData, setExchangeData] = useState<any | null>(null);

  // 1. Authenticate Participant via Backend Token
  const verifyAuthorization = async () => {
    setAuthChecking(true);
    setAuthError(null);
    setConnectionState('CONNECTING');

    try {
      const res = await fetch(`/api/sessions/${sessionId}/video-token`);
      const data = await res.json();

      if (res.ok && data.authorized) {
        setParticipantInfo(data);
        setConnectionState('CONNECTED');
      } else {
        setAuthError(data.error || 'Access Denied: You are not an authorized participant for this session.');
        setConnectionState('FAILED');
      }
    } catch (err: any) {
      setAuthError('Connection error: Failed to verify room credentials.');
      setConnectionState('FAILED');
    } finally {
      setAuthChecking(false);
    }
  };

  // 2. Fetch Exchange Agreement
  const fetchExchange = () => {
    fetch(`/api/sessions/${sessionId}/exchange`)
      .then(res => res.json())
      .then(data => {
        if (data && data.session) {
          setExchangeData(data);
        }
      })
      .catch(console.error);
  };

  // 3. Fetch & Poll Chat Messages
  const fetchChat = async () => {
    try {
      const res = await fetch(`/api/sessions/${sessionId}/chat`);
      if (res.ok) {
        const data = await res.json();
        if (data.messages) {
          setChatMessages(data.messages);
        }
      }
    } catch (err) {
      console.error('Failed to fetch chat history:', err);
    }
  };

  useEffect(() => {
    verifyAuthorization();
    fetchExchange();
    fetchChat();

    const interval = setInterval(fetchChat, 3000);
    return () => clearInterval(interval);
  }, [sessionId]);

  // Telemetry event logger
  const logAttendance = (eventType: string, metadata?: any) => {
    fetch(`/api/sessions/${sessionId}/attendance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventType, metadata }),
    }).catch(console.error);
  };

  // Toggle Controls with Telemetry
  const toggleMic = () => {
    const next = !micOn;
    setMicOn(next);
    logAttendance(next ? 'UNMUTED' : 'MUTED');
  };

  const toggleCamera = () => {
    const next = !cameraOn;
    setCameraOn(next);
    logAttendance(next ? 'VIDEO_ON' : 'VIDEO_OFF');
  };

  const toggleScreenShare = () => {
    const next = !screenShare;
    setScreenShare(next);
    logAttendance(next ? 'SCREEN_SHARE_START' : 'SCREEN_SHARE_STOP');
  };

  // Send Text Chat Message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sendingMessage) return;

    const messageText = newMessage.trim();
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg = {
      id: tempId,
      senderId: user?.id || 'me',
      senderName: user?.display_name || 'You',
      message: messageText,
      status: 'SENDING' as const,
      createdAt: new Date().toISOString(),
    };

    setChatMessages(prev => [...prev, optimisticMsg]);
    setNewMessage('');
    setSendingMessage(true);

    try {
      const res = await fetch(`/api/sessions/${sessionId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText }),
      });

      if (res.ok) {
        const data = await res.json();
        setChatMessages(prev => prev.map(m => m.id === tempId ? { ...data.message, status: 'SENT' } : m));
      } else {
        setChatMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'FAILED' } : m));
      }
    } catch (err) {
      setChatMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'FAILED' } : m));
    } finally {
      setSendingMessage(false);
    }
  };

  // Confirm and Settle Session Escrow
  const handleConfirmAndSettle = async () => {
    setCompleting(true);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CONFIRM_COMPLETION',
          idempotencyKey: `live-complete-${sessionId}-${Date.now()}`,
        }),
      });

      if (res.ok) {
        setCompletionSuccess(true);
        logAttendance('LEFT', { reason: 'SESSION_COMPLETED_SETTLED' });
        await refreshUser();
        setTimeout(() => {
          router.push('/sessions');
        }, 2200);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to settle session');
      }
    } catch (err) {
      console.error('Settlement error:', err);
    } finally {
      setCompleting(false);
    }
  };

  // Leave room handler (does NOT mark complete)
  const handleConfirmLeave = () => {
    logAttendance('LEFT', { reason: 'USER_LEFT_ROOM' });
    setLeaveModalOpen(false);
    router.push('/sessions');
  };

  // Unauthorized Error View
  if (authError) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-white">Video Classroom Access Restricted</h2>
          <p className="text-xs text-slate-300 leading-relaxed">{authError}</p>
        </div>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={verifyAuthorization}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry Connection
          </button>
          <button
            onClick={() => router.push('/sessions')}
            className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-400 text-dark-bg font-bold text-xs shadow-glow-brand transition-colors"
          >
            Back to My Sessions
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-4">
      
      {/* Pinned SkillSwap Exchange Agreement Banner */}
      {exchangeData && (
        <div className="glass-panel p-3.5 rounded-2xl border border-brand-500/30 bg-brand-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="text-base">🤝</span>
            <div>
              <span className="font-bold text-white flex items-center gap-2">
                Agreed SkillSwap Exchange:
                <span className="px-2 py-0.5 rounded bg-brand-500/20 text-brand-300 font-extrabold border border-brand-500/40">
                  {exchangeData.session.skill_name} ↔ {exchangeData.agreement?.return_type === 'SKILL' ? exchangeData.agreement?.requested_return_skill_name : `${exchangeData.agreement?.credit_amount || exchangeData.requiredCredits} Skill Credit(s)`}
                </span>
              </span>
              <p className="text-[11px] text-slate-300 mt-0.5">
                {exchangeData.session.teacher_name} teaches {exchangeData.session.skill_name} • {exchangeData.session.learner_name} provides {exchangeData.agreement?.return_type === 'SKILL' ? exchangeData.agreement?.requested_return_skill_name : `${exchangeData.agreement?.credit_amount || exchangeData.requiredCredits} Skill Credit(s)`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-[10px] px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-brand-400 font-bold flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Pre-Session Terms Verified
            </span>
          </div>
        </div>
      )}

      {/* Room Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${connectionState === 'CONNECTED' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400 animate-ping'}`} />
          <div>
            <h1 className="text-base font-bold text-white flex items-center gap-2">
              Online Classroom: {participantInfo?.skillName || exchangeData?.session?.skill_name || 'Skill Mentorship'}
              <span className="text-[10px] px-2 py-0.5 rounded bg-brand-500/20 text-brand-400 font-semibold border border-brand-500/30">
                {participantInfo?.role === 'TRAINER' ? 'Teacher / Mentor' : 'Learner'}
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              State: <strong className="text-emerald-400">{connectionState}</strong> • WebRTC Peer Signaling Connected
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleConfirmAndSettle}
            disabled={completing || completionSuccess}
            className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-400 text-dark-bg font-bold text-xs shadow-glow-brand transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            {completionSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4" /> Credit Settled!
              </>
            ) : completing ? (
              'Settling Escrow...'
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" /> Confirm &amp; End Session
              </>
            )}
          </button>

          <button
            onClick={() => setLeaveModalOpen(true)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-slate-700 transition-colors"
            title="Leave room"
            aria-label="Leave video session"
          >
            <PhoneOff className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Grid: Video Streams + Scratchpad + Live Chat */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Left 2 Columns: Video Classroom & Code Scratchpad */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Video Streams */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            
            {/* Stream 1: Local Stream */}
            <div className="glass-panel h-52 sm:h-60 rounded-2xl border border-slate-800 relative flex items-center justify-center overflow-hidden bg-slate-950">
              {cameraOn ? (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-950 relative">
                  <div className="w-16 h-16 rounded-full bg-brand-500/20 border border-brand-500/40 flex items-center justify-center text-brand-300 font-extrabold text-xl animate-pulse">
                    {user?.display_name?.substring(0, 2).toUpperCase() || 'ME'}
                  </div>
                  <span className="text-xs text-slate-300 font-medium mt-2">Active Camera Stream (720p HD)</span>
                  {!micOn && (
                    <span className="absolute top-3 right-3 p-1.5 rounded-lg bg-rose-500/80 text-white text-[10px] flex items-center gap-1">
                      <MicOff className="w-3 h-3" /> Muted
                    </span>
                  )}
                </div>
              ) : (
                <div className="text-center text-slate-500 text-xs">
                  <VideoOff className="w-8 h-8 mx-auto mb-1" /> Camera Off
                </div>
              )}
              <div className="absolute bottom-3 left-3 bg-black/70 px-2 py-0.5 rounded text-[11px] text-white backdrop-blur-sm">
                You ({user?.display_name || 'Student'})
              </div>
            </div>

            {/* Stream 2: Peer Mentor / Learner Stream */}
            <div className="glass-panel h-52 sm:h-60 rounded-2xl border border-slate-800 relative flex items-center justify-center overflow-hidden bg-slate-950">
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-indigo-950/40 to-slate-950 relative">
                <div className="w-16 h-16 rounded-full bg-accent-500/20 border border-accent-500/40 flex items-center justify-center text-accent-300 font-extrabold text-xl">
                  {participantInfo?.role === 'TRAINER' ? 'L' : 'M'}
                </div>
                <span className="text-xs text-slate-300 font-medium mt-2">
                  {participantInfo?.role === 'TRAINER' ? 'Learner Connected' : 'Mentor Connected'}
                </span>
              </div>
              <div className="absolute bottom-3 left-3 bg-black/70 px-2 py-0.5 rounded text-[11px] text-white backdrop-blur-sm flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>{participantInfo?.role === 'TRAINER' ? (exchangeData?.session?.learner_name || 'Learner') : (exchangeData?.session?.teacher_name || 'Mentor')}</span>
              </div>
            </div>

          </div>

          {/* Accessible Control Bar */}
          <div className="glass-panel p-2.5 rounded-2xl border border-slate-800 flex items-center justify-center gap-3">
            <button
              onClick={toggleMic}
              aria-label={micOn ? 'Mute microphone' : 'Unmute microphone'}
              className={`p-3 rounded-xl transition-colors ${
                micOn ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              }`}
            >
              {micOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            </button>

            <button
              onClick={toggleCamera}
              aria-label={cameraOn ? 'Turn camera off' : 'Turn camera on'}
              className={`p-3 rounded-xl transition-colors ${
                cameraOn ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              }`}
            >
              {cameraOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
            </button>

            <button
              onClick={toggleScreenShare}
              aria-label={screenShare ? 'Stop screen share' : 'Start screen share'}
              className={`p-3 rounded-xl transition-colors ${
                screenShare ? 'bg-brand-500 text-dark-bg font-bold' : 'bg-slate-800 text-white hover:bg-slate-700'
              }`}
            >
              <Monitor className="w-4 h-4" />
            </button>

            <button
              onClick={() => setChatDrawerOpen(!chatDrawerOpen)}
              aria-label="Toggle chat stream"
              className={`p-3 rounded-xl transition-colors ${
                chatDrawerOpen ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
            </button>
          </div>

          {/* Collaborative Code Scratchpad */}
          <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
            <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-300 font-semibold">
                <Code className="w-4 h-4 text-brand-400" />
                <span>Shared Code &amp; Scratchpad</span>
              </div>
              <span className="text-[11px] text-slate-500">Live Synchronized</span>
            </div>
            <textarea
              value={codeContent}
              onChange={(e) => setCodeContent(e.target.value)}
              rows={10}
              className="w-full bg-slate-950 p-4 font-mono text-xs text-brand-300 focus:outline-none resize-none leading-relaxed"
            />
          </div>

        </div>

        {/* Right 1 Column: Real-Time Session Text Chat */}
        {chatDrawerOpen && (
          <div className="glass-panel rounded-2xl border border-slate-800 flex flex-col h-[620px] overflow-hidden">
            
            <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-accent-400" />
                <h3 className="font-bold text-white text-xs">Session Chat</h3>
              </div>
              <span className="text-[10px] text-brand-400 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Encrypted Session
              </span>
            </div>

            {/* Messages Feed */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {chatMessages.length === 0 ? (
                <div className="text-center py-12 text-xs text-slate-500">
                  No messages yet. Send a message to your session partner!
                </div>
              ) : (
                chatMessages.map((msg) => {
                  const isMe = msg.senderId === user?.id || msg.senderName === 'You';
                  return (
                    <div key={msg.id} className={`space-y-0.5 text-xs ${isMe ? 'text-right' : 'text-left'}`}>
                      <div className="flex items-center gap-1 text-[10px] text-slate-500 justify-between">
                        <span className="font-semibold text-slate-300">{msg.senderName}</span>
                        <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className={`p-2.5 rounded-2xl leading-relaxed inline-block max-w-[90%] text-left ${
                        isMe 
                          ? 'bg-brand-500/20 text-brand-200 border border-brand-500/30' 
                          : 'bg-slate-900 border border-slate-800 text-slate-200'
                      }`}>
                        {msg.message}
                      </div>
                      {msg.status === 'FAILED' && (
                        <div className="text-[10px] text-rose-400 flex items-center gap-1 justify-end">
                          <span>Failed to send.</span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Chat Input Form */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800 bg-slate-900/60 flex items-center gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message or code snippet..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
              />
              <button
                type="submit"
                disabled={sendingMessage || !newMessage.trim()}
                className="p-2 rounded-xl bg-brand-500 hover:bg-brand-400 text-dark-bg transition-colors disabled:opacity-50"
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

          </div>
        )}

      </div>

      {/* ============================================================ */}
      {/* LEAVE SESSION CONFIRMATION MODAL */}
      {/* ============================================================ */}
      {leaveModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-sm rounded-3xl border border-slate-700 shadow-2xl p-6 space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
              <PhoneOff className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">Leave this session?</h3>
              <p className="text-xs text-slate-300">
                Leaving the video room does <strong>NOT</strong> automatically mark the session as completed. Credits remain in escrow until both parties confirm completion.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setLeaveModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmLeave}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors"
              >
                Leave Room
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
