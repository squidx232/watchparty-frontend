/**
 * ParticipantsList - Premium Redesign
 * 
 * Elegant participant display with:
 * - Animated avatars
 * - Host indicator
 * - Online status
 * - Hover tooltips
 */

'use client';

import { useState } from 'react';
import { Crown, Users, Wifi, ChevronDown, ChevronUp } from 'lucide-react';
import type { Participant } from '@/types';

interface ParticipantsListProps {
  participants: Participant[];
  currentUserId?: string;
  compact?: boolean;
  isHost?: boolean;
}

export default function ParticipantsList({
  participants,
  currentUserId,
  compact = false,
  isHost = false,
}: ParticipantsListProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  if (compact) {
    return (
      <div className="relative">
        {/* Main compact view */}
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="glass-card px-3 py-2 flex items-center gap-3 cursor-pointer hover:bg-glass-medium transition-all"
        >
          {/* Avatar Stack */}
          <div className="flex items-center -space-x-2">
            {participants.slice(0, 5).map((participant, index) => (
              <div
                key={participant.id}
                className="relative"
                style={{ zIndex: 5 - index }}
              >
                {/* Avatar */}
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-semibold ring-2 ring-background-primary transition-all duration-200"
                  style={{ backgroundColor: participant.avatarColor }}
                >
                  {participant.name.charAt(0).toUpperCase()}
                </div>
                
                {/* Host Crown */}
                {participant.role === 'host' && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center ring-2 ring-background-primary">
                    <Crown className="w-2.5 h-2.5 text-white" />
                  </div>
                )}
                
                {/* Online Indicator */}
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-status-success rounded-full ring-2 ring-background-primary" />
              </div>
            ))}
            
            {/* Overflow Count */}
            {participants.length > 5 && (
              <div className="w-9 h-9 rounded-full bg-background-elevated flex items-center justify-center text-text-secondary text-xs font-medium ring-2 ring-background-primary">
                +{participants.length - 5}
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="h-5 w-px bg-glass-border" />

          {/* Count */}
          <div className="flex items-center gap-1.5 text-sm">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-status-success rounded-full animate-pulse" />
              <span className="text-text-secondary">{participants.length}</span>
            </div>
            <span className="text-text-muted">watching</span>
          </div>

          {/* Role Badge */}
          <div className="h-5 w-px bg-glass-border" />
          <div className={`px-2 py-1 rounded-lg text-xs font-medium ${isHost ? 'bg-amber-500/20 text-amber-400' : 'bg-accent-primary/20 text-accent-primary'}`}>
            {isHost ? 'Host' : 'Viewer'}
          </div>

          {/* Expand/Collapse Icon */}
          <div className="text-text-muted">
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {/* Expanded participant list */}
        {isExpanded && (
          <div className="absolute bottom-full left-0 mb-2 bg-background-secondary border border-glass-border rounded-xl p-3 min-w-[220px] max-h-[300px] overflow-y-auto animate-fade-in z-50 shadow-2xl">
            <div className="space-y-2">
              {participants.map((participant) => (
                <div
                  key={participant.id}
                  className={`flex items-center gap-3 p-2 rounded-xl transition-all hover:bg-glass-light ${
                    participant.id === currentUserId ? 'bg-accent-primary/10 border border-accent-primary/20' : ''
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-xs"
                      style={{ backgroundColor: participant.avatarColor }}
                    >
                      {participant.name.charAt(0).toUpperCase()}
                    </div>
                    
                    {/* Online Dot */}
                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-status-success rounded-full ring-2 ring-background-secondary" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-white truncate">
                        {participant.name}
                      </span>
                      {participant.id === currentUserId && (
                        <span className="text-xs text-accent-primary">(You)</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-text-muted">
                      {participant.role === 'host' ? (
                        <span className="flex items-center gap-1 text-amber-400">
                          <Crown className="w-3 h-3" />
                          Host
                        </span>
                      ) : (
                        <span className="text-gray-400">Viewer</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Full list view
  return (
    <div className="glass-card p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-text-muted" />
          <h3 className="font-medium text-sm text-white">Participants</h3>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1 bg-status-success/10 rounded-full">
          <div className="w-1.5 h-1.5 bg-status-success rounded-full animate-pulse" />
          <span className="text-xs font-medium text-status-success">{participants.length} online</span>
        </div>
      </div>

      {/* List */}
      <div className="space-y-2">
        {participants.map((participant) => (
          <div
            key={participant.id}
            className={`flex items-center gap-3 p-2 rounded-xl transition-all hover:bg-glass-light ${
              participant.id === currentUserId ? 'bg-accent-primary/5 border border-accent-primary/20' : ''
            }`}
          >
            {/* Avatar */}
            <div className="relative">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-semibold text-sm"
                style={{ backgroundColor: participant.avatarColor }}
              >
                {participant.name.charAt(0).toUpperCase()}
              </div>
              
              {/* Online Dot */}
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-status-success rounded-full ring-2 ring-background-secondary" />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm text-white truncate">
                  {participant.name}
                </span>
                {participant.id === currentUserId && (
                  <span className="text-xs text-accent-primary">(You)</span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-text-muted">
                {participant.role === 'host' ? (
                  <span className="flex items-center gap-1 text-amber-400">
                    <Crown className="w-3 h-3" />
                    Host
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <Wifi className="w-3 h-3" />
                    Watching
                  </span>
                )}
              </div>
            </div>

            {/* Host Badge */}
            {participant.role === 'host' && (
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Crown className="w-4 h-4 text-amber-400" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
