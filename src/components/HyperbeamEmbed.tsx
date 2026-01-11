/**
 * HyperbeamEmbed - Using Official Hyperbeam SDK
 * 
 * Embeds a Hyperbeam cloud browser session using the official SDK
 * instead of deprecated iframe embedding.
 * 
 * SDK Docs: https://docs.hyperbeam.com/client-sdk/javascript/reference
 */

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Monitor, Maximize2, Minimize2 } from 'lucide-react';
import Hyperbeam from '@hyperbeam/web';

interface HyperbeamEmbedProps {
  embedUrl: string;
  isHost: boolean;
  onLoad?: () => void;
  onError?: (error: string) => void;
  onFullscreenChange?: (isFullscreen: boolean) => void;
}

export default function HyperbeamEmbed({
  embedUrl,
  isHost,
  onLoad,
  onError,
  onFullscreenChange,
}: HyperbeamEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hbInstanceRef = useRef<any>(null);
  const initializedUrlRef = useRef<string | null>(null);
  const isInitializingRef = useRef(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Handle fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isNowFullscreen = !!document.fullscreenElement;
      setIsFullscreen(isNowFullscreen);
      onFullscreenChange?.(isNowFullscreen);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [onFullscreenChange]);

  // Toggle fullscreen on the room container to keep UI visible
  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        const roomContainer = document.getElementById('room-container');
        if (roomContainer) {
          await roomContainer.requestFullscreen();
        }
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
  }, []);

  // Initialize Hyperbeam SDK - only when embedUrl changes
  useEffect(() => {
    if (!embedUrl || !containerRef.current) return;

    // Prevent re-initialization if we already have an instance with the same base URL
    // (ignore token differences - same session can have different tokens for host/viewer)
    const baseUrl = embedUrl.split('?')[0];
    const existingBaseUrl = initializedUrlRef.current?.split('?')[0];
    
    if (existingBaseUrl === baseUrl && hbInstanceRef.current) {
      console.log('[HyperbeamEmbed] Instance already exists for this session, skipping re-init');
      setIsLoading(false);
      return;
    }

    // Clean up previous instance if URL changed
    if (hbInstanceRef.current) {
      console.log('[HyperbeamEmbed] URL changed, cleaning up old instance');
      try {
        hbInstanceRef.current.destroy();
      } catch (e) {
        console.warn('[HyperbeamEmbed] Error destroying old instance:', e);
      }
      hbInstanceRef.current = null;
      initializedUrlRef.current = null;
    }

    // Reset initializing flag if we're starting fresh
    isInitializingRef.current = false;

    let isMounted = true;
    
    const initHyperbeam = async () => {
      // Prevent concurrent initialization
      if (isInitializingRef.current) {
        console.log('[HyperbeamEmbed] Already initializing, skipping');
        return;
      }
      
      isInitializingRef.current = true;
      
      try {
        console.log('[HyperbeamEmbed] Initializing with URL:', embedUrl);
        console.log('[HyperbeamEmbed] isHost:', isHost);

        // Small delay for viewers to let host connect first
        if (!isHost) {
          console.log('[HyperbeamEmbed] Viewer waiting 1s before connecting...');
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // Clear the container first
        if (containerRef.current) {
          containerRef.current.innerHTML = '';
        }

        // Create new Hyperbeam instance using the SDK
        // Timeout set to 60 seconds for connections
        console.log('[HyperbeamEmbed] Calling Hyperbeam SDK...');
        
        // Wrap in our own timeout to catch hangs
        const hbPromise = Hyperbeam(containerRef.current!, embedUrl, {
          timeout: 60000,
        });
        
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Hyperbeam connection timed out after 60s')), 65000);
        });
        
        const hb = await Promise.race([hbPromise, timeoutPromise]);
        console.log('[HyperbeamEmbed] Hyperbeam SDK returned:', hb);
        
        if (!isMounted) {
          console.log('[HyperbeamEmbed] Component unmounted during init, destroying');
          hb.destroy();
          isInitializingRef.current = false;
          return;
        }

        hbInstanceRef.current = hb;
        initializedUrlRef.current = embedUrl;
        isInitializingRef.current = false;
        
        console.log('[HyperbeamEmbed] Hyperbeam initialized successfully');
        setIsLoading(false);
        setHasError(false);
        onLoad?.();

      } catch (error: any) {
        console.error('[HyperbeamEmbed] Failed to initialize:', error);
        isInitializingRef.current = false;
        if (isMounted) {
          setIsLoading(false);
          setHasError(true);
          setErrorMessage(error?.message || 'Failed to load cloud browser');
          onError?.(error?.message || 'Failed to load Hyperbeam session');
        }
      }
    };

    // Start initialization immediately
    initHyperbeam();

    return () => {
      isMounted = false;
    };
  }, [embedUrl]); // Only depend on embedUrl to prevent re-init on other prop changes

  // Cleanup on actual unmount
  useEffect(() => {
    return () => {
      if (hbInstanceRef.current) {
        console.log('[HyperbeamEmbed] Component unmounting, cleaning up');
        try {
          hbInstanceRef.current.destroy();
        } catch (e) {
          console.warn('[HyperbeamEmbed] Error during cleanup:', e);
        }
        hbInstanceRef.current = null;
        initializedUrlRef.current = null;
      }
    };
  }, []);

  if (hasError) {
    return (
      <div className="w-full h-full rounded-2xl bg-background-secondary flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-status-error/10 border border-status-error/20 flex items-center justify-center">
            <Monitor className="w-10 h-10 text-status-error" />
          </div>
          <p className="text-status-error text-lg font-medium mb-2">Failed to load session</p>
          <p className="text-text-muted text-sm mb-2">
            {errorMessage || 'Please try refreshing or create a new session'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {/* Main Container */}
      <div className="relative w-full h-full bg-black rounded-2xl overflow-hidden shadow-2xl">
        {/* Loading State */}
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background-secondary z-20">
            {/* Animated Logo */}
            <div className="relative w-20 h-20 mb-6">
              <div className="absolute inset-0 rounded-2xl border-2 border-status-success/30 animate-ping" style={{ animationDuration: '2s' }} />
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-status-success to-emerald-500 flex items-center justify-center shadow-glow-success">
                <Monitor className="w-8 h-8 text-white" />
              </div>
            </div>
            
            <p className="text-text-secondary font-medium mb-2">Starting cloud browser...</p>
            <p className="text-text-muted text-sm mb-4">This may take a few seconds</p>
            
            {/* Loading Dots */}
            <div className="flex items-center gap-1.5">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 bg-status-success rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        )}
        
        {/* Hyperbeam Container - SDK will render iframe here */}
        <div 
          ref={containerRef} 
          className="hyperbeam-container"
          style={{ 
            width: '100%', 
            height: '100%',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        />

        {/* Control Bar - only show when not loading */}
        {!isLoading && (
          <div className="absolute top-4 right-4 flex items-center gap-2 z-10 pointer-events-none">
            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              className="btn-icon w-10 h-10 bg-black/60 hover:bg-black/80 border-transparent pointer-events-auto"
              title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        )}

        {/* Host/Viewer Indicator - only show when not loading */}
        {!isLoading && (
          <div className="absolute bottom-4 right-4 z-10 pointer-events-none">
            <div className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
              isHost 
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
            }`}>
              {isHost ? '🎮 You have control' : '👀 View only'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
