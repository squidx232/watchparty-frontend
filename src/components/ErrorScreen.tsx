/**
 * ErrorScreen - Premium Redesign
 * 
 * Full-screen error display with retry option
 */

import { AlertCircle, RefreshCw, Home, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface ErrorScreenProps {
  message: string;
  onRetry?: () => void;
}

export default function ErrorScreen({ message, onRetry }: ErrorScreenProps) {
  return (
    <div className="min-h-screen bg-background-primary flex items-center justify-center relative overflow-hidden px-4">
      {/* Ambient Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] bg-status-error/10 rounded-full blur-[150px]" />
      </div>

      {/* Content */}
      <div className="relative text-center max-w-md">
        {/* Error Icon */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-status-error/10 border border-status-error/20 flex items-center justify-center">
          <AlertCircle className="w-10 h-10 text-status-error" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-white mb-2">Something went wrong</h1>
        
        {/* Message */}
        <p className="text-text-secondary mb-8">{message}</p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {onRetry && (
            <button
              onClick={onRetry}
              className="btn-gradient flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          )}
          <Link
            href="/"
            className="btn-glass flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            Go Home
          </Link>
        </div>

        {/* Back Link */}
        <button
          onClick={() => window.history.back()}
          className="mt-6 text-sm text-text-muted hover:text-text-secondary transition-colors inline-flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" />
          Go back
        </button>
      </div>
    </div>
  );
}
