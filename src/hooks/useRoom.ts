/**
 * useRoom Hook
 * 
 * Manages the WebSocket connection and room state.
 * This is the main hook for the room experience.
 * 
 * SYNCHRONIZATION:
 * - On join, the server sends the current playback state
 * - Host actions (play/pause/seek) are sent to server and broadcast to all
 * - Guests receive updates and sync their local players
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import type { Participant, ChatMessage, PlaybackState, RoomInfo } from '@/types';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';

interface UseRoomOptions {
  roomId: string;
  userName: string;
  onError?: (error: string) => void;
}

interface UseRoomReturn {
  // Connection state
  isConnected: boolean;
  isJoined: boolean;
  error: string | null;
  
  // Room data
  roomInfo: RoomInfo | null;
  participants: Participant[];
  currentParticipant: Participant | null;
  isHost: boolean;
  
  // Playback state
  playbackState: PlaybackState;
  
  // Chat
  messages: ChatMessage[];
  sendMessage: (content: string) => void;
  
  // Playback controls (host only)
  play: (currentTime: number) => void;
  pause: (currentTime: number) => void;
  seek: (currentTime: number) => void;
  
  // Media controls (host only)
  changeMedia: (url: string, type: 'video' | 'iframe' | 'youtube') => void;
  
  // Room actions
  leaveRoom: () => void;
}

export function useRoom({ roomId, userName, onError }: UseRoomOptions): UseRoomReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [currentParticipant, setCurrentParticipant] = useState<Participant | null>(null);
  
  const [playbackState, setPlaybackState] = useState<PlaybackState>({
    isPlaying: false,
    currentTime: 0,
    playbackRate: 1.0,
    lastUpdated: Date.now(),
  });
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  
  // Use refs to avoid dependency issues
  const socketRef = useRef<Socket | null>(null);
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  // Determine if current user is host
  const isHost = currentParticipant?.role === 'host';

  // Connect and join room - only run once on mount
  useEffect(() => {
    // Get host token from localStorage if available (for reconnection)
    const hostToken = typeof window !== 'undefined' 
      ? localStorage.getItem(`hostToken_${roomId}`) 
      : null;
    
    // Create a new socket for this room session
    const socket = io(WS_URL, {
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000,
    });
    
    socketRef.current = socket;

    // Connection established
    socket.on('connect', () => {
      console.log('[Socket] Connected');
      setIsConnected(true);
      setError(null);
      
      // Join the room with host token if available
      socket.emit('room:join', { roomId, userName, hostToken }, (response: any) => {
        console.log('[Socket] Join response:', response);
        if (response.success && response.room) {
          setRoomInfo(response.room);
          setIsJoined(true);
        } else {
          const errMsg = response.error || 'Failed to join room';
          setError(errMsg);
          onErrorRef.current?.(errMsg);
        }
      });
    });

    socket.on('disconnect', () => {
      console.log('[Socket] Disconnected');
      setIsConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.error('[Socket] Connection error:', err);
      const errMsg = `Connection error: ${err.message}`;
      setError(errMsg);
      onErrorRef.current?.(errMsg);
    });

    // Room events
    socket.on('room:joined', ({ participant, participants: roomParticipants }) => {
      console.log('[Socket] Room joined:', participant);
      setCurrentParticipant(participant);
      setParticipants(roomParticipants);
    });

    socket.on('room:participant-joined', (participant) => {
      console.log('[Socket] Participant joined:', participant);
      setParticipants(prev => {
        if (prev.some(p => p.id === participant.id)) return prev;
        return [...prev, participant];
      });
    });

    socket.on('room:participant-left', (participantId) => {
      console.log('[Socket] Participant left:', participantId);
      setParticipants(prev => prev.filter(p => p.id !== participantId));
    });

    socket.on('room:host-changed', (newHostId) => {
      console.log('[Socket] Host changed to:', newHostId);
      setParticipants(prev => prev.map(p => ({
        ...p,
        role: p.id === newHostId ? 'host' : 'guest'
      })));
      // Update current participant's role - they might be promoted or demoted
      setCurrentParticipant(prev => {
        if (!prev) return prev;
        const newRole = prev.id === newHostId ? 'host' : 'guest';
        if (prev.role !== newRole) {
          console.log(`[Socket] My role changed from ${prev.role} to ${newRole}`);
          return { ...prev, role: newRole };
        }
        return prev;
      });
    });

    socket.on('room:closed', () => {
      console.log('[Socket] Room closed');
      const errMsg = 'Room has been closed';
      setError(errMsg);
      onErrorRef.current?.(errMsg);
    });

    // Playback events
    socket.on('playback:sync', (state) => {
      console.log('[Socket] Playback sync:', state);
      setPlaybackState(state);
    });

    socket.on('playback:play', (currentTime) => {
      console.log('[Socket] Playback play:', currentTime);
      setPlaybackState(prev => ({
        ...prev,
        isPlaying: true,
        currentTime,
        lastUpdated: Date.now(),
      }));
    });

    socket.on('playback:pause', (currentTime) => {
      console.log('[Socket] Playback pause:', currentTime);
      setPlaybackState(prev => ({
        ...prev,
        isPlaying: false,
        currentTime,
        lastUpdated: Date.now(),
      }));
    });

    socket.on('playback:seek', (currentTime) => {
      console.log('[Socket] Playback seek:', currentTime);
      setPlaybackState(prev => ({
        ...prev,
        currentTime,
        lastUpdated: Date.now(),
      }));
    });

    // Media events
    socket.on('media:changed', ({ mediaUrl, mediaType }) => {
      console.log('[Socket] Media changed:', mediaUrl);
      setRoomInfo(prev => prev ? { ...prev, mediaUrl, mediaType } : null);
      setPlaybackState({
        isPlaying: false,
        currentTime: 0,
        playbackRate: 1.0,
        lastUpdated: Date.now(),
      });
    });

    // Chat events
    socket.on('chat:history', (history) => {
      console.log('[Socket] Chat history:', history.length, 'messages');
      setMessages(history);
    });

    socket.on('chat:message', (message) => {
      console.log('[Socket] Chat message:', message);
      setMessages(prev => [...prev, message]);
    });

    // Error events
    socket.on('error', (errorMsg) => {
      console.error('[Socket Error]', errorMsg);
    });

    // Cleanup on unmount
    return () => {
      console.log('[Socket] Cleaning up');
      socket.emit('room:leave');
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [roomId, userName]); // Only depend on roomId and userName

  // Action: Send chat message
  const sendMessage = useCallback((content: string) => {
    if (content.trim() && socketRef.current) {
      socketRef.current.emit('chat:send', content);
    }
  }, []);

  // Action: Play video (host only)
  const play = useCallback((currentTime: number) => {
    if (socketRef.current) {
      socketRef.current.emit('playback:play', currentTime);
    }
  }, []);

  // Action: Pause video (host only)
  const pause = useCallback((currentTime: number) => {
    if (socketRef.current) {
      socketRef.current.emit('playback:pause', currentTime);
    }
  }, []);

  // Action: Seek video (host only)
  const seek = useCallback((currentTime: number) => {
    if (socketRef.current) {
      socketRef.current.emit('playback:seek', currentTime);
    }
  }, []);

  // Action: Change media (host only)
  const changeMedia = useCallback((url: string, type: 'video' | 'iframe' | 'youtube') => {
    if (socketRef.current) {
      socketRef.current.emit('media:change', { mediaUrl: url, mediaType: type });
    }
  }, []);

  // Action: Leave room
  const leaveRoom = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('room:leave');
      socketRef.current.disconnect();
    }
  }, []);

  return {
    isConnected,
    isJoined,
    error,
    roomInfo,
    participants,
    currentParticipant,
    isHost,
    playbackState,
    messages,
    sendMessage,
    play,
    pause,
    seek,
    changeMedia,
    leaveRoom,
    socket: socketRef.current,
  };
}
