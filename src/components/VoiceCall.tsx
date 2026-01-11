'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Mic, MicOff, Phone, PhoneOff, Volume2 } from 'lucide-react';
import { Socket } from 'socket.io-client';
import { VoiceParticipant } from '@/types';

interface VoiceCallProps {
  socket: Socket | null;
  currentUserId: string;
  currentUserName: string;
}

// ICE servers for WebRTC connection
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export default function VoiceCall({ socket, currentUserId, currentUserName }: VoiceCallProps) {
  const [isInCall, setIsInCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [voiceParticipants, setVoiceParticipants] = useState<VoiceParticipant[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  
  // WebRTC refs
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const audioElementsRef = useRef<Map<string, HTMLAudioElement>>(new Map());

  // Clean up peer connection
  const cleanupPeerConnection = useCallback((peerId: string) => {
    const pc = peerConnectionsRef.current.get(peerId);
    if (pc) {
      pc.close();
      peerConnectionsRef.current.delete(peerId);
    }
    
    const audio = audioElementsRef.current.get(peerId);
    if (audio) {
      audio.srcObject = null;
      audio.remove();
      audioElementsRef.current.delete(peerId);
    }
  }, []);

  // Create peer connection for a participant
  const createPeerConnection = useCallback((peerId: string, isInitiator: boolean) => {
    if (!socket || !localStreamRef.current) return null;

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionsRef.current.set(peerId, pc);

    // Add local audio track
    localStreamRef.current.getAudioTracks().forEach(track => {
      pc.addTrack(track, localStreamRef.current!);
    });

    // Handle incoming audio
    pc.ontrack = (event) => {
      console.log('[Voice] Received remote track from', peerId);
      let audio = audioElementsRef.current.get(peerId);
      if (!audio) {
        audio = new Audio();
        audio.autoplay = true;
        audioElementsRef.current.set(peerId, audio);
      }
      audio.srcObject = event.streams[0];
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('voice:ice-candidate', {
          targetId: peerId,
          candidate: event.candidate.toJSON(),
        });
      }
    };

    // Handle connection state
    pc.onconnectionstatechange = () => {
      console.log(`[Voice] Connection state with ${peerId}:`, pc.connectionState);
      if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        cleanupPeerConnection(peerId);
      }
    };

    // If initiator, create and send offer
    if (isInitiator) {
      pc.createOffer()
        .then(offer => pc.setLocalDescription(offer))
        .then(() => {
          socket.emit('voice:offer', {
            targetId: peerId,
            sdp: pc.localDescription!,
          });
        })
        .catch(err => console.error('[Voice] Error creating offer:', err));
    }

    return pc;
  }, [socket, cleanupPeerConnection]);

  // Join voice call
  const joinCall = useCallback(async () => {
    if (!socket) return;
    
    setIsConnecting(true);
    
    try {
      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false 
      });
      
      localStreamRef.current = stream;
      setIsInCall(true);
      setIsConnecting(false);
      
      // Notify server
      socket.emit('voice:join');
      
      console.log('[Voice] Joined voice call');
    } catch (err) {
      console.error('[Voice] Error accessing microphone:', err);
      setIsConnecting(false);
      alert('Could not access microphone. Please check permissions.');
    }
  }, [socket]);

  // Leave voice call
  const leaveCall = useCallback(() => {
    if (!socket) return;
    
    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    
    // Close all peer connections
    peerConnectionsRef.current.forEach((pc, peerId) => {
      cleanupPeerConnection(peerId);
    });
    
    // Notify server
    socket.emit('voice:leave');
    
    setIsInCall(false);
    setIsMuted(false);
    setVoiceParticipants([]);
    
    console.log('[Voice] Left voice call');
  }, [socket, cleanupPeerConnection]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (!socket || !localStreamRef.current) return;
    
    const newMuted = !isMuted;
    localStreamRef.current.getAudioTracks().forEach(track => {
      track.enabled = !newMuted;
    });
    
    setIsMuted(newMuted);
    socket.emit('voice:mute', newMuted);
  }, [socket, isMuted]);

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;

    // Receive current voice participants when joining
    socket.on('voice:participants', (participants: VoiceParticipant[]) => {
      console.log('[Voice] Current participants:', participants);
      setVoiceParticipants(participants.filter(p => p.id !== currentUserId));
      
      // Create peer connections to existing participants
      participants.forEach(p => {
        if (p.id !== currentUserId && isInCall) {
          createPeerConnection(p.id, true);
        }
      });
    });

    // New participant joined voice
    socket.on('voice:participant-joined', (participant: VoiceParticipant) => {
      console.log('[Voice] Participant joined:', participant.name);
      setVoiceParticipants(prev => [...prev.filter(p => p.id !== participant.id), participant]);
      
      // Create peer connection (they will send offer)
      if (isInCall && participant.id !== currentUserId) {
        createPeerConnection(participant.id, false);
      }
    });

    // Participant left voice
    socket.on('voice:participant-left', (participantId: string) => {
      console.log('[Voice] Participant left:', participantId);
      setVoiceParticipants(prev => prev.filter(p => p.id !== participantId));
      cleanupPeerConnection(participantId);
    });

    // Participant muted/unmuted
    socket.on('voice:participant-muted', ({ participantId, isMuted }) => {
      setVoiceParticipants(prev =>
        prev.map(p => p.id === participantId ? { ...p, isMuted } : p)
      );
    });

    // Receive WebRTC offer
    socket.on('voice:offer', async ({ fromId, sdp }) => {
      console.log('[Voice] Received offer from', fromId);
      
      let pc: RTCPeerConnection | null | undefined = peerConnectionsRef.current.get(fromId);
      if (!pc) {
        pc = createPeerConnection(fromId, false);
      }
      
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        
        socket.emit('voice:answer', {
          targetId: fromId,
          sdp: pc.localDescription!,
        });
      }
    });

    // Receive WebRTC answer
    socket.on('voice:answer', async ({ fromId, sdp }) => {
      console.log('[Voice] Received answer from', fromId);
      const pc = peerConnectionsRef.current.get(fromId);
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      }
    });

    // Receive ICE candidate
    socket.on('voice:ice-candidate', async ({ fromId, candidate }) => {
      const pc = peerConnectionsRef.current.get(fromId);
      if (pc && candidate) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    return () => {
      socket.off('voice:participants');
      socket.off('voice:participant-joined');
      socket.off('voice:participant-left');
      socket.off('voice:participant-muted');
      socket.off('voice:offer');
      socket.off('voice:answer');
      socket.off('voice:ice-candidate');
    };
  }, [socket, currentUserId, isInCall, createPeerConnection, cleanupPeerConnection]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isInCall) {
        leaveCall();
      }
    };
  }, [isInCall, leaveCall]);

  return (
    <div className="flex items-center gap-2">
      {/* Voice participants indicator */}
      {isInCall && voiceParticipants.length > 0 && (
        <div className="flex items-center gap-1 px-2 py-1 bg-green-500/20 rounded-lg">
          <Volume2 className="w-4 h-4 text-green-400" />
          <span className="text-xs text-green-400">{voiceParticipants.length + 1}</span>
        </div>
      )}

      {/* Mute button - only show when in call */}
      {isInCall && (
        <button
          onClick={toggleMute}
          className={`btn-icon w-10 h-10 ${isMuted ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-green-500/20 text-green-400 border-green-500/30'}`}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>
      )}

      {/* Join/Leave call button */}
      <button
        onClick={isInCall ? leaveCall : joinCall}
        disabled={isConnecting}
        className={`btn-icon w-10 h-10 ${
          isInCall 
            ? 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30' 
            : 'bg-accent-primary/20 text-accent-primary border-accent-primary/30 hover:bg-accent-primary/30'
        } ${isConnecting ? 'opacity-50 cursor-not-allowed' : ''}`}
        title={isInCall ? 'Leave voice call' : 'Join voice call'}
      >
        {isConnecting ? (
          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : isInCall ? (
          <PhoneOff className="w-5 h-5" />
        ) : (
          <Phone className="w-5 h-5" />
        )}
      </button>
    </div>
  );
}
