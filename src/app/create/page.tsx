/**
 * Create Room Page - Premium Redesign
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Play, Loader2, Sparkles, Film, Link2 } from 'lucide-react';
import { createRoom } from '@/lib/api';

export default function CreateRoomPage() {
  const router = useRouter();
  const [hostName, setHostName] = useState('');
  const [roomName, setRoomName] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState<'video' | 'youtube' | 'iframe'>('video');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!hostName.trim()) {
      setError('Please enter your name');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await createRoom({
        hostName: hostName.trim(),
        roomName: roomName.trim() || undefined,
        mediaUrl: mediaUrl.trim() || undefined,
        mediaType,
      });

      localStorage.setItem(`hostToken_${result.roomId}`, result.hostToken);
      localStorage.setItem('userName', hostName.trim());

      router.push(`/room/${result.roomId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create room');
      setIsLoading(false);
    }
  };

  const handleMediaUrlChange = (url: string) => {
    setMediaUrl(url);
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      setMediaType('youtube');
    } else if (url.endsWith('.mp4') || url.endsWith('.webm') || url.endsWith('.ogg')) {
      setMediaType('video');
    }
  };

  return (
    <div className="min-h-screen bg-background-primary flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Ambient Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-accent-primary/15 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-accent-secondary/15 rounded-full blur-[150px]" />
      </div>

      <div className="w-full max-w-md relative">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center text-text-tertiary hover:text-white mb-8 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </Link>

        {/* Form Card */}
        <div className="glass-card p-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-accent flex items-center justify-center shadow-glow">
              <Play className="w-7 h-7 text-white" fill="white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Start a Pillow Party</h1>
              <p className="text-text-tertiary text-sm">Create your cozy watch room</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Host Name */}
            <div>
              <label htmlFor="hostName" className="block text-sm font-medium text-text-secondary mb-2">
                Your Name *
              </label>
              <input
                type="text"
                id="hostName"
                value={hostName}
                onChange={(e) => setHostName(e.target.value)}
                placeholder="Enter your name"
                className="input-glass"
                maxLength={50}
                required
              />
            </div>

            {/* Room Name */}
            <div>
              <label htmlFor="roomName" className="block text-sm font-medium text-text-secondary mb-2">
                Room Name
                <span className="text-text-muted ml-1">(optional)</span>
              </label>
              <input
                type="text"
                id="roomName"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="My Watch Party"
                className="input-glass"
                maxLength={100}
              />
            </div>

            {/* Media URL */}
            <div>
              <label htmlFor="mediaUrl" className="block text-sm font-medium text-text-secondary mb-2">
                Video URL
                <span className="text-text-muted ml-1">(optional)</span>
              </label>
              <div className="relative">
                <input
                  type="url"
                  id="mediaUrl"
                  value={mediaUrl}
                  onChange={(e) => handleMediaUrlChange(e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  className="input-glass pl-10"
                />
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              </div>
              <p className="mt-2 text-xs text-text-muted flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                You can add or change videos after creating the room
              </p>
            </div>

            {/* Media Type (if URL provided) */}
            {mediaUrl && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-glass-light border border-glass-border">
                <Film className="w-4 h-4 text-text-muted" />
                <span className="text-sm text-text-secondary">
                  Detected: <span className="text-white capitalize">{mediaType}</span>
                </span>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-4 rounded-xl bg-status-error/10 border border-status-error/20 text-status-error text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-gradient py-4 text-base flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Setting up your room...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" fill="white" />
                  Start Pillow Party
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer Link */}
        <p className="text-center text-text-muted text-sm mt-6">
          Already have a room code?{' '}
          <Link href="/join" className="text-accent-primary hover:text-accent-primary-hover transition-colors">
            Join existing room
          </Link>
        </p>
      </div>
    </div>
  );
}
