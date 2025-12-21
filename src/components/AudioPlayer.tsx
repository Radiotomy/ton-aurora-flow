import React, { useMemo, useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { MiniEQVisualizer } from '@/components/MiniEQVisualizer';
import { ExpandedPlayerModal } from '@/components/ExpandedPlayerModal';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Music,
  BarChart3,
  Maximize2,
  X,
  Minimize2,
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

  const [showExpandedPlayer, setShowExpandedPlayer] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

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

  // Show minimized player when minimized or not playing and stopped
  const shouldShowMinimized = isMinimized || (!isPlaying && currentTime === 0);

  return (
    <div 
      className={`fixed left-0 right-0 z-50 glass-panel border-0 border-t border-glass-border backdrop-blur-xl bg-background/95 animate-fade-in transition-all duration-300 ${
        shouldShowMinimized ? 'bottom-16 lg:bottom-0' : 'bottom-16 lg:bottom-0'
      }`}
    >
      <div className="max-w-screen-2xl mx-auto px-3 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4">
        {shouldShowMinimized ? (
          /* Minimized Player - Touch Optimized */
          <div className="flex items-center justify-between gap-3">
            <div 
              className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer active:opacity-80"
              onClick={() => setIsMinimized(false)}
            >
              <Avatar className="h-10 w-10 flex-shrink-0">
                <AvatarImage src={currentTrack.artwork} alt={currentTrack.title} className="object-cover" />
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20">
                  <Music className="h-5 w-5 text-primary" />
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate text-foreground">
                  {currentTrack.title}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {currentTrack.artist}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <Button
                size="icon"
                variant="ghost"
                className="h-11 w-11 rounded-full"
                onClick={isPlaying ? pauseTrack : () => playTrack(currentTrack)}
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary/30 border-t-primary" />
                ) : isPlaying ? (
                  <Pause className="h-5 w-5 text-primary" />
                ) : (
                  <Play className="h-5 w-5 text-primary ml-0.5" />
                )}
              </Button>
              
              <Button
                size="icon"
                variant="ghost"
                className="h-11 w-11 rounded-full"
                onClick={() => setIsMinimized(false)}
                title="Expand Player"
              >
                <Maximize2 className="h-5 w-5" />
              </Button>
            </div>
          </div>
        ) : (
          /* Full Player - Mobile First Layout */
          <div className="space-y-2 sm:space-y-0">
            {/* Mobile: Stacked Layout */}
            <div className="flex items-center gap-3 sm:hidden">
              {/* Track Info - Mobile */}
              <div 
                className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer active:opacity-80"
                onClick={() => setShowExpandedPlayer(true)}
              >
                <div className="relative">
                  <Avatar className="h-12 w-12 flex-shrink-0 ring-2 ring-primary/20">
                    <AvatarImage src={currentTrack.artwork} alt={currentTrack.title} className="object-cover" />
                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20">
                      <Music className="h-5 w-5 text-primary" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1">
                    <MiniEQVisualizer isPlaying={isPlaying} size="sm" />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-semibold text-sm truncate text-foreground">
                    {currentTrack.title}
                  </h4>
                  <p className="text-xs text-muted-foreground truncate">
                    {currentTrack.artist}
                  </p>
                </div>
              </div>

              {/* Mobile Controls */}
              <div className="flex items-center gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-11 w-11 rounded-full"
                  onClick={() => skipTime(-10)}
                >
                  <SkipBack className="h-5 w-5" />
                </Button>
                
                <Button
                  size="icon"
                  variant="glass"
                  className="h-14 w-14 rounded-full ring-2 ring-primary/30 shadow-lg"
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
                  className="h-11 w-11 rounded-full"
                  onClick={() => skipTime(10)}
                >
                  <SkipForward className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Mobile Progress Bar */}
            <div className="flex items-center gap-2 text-xs sm:hidden px-1">
              <span className="text-muted-foreground min-w-[36px] text-center font-mono tabular-nums">
                {formattedCurrentTime}
              </span>
              <div className="flex-1">
                <Slider
                  value={[progress]}
                  onValueChange={handleProgressChange}
                  max={100}
                  step={0.1}
                  className="cursor-pointer"
                />
              </div>
              <span className="text-muted-foreground min-w-[36px] text-center font-mono tabular-nums">
                {formattedDuration}
              </span>
              
              {/* Mobile Extra Actions */}
              <Button
                size="icon"
                variant="ghost"
                className="h-9 w-9"
                onClick={() => setShowExpandedPlayer(true)}
              >
                <BarChart3 className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-9 w-9"
                onClick={() => setIsMinimized(true)}
              >
                <Minimize2 className="h-4 w-4" />
              </Button>
            </div>

            {/* Desktop Layout - Hidden on Mobile */}
            <div className="hidden sm:flex items-center justify-between gap-4 lg:gap-6">
              {/* Track Info */}
              <div className="flex items-center gap-3 min-w-0 flex-1 max-w-xs group">
                <div className="relative">
                  <Avatar className="h-14 w-14 flex-shrink-0 ring-2 ring-primary/20 transition-all duration-300 hover:ring-primary/40 hover:scale-105">
                    <AvatarImage src={currentTrack.artwork} alt={currentTrack.title} className="object-cover" />
                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20">
                      <Music className="h-6 w-6 text-primary" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1">
                    <MiniEQVisualizer isPlaying={isPlaying} size="sm" />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-semibold text-base truncate text-foreground group-hover:text-primary transition-colors">
                    {currentTrack.title}
                  </h4>
                  <p className="text-sm text-muted-foreground truncate hover:text-foreground transition-colors">
                    {currentTrack.artist}
                  </p>
                </div>
              </div>

              {/* Player Controls - Desktop */}
              <div className="flex flex-col items-center gap-2 flex-1 max-w-lg lg:max-w-2xl">
                <div className="flex items-center gap-3">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-9 w-9 hover:scale-110 transition-all duration-200"
                    onClick={() => skipTime(-10)}
                    title="Skip back 10s"
                  >
                    <SkipBack className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    size="icon"
                    variant="glass"
                    className="h-14 w-14 ring-2 ring-primary/30 hover:ring-primary/50 hover:scale-105 transition-all duration-300 shadow-lg"
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
                    className="h-9 w-9 hover:scale-110 transition-all duration-200"
                    onClick={() => skipTime(10)}
                    title="Skip forward 10s"
                  >
                    <SkipForward className="h-4 w-4" />
                  </Button>
                </div>

                {/* Progress Bar - Desktop */}
                <div className="flex items-center gap-3 w-full text-sm">
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
                  </div>
                  <span className="text-muted-foreground min-w-[40px] text-center font-mono tabular-nums">
                    {formattedDuration}
                  </span>
                </div>
              </div>

              {/* Volume & Actions - Desktop */}
              <div className="flex items-center gap-3 flex-1 justify-end max-w-xs">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-9 w-9"
                  onClick={toggleMute}
                  title={volume === 0 ? 'Unmute' : 'Mute'}
                >
                  {volume === 0 ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </Button>
                
                <div className="flex items-center gap-2">
                  <Slider
                    value={[volume * 100]}
                    onValueChange={handleVolumeChange}
                    max={100}
                    step={1}
                    className="w-20 lg:w-24 cursor-pointer"
                  />
                  <span className="text-xs text-muted-foreground font-mono w-8 text-center">
                    {Math.round(volume * 100)}
                  </span>
                </div>

                <Button
                  size="icon"
                  variant="ghost"
                  className="h-9 w-9"
                  onClick={() => setShowExpandedPlayer(true)}
                  title="Open Visualizer & EQ"
                >
                  <BarChart3 className="h-4 w-4" />
                </Button>
                
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-9 w-9"
                  onClick={() => setIsMinimized(true)}
                  title="Minimize Player"
                >
                  <Minimize2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Expanded Player Modal */}
      <ExpandedPlayerModal 
        isOpen={showExpandedPlayer}
        onClose={() => setShowExpandedPlayer(false)}
      />
    </div>
  );
});