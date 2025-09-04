import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Volume2, VolumeX, Volume1 } from 'lucide-react';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

export const MobileVolumeSlider: React.FC = () => {
  const { volume, changeVolume } = useAudioPlayer();
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useIsMobile();

  const handleVolumeChange = (value: number[]) => {
    changeVolume(value[0] / 100);
  };

  const toggleMute = () => {
    const newVolume = volume > 0 ? 0 : 0.7;
    changeVolume(newVolume);
  };

  const getVolumeIcon = () => {
    if (volume === 0) return VolumeX;
    if (volume < 0.5) return Volume1;
    return Volume2;
  };

  const VolumeIcon = getVolumeIcon();

  // Only show on mobile
  if (!isMobile) return null;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="relative h-8 w-8 rounded-full bg-background/10 backdrop-blur-sm border border-white/20 text-foreground hover:bg-background/20 hover:border-primary/40 transition-all duration-200"
        >
          <VolumeIcon className="h-4 w-4" />
          <div 
            className="absolute bottom-0 left-1/2 transform -translate-x-1/2 h-0.5 bg-primary rounded-full transition-all duration-200"
            style={{ width: `${Math.max(4, volume * 24)}px` }}
          />
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="bg-background/95 backdrop-blur-md border-t border-border/50">
        <SheetHeader className="pb-6">
          <SheetTitle className="text-center text-xl font-semibold">Volume Control</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col items-center gap-6 pb-8">
          <Button
            size="lg"
            variant="ghost"
            className="h-16 w-16 rounded-full bg-accent/20 hover:bg-accent/30 transition-all duration-200 hover:scale-105"
            onClick={toggleMute}
          >
            <VolumeIcon className="h-8 w-8" />
          </Button>
          
          <div className="w-full max-w-xs space-y-4">
            <Slider
              value={[volume * 100]}
              onValueChange={handleVolumeChange}
              max={100}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>0%</span>
              <span className="text-base font-mono font-semibold text-foreground">
                {Math.round(volume * 100)}%
              </span>
              <span>100%</span>
            </div>
          </div>
          
          <div className="grid grid-cols-4 gap-2 w-full max-w-xs">
            {[25, 50, 75, 100].map((preset) => (
              <Button
                key={preset}
                variant="outline"
                size="sm"
                className="h-8 text-xs rounded-full"
                onClick={() => changeVolume(preset / 100)}
              >
                {preset}%
              </Button>
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};