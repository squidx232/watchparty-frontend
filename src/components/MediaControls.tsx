/**
 * MediaControls - Premium Redesign
 * 
 * Floating glassmorphic media controls with:
 * - Clean input design
 * - Session management
 * - Smooth transitions
 */

'use client';

import { useState } from 'react';
import { 
  Monitor, 
  StopCircle
} from 'lucide-react';

interface MediaControlsProps {
  currentUrl: string;
  currentType: 'video' | 'youtube' | 'iframe' | 'hyperbeam';
  onChangeMedia: (url: string, type: 'video' | 'youtube' | 'iframe') => void;
  onStopSession?: () => Promise<void>;
  isSessionActive?: boolean;
}

export default function MediaControls({
  currentUrl,
  currentType,
  onChangeMedia,
  onStopSession,
  isSessionActive = false,
}: MediaControlsProps) {
  const [isStopping, setIsStopping] = useState(false);

  const handleStopSession = async () => {
    if (!onStopSession) return;
    setIsStopping(true);
    try {
      await onStopSession();
    } catch (error) {
      console.error('Failed to stop session:', error);
    } finally {
      setIsStopping(false);
    }
  };

  // Session active state - show only stop button
  if (isSessionActive) {
    return (
      <div className="glass-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-status-success/10 flex items-center justify-center">
              <Monitor className="w-5 h-5 text-status-success" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-white text-sm">Session Active</span>
                <div className="flex items-center gap-1 px-2 py-0.5 bg-status-success/10 rounded-full">
                  <div className="w-1.5 h-1.5 bg-status-success rounded-full animate-pulse" />
                  <span className="text-xs text-status-success">Synced</span>
                </div>
              </div>
              <p className="text-xs text-text-muted">Cloud browser session running</p>
            </div>
          </div>
          <button
            onClick={handleStopSession}
            disabled={isStopping}
            className="px-4 py-2 bg-status-error/10 hover:bg-status-error/20 border border-status-error/20 rounded-xl text-sm font-medium text-status-error transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <StopCircle className="w-4 h-4" />
            {isStopping ? 'Stopping...' : 'End Session'}
          </button>
        </div>
      </div>
    );
  }

  // No session - show loading state (session will auto-start)
  return (
    <div className="glass-card p-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-glass-medium flex items-center justify-center">
          <Monitor className="w-5 h-5 text-text-muted animate-pulse" />
        </div>
        <div>
          <p className="text-sm text-text-secondary">Starting session...</p>
          <p className="text-xs text-text-muted">Cloud browser will start automatically</p>
        </div>
      </div>
    </div>
  );
}
