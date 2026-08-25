'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import io, { Socket } from 'socket.io-client';
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
  RotateCcw,
  Volume2,
  Signal,
  Settings,
  ChevronRight,
  ChevronLeft,
  Maximize2,
  X,
  Users,
  Layers,
  FileText,
  Radio
} from 'lucide-react';
import RatingModal from '@/components/RatingModal';

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
  const [roomPresence, setRoomPresence] = useState<any[]>([]);

  // Video Media Streams & WebRTC Refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const processedSignalsRef = useRef<Set<string>>(new Set());
  const iceCandidateQueueRef = useRef<any[]>([]);
  const isInitiatorRef = useRef<boolean>(false);
  const makingOfferRef = useRef<boolean>(false);
  const lastOfferAttemptRef = useRef<number>(0);

  // Socket.io Real-Time Signaling Refs
  const socketRef = useRef<Socket | null>(null);
  const targetSocketIdRef = useRef<string | null>(null);
  const [socketConnected, setSocketConnected] = useState<boolean>(false);

  // Google Meet / Zoom Classroom Controls & Panels
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [screenShare, setScreenShare] = useState(false);
  const [sidePanelOpen, setSidePanelOpen] = useState(false);
  const [activeSideTab, setActiveSideTab] = useState<'CHAT' | 'SCRATCHPAD' | 'DETAILS'>('CHAT');
  const [meetingSeconds, setMeetingSeconds] = useState(0);
  const [hasRealWebcam, setHasRealWebcam] = useState(false);
  const [hasRemotePeerStream, setHasRemotePeerStream] = useState(false);
  const [videoEngine, setVideoEngine] = useState<'SOCKET_WEBRTC' | 'STUDIO'>('SOCKET_WEBRTC');

  // Scratchpad
  const [codeContent, setCodeContent] = useState(`// SkillSwap Campus Live Collaborative Scratchpad
// Topic: Interactive Coding & Peer Review

function processLearningGoal() {
    console.log("Welcome to your live SkillSwap peer mentoring classroom!");
}
`);
  const [scratchpadSaved, setScratchpadSaved] = useState(true);

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

  // Leave / Completion / Rating Modals
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [completionSuccess, setCompletionSuccess] = useState(false);
  const [exchangeData, setExchangeData] = useState<any | null>(null);

  // Multi-Region STUN / TURN Configuration
  const RTC_CONFIG: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' },
      { urls: 'stun:stun.relay.metered.ca:80' },
      { urls: 'stun:openrelay.metered.ca:80' },
    ],
  };

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
        if (data.role === 'TRAINER') {
          isInitiatorRef.current = true;
        }
        await initializeMediaStreams(data);
      } else {
        setAuthError(data.error || 'Access Denied: You are not authorized to enter this video session.');
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

  // 4. Fetch & Poll Collaborative Scratchpad
  const fetchScratchpad = async () => {
    try {
      const res = await fetch(`/api/sessions/${sessionId}/scratchpad`);
      if (res.ok) {
        const data = await res.json();
        if (data.content && data.content !== codeContent && scratchpadSaved) {
          setCodeContent(data.content);
        }
      }
    } catch (err) {
      console.error('Failed to fetch scratchpad:', err);
    }
  };

  // WebRTC Signal Sender Helper
  const sendSignal = async (signalType: string, payload: any) => {
    try {
      await fetch(`/api/sessions/${sessionId}/signaling`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signalType, payload }),
      });
    } catch (err) {
      console.error('Error sending WebRTC signal:', err);
    }
  };

  // Flush Queued ICE Candidates Once Remote Description is Set
  const flushIceCandidates = async (pc: RTCPeerConnection) => {
    while (iceCandidateQueueRef.current.length > 0) {
      const cand = iceCandidateQueueRef.current.shift();
      if (cand) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(cand));
        } catch (e) {
          console.warn('Applying queued ICE candidate note:', e);
        }
      }
    }
  };

  // Create & Configure RTCPeerConnection
  const createPeerConnection = (stream?: MediaStream): RTCPeerConnection => {
    if (peerConnectionRef.current) {
      try {
        peerConnectionRef.current.close();
      } catch (e) {}
    }

    const pc = new RTCPeerConnection(RTC_CONFIG);
    peerConnectionRef.current = pc;

    // Attach all local tracks (Microphone & Camera) to WebRTC connection
    const currentStream = stream || localStreamRef.current;
    if (currentStream) {
      currentStream.getTracks().forEach(track => {
        try {
          pc.addTrack(track, currentStream);
        } catch (e) {
          console.warn('Track already added:', e);
        }
      });
    }

    // Ensure audio and video transceivers exist so SDP always includes sendrecv for both audio & video
    try {
      if (!pc.getTransceivers().some(t => t.receiver.track.kind === 'audio')) {
        pc.addTransceiver('audio', { direction: 'sendrecv' });
      }
      if (!pc.getTransceivers().some(t => t.receiver.track.kind === 'video')) {
        pc.addTransceiver('video', { direction: 'sendrecv' });
      }
    } catch (e) {}

    // Handle incoming opponent Audio & Video stream (individual tracks or bundled streams)
    pc.ontrack = (event) => {
      console.log('Received remote media track:', event.track.kind, event.streams);
      let incomingStream: MediaStream | null = null;
      if (event.streams && event.streams[0]) {
        incomingStream = event.streams[0];
      } else if (remoteVideoRef.current && remoteVideoRef.current.srcObject instanceof MediaStream) {
        incomingStream = remoteVideoRef.current.srcObject;
        incomingStream.addTrack(event.track);
      } else {
        incomingStream = new MediaStream([event.track]);
      }

      if (remoteVideoRef.current && incomingStream) {
        remoteVideoRef.current.srcObject = incomingStream;
        remoteVideoRef.current.play().catch(e => console.log('Remote playback notice:', e));
      }
      setHasRemotePeerStream(true);
      setConnectionState('CONNECTED');
    };

    // Forward ICE Candidates to Opponent via Socket.io & HTTP Signaling
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        if (socketRef.current && targetSocketIdRef.current) {
          socketRef.current.emit('signal', {
            to: targetSocketIdRef.current,
            signalData: { type: 'candidate', candidate: event.candidate.toJSON() },
          });
        }
        sendSignal('ICE_CANDIDATE', event.candidate.toJSON());
      }
    };

    // Monitor Connection State
    pc.onconnectionstatechange = () => {
      console.log('WebRTC connection state:', pc.connectionState);
      if (pc.connectionState === 'connected') {
        setConnectionState('CONNECTED');
        setHasRemotePeerStream(true);
      } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        setConnectionState('RECONNECTING');
      }
    };

    return pc;
  };

  // Initiate WebRTC Call Offer
  const initiateWebRTCCall = async (pcInstance?: RTCPeerConnection) => {
    const pc = pcInstance || peerConnectionRef.current || createPeerConnection();
    if (makingOfferRef.current) return;
    if (pc.signalingState !== 'stable') return;

    try {
      makingOfferRef.current = true;
      lastOfferAttemptRef.current = Date.now();

      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });

      if (pc.signalingState !== 'stable') return;
      await pc.setLocalDescription(offer);
      await sendSignal('OFFER', offer);
      console.log('WebRTC Offer sent to opponent.');
    } catch (err) {
      console.error('Error creating WebRTC offer:', err);
    } finally {
      makingOfferRef.current = false;
    }
  };

  // Poll WebRTC Signaling & Room Presence
  const pollSignaling = async () => {
    try {
      const res = await fetch(`/api/sessions/${sessionId}/signaling`);
      if (!res.ok) return;

      const data = await res.json();

      if (data.presence) {
        setRoomPresence(data.presence);

        // If trainer/host sees learner arrived in presence and call not yet established, initiate offer
        const otherParticipantInPresence = data.presence.some((p: any) => p.user_id !== user?.id);
        const now = Date.now();
        if (otherParticipantInPresence && !hasRemotePeerStream && (now - lastOfferAttemptRef.current > 5000)) {
          const pc = peerConnectionRef.current || createPeerConnection();
          if (pc.signalingState === 'stable' && isInitiatorRef.current) {
            initiateWebRTCCall(pc);
          }
        }
      }

      if (data.signals && Array.isArray(data.signals)) {
        for (const sig of data.signals) {
          if (processedSignalsRef.current.has(sig.id)) continue;
          processedSignalsRef.current.add(sig.id);

          const pc = peerConnectionRef.current || createPeerConnection();

          if (sig.signalType === 'OFFER') {
            try {
              console.log('Received OFFER from opponent, creating ANSWER...');
              if (pc.signalingState !== 'stable') {
                if (!isInitiatorRef.current) {
                  await Promise.all([
                    pc.setLocalDescription({ type: 'rollback' } as any),
                    pc.setRemoteDescription(new RTCSessionDescription(sig.payload))
                  ]);
                } else {
                  continue;
                }
              } else {
                await pc.setRemoteDescription(new RTCSessionDescription(sig.payload));
              }

              await flushIceCandidates(pc);
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              await sendSignal('ANSWER', answer);
            } catch (err) {
              console.error('Error processing OFFER:', err);
            }
          } else if (sig.signalType === 'ANSWER') {
            try {
              console.log('Received ANSWER from opponent...');
              if (pc.signalingState === 'have-local-offer') {
                await pc.setRemoteDescription(new RTCSessionDescription(sig.payload));
                await flushIceCandidates(pc);
              }
            } catch (err) {
              console.error('Error processing ANSWER:', err);
            }
          } else if (sig.signalType === 'ICE_CANDIDATE') {
            try {
              if (sig.payload) {
                if (pc.remoteDescription && pc.remoteDescription.type) {
                  await pc.addIceCandidate(new RTCIceCandidate(sig.payload));
                } else {
                  iceCandidateQueueRef.current.push(sig.payload);
                }
              }
            } catch (err) {
              console.warn('Error adding ICE candidate:', err);
            }
          }
        }
      }
    } catch (err) {
      console.error('Signaling poll error:', err);
    }
  };

  // 5. Initialize Camera & WebRTC Signaling Streams
  const initializeMediaStreams = async (authInfo: any) => {
    try {
      let stream: MediaStream;

      // Access real physical microphone and camera with optimal audio enhancements
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        });
        setHasRealWebcam(true);
      } catch (mediaErr) {
        console.warn('Real webcam unavailable or permission denied, using simulated HD video stream:', mediaErr);
        stream = createSimulatedVideoStream(authInfo.displayName || 'You', authInfo.role || 'LEARNER');
        setHasRealWebcam(false);
      }

      localStreamRef.current = stream;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.play().catch(e => console.log('Local video play note:', e));
      }

      // Initialize WebRTC Peer Connection with the fresh media stream
      const pc = createPeerConnection(stream);

      // Trainer / Host initiates the WebRTC offer
      if (authInfo.role === 'TRAINER') {
        isInitiatorRef.current = true;
        await initiateWebRTCCall(pc);
      }

      // Dispatch presence to backend database
      await fetch(`/api/sessions/${sessionId}/presence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cameraOn: true, micOn: true, screenSharing: false }),
      });

    } catch (err) {
      console.error('Error initializing media stream:', err);
    }
  };

  // Helper: Generates an animated avatar placeholder while peer connects
  const createSimulatedVideoStream = (name: string, role: string, isPeer: boolean = false): MediaStream => {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 360;
    const ctx = canvas.getContext('2d')!;

    let frame = 0;
    const draw = () => {
      frame++;
      
      const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      if (isPeer) {
        grad.addColorStop(0, '#0f172a');
        grad.addColorStop(0.5, '#1e1b4b');
        grad.addColorStop(1, '#090d16');
      } else {
        grad.addColorStop(0, '#091524');
        grad.addColorStop(0.5, '#06282d');
        grad.addColorStop(1, '#020617');
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2 - 10;
      const pulse = Math.sin(frame * 0.05) * 6;

      ctx.beginPath();
      ctx.arc(cx, cy, 75 + pulse, 0, Math.PI * 2);
      ctx.fillStyle = isPeer ? 'rgba(99, 102, 241, 0.15)' : 'rgba(20, 184, 166, 0.15)';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(cx, cy, 60, 0, Math.PI * 2);
      ctx.fillStyle = isPeer ? '#4f46e5' : '#0d9488';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = isPeer ? '#818cf8' : '#2dd4bf';
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx, cy - 10, 26, 0, Math.PI * 2);
      ctx.fillStyle = '#fde047';
      ctx.fill();

      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(cx - 8, cy - 12, 3, 0, Math.PI * 2);
      ctx.arc(cx + 8, cy - 12, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(cx, cy - 8, 9, 0.2 * Math.PI, 0.8 * Math.PI, false);
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#1e293b';
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx, cy + 50, 42, Math.PI, 0, false);
      ctx.fillStyle = isPeer ? '#3730a3' : '#115e59';
      ctx.fill();

      ctx.font = 'bold 13px system-ui, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText(name, cx, cy + 78);

      animationFrameRef.current = requestAnimationFrame(draw);
    };

    draw();
    return canvas.captureStream(30);
  };

  useEffect(() => {
    verifyAuthorization();
    fetchExchange();
    fetchChat();
    fetchScratchpad();

    // Meeting Duration Timer
    const durationTimer = setInterval(() => {
      setMeetingSeconds(s => s + 1);
    }, 1000);

    // Fast 1000ms polling for real-time presence & fallback signaling
    const interval = setInterval(() => {
      pollSignaling();
    }, 1000);

    return () => {
      clearInterval(durationTimer);
      clearInterval(interval);
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [sessionId]);

  // Connect Socket.io signaling once participant is verified
  useEffect(() => {
    if (participantInfo) {
      initSocketSignaling();
    }
  }, [participantInfo]);

  const formatDuration = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Initialize Socket.io Real-Time Signaling Server Connection
  const initSocketSignaling = async () => {
    try {
      // Ensure Socket.io API route is warm
      await fetch('/api/socket').catch(() => {});

      if (socketRef.current) {
        socketRef.current.disconnect();
      }

      const socket = io({
        path: '/api/socketio',
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 15,
        reconnectionDelay: 1000,
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        setSocketConnected(true);
        console.log('[Socket.io] Connected to signaling channel:', socket.id);
        socket.emit('join-room', {
          roomId: sessionId,
          userId: user?.id,
          userName: user?.display_name || participantInfo?.displayName || 'Participant',
          role: participantInfo?.role,
        });
      });

      socket.on('disconnect', () => {
        setSocketConnected(false);
      });

      socket.on('room-users', async ({ users }: { users: any[] }) => {
        console.log('[Socket.io] Existing room users:', users);
        if (users.length > 0) {
          const peer = users[0];
          targetSocketIdRef.current = peer.socketId;
          const pc = peerConnectionRef.current || createPeerConnection();
          if (isInitiatorRef.current || participantInfo?.role === 'TRAINER') {
            try {
              const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
              await pc.setLocalDescription(offer);
              socket.emit('signal', {
                to: peer.socketId,
                signalData: { type: 'offer', sdp: offer.sdp },
              });
            } catch (e) {
              console.error('Socket.io offer failed:', e);
            }
          }
        }
      });

      socket.on('user-joined', async ({ socketId, userName }: any) => {
        console.log('[Socket.io] User joined:', userName, socketId);
        targetSocketIdRef.current = socketId;
        const pc = peerConnectionRef.current || createPeerConnection();
        try {
          const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
          await pc.setLocalDescription(offer);
          socket.emit('signal', {
            to: socketId,
            signalData: { type: 'offer', sdp: offer.sdp },
          });
        } catch (e) {
          console.error('Socket.io offer on user-joined failed:', e);
        }
      });

      socket.on('signal', async ({ from, signalData }: any) => {
        targetSocketIdRef.current = from;
        const pc = peerConnectionRef.current || createPeerConnection();

        if (signalData.type === 'offer') {
          try {
            console.log('[Socket.io] Received OFFER from peer');
            await pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: signalData.sdp }));
            await flushIceCandidates(pc);
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit('signal', {
              to: from,
              signalData: { type: 'answer', sdp: answer.sdp },
            });
          } catch (e) {
            console.error('Socket.io answer generation error:', e);
          }
        } else if (signalData.type === 'answer') {
          try {
            console.log('[Socket.io] Received ANSWER from peer');
            await pc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: signalData.sdp }));
            await flushIceCandidates(pc);
            setConnectionState('CONNECTED');
            setHasRemotePeerStream(true);
          } catch (e) {
            console.error('Socket.io answer setting error:', e);
          }
        } else if (signalData.type === 'candidate' && signalData.candidate) {
          try {
            if (pc.remoteDescription && pc.remoteDescription.type) {
              await pc.addIceCandidate(new RTCIceCandidate(signalData.candidate));
            } else {
              iceCandidateQueueRef.current.push(signalData.candidate);
            }
          } catch (e) {
            console.warn('Socket.io ICE addition error:', e);
          }
        }
      });

      socket.on('new-message', (msg: any) => {
        setChatMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      });

      socket.on('scratchpad-update', ({ content }: { content: string }) => {
        setCodeContent(content);
        setScratchpadSaved(true);
      });

      socket.on('user-left', () => {
        setHasRemotePeerStream(false);
        setConnectionState('CONNECTING');
      });

    } catch (err) {
      console.error('Failed to initialize Socket.io client:', err);
    }
  };

  // Telemetry event logger
  const logAttendance = (eventType: string, metadata?: any) => {
    fetch(`/api/sessions/${sessionId}/attendance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventType, metadata }),
    }).catch(console.error);
  };

  // Toggle Controls with Telemetry & Database Presence Update
  const toggleMic = async () => {
    const next = !micOn;
    setMicOn(next);
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(t => (t.enabled = next));
    }
    logAttendance(next ? 'UNMUTED' : 'MUTED');
    await fetch(`/api/sessions/${sessionId}/presence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ micOn: next }),
    }).catch(() => {});
  };

  const toggleCamera = async () => {
    const next = !cameraOn;
    setCameraOn(next);
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(t => (t.enabled = next));
    }
    logAttendance(next ? 'VIDEO_ON' : 'VIDEO_OFF');
    await fetch(`/api/sessions/${sessionId}/presence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cameraOn: next }),
    }).catch(() => {});
  };

  const toggleScreenShare = async () => {
    try {
      if (!screenShare) {
        // Request screen capture without blocking on audio permissions
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            displaySurface: 'monitor',
          },
          audio: false,
        });

        screenStreamRef.current = screenStream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
          localVideoRef.current.play().catch(() => {});
        }

        const screenVideoTrack = screenStream.getVideoTracks()[0];

        // Dynamically replace video track in WebRTC peer connection
        if (peerConnectionRef.current) {
          const senders = peerConnectionRef.current.getSenders();
          const videoSender = senders.find(s => s.track?.kind === 'video') || senders.find(s => s.track === null);
          if (videoSender) {
            await videoSender.replaceTrack(screenVideoTrack);
          } else {
            peerConnectionRef.current.addTrack(screenVideoTrack, screenStream);
            initiateWebRTCCall();
          }
        }

        setScreenShare(true);
        logAttendance('SCREEN_SHARE_START');

        // Update database presence
        fetch(`/api/sessions/${sessionId}/presence`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ screenSharing: true }),
        }).catch(() => {});
        
        screenVideoTrack.onended = () => {
          stopScreenShare();
        };
      } else {
        stopScreenShare();
      }
    } catch (err) {
      console.warn('Screen share cancelled or not supported:', err);
    }
  };

  const stopScreenShare = async () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(t => t.stop());
      screenStreamRef.current = null;
    }

    if (localStreamRef.current) {
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
        localVideoRef.current.play().catch(() => {});
      }
      const localVideoTrack = localStreamRef.current.getVideoTracks()[0];
      if (peerConnectionRef.current) {
        const senders = peerConnectionRef.current.getSenders();
        const videoSender = senders.find(s => s.track?.kind === 'video') || senders.find(s => s.track === null);
        if (videoSender && localVideoTrack) {
          await videoSender.replaceTrack(localVideoTrack);
        }
      }
    }

    setScreenShare(false);
    logAttendance('SCREEN_SHARE_STOP');

    // Update database presence
    fetch(`/api/sessions/${sessionId}/presence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ screenSharing: false }),
    }).catch(() => {});
  };

  // Save Scratchpad Content to SQLite & Broadcast via Socket.io
  const handleScratchpadChange = (newText: string) => {
    setCodeContent(newText);
    setScratchpadSaved(false);
    
    if (socketRef.current) {
      socketRef.current.emit('scratchpad-update', { roomId: sessionId, content: newText });
    }
    
    fetch(`/api/sessions/${sessionId}/scratchpad`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: newText, language: 'javascript' }),
    })
      .then(() => setScratchpadSaved(true))
      .catch(console.error);
  };

  // Send Text Chat Message & Broadcast via Socket.io
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sendingMessage) return;

    const tempText = newMessage;
    setNewMessage('');
    setSendingMessage(true);

    try {
      const res = await fetch(`/api/sessions/${sessionId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: tempText }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.message) {
          setChatMessages((prev) => [...prev, data.message]);
          if (socketRef.current) {
            socketRef.current.emit('send-message', { roomId: sessionId, message: data.message });
          }
        }
      }
    } catch (err) {
      console.error('Failed to send chat message:', err);
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

        // If current participant is learner, prompt rating modal immediately
        const isLearner = participantInfo?.role === 'STUDENT' || exchangeData?.session?.learner_id === user?.id;
        if (isLearner) {
          setShowRatingModal(true);
        } else {
          setTimeout(() => {
            router.push(`/sessions/${sessionId}`);
          }, 1800);
        }
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

  // Leave room handler
  const handleConfirmLeave = () => {
    logAttendance('LEFT', { reason: 'USER_LEFT_ROOM' });
    setLeaveModalOpen(false);
    router.push('/sessions');
  };

  // Unauthorized Error View
  if (authError) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto shadow-2xl">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-white">Video Classroom Access Restricted</h2>
          <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">{authError}</p>
        </div>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={verifyAuthorization}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 border border-slate-700"
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
    <div className="w-full max-w-[1680px] mx-auto px-2 sm:px-4 py-3 min-h-[calc(100vh-80px)] flex flex-col justify-between space-y-3 font-sans">
      
      {/* 1. Top Google Meet / Zoom Style Header Bar */}
      <div className="flex items-center justify-between gap-3 bg-slate-900/95 px-4 py-2.5 rounded-2xl border border-slate-800 shadow-lg backdrop-blur-xl">
        
        {/* Left: Meeting Info & Timer */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-glow-brand" />
            <span className="font-mono text-xs font-bold text-white tracking-wide bg-slate-800/80 px-2 py-0.5 rounded-lg border border-slate-700">
              {formatDuration(meetingSeconds)}
            </span>
          </div>

          <div className="h-4 w-px bg-slate-700 hidden sm:block" />

          <div className="hidden sm:flex items-center gap-2">
            <h1 className="text-xs sm:text-sm font-bold text-white">
              {participantInfo?.skillName || exchangeData?.session?.skill_name || 'Live Mentoring Classroom'}
            </h1>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 font-bold border border-brand-500/30">
              {participantInfo?.role === 'TRAINER' ? '👨‍🏫 Mentor' : '🎓 Learner'}
            </span>
          </div>
        </div>

        {/* Center: Engine Mode Switcher */}
        <div className="flex items-center gap-1 bg-slate-950/80 border border-slate-800 p-0.5 rounded-xl">
          <button
            onClick={() => setVideoEngine('SOCKET_WEBRTC')}
            className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 ${
              videoEngine === 'SOCKET_WEBRTC'
                ? 'bg-brand-500 text-dark-bg shadow-glow-brand'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span>WebRTC + Socket.io</span>
          </button>
          <button
            onClick={() => setVideoEngine('STUDIO')}
            className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
              videoEngine === 'STUDIO'
                ? 'bg-brand-500 text-dark-bg shadow-glow-brand'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ⚡ Studio SFU
          </button>
        </div>

        {/* Right: Settle Escrow Action */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleConfirmAndSettle}
            disabled={completing || completionSuccess}
            className="px-3.5 py-1.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-dark-bg font-bold text-xs shadow-glow-brand transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            {completionSuccess ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" /> Credit Settled!
              </>
            ) : completing ? (
              'Settling...'
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" /> Confirm &amp; End
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. Main Stage: Video Arena (Left) + Sliding Side Drawer (Right) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-[540px]">
        
        {/* Video Stage (Expands to 12 cols when drawer is closed, 8-9 cols when open) */}
        <div className={`${sidePanelOpen ? 'lg:col-span-8 xl:col-span-9' : 'lg:col-span-12'} flex flex-col transition-all duration-300`}>
          
          {videoEngine === 'SOCKET_WEBRTC' ? (
            /* Mode 1: Real-Time WebRTC + Socket.io Video Grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 h-[calc(100vh-210px)] min-h-[500px]">
              
              {/* Tile 1: Local Video */}
              <div className="glass-panel rounded-3xl border border-slate-800 relative flex items-center justify-center overflow-hidden bg-slate-950 shadow-2xl">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover rounded-3xl transition-opacity duration-300 ${cameraOn ? 'opacity-100' : 'opacity-0'}`}
                />

                {!cameraOn && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 text-slate-400 space-y-2">
                    <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-brand-400 font-bold text-xl shadow-inner">
                      {user?.display_name?.substring(0, 2).toUpperCase() || 'ME'}
                    </div>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <VideoOff className="w-3.5 h-3.5 text-rose-400" /> Camera Muted
                    </span>
                  </div>
                )}

                <div className="absolute top-3 left-3 bg-black/70 px-2.5 py-1 rounded-xl text-[11px] font-bold text-white backdrop-blur-md border border-slate-800 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>You ({user?.display_name || 'Participant'})</span>
                </div>

                {!micOn && (
                  <span className="absolute top-3 right-3 px-2 py-0.5 rounded-lg bg-rose-500/90 text-white text-[10px] font-bold flex items-center gap-1 backdrop-blur-sm shadow-md">
                    <MicOff className="w-3 h-3" /> Muted
                  </span>
                )}
              </div>

              {/* Tile 2: Peer Remote Video */}
              <div className="glass-panel rounded-3xl border border-slate-800 relative flex items-center justify-center overflow-hidden bg-slate-950 shadow-2xl">
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className={`w-full h-full object-cover rounded-3xl transition-opacity duration-300 ${hasRemotePeerStream ? 'opacity-100' : 'opacity-0'}`}
                />

                {!hasRemotePeerStream && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/95 text-slate-400 space-y-3 p-4 text-center z-10">
                    <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-cyan-400 font-bold text-xl animate-pulse shadow-inner">
                      {participantInfo?.role === 'TRAINER' ? 'L' : 'M'}
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-white">
                        Waiting for {participantInfo?.role === 'TRAINER' ? (exchangeData?.session?.learner_name || 'Learner') : (exchangeData?.session?.teacher_name || 'Mentor')}...
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {socketConnected ? '🟢 Socket.io connected • Streaming will start automatically' : 'Connecting to Socket.io signaling...'}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        const pc = createPeerConnection();
                        initiateWebRTCCall(pc);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-brand-500/20 hover:bg-brand-500/30 text-brand-300 font-semibold text-xs border border-brand-500/40 transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Reconnect WebRTC
                    </button>
                  </div>
                )}

                <div className="absolute top-3 left-3 bg-black/70 px-2.5 py-1 rounded-xl text-[11px] font-bold text-white backdrop-blur-md border border-slate-800 flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${hasRemotePeerStream ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400 animate-ping'}`} />
                  <span>{participantInfo?.role === 'TRAINER' ? (exchangeData?.session?.learner_name || 'Learner') : (exchangeData?.session?.teacher_name || 'Mentor')}</span>
                </div>
              </div>

            </div>
          ) : (
            /* Mode 2: Full-Stage Google Meet / Zoom Style Studio Room */
            <div className="w-full flex-1 min-h-[500px] h-[calc(100vh-210px)] rounded-3xl overflow-hidden border border-slate-800 bg-[#0e1017] shadow-2xl relative">
              <iframe
                src={`https://meet.jit.si/ReciproCampus_${sessionId.replace(/[^a-zA-Z0-9]/g, '_')}#userInfo.displayName="${encodeURIComponent(user?.display_name || participantInfo?.displayName || 'Participant')}"&config.prejoinPageEnabled=false&config.startWithAudioMuted=false&config.startWithVideoMuted=false&config.disableDeepLinking=true`}
                allow="camera; microphone; fullscreen; display-capture; autoplay"
                className="w-full h-full border-0 rounded-3xl"
              />
            </div>
          )}

        </div>

        {/* 3. Google Meet Style Sliding Side Drawer (Chat / Scratchpad / Exchange Terms) */}
        {sidePanelOpen && (
          <div className="lg:col-span-4 xl:col-span-3 glass-panel rounded-3xl border border-slate-800 flex flex-col h-[calc(100vh-210px)] min-h-[500px] shadow-2xl overflow-hidden bg-slate-900/90 backdrop-blur-xl">
            
            {/* Drawer Header Tabs */}
            <div className="p-2 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setActiveSideTab('CHAT')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeSideTab === 'CHAT' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" /> Chat
                </button>

                <button
                  onClick={() => setActiveSideTab('SCRATCHPAD')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeSideTab === 'SCRATCHPAD' ? 'bg-brand-500 text-dark-bg shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Code className="w-3.5 h-3.5" /> Code
                </button>

                <button
                  onClick={() => setActiveSideTab('DETAILS')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeSideTab === 'DETAILS' ? 'bg-slate-800 text-white border border-slate-700' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" /> Terms
                </button>
              </div>

              <button
                onClick={() => setSidePanelOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Close drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tab 1: Live Chat Stream */}
            {activeSideTab === 'CHAT' && (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 p-3.5 overflow-y-auto space-y-2.5">
                  {chatMessages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 text-xs space-y-1">
                      <MessageSquare className="w-7 h-7 text-slate-700" />
                      <p className="font-semibold text-slate-400">In-Room Chat</p>
                      <p className="text-[11px]">Send notes, links, or code snippets during your call.</p>
                    </div>
                  ) : (
                    chatMessages.map((msg) => {
                      const isMe = msg.senderId === user?.id || msg.senderId === 'me';
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                        >
                          <div className="flex items-center gap-1 text-[10px] text-slate-400 mb-0.5">
                            <span className="font-semibold">{msg.senderName}</span>
                            <span>•</span>
                            <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <div
                            className={`px-3 py-2 rounded-2xl text-xs max-w-[88%] break-words leading-relaxed ${
                              isMe
                                ? 'bg-indigo-600 text-white font-medium rounded-tr-none shadow-md'
                                : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'
                            }`}
                          >
                            {msg.message}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <form onSubmit={handleSendMessage} className="p-2.5 bg-slate-950/90 border-t border-slate-800 flex items-center gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Send a message to everyone..."
                    className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    disabled={sendingMessage || !newMessage.trim()}
                    className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-colors disabled:opacity-40 shadow-md"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            )}

            {/* Tab 2: Collaborative Code & Notes Scratchpad */}
            {activeSideTab === 'SCRATCHPAD' && (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="px-3 py-2 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between text-[11px]">
                  <span className="text-slate-300 font-bold flex items-center gap-1.5">
                    <Code className="w-3.5 h-3.5 text-brand-400" /> JavaScript Scratchpad
                  </span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <Check className="w-3 h-3" /> Auto-Saved
                  </span>
                </div>
                <textarea
                  value={codeContent}
                  onChange={(e) => handleScratchpadChange(e.target.value)}
                  placeholder="Collaborative code workspace..."
                  className="flex-1 bg-slate-950 text-slate-200 p-3 font-mono text-xs focus:outline-none resize-none border-none leading-relaxed"
                />
              </div>
            )}

            {/* Tab 3: Session Details & Escrow Terms */}
            {activeSideTab === 'DETAILS' && (
              <div className="p-4 space-y-3.5 text-xs text-slate-300 overflow-y-auto">
                <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-white">
                    <ShieldCheck className="w-4 h-4 text-brand-400" />
                    <span>SkillSwap Escrow Agreement</span>
                  </div>
                  <div className="space-y-1 text-[11px] text-slate-400">
                    <p>Skill: <strong className="text-white">{exchangeData?.session?.skill_name || 'Mentorship'}</strong></p>
                    <p>Mentor: <strong className="text-white">{exchangeData?.session?.teacher_name || 'Teacher'}</strong></p>
                    <p>Learner: <strong className="text-white">{exchangeData?.session?.learner_name || 'Learner'}</strong></p>
                    <p>Escrow: <strong className="text-brand-300">{exchangeData?.agreement?.credit_amount || 1} Credit Locked</strong></p>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-brand-500/10 border border-brand-500/30 text-[11px] space-y-1.5 text-slate-300">
                  <p className="font-bold text-white">🤝 Automated Settlement</p>
                  <p>When the session concludes, tap <strong>Confirm &amp; End</strong> to release the locked credit to the mentor and submit your peer rating.</p>
                </div>
              </div>
            )}

          </div>
        )}

      </div>

      {/* 4. Google Meet / Zoom Floating Bottom Control Dock */}
      <div className="flex items-center justify-center pt-2">
        <div className="bg-slate-900/95 border border-slate-700/80 shadow-2xl backdrop-blur-2xl px-5 py-2.5 rounded-full flex items-center gap-3">
          
          {/* Microphone */}
          <button
            onClick={toggleMic}
            aria-label={micOn ? 'Mute microphone' : 'Unmute microphone'}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              micOn ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700' : 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg'
            }`}
            title={micOn ? 'Mute mic' : 'Unmute mic'}
          >
            {micOn ? <Mic className="w-4 h-4 text-emerald-400" /> : <MicOff className="w-4 h-4" />}
          </button>

          {/* Camera */}
          <button
            onClick={toggleCamera}
            aria-label={cameraOn ? 'Turn camera off' : 'Turn camera on'}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              cameraOn ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700' : 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg'
            }`}
            title={cameraOn ? 'Turn off camera' : 'Turn on camera'}
          >
            {cameraOn ? <Video className="w-4 h-4 text-brand-400" /> : <VideoOff className="w-4 h-4" />}
          </button>

          {/* Screen Share */}
          <button
            onClick={toggleScreenShare}
            aria-label={screenShare ? 'Stop screen share' : 'Share screen'}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              screenShare ? 'bg-brand-500 text-dark-bg shadow-glow-brand' : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
            }`}
            title="Present Screen"
          >
            <Monitor className="w-4 h-4" />
          </button>

          <div className="h-6 w-px bg-slate-700" />

          {/* Live Code Scratchpad Toggle */}
          <button
            onClick={() => {
              setActiveSideTab('SCRATCHPAD');
              setSidePanelOpen(true);
            }}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              sidePanelOpen && activeSideTab === 'SCRATCHPAD' ? 'bg-brand-500 text-dark-bg shadow-glow-brand' : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
            }`}
            title="Shared Code Scratchpad"
          >
            <Code className="w-4 h-4" />
          </button>

          {/* In-Room Chat Toggle */}
          <button
            onClick={() => {
              setActiveSideTab('CHAT');
              setSidePanelOpen(!sidePanelOpen || activeSideTab !== 'CHAT');
            }}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all relative ${
              sidePanelOpen && activeSideTab === 'CHAT' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
            }`}
            title="In-Room Chat"
          >
            <MessageSquare className="w-4 h-4" />
            {chatMessages.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-brand-500 text-dark-bg text-[9px] font-extrabold flex items-center justify-center shadow">
                {chatMessages.length}
              </span>
            )}
          </button>

          {/* Agreement & Details */}
          <button
            onClick={() => {
              setActiveSideTab('DETAILS');
              setSidePanelOpen(true);
            }}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              sidePanelOpen && activeSideTab === 'DETAILS' ? 'bg-slate-700 text-white' : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
            }`}
            title="Session Agreement & Escrow"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </button>

          <div className="h-6 w-px bg-slate-700" />

          {/* End Call / Leave Pill */}
          <button
            onClick={() => setLeaveModalOpen(true)}
            className="px-4 h-10 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-lg"
            title="Leave Meeting"
          >
            <PhoneOff className="w-4 h-4" />
            <span className="hidden sm:inline">Leave</span>
          </button>

        </div>
      </div>

      {/* Leave Room Modal */}
      {leaveModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-sm rounded-3xl border border-slate-700 shadow-2xl p-6 space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/30">
              <PhoneOff className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">Leave Video Classroom?</h3>
              <p className="text-xs text-slate-400">
                You can rejoin anytime while the session is active. (To finalize and release skill credits, use Confirm &amp; End).
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setLeaveModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700"
              >
                Stay
              </button>
              <button
                onClick={handleConfirmLeave}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg"
              >
                Leave Room
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Post-Session Rating Modal */}
      <RatingModal
        isOpen={showRatingModal}
        onClose={() => {
          setShowRatingModal(false);
          router.push(`/sessions/${sessionId}`);
        }}
        sessionId={sessionId}
        mentorName={exchangeData?.session?.teacher_name || participantInfo?.trainerName || 'Mentor'}
        mentorAvatar={exchangeData?.session?.teacher_avatar}
        skillName={exchangeData?.session?.skill_name || participantInfo?.skillName || 'Skill Mentorship'}
        onRatingSubmitted={() => {
          router.push(`/sessions/${sessionId}`);
        }}
      />

    </div>
  );
}
