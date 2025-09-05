import React from 'react';
import { Loader2, Music, Play } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8'
  };

  return (
    <Loader2 className={cn(
      'animate-spin text-primary',
      sizeClasses[size],
      className
    )} />
  );
};

interface TrackLoadingSkeletonProps {
  className?: string;
}

export const TrackLoadingSkeleton: React.FC<TrackLoadingSkeletonProps> = ({ className }) => {
  return (
    <div className={cn("glass-panel rounded-2xl overflow-hidden animate-pulse", className)}>
      <div className="aspect-square bg-muted/20 flex items-center justify-center">
        <Music className="w-12 h-12 text-muted-foreground/50" />
      </div>
      <div className="p-4 space-y-3">
        <div className="space-y-2">
          <div className="h-4 bg-muted/30 rounded w-3/4" />
          <div className="h-3 bg-muted/20 rounded w-1/2" />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="h-3 bg-muted/20 rounded w-12" />
            <div className="h-3 bg-muted/20 rounded w-8" />
          </div>
        </div>
      </div>
    </div>
  );
};

interface AudioLoadingStateProps {
  isLoading: boolean;
  className?: string;
}

export const AudioLoadingState: React.FC<AudioLoadingStateProps> = ({ 
  isLoading, 
  className 
}) => {
  if (!isLoading) return null;

  return (
    <div className={cn(
      "flex items-center justify-center gap-2 text-sm text-muted-foreground",
      className
    )}>
      <LoadingSpinner size="sm" />
      <span>Loading track...</span>
    </div>
  );
};

interface PlayButtonLoadingProps {
  isLoading: boolean;
  isPlaying: boolean;
  onClick: () => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const PlayButtonLoading: React.FC<PlayButtonLoadingProps> = ({
  isLoading,
  isPlaying,
  onClick,
  size = 'md',
  className
}) => {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12'
  };

  const iconSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className={cn(
        "glass-button rounded-full transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed",
        sizeClasses[size],
        className
      )}
    >
      {isLoading ? (
        <LoadingSpinner size={size === 'lg' ? 'md' : 'sm'} />
      ) : isPlaying ? (
        <div className={cn("flex space-x-0.5", iconSizeClasses[size])}>
          <div className="w-1 bg-current animate-pulse" style={{ animationDelay: '0ms' }} />
          <div className="w-1 bg-current animate-pulse" style={{ animationDelay: '150ms' }} />
          <div className="w-1 bg-current animate-pulse" style={{ animationDelay: '300ms' }} />
        </div>
      ) : (
        <Play className={iconSizeClasses[size]} />
      )}
    </button>
  );
};