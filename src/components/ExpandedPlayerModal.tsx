import React, { useEffect, useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { RotateCcw, X } from 'lucide-react';

interface ExpandedPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExpandedPlayerModal: React.FC<ExpandedPlayerModalProps> = ({
  isOpen,
  onClose
}) => {
  const { 
    currentTrack, 
    isPlaying, 
    getFrequencyData, 
    eqGains, 
    updateEQ, 
    resetEQ 
  } = useAudioPlayer();
  
  const [frequencyBars, setFrequencyBars] = useState<number[]>([]);
  const animationRef = useRef<number>(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Update frequency visualization
  useEffect(() => {
    if (!isOpen || !isPlaying) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }

    const updateVisualization = () => {
      const frequencyData = getFrequencyData();
      if (frequencyData && canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Create gradient
        const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
        gradient.addColorStop(0, 'hsl(var(--primary))');
        gradient.addColorStop(0.5, 'hsl(var(--accent))');
        gradient.addColorStop(1, 'hsl(var(--primary-glow))');

        // Draw frequency bars
        const barWidth = canvas.width / frequencyData.length;
        
        for (let i = 0; i < frequencyData.length; i++) {
          const barHeight = (frequencyData[i] / 255) * canvas.height;
          
          ctx.fillStyle = gradient;
          ctx.fillRect(i * barWidth, canvas.height - barHeight, barWidth - 1, barHeight);
        }

        // Update simple bars array for fallback
        const barCount = 20;
        const binSize = Math.floor(frequencyData.length / barCount);
        const newBars = [];
        
        for (let i = 0; i < barCount; i++) {
          const start = i * binSize;
          const end = start + binSize;
          let sum = 0;
          
          for (let j = start; j < end; j++) {
            sum += frequencyData[j];
          }
          
          const average = sum / binSize;
          newBars.push((average / 255) * 100);
        }
        
        setFrequencyBars(newBars);
      }
      
      animationRef.current = requestAnimationFrame(updateVisualization);
    };

    animationRef.current = requestAnimationFrame(updateVisualization);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isOpen, isPlaying, getFrequencyData]);

  if (!currentTrack) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl glass-panel">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <DialogTitle className="text-xl font-bold">Audio Visualizer & EQ</DialogTitle>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="space-y-6">
          {/* Track Info */}
          <div className="text-center">
            <h3 className="font-semibold text-lg">{currentTrack.title}</h3>
            <p className="text-muted-foreground">{currentTrack.artist}</p>
          </div>

          {/* Canvas Visualizer */}
          <div className="relative">
            <canvas
              ref={canvasRef}
              width={600}
              height={200}
              className="w-full h-32 bg-background/50 rounded-lg border border-border"
            />
            {!isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-muted-foreground">Play a track to see visualization</p>
              </div>
            )}
          </div>

          {/* Fallback Bar Visualizer */}
          <div className="flex items-end justify-center gap-1 h-16">
            {frequencyBars.map((height, index) => (
              <div
                key={index}
                className="w-2 bg-gradient-to-t from-primary to-accent rounded-full transition-all duration-75"
                style={{ 
                  height: `${Math.max(height, 5)}%`,
                  opacity: isPlaying ? 0.8 : 0.3
                }}
              />
            ))}
          </div>

          {/* EQ Controls */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">Equalizer</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={resetEQ}
                className="gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-6">
              {/* Bass */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-center block">Bass</label>
                <div className="px-2">
                  <Slider
                    value={[eqGains.bass]}
                    onValueChange={(value) => updateEQ('bass', value[0])}
                    min={-12}
                    max={12}
                    step={0.5}
                    orientation="vertical"
                    className="h-24 mx-auto"
                  />
                </div>
                <p className="text-xs text-center text-muted-foreground">
                  {eqGains.bass > 0 ? '+' : ''}{eqGains.bass.toFixed(1)} dB
                </p>
              </div>

              {/* Mid */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-center block">Mid</label>
                <div className="px-2">
                  <Slider
                    value={[eqGains.mid]}
                    onValueChange={(value) => updateEQ('mid', value[0])}
                    min={-12}
                    max={12}
                    step={0.5}
                    orientation="vertical"
                    className="h-24 mx-auto"
                  />
                </div>
                <p className="text-xs text-center text-muted-foreground">
                  {eqGains.mid > 0 ? '+' : ''}{eqGains.mid.toFixed(1)} dB
                </p>
              </div>

              {/* Treble */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-center block">Treble</label>
                <div className="px-2">
                  <Slider
                    value={[eqGains.treble]}
                    onValueChange={(value) => updateEQ('treble', value[0])}
                    min={-12}
                    max={12}
                    step={0.5}
                    orientation="vertical"
                    className="h-24 mx-auto"
                  />
                </div>
                <p className="text-xs text-center text-muted-foreground">
                  {eqGains.treble > 0 ? '+' : ''}{eqGains.treble.toFixed(1)} dB
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};