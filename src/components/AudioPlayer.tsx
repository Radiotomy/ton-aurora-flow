import React, { useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Music,
  Maximize2,
} from 'lucide-react';

export const AudioPlayer: React.FC = React.memo(() => {
  const {
    currentTrack,
    isPlaying,
    isLoading,
    currentTime,
    duration,
    volume,
    progress,
    playTrack,
    pauseTrack,
    seekTo,
    changeVolume,
    skipTime,
    formatTime,
  } = useAudioPlayer();

  const handleProgressChange = useCallback((value: number[]) => {
    const newTime = (value[0] / 100) * duration;
    seekTo(newTime);
  }, [duration, seekTo]);

  const handleVolumeChange = useCallback((value: number[]) => {
    changeVolume(value[0] / 100);
  }, [changeVolume]);

  const toggleMute = useCallback(() => {
    changeVolume(volume > 0 ? 0 : 1);
  }, [volume, changeVolume]);

  // Memoize formatted times to prevent constant recalculation
  const formattedCurrentTime = useMemo(() => formatTime(currentTime), [currentTime, formatTime]);
  const formattedDuration = useMemo(() => formatTime(duration), [duration, formatTime]);

  if (!currentTrack) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 glass-panel border-0 border-t border-glass-border backdrop-blur-xl bg-background/90 animate-fade-in">
      <div className="max-w-screen-2xl mx-auto px-3 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-3 sm:gap-6">
          {/* Track Info */}
          <div className="flex items-center gap-3 min-w-0 flex-1 max-w-[35%] sm:max-w-none group">
            <div className="relative">
              <Avatar className="h-12 w-12 sm:h-14 sm:w-14 flex-shrink-0 ring-2 ring-primary/20 transition-all duration-300 hover:ring-primary/40 hover:scale-105">
                <AvatarImage src={currentTrack.artwork} alt={currentTrack.title} className="object-cover" />
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20">
                  <Music className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </AvatarFallback>
              </Avatar>
              {isPlaying && (
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-primary rounded-full animate-pulse flex items-center justify-center">
                  <div className="w-2 h-2 bg-background rounded-full animate-bounce" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-semibold text-sm sm:text-base truncate text-foreground group-hover:text-primary transition-colors">
                {currentTrack.title}
              </h4>
              <p className="text-xs sm:text-sm text-muted-foreground truncate hover:text-foreground transition-colors">
                {currentTrack.artist}
              </p>
            </div>
          </div>

          {/* Player Controls - Enhanced */}
          <div className="flex flex-col items-center gap-2 flex-1 max-w-xs sm:max-w-lg lg:max-w-2xl">
            {/* Control Buttons */}
            <div className="flex items-center gap-2 sm:gap-3">
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 sm:h-9 sm:w-9 hidden sm:flex hover:scale-110 transition-all duration-200 hover:bg-accent/20"
                onClick={() => skipTime(-10)}
                title="Skip back 10s"
              >
                <SkipBack className="h-4 w-4" />
              </Button>
              
              <Button
                size="icon"
                variant="glass"
                className="h-12 w-12 sm:h-14 sm:w-14 ring-2 ring-primary/30 hover:ring-primary/50 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-primary/20"
                onClick={isPlaying ? pauseTrack : () => playTrack(currentTrack)}
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary/30 border-t-primary" />
                ) : isPlaying ? (
                  <Pause className="h-6 w-6 text-primary" />
                ) : (
                  <Play className="h-6 w-6 text-primary ml-0.5" />
                )}
              </Button>
              
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 sm:h-9 sm:w-9 hidden sm:flex hover:scale-110 transition-all duration-200 hover:bg-accent/20"
                onClick={() => skipTime(10)}
                title="Skip forward 10s"
              >
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>

            {/* Progress Bar - Enhanced */}
            <div className="flex items-center gap-3 w-full text-xs sm:text-sm">
              <span className="text-muted-foreground min-w-[40px] text-center font-mono tabular-nums">
                {formattedCurrentTime}
              </span>
              <div className="flex-1 relative group">
                <Slider
                  value={[progress]}
                  onValueChange={handleProgressChange}
                  max={100}
                  step={0.1}
                  className="flex-1 cursor-pointer"
                />
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-popover border border-border rounded px-2 py-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  {Math.round(progress)}%
                </div>
              </div>
              <span className="text-muted-foreground min-w-[40px] text-center font-mono tabular-nums">
                {formattedDuration}
              </span>
            </div>
          </div>

          {/* Volume & Actions */}
          <div className="flex items-center gap-2 sm:gap-3 flex-1 justify-end max-w-[25%] sm:max-w-none">
            <Button
              size="icon"
              variant="ghost"
              className="h-9 w-9 hover:scale-110 transition-all duration-200 hover:bg-accent/20 relative"
              onClick={toggleMute}
              title={volume === 0 ? 'Unmute' : 'Mute'}
            >
              {volume === 0 ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
              <div 
                className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 h-1 bg-primary rounded-full transition-all duration-200"
                style={{ width: `${Math.max(4, volume * 20)}px` }}
              />
            </Button>
            
            <div className="hidden sm:block">
              <div className="flex items-center gap-2">
                <Slider
                  value={[volume * 100]}
                  onValueChange={handleVolumeChange}
                  max={100}
                  step={1}
                  className="w-16 md:w-20 lg:w-24 cursor-pointer"
                />
                <span className="text-xs text-muted-foreground font-mono w-8 text-center">
                  {Math.round(volume * 100)}
                </span>
              </div>
            </div>

            <Button
              size="icon"
              variant="ghost"
              className="h-9 w-9 hover:scale-110 transition-all duration-200 hover:bg-accent/20 sm:hidden"
              title="Expand Player"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
});