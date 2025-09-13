import React, { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Volume2, VolumeX, Volume1 } from 'lucide-react';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export const MiniVolumeControl: React.FC = () => {
  const { volume, changeVolume } = useAudioPlayer();
  const [isOpen, setIsOpen] = useState(false);

  const handleVolumeChange = useCallback((value: number[]) => {
    changeVolume(value[0] / 100);
  }, [changeVolume]);

  const toggleMute = useCallback(() => {
    changeVolume(volume > 0 ? 0 : 0.7);
  }, [volume, changeVolume]);

  const VolumeIcon = useMemo(() => {
    if (volume === 0) return VolumeX;
    if (volume < 0.5) return Volume1;
    return Volume2;
  }, [volume]);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          size="sm" 
          variant="ghost" 
          className="relative h-8 w-8 p-0 rounded-full bg-background/20 backdrop-blur-md border border-primary/20 text-foreground hover:bg-primary/10 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 hover:scale-110 group"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
        >
          <VolumeIcon className="w-4 h-4 transition-colors group-hover:text-primary" />
          <div 
            className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 h-1 bg-gradient-to-r from-primary/50 to-primary rounded-full transition-all duration-300 group-hover:from-primary group-hover:to-accent"
            style={{ width: `${Math.max(4, volume * 24)}px` }}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-16 p-4 glass-panel backdrop-blur-xl border border-glass-border shadow-2xl rounded-2xl animate-scale-in" 
        side="top"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center gap-4">
          <Button
            size="sm"
            variant="ghost"
            className="h-10 w-10 p-0 rounded-full hover:bg-primary/10 hover:scale-110 transition-all duration-200 group"
            onClick={toggleMute}
          >
            <VolumeIcon className="w-5 h-5 group-hover:text-primary transition-colors" />
          </Button>
          <div className="relative flex flex-col items-center">
            <Slider
              value={[volume * 100]}
              onValueChange={handleVolumeChange}
              max={100}
              step={1}
              orientation="vertical"
              className="h-24 cursor-pointer"
            />
            <div className="mt-2 px-2 py-1 bg-accent/20 rounded-lg">
              <span className="text-xs text-foreground font-mono font-semibold">
                {Math.round(volume * 100)}%
              </span>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};