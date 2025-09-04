import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Volume2, VolumeX } from 'lucide-react';
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
    const newVolume = volume > 0 ? 0 : 1;
    changeVolume(newVolume);
  };

  // Only show on mobile
  if (!isMobile) return null;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 sm:h-8 sm:w-8"
        >
          {volume === 0 ? (
            <VolumeX className="h-3 w-3 sm:h-4 sm:w-4" />
          ) : (
            <Volume2 className="h-3 w-3 sm:h-4 sm:w-4" />
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="glass-panel">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-center">Volume Control</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col items-center gap-4 pb-4">
          <Button
            size="lg"
            variant="ghost"
            className="h-12 w-12"
            onClick={toggleMute}
          >
            {volume === 0 ? (
              <VolumeX className="h-6 w-6" />
            ) : (
              <Volume2 className="h-6 w-6" />
            )}
          </Button>
          <div className="w-full max-w-sm px-4">
            <Slider
              value={[volume * 100]}
              onValueChange={handleVolumeChange}
              max={100}
              step={1}
              className="w-full"
            />
          </div>
          <div className="text-center">
            <span className="text-lg font-medium text-muted-foreground">
              {Math.round(volume * 100)}%
            </span>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};