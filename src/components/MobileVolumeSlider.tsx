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
          className="relative h-9 w-9 rounded-full bg-background/20 backdrop-blur-md border border-primary/20 text-foreground hover:bg-primary/10 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 hover:scale-110"
        >
          <VolumeIcon className="h-5 w-5" />
          <div 
            className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 h-1 bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-300"
            style={{ width: `${Math.max(6, volume * 28)}px` }}
          />
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="glass-panel backdrop-blur-xl border-t border-glass-border animate-slide-in-right">
        <SheetHeader className="pb-8">
          <SheetTitle className="text-center text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Volume Control
          </SheetTitle>
        </SheetHeader>
        <div className="flex flex-col items-center gap-8 pb-12">
          <Button
            size="lg"
            variant="ghost"
            className="h-20 w-20 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 hover:from-primary/30 hover:to-accent/30 border border-primary/20 hover:border-primary/40 transition-all duration-300 hover:scale-110 shadow-lg hover:shadow-xl hover:shadow-primary/20"
            onClick={toggleMute}
          >
            <VolumeIcon className="h-10 w-10 text-primary" />
          </Button>
          
          <div className="w-full max-w-sm space-y-6">
            <div className="relative">
              <Slider
                value={[volume * 100]}
                onValueChange={handleVolumeChange}
                max={100}
                step={1}
                className="w-full h-2"
              />
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
                <div className="bg-popover border border-border rounded-lg px-3 py-1 shadow-lg">
                  <span className="text-lg font-mono font-bold text-primary">
                    {Math.round(volume * 100)}%
                  </span>
                </div>
              </div>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span className="font-medium">Muted</span>
              <span className="font-medium">Max</span>
            </div>
          </div>
          
          <div className="grid grid-cols-4 gap-3 w-full max-w-sm">
            {[25, 50, 75, 100].map((preset) => (
              <Button
                key={preset}
                variant="outline"
                size="sm"
                className={`h-10 text-sm rounded-xl border-2 transition-all duration-200 hover:scale-105 ${
                  Math.abs(volume * 100 - preset) < 5 
                    ? 'border-primary bg-primary/10 text-primary shadow-lg' 
                    : 'border-border hover:border-primary/40'
                }`}
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