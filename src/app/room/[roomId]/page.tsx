/**
 * Room Page - Premium Redesign
 * 
 * Cinematic watch-together experience with:
 * - Full-screen video with ambient glow
 * - Floating glassmorphic UI elements
 * - Smooth animations
 */

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
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
import { createCloudBrowserSessionWithRetry, terminateCloudBrowserSession, getHyperbeamStatus, getCloudBrowserSession, RateLimitError, isGloballyRateLimited, getGlobalRateLimitRemaining } from '@/lib/api';

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
  const [lastSeenMessageCount, setLastSeenMessageCount] = useState(0);
  const prevMessagesLengthRef = useRef(0);
  
  // Rate limit handling state
  const [rateLimitCountdown, setRateLimitCountdown] = useState<number>(0);
  const [hyperbeamError, setHyperbeamError] = useState<string | null>(null);
  
  // LAYER 3: Use ref to prevent duplicate initialization during reconnects
  const initializingRef = useRef(false);

  // Check global rate limit on mount (persists across room navigations)
  useEffect(() => {
    if (isGloballyRateLimited()) {
      const remaining = getGlobalRateLimitRemaining();
      console.log(`[Room] Global rate limit active: ${remaining}s remaining`);
      setRateLimitCountdown(remaining);
      
      // Start countdown
      const interval = setInterval(() => {
        const newRemaining = getGlobalRateLimitRemaining();
        setRateLimitCountdown(newRemaining);
        if (newRemaining <= 0) {
          clearInterval(interval);
        }
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, []);

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
    socket,
  } = useRoom({
    roomId,
    userName: userName || 'Anonymous',
    onError: (err) => console.error('Room error:', err),
  });

  // LAYER 3: Track initialization in sessionStorage to persist across page refreshes
  const [hasInitializedHyperbeam, setHasInitializedHyperbeam] = useState(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem(`hyperbeam_init_${roomId}`) === 'true';
  });

  // Persist initialization state to sessionStorage
  useEffect(() => {
    if (hasInitializedHyperbeam) {
      sessionStorage.setItem(`hyperbeam_init_${roomId}`, 'true');
    }
  }, [hasInitializedHyperbeam, roomId]);

  // Clear initialization state when leaving room (cleanup)
  useEffect(() => {
    return () => {
      // Don't clear on normal unmount - only when explicitly leaving
    };
  }, [roomId]);

  // Check cloud browser availability and auto-start session when joined
  // LAYER 3: Prevents duplicate initialization using ref + sessionStorage
  // NOTE: We still need to fetch the URL even if initialized (URL is not persisted)
  useEffect(() => {
    if (!isJoined || !currentParticipant) return;
    if (initializingRef.current) return; // Already in progress, prevent race condition
    // Skip only if we already have the URL (not just the flag)
    if (hyperbeamEmbedUrl) return;
    
    const actualIsHost = currentParticipant.role === 'host';
    console.log('[Room] Initializing cloud browser, isHost:', actualIsHost);
    
    // Track if effect is still mounted
    let isMounted = true;
    
    const initCloudBrowser = async () => {
      // LAYER 3: Prevent concurrent initialization attempts
      if (initializingRef.current) {
        console.log('[Room] Initialization already in progress, skipping');
        return;
      }
      initializingRef.current = true;
      setHyperbeamError(null);
      
      try {
        const { available } = await getHyperbeamStatus();
        if (!isMounted) return; // Component unmounted during fetch
        
        console.log('[Room] Hyperbeam available:', available);
        setHyperbeamAvailable(available);
        
        if (available) {
          // Check if session already exists, get URL with proper permissions
          const existingSession = await getCloudBrowserSession(roomId, actualIsHost);
          if (!isMounted) return; // Component unmounted during fetch
          
          console.log('[Room] Existing session:', existingSession);
          if (existingSession) {
            console.log('[Room] Using existing session URL:', existingSession.embedUrl);
            setHyperbeamEmbedUrl(existingSession.embedUrl);
            setHasInitializedHyperbeam(true);
          } else if (actualIsHost) {
            // Host auto-starts the session with retry logic
            console.log('[Room] Host creating new session (with retry support)');
            
            // LAYER 2: Use retry function with countdown callback
            const result = await createCloudBrowserSessionWithRetry(
              roomId,
              actualIsHost,
              undefined, // startUrl
              (secondsRemaining) => {
                if (isMounted) setRateLimitCountdown(secondsRemaining);
              },
              3 // maxRetries
            );
            
            if (!isMounted) return; // Component unmounted during creation
            
            console.log('[Room] Created session URL:', result.embedUrl);
            setHyperbeamEmbedUrl(result.embedUrl);
            setHasInitializedHyperbeam(true);
            setRateLimitCountdown(0);
          } else {
            // Viewer - session doesn't exist yet, polling will handle it
            console.log('[Room] Viewer waiting for session to be created by host');
          }
        }
      } catch (error: any) {
        if (!isMounted) return; // Component unmounted, ignore error
        
        console.error('Failed to initialize cloud browser:', error);
        
        // LAYER 2: Handle rate limit errors gracefully
        if (error.isRateLimited || error.name === 'RateLimitError') {
          setHyperbeamError(`Rate limited. Please wait a moment and refresh the page.`);
        } else if (error.message?.includes('Failed to fetch')) {
          // Network error - likely page navigation or unmount
          console.log('[Room] Network error during initialization (page may have navigated)');
        } else {
          setHyperbeamError(error.message || 'Failed to initialize cloud browser');
        }
        setHyperbeamAvailable(false);
      } finally {
        initializingRef.current = false;
      }
    };
    
    initCloudBrowser();
    
    // Cleanup: mark as unmounted
    return () => {
      isMounted = false;
    };
  }, [isJoined, roomId, currentParticipant, hyperbeamEmbedUrl]);

  // Poll for session if viewer doesn't have embed URL yet
  // Always use getCloudBrowserSession API to get the correct URL with proper permissions
  useEffect(() => {
    if (hyperbeamEmbedUrl) return; // Already have URL
    if (!isJoined || !currentParticipant) return;
    
    const actualIsHost = currentParticipant.role === 'host';
    
    // For viewers, poll for the session to be created by host
    if (!actualIsHost && hyperbeamAvailable) {
      console.log('[Room] Viewer polling for session...');
      let pollCount = 0;
      const maxPolls = 30; // Max 30 attempts (60 seconds at 2s intervals)
      
      const pollInterval = setInterval(async () => {
        pollCount++;
        if (pollCount > maxPolls) {
          console.log('[Room] Viewer polling timed out after', maxPolls, 'attempts');
          clearInterval(pollInterval);
          return;
        }
        
        try {
          const session = await getCloudBrowserSession(roomId, false);
          if (session) {
            console.log('[Room] Viewer got session URL:', session.embedUrl);
            setHyperbeamEmbedUrl(session.embedUrl);
            setHasInitializedHyperbeam(true);
            clearInterval(pollInterval);
          }
        } catch (error) {
          // Session not ready yet, keep polling (but don't log to reduce noise)
        }
      }, 3000); // Poll every 3 seconds (less aggressive)
      
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

  // Sound notification - using preloaded audio element
  const notificationSoundRef = useRef<HTMLAudioElement | null>(null);
  const soundEnabledRef = useRef(false);

  // Create audio element and enable on user interaction
  useEffect(() => {
    // Create audio element
    const audio = new Audio('/message.mp3');
    audio.preload = 'auto';
    audio.volume = 0.5;
    notificationSoundRef.current = audio;

    // Enable sound on first user interaction (iOS requirement)
    const enableSound = () => {
      if (soundEnabledRef.current) return;
      
      // Play silent/muted to unlock audio
      const unlockAudio = notificationSoundRef.current;
      if (unlockAudio) {
        unlockAudio.muted = true;
        unlockAudio.play().then(() => {
          unlockAudio.pause();
          unlockAudio.currentTime = 0;
          unlockAudio.muted = false;
          soundEnabledRef.current = true;
          console.log('[Audio] Sound enabled');
        }).catch(() => {});
      }
    };

    // Listen on multiple events
    window.addEventListener('touchstart', enableSound, { once: true, passive: true });
    window.addEventListener('click', enableSound, { once: true, passive: true });
    window.addEventListener('keydown', enableSound, { once: true, passive: true });

    return () => {
      window.removeEventListener('touchstart', enableSound);
      window.removeEventListener('click', enableSound);
      window.removeEventListener('keydown', enableSound);
      notificationSoundRef.current = null;
    };
  }, []);

  // Play sound for new messages
  useEffect(() => {
    if (messages.length > prevMessagesLengthRef.current) {
      const lastMessage = messages[messages.length - 1];
      // Only play sound if the message is from someone else
      if (lastMessage && lastMessage.senderId !== currentParticipant?.id) {
        const audio = notificationSoundRef.current;
        if (audio && soundEnabledRef.current) {
          audio.currentTime = 0;
          audio.play().catch(() => {});
        }
      }
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages, currentParticipant?.id]);

  // Track when chat is opened to mark messages as read
  useEffect(() => {
    if (showChat) {
      setLastSeenMessageCount(messages.length);
    }
  }, [showChat, messages.length]);

  // Calculate unread message count
  const unreadCount = showChat ? 0 : Math.max(0, messages.length - lastSeenMessageCount);

  // Handle starting cloud browser session (with retry logic)
  const handleStartCloudBrowser = useCallback(async (startUrl?: string) => {
    try {
      setHyperbeamError(null);
      const result = await createCloudBrowserSessionWithRetry(
        roomId,
        isHost,
        startUrl,
        (secondsRemaining) => {
          setRateLimitCountdown(secondsRemaining);
        },
        3 // maxRetries
      );
      setHyperbeamEmbedUrl(result.embedUrl);
      setHasInitializedHyperbeam(true);
      setRateLimitCountdown(0);
    } catch (error: any) {
      console.error('Failed to start cloud browser:', error);
      if (error.isRateLimited || error.name === 'RateLimitError') {
        setHyperbeamError('Rate limited. Please wait a moment and try again.');
      } else {
        setHyperbeamError(error.message || 'Failed to start cloud browser');
      }
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
        unreadCount={unreadCount}
        socket={socket}
        currentUserId={currentParticipant?.id}
        currentUserName={currentParticipant?.name}
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
                onFullscreenChange={setIsFullscreen}
                chatPanel={showChat ? (
                  <ChatPanel
                    messages={messages}
                    currentUserId={currentParticipant?.id || ''}
                    onSendMessage={sendMessage}
                    participants={participants}
                    onClose={() => setShowChat(false)}
                    isFullscreenMode={true}
                  />
                ) : null}
                showChat={showChat}
                onToggleChat={() => setShowChat(!showChat)}
                unreadCount={unreadCount}
              />
            ) : isHyperbeamLoading || rateLimitCountdown > 0 ? (
              <div className="w-full h-full rounded-2xl bg-background-secondary flex items-center justify-center">
                <div className="text-center">
                  <div className="relative w-20 h-20 mb-6 mx-auto">
                    {rateLimitCountdown > 0 ? (
                      // Rate limit countdown UI
                      <>
                        <div className="absolute inset-0 rounded-2xl border-2 border-amber-500/30 animate-pulse" />
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                          <span className="text-2xl font-bold text-white">{rateLimitCountdown}</span>
                        </div>
                      </>
                    ) : (
                      // Normal loading UI
                      <>
                        <div className="absolute inset-0 rounded-2xl border-2 border-status-success/30 animate-ping" style={{ animationDuration: '2s' }} />
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-status-success to-emerald-500 flex items-center justify-center">
                          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                      </>
                    )}
                  </div>
                  {rateLimitCountdown > 0 ? (
                    <>
                      <p className="text-amber-400 font-medium mb-2">Rate limited - retrying in {rateLimitCountdown}s</p>
                      <p className="text-text-muted text-sm">Too many requests, waiting for cooldown...</p>
                    </>
                  ) : hyperbeamError ? (
                    <>
                      <p className="text-red-400 font-medium mb-2">Failed to start cloud browser</p>
                      <p className="text-text-muted text-sm">{hyperbeamError}</p>
                      <button 
                        onClick={() => {
                          setHyperbeamError(null);
                          setHasInitializedHyperbeam(false);
                          sessionStorage.removeItem(`hyperbeam_init_${roomId}`);
                        }}
                        className="mt-4 px-4 py-2 bg-accent-primary hover:bg-accent-primary/80 rounded-lg text-white text-sm transition-colors"
                      >
                        Retry
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="text-text-secondary font-medium mb-2">Loading cloud browser...</p>
                      <p className="text-text-muted text-sm">Waiting for session</p>
                    </>
                  )}
                </div>
              </div>
            ) : hyperbeamError && !hyperbeamEmbedUrl ? (
              <div className="w-full h-full rounded-2xl bg-background-secondary flex items-center justify-center">
                <div className="text-center">
                  <div className="relative w-20 h-20 mb-6 mx-auto">
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center">
                      <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-red-400 font-medium mb-2">Cloud browser error</p>
                  <p className="text-text-muted text-sm mb-4">{hyperbeamError}</p>
                  <button 
                    onClick={() => {
                      setHyperbeamError(null);
                      setHasInitializedHyperbeam(false);
                      sessionStorage.removeItem(`hyperbeam_init_${roomId}`);
                    }}
                    className="px-4 py-2 bg-accent-primary hover:bg-accent-primary/80 rounded-lg text-white text-sm transition-colors"
                  >
                    Retry
                  </button>
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
