import React from 'react';
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

export const AudioPlayer: React.FC = () => {
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

  if (!currentTrack) {
    return null;
  }

  const handleProgressChange = (value: number[]) => {
    const newTime = (value[0] / 100) * duration;
    seekTo(newTime);
  };

  const handleVolumeChange = (value: number[]) => {
    changeVolume(value[0] / 100);
  };

  const toggleMute = () => {
    changeVolume(volume > 0 ? 0 : 1);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 glass-panel border-0 border-t border-glass-border">
      <div className="max-w-screen-2xl mx-auto px-2 sm:px-4 py-2 sm:py-3">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* Track Info */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <Avatar className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
              <AvatarImage src={currentTrack.artwork} alt={currentTrack.title} />
              <AvatarFallback>
                <Music className="h-4 w-4 sm:h-6 sm:w-6" />
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <h4 className="font-medium text-xs sm:text-sm truncate">{currentTrack.title}</h4>
              <p className="text-xs text-muted-foreground truncate">{currentTrack.artist}</p>
            </div>
          </div>

          {/* Player Controls - Mobile First */}
          <div className="flex flex-col items-center gap-1 sm:gap-2 flex-1 max-w-xs sm:max-w-2xl">
            {/* Control Buttons */}
            <div className="flex items-center gap-1 sm:gap-2">
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 sm:h-8 sm:w-8 hidden sm:flex"
                onClick={() => skipTime(-10)}
              >
                <SkipBack className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
              
              <Button
                size="icon"
                variant="glass"
                className="h-8 w-8 sm:h-10 sm:w-10"
                onClick={isPlaying ? pauseTrack : () => playTrack(currentTrack)}
                disabled={isLoading}
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4 sm:h-5 sm:w-5" />
                ) : (
                  <Play className="h-4 w-4 sm:h-5 sm:w-5" />
                )}
              </Button>
              
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 sm:h-8 sm:w-8 hidden sm:flex"
                onClick={() => skipTime(10)}
              >
                <SkipForward className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </div>

            {/* Progress Bar - Hidden on very small screens */}
            <div className="hidden xs:flex items-center gap-2 w-full">
              <span className="text-xs text-muted-foreground min-w-[35px] sm:min-w-[40px]">
                {formatTime(currentTime)}
              </span>
              <Slider
                value={[progress]}
                onValueChange={handleProgressChange}
                max={100}
                step={0.1}
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground min-w-[35px] sm:min-w-[40px]">
                {formatTime(duration)}
              </span>
            </div>
          </div>

          {/* Volume & Actions */}
          <div className="flex items-center gap-1 sm:gap-2 flex-1 justify-end">
            {/* Volume - Hidden on mobile */}
            <div className="hidden md:flex items-center gap-2">
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={toggleMute}
              >
                {volume === 0 ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>
              <Slider
                value={[volume * 100]}
                onValueChange={handleVolumeChange}
                max={100}
                step={1}
                className="w-16 lg:w-20"
              />
            </div>
            
            {/* Mobile volume control */}
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 sm:h-8 sm:w-8 md:hidden"
              onClick={toggleMute}
            >
              {volume === 0 ? (
                <VolumeX className="h-3 w-3 sm:h-4 sm:w-4" />
              ) : (
                <Volume2 className="h-3 w-3 sm:h-4 sm:w-4" />
              )}
            </Button>
            
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 sm:h-8 sm:w-8"
            >
              <Maximize2 className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};