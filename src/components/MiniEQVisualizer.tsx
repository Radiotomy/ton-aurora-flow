import React, { useEffect, useState } from 'react';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';

interface MiniEQVisualizerProps {
  isPlaying: boolean;
  size?: 'sm' | 'md';
}

export const MiniEQVisualizer: React.FC<MiniEQVisualizerProps> = ({ 
  isPlaying, 
  size = 'sm' 
}) => {
  const [bars, setBars] = useState([0, 0, 0, 0, 0]);

  useEffect(() => {
    if (!isPlaying) {
      setBars([0, 0, 0, 0, 0]);
      return;
    }

    const interval = setInterval(() => {
      setBars(prev => prev.map(() => Math.random() * 100));
    }, 150);

    return () => clearInterval(interval);
  }, [isPlaying]);

  const barHeight = size === 'sm' ? 'h-3' : 'h-4';
  const barWidth = size === 'sm' ? 'w-0.5' : 'w-1';

  return (
    <div className="flex items-end justify-center gap-0.5 h-3">
      {bars.map((height, index) => (
        <div
          key={index}
          className={`${barWidth} bg-primary/60 rounded-full transition-all duration-150 ease-out`}
          style={{ 
            height: isPlaying ? `${Math.max(height, 10)}%` : '10%',
            opacity: isPlaying ? 0.8 : 0.3
          }}
        />
      ))}
    </div>
  );
};