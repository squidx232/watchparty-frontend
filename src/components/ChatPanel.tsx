/**
 * ChatPanel - Premium Redesign
 * 
 * Floating glassmorphic chat panel with:
 * - Clean message bubbles
 * - Smooth animations
 * - Emoji reactions
 * - Typing indicators
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Smile, X, MessageCircle, Sparkles } from 'lucide-react';
import type { ChatMessage, Participant } from '@/types';

interface ChatPanelProps {
  messages: ChatMessage[];
  currentUserId: string;
  onSendMessage: (content: string) => void;
  participants: Participant[];
  onClose?: () => void;
  isFullscreenMode?: boolean;
}

// Quick emoji reactions
const QUICK_EMOJIS = ['👍', '❤️', '😂', '🔥', '👏', '😮'];

export default function ChatPanel({
  messages,
  currentUserId,
  onSendMessage,
  participants,
  onClose,
  isFullscreenMode = false,
}: ChatPanelProps) {
  const [input, setInput] = useState('');
  const [showEmojis, setShowEmojis] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  // Note: Sound is handled centrally in the room page to avoid duplicates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSendMessage(input.trim());
      setInput('');
      setShowEmojis(false);
    }
  };

  const handleEmojiClick = (emoji: string) => {
    onSendMessage(emoji);
    setShowEmojis(false);
  };

  const getParticipantColor = (senderId: string): string => {
    const participant = participants.find(p => p.id === senderId);
    return participant?.avatarColor || '#6366f1';
  };

  const getParticipantInitial = (name: string): string => {
    return name.charAt(0).toUpperCase();
  };

  const formatTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Group messages by sender for cleaner UI
  const groupedMessages = messages.reduce((groups, message, index) => {
    const prevMessage = messages[index - 1];
    const isSameSender = prevMessage?.senderId === message.senderId;
    const isWithinTime = prevMessage && 
      (new Date(message.timestamp).getTime() - new Date(prevMessage.timestamp).getTime()) < 60000;
    
    if (isSameSender && isWithinTime) {
      groups[groups.length - 1].messages.push(message);
    } else {
      groups.push({
        senderId: message.senderId,
        senderName: message.senderName,
        messages: [message],
      });
    }
    return groups;
  }, [] as { senderId: string; senderName: string; messages: ChatMessage[] }[]);

  // For fullscreen mode, only show last 5 messages
  const displayMessages = isFullscreenMode ? messages.slice(-5) : messages;
  
  // Recompute grouped messages for display
  const displayGroupedMessages = displayMessages.reduce((groups, message, index) => {
    const prevMessage = displayMessages[index - 1];
    const isSameSender = prevMessage?.senderId === message.senderId;
    const isWithinTime = prevMessage && 
      (new Date(message.timestamp).getTime() - new Date(prevMessage.timestamp).getTime()) < 60000;
    
    if (isSameSender && isWithinTime) {
      groups[groups.length - 1].messages.push(message);
    } else {
      groups.push({
        senderId: message.senderId,
        senderName: message.senderName,
        messages: [message],
      });
    }
    return groups;
  }, [] as { senderId: string; senderName: string; messages: ChatMessage[] }[]);

  // Use different layouts for fullscreen vs normal mode
  if (isFullscreenMode) {
    return (
      <div className="bg-black/80 backdrop-blur-md rounded-xl overflow-hidden">
        {/* Messages - compact */}
        <div className="max-h-[120px] overflow-y-auto p-2 space-y-1">
          {displayGroupedMessages.length === 0 ? (
            <p className="text-white/50 text-xs text-center py-2">No messages yet</p>
          ) : (
            displayGroupedMessages.map((group, groupIndex) => (
              <div key={groupIndex} className="flex items-start gap-2">
                <span 
                  className="text-xs font-semibold flex-shrink-0"
                  style={{ color: getParticipantColor(group.senderId) }}
                >
                  {group.senderName}:
                </span>
                <span className="text-xs text-white break-words">
                  {group.messages.map(m => m.content).join(' ')}
                </span>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Compact input - font-size 16px prevents iOS zoom */}
        <form onSubmit={handleSubmit} className="p-2 border-t border-white/10">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Message..."
              maxLength={500}
              style={{ fontSize: '16px' }}
              className="flex-1 bg-white/10 text-white px-3 py-1.5 rounded-lg outline-none placeholder-white/50"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className={`p-2 rounded-lg flex-shrink-0 ${input.trim() ? 'bg-accent-primary text-white' : 'bg-white/10 text-white/50'}`}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="w-80 lg:w-96 h-full flex-shrink-0 flex flex-col glass-heavy rounded-2xl overflow-hidden animate-slide-in-right">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-glass-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-accent flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-white text-sm">Live Chat</h2>
            <p className="text-xs text-text-muted">{participants.length} watching</p>
          </div>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="btn-icon w-8 h-8"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-glass-medium flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-text-muted" />
            </div>
            <p className="text-text-secondary font-medium mb-1">No messages yet</p>
            <p className="text-text-muted text-sm">Start the conversation!</p>
          </div>
        ) : (
          groupedMessages.map((group, groupIndex) => {
            const isOwn = group.senderId === currentUserId;
            
            return (
              <div 
                key={groupIndex}
                className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''} animate-fade-in`}
              >
                {/* Avatar */}
                {!isOwn && (
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0"
                    style={{ backgroundColor: getParticipantColor(group.senderId) }}
                  >
                    {getParticipantInitial(group.senderName)}
                  </div>
                )}
                
                {/* Messages */}
                <div className={`flex flex-col gap-1 max-w-[75%] ${isOwn ? 'items-end' : 'items-start'}`}>
                  {/* Sender Name (only for others) */}
                  {!isOwn && (
                    <span className="text-xs text-text-muted ml-1 mb-0.5">
                      {group.senderName}
                    </span>
                  )}
                  
                  {group.messages.map((message, msgIndex) => (
                    <div
                      key={message.id}
                      className={`group relative px-4 py-2.5 rounded-2xl text-sm transition-all
                        ${isOwn 
                          ? 'bg-gradient-to-r from-accent-primary to-accent-secondary text-white rounded-br-md' 
                          : 'bg-glass-medium border border-glass-border text-text-primary rounded-bl-md'
                        }
                        ${msgIndex === 0 ? '' : isOwn ? 'rounded-tr-md' : 'rounded-tl-md'}
                      `}
                    >
                      <p className="break-words">{message.content}</p>
                      
                      {/* Time tooltip on hover */}
                      <span className={`absolute ${isOwn ? 'right-full mr-2' : 'left-full ml-2'} top-1/2 -translate-y-1/2 text-xs text-text-muted opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap`}>
                        {formatTime(message.timestamp)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Reactions */}
      {showEmojis && (
        <div className="px-4 py-2 border-t border-glass-border animate-fade-in">
          <div className="flex items-center justify-center gap-2">
            {QUICK_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleEmojiClick(emoji)}
                className="w-10 h-10 rounded-xl bg-glass-medium hover:bg-glass-heavy border border-glass-border hover:border-glass-border-hover transition-all hover:scale-110 text-lg"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <form 
        onSubmit={handleSubmit} 
        className="p-4 border-t border-glass-border flex-shrink-0"
        style={isFullscreenMode ? {
          paddingBottom: 'max(16px, env(safe-area-inset-bottom, 16px))',
        } : undefined}
      >
        <div className="flex items-center gap-2">
          {/* Emoji Toggle */}
          <button
            type="button"
            onClick={() => setShowEmojis(!showEmojis)}
            className={`btn-icon w-10 h-10 flex-shrink-0 ${showEmojis ? 'bg-accent-primary/20 border-accent-primary/30 text-accent-primary' : ''}`}
          >
            <Smile className="w-5 h-5" />
          </button>
          
          {/* Input */}
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              maxLength={500}
              className="input-glass w-full pr-12"
            />
            
            {/* Send Button */}
            <button
              type="submit"
              disabled={!input.trim()}
              className={`absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center transition-all
                ${input.trim() 
                  ? 'bg-gradient-accent text-white shadow-glow' 
                  : 'bg-glass-medium text-text-muted'
                }`}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
