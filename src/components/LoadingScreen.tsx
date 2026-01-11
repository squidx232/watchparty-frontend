/**
 * LoadingScreen - Premium Redesign
 * 
 * Full-screen loading with ambient animations
 */

import { Loader2 } from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
}

export default function LoadingScreen({ message = 'Loading...' }: LoadingScreenProps) {
  return (
    <div className="min-h-screen bg-background-primary flex items-center justify-center relative overflow-hidden">
      {/* Ambient Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-accent-primary/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-accent-secondary/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Content */}
      <div className="relative text-center">
        {/* Logo Loader */}
        <div className="relative w-20 h-20 mx-auto mb-6">
          {/* Outer Ring */}
          <div className="absolute inset-0 rounded-2xl border-2 border-accent-primary/20 animate-ping" style={{ animationDuration: '2s' }} />
          
          {/* Main Container */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-accent flex items-center justify-center shadow-glow">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
        </div>

        {/* Message */}
        <p className="text-text-secondary text-lg font-medium">{message}</p>
        
        {/* Dots Animation */}
        <div className="flex items-center justify-center gap-1 mt-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 bg-accent-primary rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
