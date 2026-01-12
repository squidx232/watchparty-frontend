/**
 * API client for REST endpoints
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Global rate limit tracking to prevent hammering the API across page navigations
let globalRateLimitUntil: number = 0;

/**
 * Check if we're currently rate limited (before making API calls)
 */
export function isGloballyRateLimited(): boolean {
  return Date.now() < globalRateLimitUntil;
}

/**
 * Get remaining rate limit seconds
 */
export function getGlobalRateLimitRemaining(): number {
  const remaining = Math.ceil((globalRateLimitUntil - Date.now()) / 1000);
  return Math.max(0, remaining);
}

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
 * Rate limit error with retry information
 */
export class RateLimitError extends Error {
  public retryAfterMs: number;
  public retryAfterSeconds: number;
  public isRateLimited: boolean = true;

  constructor(message: string, retryAfterMs: number) {
    super(message);
    this.name = 'RateLimitError';
    this.retryAfterMs = retryAfterMs;
    this.retryAfterSeconds = Math.ceil(retryAfterMs / 1000);
  }
}

/**
 * Create or get a cloud browser session for a room
 * Throws RateLimitError if rate limited (429), allowing caller to handle retry
 */
export async function createCloudBrowserSession(
  roomId: string,
  isHost: boolean,
  startUrl?: string
): Promise<{ success: boolean; embedUrl: string; sessionId: string; reused?: boolean; recovered?: boolean }> {
  // Check global rate limit BEFORE making the request
  if (isGloballyRateLimited()) {
    const remainingMs = globalRateLimitUntil - Date.now();
    throw new RateLimitError(
      `Rate limited. Please wait ${Math.ceil(remainingMs / 1000)} seconds.`,
      remainingMs
    );
  }

  const response = await fetch(`${API_URL}/api/rooms/${roomId}/hyperbeam`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ startUrl, isHost }),
  });

  if (!response.ok) {
    const error = await response.json();
    
    // Handle rate limiting specifically
    if (response.status === 429 && error.isRateLimited) {
      const retryAfterMs = error.retryAfterMs || 60000;
      // Set global rate limit to prevent other requests
      globalRateLimitUntil = Date.now() + retryAfterMs;
      console.log(`[API] Global rate limit set for ${Math.ceil(retryAfterMs / 1000)}s`);
      
      throw new RateLimitError(
        error.message || `Rate limited. Please wait ${Math.ceil(retryAfterMs / 1000)} seconds.`,
        retryAfterMs
      );
    }
    
    throw new Error(error.error || 'Failed to create cloud browser session');
  }

  // Clear rate limit on success
  globalRateLimitUntil = 0;
  return response.json();
}

/**
 * Create cloud browser session with automatic retry on rate limit
 * Shows countdown and retries automatically
 * 
 * Uses the actual cooldown time from backend (can be up to 60s)
 */
export async function createCloudBrowserSessionWithRetry(
  roomId: string,
  isHost: boolean,
  startUrl?: string,
  onRateLimitCountdown?: (secondsRemaining: number) => void,
  maxRetries: number = 3
): Promise<{ success: boolean; embedUrl: string; sessionId: string; reused?: boolean; recovered?: boolean }> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await createCloudBrowserSession(roomId, isHost, startUrl);
    } catch (error) {
      if (error instanceof RateLimitError) {
        lastError = error;
        
        // Use the actual retry time from backend (minimum 5 seconds to avoid spam)
        const waitSeconds = Math.max(5, error.retryAfterSeconds);
        console.log(`[API] Rate limited, waiting ${waitSeconds}s before retry (attempt ${attempt + 1}/${maxRetries})`);
        
        // Countdown with callback
        let remaining = waitSeconds;
        while (remaining > 0) {
          onRateLimitCountdown?.(remaining);
          await new Promise(resolve => setTimeout(resolve, 1000));
          remaining--;
        }
        onRateLimitCountdown?.(0);
        
        // Add small buffer before retry
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        // Non-rate-limit error, throw immediately
        throw error;
      }
    }
  }
  
  throw lastError || new Error('Failed to create cloud browser session after retries');
}

/**
 * Get existing cloud browser session for a room
 * Returns null if no session exists or if session has expired
 */
export async function getCloudBrowserSession(
  roomId: string,
  isHost: boolean
): Promise<{ success: boolean; embedUrl: string; sessionId: string } | null> {
  const response = await fetch(`${API_URL}/api/rooms/${roomId}/hyperbeam?isHost=${isHost}`);

  if (response.status === 404) {
    // Check if it's an expired session
    try {
      const data = await response.json();
      if (data.expired) {
        console.log('[API] Session expired, will need to create new one');
      }
    } catch {
      // Ignore JSON parse errors
    }
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

// ============================================
// Admin API Functions
// ============================================

export interface AdminRoom {
  id: string;
  name: string;
  hostId: string;
  participantCount: number;
  participants: Array<{ id: string; name: string; role: string }>;
  mediaUrl: string;
  mediaType: string;
  hasHyperbeam: boolean;
  hyperbeamSessionId?: string;
  createdAt: string;
  lastActivity: string;
}

export interface HyperbeamSessionInfo {
  session_id: string;
  embed_url: string;
  admin_token?: string;
  created_at?: string;
}

/**
 * Get all rooms (admin)
 */
export async function adminGetAllRooms(adminToken?: string): Promise<{ rooms: AdminRoom[]; count: number }> {
  const headers: Record<string, string> = {};
  if (adminToken) {
    headers['x-admin-token'] = adminToken;
  }
  
  const response = await fetch(`${API_URL}/api/admin/rooms`, { headers });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get rooms');
  }
  
  return response.json();
}

/**
 * Force delete a room (admin)
 */
export async function adminDeleteRoom(roomId: string, adminToken?: string): Promise<void> {
  const headers: Record<string, string> = {};
  if (adminToken) {
    headers['x-admin-token'] = adminToken;
  }
  
  const response = await fetch(`${API_URL}/api/admin/rooms/${roomId}`, {
    method: 'DELETE',
    headers
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete room');
  }
}

/**
 * Delete all rooms (admin)
 */
export async function adminDeleteAllRooms(adminToken?: string): Promise<{ deletedCount: number; failedCount: number }> {
  const headers: Record<string, string> = {};
  if (adminToken) {
    headers['x-admin-token'] = adminToken;
  }
  
  const response = await fetch(`${API_URL}/api/admin/rooms`, {
    method: 'DELETE',
    headers
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete rooms');
  }
  
  return response.json();
}

/**
 * Get all Hyperbeam sessions (admin)
 */
export async function adminGetAllSessions(): Promise<{ sessions: HyperbeamSessionInfo[]; count: number }> {
  const response = await fetch(`${API_URL}/api/hyperbeam/sessions`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get sessions');
  }
  
  return response.json();
}

/**
 * Terminate all Hyperbeam sessions (admin)
 */
export async function adminTerminateAllSessions(): Promise<{ terminatedCount: number; failedCount: number }> {
  const response = await fetch(`${API_URL}/api/hyperbeam/sessions`, {
    method: 'DELETE'
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to terminate sessions');
  }
  
  return response.json();
}

/**
 * Get server stats
 */
export async function getServerStats(): Promise<{
  totalRooms: number;
  totalParticipants: number;
  hyperbeamAvailable: boolean;
}> {
  const response = await fetch(`${API_URL}/api/stats`);
  return response.json();
}
