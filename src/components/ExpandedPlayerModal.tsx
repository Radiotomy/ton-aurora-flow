import React, { useEffect, useState, useRef } from 'react';
import Draggable from 'react-draggable';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { RotateCcw, Move, X } from 'lucide-react';

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

        // Create gradient with actual color values
        const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
        gradient.addColorStop(0, 'hsl(180, 100%, 60%)');     // primary
        gradient.addColorStop(0.5, 'hsl(310, 100%, 65%)');   // accent
        gradient.addColorStop(1, 'hsl(180, 100%, 70%)')      // primary-glow

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

  if (!isOpen || !currentTrack) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm pointer-events-auto"
        onClick={onClose}
      />
      
      {/* Draggable Modal */}
      <Draggable handle=".drag-handle" bounds="parent" defaultPosition={{x: 50, y: 50}}>
        <div className="absolute bg-background/95 backdrop-blur-lg rounded-lg border border-border shadow-2xl max-w-2xl pointer-events-auto">
          {/* Header with drag handle and close */}
          <div className="p-6 pb-4 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Move className="h-4 w-4 drag-handle cursor-move opacity-60 hover:opacity-100 transition-opacity" />
                <h2 className="text-xl font-bold">Audio Visualizer & 7-Band EQ</h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-6 p-6">
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

              <div className="grid grid-cols-7 gap-3">
                {/* Sub-Bass 60Hz */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-center block">60Hz</label>
                  <div className="px-1 flex justify-center">
                    <Slider
                      value={[eqGains.subBass]}
                      onValueChange={(value) => updateEQ('subBass', value[0])}
                      min={-12}
                      max={12}
                      step={0.5}
                      orientation="vertical"
                      className="h-32"
                    />
                  </div>
                  <p className="text-[10px] text-center text-muted-foreground">
                    {eqGains.subBass > 0 ? '+' : ''}{eqGains.subBass.toFixed(1)}
                  </p>
                </div>

                {/* Bass 170Hz */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-center block">170Hz</label>
                  <div className="px-1 flex justify-center">
                    <Slider
                      value={[eqGains.bass]}
                      onValueChange={(value) => updateEQ('bass', value[0])}
                      min={-12}
                      max={12}
                      step={0.5}
                      orientation="vertical"
                      className="h-32"
                    />
                  </div>
                  <p className="text-[10px] text-center text-muted-foreground">
                    {eqGains.bass > 0 ? '+' : ''}{eqGains.bass.toFixed(1)}
                  </p>
                </div>

                {/* Low-Mid 350Hz */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-center block">350Hz</label>
                  <div className="px-1 flex justify-center">
                    <Slider
                      value={[eqGains.lowMid]}
                      onValueChange={(value) => updateEQ('lowMid', value[0])}
                      min={-12}
                      max={12}
                      step={0.5}
                      orientation="vertical"
                      className="h-32"
                    />
                  </div>
                  <p className="text-[10px] text-center text-muted-foreground">
                    {eqGains.lowMid > 0 ? '+' : ''}{eqGains.lowMid.toFixed(1)}
                  </p>
                </div>

                {/* Mid 1kHz */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-center block">1kHz</label>
                  <div className="px-1 flex justify-center">
                    <Slider
                      value={[eqGains.mid]}
                      onValueChange={(value) => updateEQ('mid', value[0])}
                      min={-12}
                      max={12}
                      step={0.5}
                      orientation="vertical"
                      className="h-32"
                    />
                  </div>
                  <p className="text-[10px] text-center text-muted-foreground">
                    {eqGains.mid > 0 ? '+' : ''}{eqGains.mid.toFixed(1)}
                  </p>
                </div>

                {/* Upper-Mid 3.5kHz */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-center block">3.5kHz</label>
                  <div className="px-1 flex justify-center">
                    <Slider
                      value={[eqGains.upperMid]}
                      onValueChange={(value) => updateEQ('upperMid', value[0])}
                      min={-12}
                      max={12}
                      step={0.5}
                      orientation="vertical"
                      className="h-32"
                    />
                  </div>
                  <p className="text-[10px] text-center text-muted-foreground">
                    {eqGains.upperMid > 0 ? '+' : ''}{eqGains.upperMid.toFixed(1)}
                  </p>
                </div>

                {/* Presence 5kHz */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-center block">5kHz</label>
                  <div className="px-1 flex justify-center">
                    <Slider
                      value={[eqGains.presence]}
                      onValueChange={(value) => updateEQ('presence', value[0])}
                      min={-12}
                      max={12}
                      step={0.5}
                      orientation="vertical"
                      className="h-32"
                    />
                  </div>
                  <p className="text-[10px] text-center text-muted-foreground">
                    {eqGains.presence > 0 ? '+' : ''}{eqGains.presence.toFixed(1)}
                  </p>
                </div>

                {/* Brilliance 10kHz */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-center block">10kHz</label>
                  <div className="px-1 flex justify-center">
                    <Slider
                      value={[eqGains.brilliance]}
                      onValueChange={(value) => updateEQ('brilliance', value[0])}
                      min={-12}
                      max={12}
                      step={0.5}
                      orientation="vertical"
                      className="h-32"
                    />
                  </div>
                  <p className="text-[10px] text-center text-muted-foreground">
                    {eqGains.brilliance > 0 ? '+' : ''}{eqGains.brilliance.toFixed(1)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Draggable>
    </div>
  );
};