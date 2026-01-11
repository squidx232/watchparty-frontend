/**
 * Join Room Page - Premium Redesign
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Users, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { getRoomInfo } from '@/lib/api';

export default function JoinRoomPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [roomId, setRoomId] = useState('');
  const [userName, setUserName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState('');
  const [roomInfo, setRoomInfo] = useState<{
    name: string;
    hostName: string;
    participantCount: number;
  } | null>(null);

  // Pre-fill from URL and localStorage
  useEffect(() => {
    const roomParam = searchParams.get('room');
    if (roomParam) {
      setRoomId(roomParam);
      validateRoom(roomParam);
    }
    
    const savedName = localStorage.getItem('userName');
    if (savedName) {
      setUserName(savedName);
    }
  }, [searchParams]);

  const validateRoom = async (id: string) => {
    if (!id || id.length < 5) {
      setRoomInfo(null);
      setIsValidating(false);
      return;
    }

    setIsValidating(true);
    setError('');

    try {
      const info = await getRoomInfo(id);
      setRoomInfo({
        name: info.name,
        hostName: info.hostName,
        participantCount: info.participantCount,
      });
      setError('');
    } catch (err) {
      setRoomInfo(null);
      if (id.length >= 10) {
        setError('Room not found');
      }
    } finally {
      setIsValidating(false);
    }
  };

  const handleRoomIdChange = (value: string) => {
    const urlMatch = value.match(/\/room\/([a-zA-Z0-9_-]+)/) || value.match(/[?&]room=([a-zA-Z0-9_-]+)/);
    const cleanId = urlMatch ? urlMatch[1] : value.trim();
    
    setRoomId(cleanId);
    setError('');
    setRoomInfo(null);
    
    if (cleanId.length >= 5) {
      setIsValidating(true);
      const timeout = setTimeout(() => validateRoom(cleanId), 500);
      return () => clearTimeout(timeout);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!roomId.trim()) {
      setError('Please enter a room ID');
      return;
    }
    
    if (!userName.trim()) {
      setError('Please enter your name');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await getRoomInfo(roomId);
      localStorage.setItem('userName', userName.trim());
      router.push(`/room/${roomId}?name=${encodeURIComponent(userName.trim())}`);
    } catch (err) {
      setError('Room not found or no longer available');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-primary flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Ambient Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-status-success/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[150px]" />
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
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-status-success to-emerald-500 flex items-center justify-center shadow-glow-success">
              <Users className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Join the Party</h1>
              <p className="text-text-tertiary text-sm">Enter a room code to get cozy</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Room ID */}
            <div>
              <label htmlFor="roomId" className="block text-sm font-medium text-text-secondary mb-2">
                Room ID or Link *
              </label>
              <input
                type="text"
                id="roomId"
                value={roomId}
                onChange={(e) => handleRoomIdChange(e.target.value)}
                placeholder="Enter room ID or paste link"
                className="input-glass"
                required
              />
              
              {/* Validation States */}
              {isValidating && (
                <div className="mt-3 flex items-center gap-2 text-text-tertiary text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Checking room...
                </div>
              )}
              
              {roomInfo && !isValidating && (
                <div className="mt-3 p-4 rounded-xl bg-status-success/10 border border-status-success/20 animate-fade-in">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-status-success flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-status-success">{roomInfo.name}</p>
                      <p className="text-sm text-text-tertiary mt-0.5">
                        Hosted by {roomInfo.hostName} • {roomInfo.participantCount} watching
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* User Name */}
            <div>
              <label htmlFor="userName" className="block text-sm font-medium text-text-secondary mb-2">
                Your Name *
              </label>
              <input
                type="text"
                id="userName"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Enter your name"
                className="input-glass"
                maxLength={50}
                required
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 rounded-xl bg-status-error/10 border border-status-error/20 text-status-error text-sm flex items-start gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !roomInfo}
              className="w-full py-4 text-base flex items-center justify-center gap-2 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-status-success to-emerald-500 hover:from-status-success/90 hover:to-emerald-500/90 text-white shadow-glow-success"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Getting cozy...
                </>
              ) : (
                <>
                  <Users className="w-5 h-5" />
                  Join the Party
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer Link */}
        <p className="text-center text-text-muted text-sm mt-6">
          Want to host your own?{' '}
          <Link href="/create" className="text-accent-primary hover:text-accent-primary-hover transition-colors">
            Create a room
          </Link>
        </p>
      </div>
    </div>
  );
}
