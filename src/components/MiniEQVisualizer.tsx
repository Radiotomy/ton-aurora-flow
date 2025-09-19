import React, { useEffect, useState, useRef } from 'react';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';

interface MiniEQVisualizerProps {
  isPlaying: boolean;
  size?: 'sm' | 'md';
}

export const MiniEQVisualizer: React.FC<MiniEQVisualizerProps> = ({ 
  isPlaying, 
  size = 'sm' 
}) => {
  const { getFrequencyData } = useAudioPlayer();
  const [bars, setBars] = useState([0, 0, 0, 0, 0]);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    if (!isPlaying) {
      setBars([0, 0, 0, 0, 0]);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }

    const updateBars = () => {
      const frequencyData = getFrequencyData();
      if (frequencyData) {
        // Sample 5 frequency ranges for the bars
        const barCount = 5;
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
        
        setBars(newBars);
      }
      
      animationRef.current = requestAnimationFrame(updateBars);
    };

    animationRef.current = requestAnimationFrame(updateBars);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, getFrequencyData]);

  const barHeight = size === 'sm' ? 'h-3' : 'h-4';
  const barWidth = size === 'sm' ? 'w-0.5' : 'w-1';

  return (
    <div className="flex items-end justify-center gap-0.5 h-3">
      {bars.map((height, index) => (
        <div
          key={index}
          className={`${barWidth} bg-gradient-to-t from-primary to-accent rounded-full transition-all duration-75 ease-out`}
          style={{ 
            height: isPlaying ? `${Math.max(height, 8)}%` : '8%',
            opacity: isPlaying ? 0.8 : 0.3
          }}
        />
      ))}
    </div>
  );
};