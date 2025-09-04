import React, { useState } from 'react';
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

  const handleVolumeChange = (value: number[]) => {
    changeVolume(value[0] / 100);
  };

  const toggleMute = () => {
    changeVolume(volume > 0 ? 0 : 0.7);
  };

  const getVolumeIcon = () => {
    if (volume === 0) return VolumeX;
    if (volume < 0.5) return Volume1;
    return Volume2;
  };

  const VolumeIcon = getVolumeIcon();

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          size="sm" 
          variant="ghost" 
          className="relative h-8 w-8 p-0 rounded-full bg-background/10 backdrop-blur-sm border border-white/20 text-foreground hover:bg-background/20 hover:border-primary/40 transition-all duration-200 hover:scale-105"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
        >
          <VolumeIcon className="w-4 h-4" />
          <div 
            className="absolute bottom-0 left-1/2 transform -translate-x-1/2 h-0.5 bg-primary rounded-full transition-all duration-200"
            style={{ width: `${Math.max(4, volume * 24)}px` }}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-14 p-3 bg-background/95 backdrop-blur-md border border-border/50 shadow-xl rounded-xl" 
        side="top"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center gap-3">
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 rounded-full hover:bg-accent transition-colors"
            onClick={toggleMute}
          >
            <VolumeIcon className="w-4 h-4" />
          </Button>
          <div className="relative">
            <Slider
              value={[volume * 100]}
              onValueChange={handleVolumeChange}
              max={100}
              step={5}
              orientation="vertical"
              className="h-20"
            />
            <div className="absolute -right-8 top-1/2 transform -translate-y-1/2 text-xs text-muted-foreground font-mono">
              {Math.round(volume * 100)}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};