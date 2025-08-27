import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Volume2, VolumeX } from 'lucide-react';
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
    changeVolume(volume > 0 ? 0 : 1);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          size="sm" 
          variant="ghost" 
          className="h-6 w-6 p-0 text-white hover:text-primary"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
        >
          {volume === 0 ? (
            <VolumeX className="w-3 h-3" />
          ) : (
            <Volume2 className="w-3 h-3" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-24 p-2 glass-panel" 
        side="top"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0"
            onClick={toggleMute}
          >
            {volume === 0 ? (
              <VolumeX className="w-3 h-3" />
            ) : (
              <Volume2 className="w-3 h-3" />
            )}
          </Button>
          <Slider
            value={[volume * 100]}
            onValueChange={handleVolumeChange}
            max={100}
            step={1}
            orientation="vertical"
            className="h-16"
          />
          <span className="text-xs text-muted-foreground">
            {Math.round(volume * 100)}%
          </span>
        </div>
      </PopoverContent>
    </Popover>
  );
};