/**
 * VideoPlayer - Premium Redesign
 * 
 * Cinematic video player with:
 * - Ambient background glow
 * - Floating minimal controls
 * - Smooth hover interactions
 * - Premium visual styling
 */

'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize,
  SkipBack,
  SkipForward,
  Settings,
  Film,
  Loader2
} from 'lucide-react';
import type { PlaybackState } from '@/types';

interface VideoPlayerProps {
  mediaUrl: string;
  mediaType: 'video' | 'youtube' | 'iframe' | 'hyperbeam';
  playbackState: PlaybackState;
  isHost: boolean;
  onPlay: (currentTime: number) => void;
  onPause: (currentTime: number) => void;
  onSeek: (currentTime: number) => void;
}

const SYNC_THRESHOLD = 2;

export default function VideoPlayer({
  mediaUrl,
  mediaType,
  playbackState,
  isHost,
  onPlay,
  onPause,
  onSeek,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const isSyncingRef = useRef(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  // Auto-hide controls
  const resetControlsTimeout = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (playbackState.isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  }, [playbackState.isPlaying]);

  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  // Sync video to server state
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !mediaUrl) return;

    isSyncingRef.current = true;

    const timeSinceUpdate = (Date.now() - playbackState.lastUpdated) / 1000;
    const expectedTime = playbackState.isPlaying 
      ? playbackState.currentTime + timeSinceUpdate 
      : playbackState.currentTime;

    const drift = Math.abs(video.currentTime - expectedTime);
    if (drift > SYNC_THRESHOLD) {
      video.currentTime = expectedTime;
    }

    if (playbackState.isPlaying && video.paused) {
      video.play().catch(console.error);
    } else if (!playbackState.isPlaying && !video.paused) {
      video.pause();
    }

    if (video.playbackRate !== playbackState.playbackRate) {
      video.playbackRate = playbackState.playbackRate;
    }

    setTimeout(() => {
      isSyncingRef.current = false;
    }, 100);
  }, [playbackState, mediaUrl]);

  const handlePlay = useCallback(() => {
    if (isHost && !isSyncingRef.current && videoRef.current) {
      onPlay(videoRef.current.currentTime);
    }
  }, [isHost, onPlay]);

  const handlePause = useCallback(() => {
    if (isHost && !isSyncingRef.current && videoRef.current) {
      onPause(videoRef.current.currentTime);
    }
  }, [isHost, onPause]);

  const handleSeek = useCallback(() => {
    if (isHost && !isSyncingRef.current && videoRef.current) {
      onSeek(videoRef.current.currentTime);
    }
  }, [isHost, onSeek]);

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  }, []);

  const handleDurationChange = useCallback(() => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  }, []);

  const togglePlayPause = () => {
    if (!isHost || !videoRef.current) return;
    resetControlsTimeout();
    
    if (videoRef.current.paused) {
      videoRef.current.play();
    } else {
      videoRef.current.pause();
    }
  };

  const seekTo = (time: number) => {
    if (!isHost || !videoRef.current) return;
    videoRef.current.currentTime = time;
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isHost || !progressRef.current || !duration) return;
    
    const rect = progressRef.current.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * duration;
    seekTo(newTime);
  };

  const handleProgressHover = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !duration) return;
    
    const rect = progressRef.current.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    setHoverTime(percent * duration);
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const changeVolume = (newVolume: number) => {
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    
    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const formatTime = (seconds: number): string => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration ? (currentTime / duration) * 100 : 0;

  // YouTube embed URL handler
  const getYouTubeVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]+)/,
      /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/,
      /(?:youtu\.be\/)([a-zA-Z0-9_-]+)/,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const getYouTubeEmbedUrl = (url: string): string | null => {
    const videoId = getYouTubeVideoId(url);
    if (videoId) {
      return `https://www.youtube-nocookie.com/embed/${videoId}?enablejsapi=1&rel=0&modestbranding=1`;
    }
    return null;
  };

  // No media placeholder
  if (!mediaUrl) {
    return (
      <div className="relative w-full h-full bg-background-secondary rounded-2xl overflow-hidden">
        {/* Ambient Background */}
        <div className="absolute inset-0 bg-gradient-radial from-accent-primary/5 via-transparent to-transparent" />
        
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="w-20 h-20 rounded-2xl bg-glass-medium backdrop-blur-glass border border-glass-border flex items-center justify-center mb-6">
            <Film className="w-10 h-10 text-text-muted" />
          </div>
          <p className="text-text-secondary text-lg font-medium mb-2">No media loaded</p>
          {isHost && (
            <p className="text-text-muted text-sm">
              Click "Add Media" below to start watching
            </p>
          )}
        </div>
      </div>
    );
  }

  // YouTube/iframe render
  if (mediaType === 'youtube') {
    const embedUrl = getYouTubeEmbedUrl(mediaUrl);
    
    if (!embedUrl) {
      return (
        <div className="relative w-full h-full bg-background-secondary rounded-2xl overflow-hidden flex items-center justify-center">
          <div className="text-center">
            <Film className="w-16 h-16 text-status-error mx-auto mb-4" />
            <p className="text-status-error text-lg">Invalid YouTube URL</p>
          </div>
        </div>
      );
    }
    
    return (
      <div className="relative w-full h-full">
        {/* Ambient Glow Background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-[-20%] bg-gradient-radial from-accent-primary/20 via-accent-secondary/10 to-transparent blur-3xl opacity-60" />
        </div>
        
        <div className="relative w-full h-full bg-black rounded-2xl overflow-hidden shadow-2xl">
          <iframe
            src={embedUrl}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
          
          {/* Role Badge */}
          <div className="absolute bottom-4 left-4">
            <div className={`glass px-3 py-1.5 rounded-full text-xs font-medium ${isHost ? 'text-accent-primary' : 'text-amber-400'}`}>
              {isHost ? '👑 Host' : '👁 Viewer'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (mediaType === 'iframe') {
    return (
      <div className="relative w-full h-full">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-[-20%] bg-gradient-radial from-accent-secondary/20 via-accent-tertiary/10 to-transparent blur-3xl opacity-60" />
        </div>
        
        <div className="relative w-full h-full bg-black rounded-2xl overflow-hidden shadow-2xl">
          <iframe
            src={mediaUrl}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    );
  }

  // Main video player
  return (
    <div className="relative w-full h-full">
      {/* Ambient Glow Background */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div 
          className="absolute inset-[-30%] blur-[100px] opacity-50 transition-opacity duration-1000"
          style={{
            background: `radial-gradient(ellipse at center, 
              rgba(99, 102, 241, 0.3) 0%, 
              rgba(139, 92, 246, 0.2) 30%, 
              rgba(168, 85, 247, 0.1) 50%,
              transparent 70%)`
          }}
        />
      </div>

      {/* Video Container */}
      <div 
        ref={containerRef}
        className="relative w-full h-full bg-black rounded-2xl overflow-hidden shadow-2xl group"
        onMouseMove={resetControlsTimeout}
        onMouseEnter={() => setShowControls(true)}
      >
        {/* Video Element */}
        <video
          ref={videoRef}
          src={mediaUrl}
          className="w-full h-full object-contain"
          onPlay={handlePlay}
          onPause={handlePause}
          onSeeked={handleSeek}
          onTimeUpdate={handleTimeUpdate}
          onDurationChange={handleDurationChange}
          onWaiting={() => setIsBuffering(true)}
          onPlaying={() => setIsBuffering(false)}
          onClick={togglePlayPause}
          playsInline
        />

        {/* Buffering Indicator */}
        {isBuffering && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <Loader2 className="w-12 h-12 text-white animate-spin" />
          </div>
        )}

        {/* Click to Play Overlay */}
        {!playbackState.isPlaying && !isBuffering && (
          <div 
            className="absolute inset-0 flex items-center justify-center cursor-pointer"
            onClick={togglePlayPause}
          >
            <div className={`w-20 h-20 rounded-full bg-white/10 backdrop-blur-xl flex items-center justify-center transition-all duration-300 ${isHost ? 'hover:bg-white/20 hover:scale-110' : 'opacity-50'}`}>
              <Play className="w-8 h-8 text-white ml-1" fill="white" />
            </div>
          </div>
        )}

        {/* Controls Overlay */}
        <div 
          className={`absolute inset-0 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}
          style={{
            background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 30%, transparent 80%, rgba(0,0,0,0.4) 100%)'
          }}
        >
          {/* Top Bar */}
          <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
            {/* Role Badge */}
            <div className={`glass px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-2 ${isHost ? 'text-accent-primary' : 'text-amber-400'}`}>
              {isHost ? (
                <>
                  <span className="w-2 h-2 bg-accent-primary rounded-full" />
                  Host Controls
                </>
              ) : (
                <>
                  <span className="w-2 h-2 bg-amber-400 rounded-full" />
                  View Only
                </>
              )}
            </div>

            {/* Settings */}
            <button className="btn-icon w-9 h-9 bg-black/40 border-transparent hover:bg-black/60">
              <Settings className="w-4 h-4" />
            </button>
          </div>

          {/* Bottom Controls */}
          <div className="absolute bottom-0 left-0 right-0 p-4 space-y-3">
            {/* Progress Bar */}
            <div 
              ref={progressRef}
              className={`relative h-1.5 bg-white/20 rounded-full overflow-hidden ${isHost ? 'cursor-pointer' : 'cursor-default'} group/progress`}
              onClick={handleProgressClick}
              onMouseMove={handleProgressHover}
              onMouseLeave={() => setHoverTime(null)}
            >
              {/* Buffered */}
              <div className="absolute inset-y-0 left-0 bg-white/30 rounded-full" style={{ width: '100%' }} />
              
              {/* Progress */}
              <div 
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-accent-primary to-accent-secondary rounded-full transition-all"
                style={{ width: `${progressPercent}%` }}
              />
              
              {/* Hover Preview */}
              {hoverTime !== null && isHost && (
                <div 
                  className="absolute bottom-full mb-2 px-2 py-1 bg-black/90 rounded text-xs text-white transform -translate-x-1/2 pointer-events-none"
                  style={{ left: `${(hoverTime / duration) * 100}%` }}
                >
                  {formatTime(hoverTime)}
                </div>
              )}
              
              {/* Scrubber */}
              <div 
                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg transition-transform group-hover/progress:scale-125"
                style={{ left: `calc(${progressPercent}% - 8px)` }}
              />
            </div>

            {/* Controls Row */}
            <div className="flex items-center justify-between">
              {/* Left Controls */}
              <div className="flex items-center gap-2">
                {/* Play/Pause */}
                <button
                  onClick={togglePlayPause}
                  disabled={!isHost}
                  className={`btn-icon w-10 h-10 bg-white/10 border-transparent hover:bg-white/20 ${!isHost && 'opacity-50 cursor-not-allowed'}`}
                >
                  {playbackState.isPlaying ? (
                    <Pause className="w-5 h-5" fill="white" />
                  ) : (
                    <Play className="w-5 h-5 ml-0.5" fill="white" />
                  )}
                </button>

                {/* Skip Buttons */}
                <button
                  onClick={() => seekTo(Math.max(0, currentTime - 10))}
                  disabled={!isHost}
                  className={`btn-icon w-9 h-9 bg-white/10 border-transparent hover:bg-white/20 ${!isHost && 'opacity-50 cursor-not-allowed'}`}
                >
                  <SkipBack className="w-4 h-4" />
                </button>
                <button
                  onClick={() => seekTo(Math.min(duration, currentTime + 10))}
                  disabled={!isHost}
                  className={`btn-icon w-9 h-9 bg-white/10 border-transparent hover:bg-white/20 ${!isHost && 'opacity-50 cursor-not-allowed'}`}
                >
                  <SkipForward className="w-4 h-4" />
                </button>

                {/* Volume */}
                <div className="flex items-center gap-2 group/volume">
                  <button 
                    onClick={toggleMute}
                    className="btn-icon w-9 h-9 bg-white/10 border-transparent hover:bg-white/20"
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={isMuted ? 0 : volume}
                    onChange={(e) => changeVolume(Number(e.target.value))}
                    className="w-0 group-hover/volume:w-20 transition-all duration-300 accent-accent-primary"
                  />
                </div>

                {/* Time Display */}
                <div className="text-sm text-white/80 font-mono ml-2">
                  <span>{formatTime(currentTime)}</span>
                  <span className="text-white/40 mx-1">/</span>
                  <span className="text-white/60">{formatTime(duration)}</span>
                </div>
              </div>

              {/* Right Controls */}
              <div className="flex items-center gap-2">
                {/* Fullscreen */}
                <button 
                  onClick={toggleFullscreen}
                  className="btn-icon w-9 h-9 bg-white/10 border-transparent hover:bg-white/20"
                >
                  {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
