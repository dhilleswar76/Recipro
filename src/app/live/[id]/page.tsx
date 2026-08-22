'use client';

import React, { useState, useEffect } from 'react';
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
  Sparkles
} from 'lucide-react';

export default function LiveRoomPage() {
  const params = useParams();
  const sessionId = params.id as string;
  const router = useRouter();
  const { user, refreshUser } = useAuth();

  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [screenShare, setScreenShare] = useState(false);

  const [codeContent, setCodeContent] = useState(`// SkillSwap Campus Collaborative Peer Scratchpad
// Topic: Smart Contract Checks-Effects-Interactions Pattern

function withdraw(uint256 amount) external nonReentrant {
    // 1. Checks
    require(balances[msg.sender] >= amount, "Insufficient balance");
    
    // 2. Effects
    balances[msg.sender] -= amount;
    
    // 3. Interactions
    (bool success, ) = msg.sender.call{value: amount}("");
    require(success, "Transfer failed");
}
`);

  const [chatMessages, setChatMessages] = useState<Array<{ sender: string; text: string; time: string }>>([
    { sender: 'System', text: 'Secure WebRTC Peer Signaling session initialized.', time: '18:00' },
    { sender: 'Peer Mentor', text: 'Welcome! Ready to dive into today\'s coding review.', time: '18:01' },
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [completing, setCompleting] = useState(false);
  const [completionSuccess, setCompletionSuccess] = useState(false);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    setChatMessages(prev => [
      ...prev,
      { sender: user?.display_name || 'You', text: newMessage, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
    ]);
    setNewMessage('');
  };

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
        await refreshUser();
        setTimeout(() => {
          router.push('/sessions');
        }, 2000);
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

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-4">
      
      {/* Room Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-brand-400 animate-ping" />
          <div>
            <h1 className="text-base font-bold text-white flex items-center gap-2">
              Live Mentorship Room: {sessionId.substring(0, 16)}...
              <span className="text-[10px] px-2 py-0.5 rounded bg-brand-500/20 text-brand-400 font-semibold border border-brand-500/30">
                1 Credit in Escrow
              </span>
            </h1>
            <p className="text-xs text-slate-400">Collaborative Audio/Video, Live Code Scratchpad &amp; Chat</p>
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
                <CheckCircle2 className="w-4 h-4" /> End &amp; Confirm Session
              </>
            )}
          </button>

          <button
            onClick={() => router.push('/sessions')}
            className="p-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-slate-700 transition-colors"
            title="Leave room"
          >
            <PhoneOff className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Grid: Video Feeds + Collaborative Code + Chat */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Left 2 Cols: Video Simulation & Code Scratchpad */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Video Streams Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            
            {/* Stream 1: User Camera */}
            <div className="glass-panel h-48 sm:h-56 rounded-2xl border border-slate-800 relative flex items-center justify-center overflow-hidden bg-slate-950">
              {cameraOn ? (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-950 relative">
                  <div className="w-16 h-16 rounded-full bg-brand-500/20 border border-brand-500/40 flex items-center justify-center text-brand-300 font-extrabold text-xl animate-pulse">
                    {user?.display_name?.substring(0, 2).toUpperCase() || 'ME'}
                  </div>
                  <span className="text-xs text-slate-300 font-medium mt-2">Active Camera Stream (720p HD)</span>
                </div>
              ) : (
                <div className="text-center text-slate-500 text-xs">
                  <VideoOff className="w-8 h-8 mx-auto mb-1" /> Camera Disabled
                </div>
              )}
              <div className="absolute bottom-3 left-3 bg-black/60 px-2 py-0.5 rounded text-[11px] text-white backdrop-blur-sm">
                You ({user?.display_name || 'Student'})
              </div>
            </div>

            {/* Stream 2: Peer Mentor Stream */}
            <div className="glass-panel h-48 sm:h-56 rounded-2xl border border-slate-800 relative flex items-center justify-center overflow-hidden bg-slate-950">
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-indigo-950/40 to-slate-950 relative">
                <div className="w-16 h-16 rounded-full bg-accent-500/20 border border-accent-500/40 flex items-center justify-center text-accent-300 font-extrabold text-xl">
                  PM
                </div>
                <span className="text-xs text-slate-300 font-medium mt-2">Peer Mentor Stream Connected</span>
              </div>
              <div className="absolute bottom-3 left-3 bg-black/60 px-2 py-0.5 rounded text-[11px] text-white backdrop-blur-sm flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-brand-400"></span>
                <span>Peer Mentor</span>
              </div>
            </div>

          </div>

          {/* Video Control Bar */}
          <div className="glass-panel p-2.5 rounded-xl border border-slate-800 flex items-center justify-center gap-3">
            <button
              onClick={() => setMicOn(!micOn)}
              className={`p-2.5 rounded-xl transition-colors ${
                micOn ? 'bg-slate-800 text-white' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              }`}
            >
              {micOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setCameraOn(!cameraOn)}
              className={`p-2.5 rounded-xl transition-colors ${
                cameraOn ? 'bg-slate-800 text-white' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              }`}
            >
              {cameraOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setScreenShare(!screenShare)}
              className={`p-2.5 rounded-xl transition-colors ${
                screenShare ? 'bg-brand-500 text-dark-bg font-bold' : 'bg-slate-800 text-white'
              }`}
            >
              <Monitor className="w-4 h-4" />
            </button>
          </div>

          {/* Collaborative Code & Scratchpad */}
          <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
            <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-300 font-semibold">
                <Code className="w-4 h-4 text-brand-400" />
                <span>Shared Code &amp; Notes Scratchpad</span>
              </div>
              <span className="text-[11px] text-slate-500">Auto-synced</span>
            </div>
            <textarea
              value={codeContent}
              onChange={(e) => setCodeContent(e.target.value)}
              rows={10}
              className="w-full bg-slate-950 p-4 font-mono text-xs text-brand-300 focus:outline-none resize-none leading-relaxed"
            />
          </div>

        </div>

        {/* Right 1 Col: Live In-Room Chat Stream */}
        <div className="glass-panel rounded-2xl border border-slate-800 flex flex-col h-[580px] overflow-hidden">
          
          <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-accent-400" />
              <h3 className="font-bold text-white text-xs">Session Chat</h3>
            </div>
            <span className="text-[10px] text-brand-400 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Encrypted
            </span>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {chatMessages.map((msg, idx) => (
              <div key={idx} className="space-y-0.5 text-xs">
                <div className="flex items-center justify-between text-[10px] text-slate-500">
                  <span className="font-semibold text-slate-300">{msg.sender}</span>
                  <span>{msg.time}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 leading-relaxed">
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800 bg-slate-900/60 flex items-center gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type message or share code snippet..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
            />
            <button
              type="submit"
              className="p-2 rounded-xl bg-brand-500 hover:bg-brand-400 text-dark-bg transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>

      </div>

    </div>
  );
}
