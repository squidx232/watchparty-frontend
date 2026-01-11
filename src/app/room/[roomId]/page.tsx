/**
 * Room Page - Premium Redesign
 * 
 * Cinematic watch-together experience with:
 * - Full-screen video with ambient glow
 * - Floating glassmorphic UI elements
 * - Smooth animations
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useRoom } from '@/hooks/useRoom';
import VideoPlayer from '@/components/VideoPlayer';
import HyperbeamEmbed from '@/components/HyperbeamEmbed';
import ChatPanel from '@/components/ChatPanel';
import ParticipantsList from '@/components/ParticipantsList';
import MediaControls from '@/components/MediaControls';
import RoomHeader from '@/components/RoomHeader';
import LoadingScreen from '@/components/LoadingScreen';
import ErrorScreen from '@/components/ErrorScreen';
import { createCloudBrowserSession, terminateCloudBrowserSession, getHyperbeamStatus, getCloudBrowserSession } from '@/lib/api';

export default function RoomPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const roomId = params.roomId as string;
  const [userName, setUserName] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(true);
  const [hyperbeamAvailable, setHyperbeamAvailable] = useState(false);
  const [hyperbeamEmbedUrl, setHyperbeamEmbedUrl] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Get username from URL or localStorage
  useEffect(() => {
    const nameFromUrl = searchParams.get('name');
    const savedName = localStorage.getItem('userName');
    
    if (nameFromUrl) {
      setUserName(nameFromUrl);
      localStorage.setItem('userName', nameFromUrl);
    } else if (savedName) {
      setUserName(savedName);
    } else {
      router.push(`/join?room=${roomId}`);
    }
  }, [searchParams, roomId, router]);

  // Initialize room connection
  const {
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
  } = useRoom({
    roomId,
    userName: userName || 'Anonymous',
    onError: (err) => console.error('Room error:', err),
  });

  // Check cloud browser availability and auto-start session when joined
  // We need to wait for currentParticipant to be set to know the actual role
  useEffect(() => {
    if (!isJoined || !currentParticipant) return;
    
    const actualIsHost = currentParticipant.role === 'host';
    console.log('[Room] Initializing cloud browser, isHost:', actualIsHost);
    
    const initCloudBrowser = async () => {
      try {
        const { available } = await getHyperbeamStatus();
        console.log('[Room] Hyperbeam available:', available);
        setHyperbeamAvailable(available);
        
        if (available) {
          // Check if session already exists, get URL with proper permissions
          const existingSession = await getCloudBrowserSession(roomId, actualIsHost);
          console.log('[Room] Existing session:', existingSession);
          if (existingSession) {
            console.log('[Room] Using existing session URL:', existingSession.embedUrl);
            setHyperbeamEmbedUrl(existingSession.embedUrl);
          } else if (actualIsHost) {
            // Host auto-starts the session
            console.log('[Room] Host creating new session');
            const result = await createCloudBrowserSession(roomId, actualIsHost);
            console.log('[Room] Created session URL:', result.embedUrl);
            setHyperbeamEmbedUrl(result.embedUrl);
          } else {
            // Viewer - session doesn't exist yet, wait for roomInfo update
            console.log('[Room] Viewer waiting for session to be created by host');
          }
        }
      } catch (error) {
        console.error('Failed to initialize cloud browser:', error);
        setHyperbeamAvailable(false);
      }
    };
    
    initCloudBrowser();
  }, [isJoined, roomId, currentParticipant]);

  // Poll for session if viewer doesn't have embed URL yet
  // Always use getCloudBrowserSession API to get the correct URL with proper permissions
  useEffect(() => {
    if (hyperbeamEmbedUrl) return; // Already have URL
    if (!isJoined || !currentParticipant) return;
    
    const actualIsHost = currentParticipant.role === 'host';
    
    // For viewers, poll for the session to be created by host
    if (!actualIsHost && hyperbeamAvailable) {
      console.log('[Room] Viewer polling for session...');
      
      const pollInterval = setInterval(async () => {
        try {
          const session = await getCloudBrowserSession(roomId, false);
          if (session) {
            console.log('[Room] Viewer got session URL:', session.embedUrl);
            setHyperbeamEmbedUrl(session.embedUrl);
            clearInterval(pollInterval);
          }
        } catch (error) {
          // Session not ready yet, keep polling
        }
      }, 2000); // Poll every 2 seconds
      
      return () => clearInterval(pollInterval);
    }
  }, [hyperbeamEmbedUrl, roomId, isJoined, currentParticipant, hyperbeamAvailable]);

  // Listen for fullscreen changes (including ESC key exit)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Handle starting cloud browser session
  const handleStartCloudBrowser = useCallback(async (startUrl?: string) => {
    try {
      const result = await createCloudBrowserSession(roomId, isHost, startUrl);
      setHyperbeamEmbedUrl(result.embedUrl);
    } catch (error) {
      console.error('Failed to start cloud browser:', error);
      throw error;
    }
  }, [roomId, isHost]);

  // Handle stopping cloud browser session (host only)
  const handleStopCloudBrowser = useCallback(async () => {
    try {
      await terminateCloudBrowserSession(roomId);
      setHyperbeamEmbedUrl(null);
    } catch (error) {
      console.error('Failed to stop cloud browser:', error);
      throw error;
    }
  }, [roomId]);

  // Handle leaving the room
  const handleLeave = () => {
    leaveRoom();
    router.push('/');
  };

  // Show loading while connecting
  if (!userName) {
    return <LoadingScreen message="Loading..." />;
  }

  if (!isConnected || !isJoined) {
    if (error) {
      return <ErrorScreen message={error} onRetry={() => window.location.reload()} />;
    }
    return <LoadingScreen message="Connecting to room..." />;
  }

  // Only show Hyperbeam when we have a proper embed URL from our API
  // Do NOT use roomInfo.mediaUrl as fallback - it might have wrong permissions
  const isHyperbeamActive = !!hyperbeamEmbedUrl;
  const isHyperbeamLoading = !hyperbeamEmbedUrl && roomInfo?.mediaType === 'hyperbeam';

  return (
    <div id="room-container" className="h-screen w-screen bg-background-primary overflow-hidden relative">
      {/* Ambient Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-accent-primary/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-accent-secondary/10 rounded-full blur-[150px]" />
      </div>

      {/* Header */}
      <RoomHeader
        roomName={roomInfo?.name || 'Loading...'}
        roomId={roomId}
        participantCount={participants.length}
        isHost={isHost}
        onLeave={handleLeave}
        showChat={showChat}
        onToggleChat={() => setShowChat(!showChat)}
      />

      {/* Main Content */}
      <div className="absolute inset-0 top-20 pb-4 px-4 flex gap-4 overflow-hidden">
        {/* Video Area */}
        <div className="flex-1 flex flex-col gap-4 min-w-0 overflow-hidden">
          {/* Video Player */}
          <div className="flex-1 relative min-h-0 overflow-hidden">
            {isHyperbeamActive && hyperbeamEmbedUrl ? (
              <HyperbeamEmbed
                embedUrl={hyperbeamEmbedUrl}
                isHost={isHost}
              />
            ) : isHyperbeamLoading ? (
              <div className="w-full h-full rounded-2xl bg-background-secondary flex items-center justify-center">
                <div className="text-center">
                  <div className="relative w-20 h-20 mb-6 mx-auto">
                    <div className="absolute inset-0 rounded-2xl border-2 border-status-success/30 animate-ping" style={{ animationDuration: '2s' }} />
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-status-success to-emerald-500 flex items-center justify-center">
                      <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-text-secondary font-medium mb-2">Loading cloud browser...</p>
                  <p className="text-text-muted text-sm">Waiting for session</p>
                </div>
              </div>
            ) : (
              <VideoPlayer
                mediaUrl={roomInfo?.mediaUrl || ''}
                mediaType={roomInfo?.mediaType || 'video'}
                playbackState={playbackState}
                isHost={isHost}
                onPlay={play}
                onPause={pause}
                onSeek={seek}
              />
            )}

            {/* Floating Participants (Bottom Left) */}
            <div className="absolute bottom-4 left-4 z-20">
              <ParticipantsList
                participants={participants}
                currentUserId={currentParticipant?.id}
                isHost={isHost}
                compact
              />
            </div>
          </div>

          {/* Media Controls (Host Only) */}
          {isHost && (
            <MediaControls
              currentUrl={roomInfo?.mediaUrl || ''}
              currentType={roomInfo?.mediaType || 'video'}
              onChangeMedia={changeMedia}
              onStopSession={handleStopCloudBrowser}
              isSessionActive={isHyperbeamActive || isHyperbeamLoading}
            />
          )}
        </div>

        {/* Chat Panel */}
        {showChat && (
          <ChatPanel
            messages={messages}
            currentUserId={currentParticipant?.id || ''}
            onSendMessage={sendMessage}
            participants={participants}
            onClose={() => setShowChat(false)}
          />
        )}
      </div>
    </div>
  );
}
