import { useState, useRef, useCallback, useEffect } from 'react';
import { useWeb3 } from '@/hooks/useWeb3';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface CurrentTrack {
  id: string;
  title: string;
  artist: string;
  artwork: string;
  streamUrl: string;
  duration: number;
}

export const useAudioPlayer = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentTrack, setCurrentTrack] = useState<CurrentTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const { isConnected, profile } = useWeb3();

  // Initialize audio element
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.preload = 'metadata';
      
      // Set up event listeners
      const audio = audioRef.current;
      
      const handleLoadStart = () => setIsLoading(true);
      const handleCanPlay = () => setIsLoading(false);
      const handlePlay = () => setIsPlaying(true);
      const handlePause = () => setIsPlaying(false);
      const handleEnded = () => {
        setIsPlaying(false);
        setCurrentTime(0);
      };
      const handleTimeUpdate = () => {
        setCurrentTime(audio.currentTime);
      };
      const handleDurationChange = () => {
        setDuration(audio.duration || 0);
      };
      const handleError = (e: Event) => {
        setError('Failed to load audio');
        setIsLoading(false);
        setIsPlaying(false);
        toast({
          title: "Audio Error",
          description: "Failed to load the track. Please try again.",
          variant: "destructive",
        });
      };

      audio.addEventListener('loadstart', handleLoadStart);
      audio.addEventListener('canplay', handleCanPlay);
      audio.addEventListener('play', handlePlay);
      audio.addEventListener('pause', handlePause);
      audio.addEventListener('ended', handleEnded);
      audio.addEventListener('timeupdate', handleTimeUpdate);
      audio.addEventListener('durationchange', handleDurationChange);
      audio.addEventListener('error', handleError);

      // Set initial volume
      audio.volume = volume;

      return () => {
        audio.removeEventListener('loadstart', handleLoadStart);
        audio.removeEventListener('canplay', handleCanPlay);
        audio.removeEventListener('play', handlePlay);
        audio.removeEventListener('pause', handlePause);
        audio.removeEventListener('ended', handleEnded);
        audio.removeEventListener('timeupdate', handleTimeUpdate);
        audio.removeEventListener('durationchange', handleDurationChange);
        audio.removeEventListener('error', handleError);
      };
    }
  }, [volume]);

  // Play track
  const playTrack = useCallback(async (track: CurrentTrack) => {
    if (!audioRef.current) return;

    setError(null);
    
    // If same track, just toggle play/pause
    if (currentTrack?.id === track.id) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        try {
          await audioRef.current.play();
        } catch (error) {
          console.error('Playback failed:', error);
          setError('Playback failed');
        }
      }
      return;
    }

    // Load new track
    setCurrentTrack(track);
    audioRef.current.src = track.streamUrl;
    
    try {
      await audioRef.current.play();
      
      // Record play in database if user is connected
      if (isConnected && profile) {
        try {
          await supabase
            .from('listening_history')
            .insert({
              profile_id: profile.id,
              track_id: track.id,
              artist_id: track.artist.toLowerCase().replace(/\s+/g, '-'),
              played_at: new Date().toISOString(),
            });
        } catch (dbError) {
          console.error('Failed to record play:', dbError);
        }
      }
    } catch (error) {
      console.error('Playback failed:', error);
      setError('Playback failed');
    }
  }, [currentTrack, isPlaying, isConnected, profile]);

  // Pause track
  const pauseTrack = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
  }, []);

  // Stop track
  const stopTrack = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
    }
  }, []);

  // Seek to position
  const seekTo = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  // Change volume
  const changeVolume = useCallback((newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setVolume(clampedVolume);
    if (audioRef.current) {
      audioRef.current.volume = clampedVolume;
    }
  }, []);

  // Skip forward/backward
  const skipTime = useCallback((seconds: number) => {
    if (audioRef.current) {
      const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
      seekTo(newTime);
    }
  }, [currentTime, duration, seekTo]);

  // Format time for display
  const formatTime = useCallback((time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  return {
    // State
    currentTrack,
    isPlaying,
    isLoading,
    currentTime,
    duration,
    volume,
    error,
    
    // Actions
    playTrack,
    pauseTrack,
    stopTrack,
    seekTo,
    changeVolume,
    skipTime,
    
    // Utilities
    formatTime,
    progress: duration > 0 ? (currentTime / duration) * 100 : 0,
  };
};