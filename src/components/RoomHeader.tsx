/**
 * RoomHeader - Premium Redesign
 * 
 * Floating glassmorphic header with minimal chrome
 * Shows room info, sync status, participants, and actions
 */

'use client';

import { useState } from 'react';
import { 
  Copy, 
  Check, 
  LogOut, 
  Users, 
  MessageCircle, 
  Share2,
  Settings,
  MoreHorizontal,
  Wifi
} from 'lucide-react';

interface RoomHeaderProps {
  roomName: string;
  roomId: string;
  participantCount: number;
  isHost: boolean;
  onLeave: () => void;
  showChat: boolean;
  onToggleChat: () => void;
  unreadCount?: number;
}

export default function RoomHeader({
  roomName,
  roomId,
  participantCount,
  isHost,
  onLeave,
  showChat,
  onToggleChat,
  unreadCount = 0,
}: RoomHeaderProps) {
  const [copied, setCopied] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const shareUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/join?room=${roomId}`
    : '';

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <>
      <header className="absolute top-0 left-0 right-0 z-30 p-4">
        <div className="flex items-center justify-between">
          {/* Left Section - Room Info */}
          <div className="flex items-center gap-4">
            {/* Logo/Back */}
            <div className="glass-card px-4 py-2.5 flex items-center gap-3">
              <img src="/logo.png" alt="Pillow Watch" className="w-8 h-8 rounded-lg" />
              <div className="hidden sm:block">
                <h1 className="font-semibold text-white text-sm leading-tight">{roomName}</h1>
                <div className="flex items-center gap-2 text-xs text-text-tertiary">
                  <span className="font-mono">{roomId}</span>
                </div>
              </div>
            </div>

            {/* Sync Status Pill */}
            <div className="glass-card px-3 py-2 flex items-center gap-2">
              <div className="relative">
                <div className="w-2 h-2 bg-status-success rounded-full" />
                <div className="absolute inset-0 w-2 h-2 bg-status-success rounded-full animate-ping opacity-75" />
              </div>
              <span className="text-xs font-medium text-status-success">Synced</span>
              <Wifi className="w-3 h-3 text-status-success" />
            </div>
          </div>


          {/* Right Section - Actions */}
          <div className="flex items-center gap-2">
            {/* Invite Button */}
            <button
              onClick={() => setShowShareModal(true)}
              className="btn-gradient flex items-center gap-2 text-sm"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">Invite</span>
            </button>

            {/* Chat Toggle */}
            <button
              onClick={onToggleChat}
              className={`btn-icon relative ${showChat ? 'bg-accent-primary/20 border-accent-primary/30 text-accent-primary' : ''}`}
              title={showChat ? 'Hide chat' : 'Show chat'}
            >
              <MessageCircle className="w-5 h-5" />
              {/* Notification dot - only show when there are unread messages */}
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-status-error rounded-full flex items-center justify-center text-[10px] font-bold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Settings/More */}
            <button className="btn-icon">
              <MoreHorizontal className="w-5 h-5" />
            </button>

            {/* Leave Button */}
            <button
              onClick={onLeave}
              className="btn-icon text-status-error hover:bg-status-error/10 hover:border-status-error/30"
              title="Leave room"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Share Modal */}
      {showShareModal && (
        <ShareModal
          roomName={roomName}
          shareUrl={shareUrl}
          onCopy={handleCopyLink}
          copied={copied}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </>
  );
}

/* Share Modal Component */
function ShareModal({
  roomName,
  shareUrl,
  onCopy,
  copied,
  onClose,
}: {
  roomName: string;
  shareUrl: string;
  onCopy: () => void;
  copied: boolean;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative glass-heavy rounded-2xl p-6 w-full max-w-md animate-scale-in">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-accent flex items-center justify-center">
            <Share2 className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-1">Invite to the Party</h2>
          <p className="text-text-tertiary text-sm">Share this link to invite friends to {roomName}</p>
        </div>

        {/* Link Input */}
        <div className="flex gap-2 mb-6">
          <div className="flex-1 glass rounded-xl px-4 py-3 text-sm text-text-secondary truncate font-mono">
            {shareUrl}
          </div>
          <button
            onClick={onCopy}
            className={`btn-icon w-12 h-12 rounded-xl ${copied ? 'bg-status-success/20 border-status-success/30 text-status-success' : ''}`}
          >
            {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
          </button>
        </div>

        {/* Copy Status */}
        {copied && (
          <p className="text-center text-sm text-status-success mb-4 animate-fade-in">
            Link copied to clipboard!
          </p>
        )}

        {/* Social Share */}
        <div className="flex items-center justify-center gap-3">
          <span className="text-xs text-text-muted">Or share via</span>
          <div className="flex gap-2">
            {['Twitter', 'Discord', 'WhatsApp'].map((platform) => (
              <button
                key={platform}
                className="btn-glass px-3 py-1.5 text-xs rounded-lg"
              >
                {platform}
              </button>
            ))}
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 btn-icon w-8 h-8"
        >
          <span className="text-lg">×</span>
        </button>
      </div>
    </div>
  );
}
