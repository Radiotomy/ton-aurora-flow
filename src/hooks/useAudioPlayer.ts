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
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  
  const [currentTrack, setCurrentTrack] = useState<CurrentTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const { isConnected, profile } = useWeb3();

  // Initialize audio element and Web Audio API
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.preload = 'metadata';
      audioRef.current.crossOrigin = 'anonymous';
      
      // Initialize Web Audio API for effects
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        gainNodeRef.current = audioContextRef.current.createGain();
        sourceNodeRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
        
        // Connect audio nodes
        sourceNodeRef.current.connect(gainNodeRef.current);
        gainNodeRef.current.connect(audioContextRef.current.destination);
      } catch (error) {
        console.warn('Web Audio API not supported:', error);
      }
      
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

  // Clean shutdown of current audio session
  const cleanupCurrentSession = useCallback(() => {
    if (audioRef.current) {
      // Immediately pause and reset
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      setIsPlaying(false);
      setIsLoading(false);
      
      // Reset gain for smooth transitions
      if (gainNodeRef.current) {
        gainNodeRef.current.gain.setValueAtTime(0, audioContextRef.current?.currentTime || 0);
      }
    }
  }, []);

  // Play track with proper cleanup and stream URL resolution
  const playTrack = useCallback(async (track: CurrentTrack) => {
    if (!audioRef.current) return;

    setError(null);
    
    // If same track, just toggle play/pause
    if (currentTrack?.id === track.id) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        try {
          // Resume audio context if suspended
          if (audioContextRef.current?.state === 'suspended') {
            await audioContextRef.current.resume();
          }
          await audioRef.current.play();
        } catch (error) {
          console.error('Playback failed:', error);
          setError('Playback failed');
        }
      }
      return;
    }

    // Clean up current session before loading new track
    if (currentTrack) {
      cleanupCurrentSession();
      // Small delay to ensure cleanup is complete
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // Load new track
    setCurrentTrack(track);
    setIsLoading(true);
    
    try {
      // Get the actual stream URL if not provided or if it's a placeholder
      let streamUrl = track.streamUrl;
      if (!streamUrl || streamUrl.includes('placeholder') || !streamUrl.startsWith('http')) {
        console.log('Fetching real stream URL for track:', track.id);
        const response = await supabase.functions.invoke('audius-api', {
          body: { path: `stream-url/${track.id}` }
        });
        
        if (response.data?.streamUrl) {
          streamUrl = response.data.streamUrl;
          console.log('Got stream URL:', streamUrl);
        } else {
          throw new Error('No stream URL available');
        }
      }
      
      audioRef.current.src = streamUrl;
      audioRef.current.playbackRate = playbackRate;
      
      // Resume audio context if suspended
      if (audioContextRef.current?.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      
      // Restore volume after cleanup
      if (gainNodeRef.current) {
        gainNodeRef.current.gain.setValueAtTime(isMuted ? 0 : volume, audioContextRef.current?.currentTime || 0);
      }
      
      // Load and play new track
      await audioRef.current.play();
      setIsLoading(false);
      
      toast({
        title: "Now Playing",
        description: `${track.title} by ${track.artist}`,
      });
      
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
      setError('Failed to load track');
      setIsLoading(false);
      setIsPlaying(false);
      
      toast({
        title: "Playback Error", 
        description: `Could not play "${track.title}". The track may not be available for streaming.`,
        variant: "destructive",
      });
    }
  }, [currentTrack, isPlaying, isConnected, profile, cleanupCurrentSession, playbackRate, volume, isMuted]);

  // Pause track
  const pauseTrack = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
  }, []);

  // Stop track with cleanup
  const stopTrack = useCallback(() => {
    cleanupCurrentSession();
    setCurrentTrack(null);
  }, [cleanupCurrentSession]);

  // Seek to position
  const seekTo = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  // Change volume with Web Audio API
  const changeVolume = useCallback((newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setVolume(clampedVolume);
    
    if (audioRef.current) {
      audioRef.current.volume = clampedVolume;
    }
    
    // Also update gain node for effects
    if (gainNodeRef.current && !isMuted) {
      gainNodeRef.current.gain.setValueAtTime(clampedVolume, audioContextRef.current?.currentTime || 0);
    }
  }, [isMuted]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.setValueAtTime(
        newMutedState ? 0 : volume, 
        audioContextRef.current?.currentTime || 0
      );
    }
    
    if (audioRef.current) {
      audioRef.current.muted = newMutedState;
    }
  }, [isMuted, volume]);

  // Change playback rate
  const changePlaybackRate = useCallback((rate: number) => {
    const clampedRate = Math.max(0.25, Math.min(2, rate));
    setPlaybackRate(clampedRate);
    
    if (audioRef.current) {
      audioRef.current.playbackRate = clampedRate;
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
      cleanupCurrentSession();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [cleanupCurrentSession]);

  return {
    // State
    currentTrack,
    isPlaying,
    isLoading,
    currentTime,
    duration,
    volume,
    isMuted,
    playbackRate,
    error,
    
    // Actions
    playTrack,
    pauseTrack,
    stopTrack,
    seekTo,
    changeVolume,
    toggleMute,
    changePlaybackRate,
    skipTime,
    cleanupCurrentSession,
    
    // Utilities
    formatTime,
    progress: duration > 0 ? (currentTime / duration) * 100 : 0,
    
    // Web Audio API context (for future effects)
    audioContext: audioContextRef.current,
    gainNode: gainNodeRef.current,
  };
};