/**
 * Shared types for the frontend application
 */

export type ParticipantRole = 'host' | 'guest';

export interface Participant {
  id: string;
  name: string;
  role: ParticipantRole;
  avatarColor: string;
  joinedAt: string;
}

export interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  playbackRate: number;
  lastUpdated: number;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
}

export interface HyperbeamSession {
  embedUrl: string;
  sessionId: string;
}

export interface RoomInfo {
  id: string;
  name: string;
  hostName: string;
  participantCount: number;
  mediaUrl: string;
  mediaType: 'video' | 'iframe' | 'youtube' | 'hyperbeam';
  playbackState: PlaybackState;
  hyperbeam?: HyperbeamSession;
}

export interface CreateRoomResponse {
  roomId: string;
  roomName: string;
  hostToken: string;
}

export interface JoinRoomResponse {
  success: boolean;
  room?: RoomInfo;
  error?: string;
}
