/**
 * API client for REST endpoints
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface CreateRoomParams {
  hostName: string;
  roomName?: string;
  mediaUrl?: string;
  mediaType?: 'video' | 'iframe' | 'youtube';
}

export interface CreateRoomResult {
  roomId: string;
  roomName: string;
  hostToken: string;
}

export interface RoomInfoResult {
  id: string;
  name: string;
  hostName: string;
  participantCount: number;
  mediaType: string;
  hasMedia: boolean;
}

/**
 * Creates a new room
 */
export async function createRoom(params: CreateRoomParams): Promise<CreateRoomResult> {
  const response = await fetch(`${API_URL}/api/rooms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create room');
  }

  return response.json();
}

/**
 * Gets information about a room
 */
export async function getRoomInfo(roomId: string): Promise<RoomInfoResult> {
  const response = await fetch(`${API_URL}/api/rooms/${roomId}`);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Room not found');
    }
    throw new Error('Failed to get room info');
  }

  return response.json();
}

/**
 * Checks if a room exists
 */
export async function checkRoomExists(roomId: string): Promise<boolean> {
  const response = await fetch(`${API_URL}/api/rooms/${roomId}/exists`);
  const data = await response.json();
  return data.exists;
}

/**
 * Check if Hyperbeam is available
 */
export async function getHyperbeamStatus(): Promise<{ available: boolean }> {
  const response = await fetch(`${API_URL}/api/hyperbeam/status`);
  return response.json();
}

/**
 * Create or get a cloud browser session for a room
 */
export async function createCloudBrowserSession(
  roomId: string,
  isHost: boolean,
  startUrl?: string
): Promise<{ success: boolean; embedUrl: string; sessionId: string }> {
  const response = await fetch(`${API_URL}/api/rooms/${roomId}/hyperbeam`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ startUrl, isHost }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create cloud browser session');
  }

  return response.json();
}

/**
 * Get existing cloud browser session for a room
 */
export async function getCloudBrowserSession(
  roomId: string,
  isHost: boolean
): Promise<{ success: boolean; embedUrl: string; sessionId: string } | null> {
  const response = await fetch(`${API_URL}/api/rooms/${roomId}/hyperbeam?isHost=${isHost}`);

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get cloud browser session');
  }

  return response.json();
}

/**
 * Terminate a cloud browser session
 */
export async function terminateCloudBrowserSession(roomId: string): Promise<void> {
  const response = await fetch(`${API_URL}/api/rooms/${roomId}/hyperbeam`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to terminate session');
  }
}

// Legacy aliases for backward compatibility
export const createHyperbeamSession = createCloudBrowserSession;
export const terminateHyperbeamSession = terminateCloudBrowserSession;
