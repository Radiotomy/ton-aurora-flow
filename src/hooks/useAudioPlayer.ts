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

// Shared singleton audio resources to prevent multiple players
let sharedAudio: HTMLAudioElement | null = null;
let sharedAudioContext: AudioContext | null = null;
let sharedGain: GainNode | null = null;
let sharedSource: MediaElementAudioSourceNode | null = null;

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
  const [queue, setQueue] = useState<CurrentTrack[]>([]);
  const [queueIndex, setQueueIndex] = useState(-1);

  const { isConnected, profile } = useWeb3();

  // Performance-optimized time updates
  const updateTimeThrottled = useCallback((time: number) => {
    // Use requestAnimationFrame for smooth updates
    if (typeof window !== 'undefined') {
      window.requestAnimationFrame(() => {
        setCurrentTime(time);
      });
    } else {
      setCurrentTime(time);
    }
  }, []);

  // Initialize audio element and Web Audio API (singleton)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Create shared instances once
    if (!sharedAudio) {
      sharedAudio = new Audio();
      sharedAudio.preload = 'metadata';
      sharedAudio.crossOrigin = 'anonymous';

      try {
        const Ctx = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext | undefined;
        if (Ctx) {
          sharedAudioContext = new Ctx();
          sharedGain = sharedAudioContext.createGain();
          sharedSource = sharedAudioContext.createMediaElementSource(sharedAudio);
          sharedSource.connect(sharedGain);
          sharedGain.connect(sharedAudioContext.destination);
        }
      } catch (err) {
        console.warn('Web Audio API not supported:', err);
      }
    }

    // Point refs to shared instances
    audioRef.current = sharedAudio;
    audioContextRef.current = sharedAudioContext;
    gainNodeRef.current = sharedGain;
    sourceNodeRef.current = sharedSource;

    // Subscribe to audio events to sync this hook's state
    const audio = sharedAudio!;

    const handleLoadStart = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => { setIsPlaying(false); setCurrentTime(0); };
    const handleTimeUpdate = () => updateTimeThrottled(audio.currentTime);
    const handleDurationChange = () => setDuration(audio.duration || 0);
    const handleError = () => {
      setError('Failed to load audio');
      setIsLoading(false);
      setIsPlaying(false);
      toast({ title: 'Audio Error', description: 'Failed to load the track. Please try again.', variant: 'destructive' });
    };

    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('error', handleError);

    // Ensure initial volume
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
  }, [volume, updateTimeThrottled]);

  // Clean shutdown of current audio session with improved UX
  const cleanupCurrentSession = useCallback((immediate = false) => {
    if (audioRef.current) {
      if (immediate) {
        // Immediate stop for track switching
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setCurrentTime(0);
        setIsPlaying(false);
        setIsLoading(false);
        if (gainNodeRef.current) {
          gainNodeRef.current.gain.setValueAtTime(0, audioContextRef.current?.currentTime || 0);
        }
      } else {
        // Create smooth fade out before stopping
        if (gainNodeRef.current && audioContextRef.current) {
          gainNodeRef.current.gain.linearRampToValueAtTime(
            0, 
            audioContextRef.current.currentTime + 0.1
          );
        }
        
        // Pause after fade
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
          }
          setCurrentTime(0);
          setIsPlaying(false);
          setIsLoading(false);
        }, 100);
      }
    }
  }, []);

  // Play track with proper cleanup and stream URL resolution
  const playTrack = useCallback(async (track: CurrentTrack) => {
    console.log('PlayTrack called with:', track);
    
    if (!audioRef.current) {
      console.error('Audio ref not available');
      return;
    }

    setError(null);
    
    // If same track, just toggle play/pause
    if (currentTrack?.id === track.id) {
      console.log('Same track, toggling play/pause. Currently playing:', isPlaying);
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
          toast({
            title: "Playback Error",
            description: "Failed to resume playback. Please try again.",
            variant: "destructive",
          });
        }
      }
      return;
    }

    // Immediately stop current track to prevent overlap
    if (currentTrack) {
      cleanupCurrentSession(true); // Immediate cleanup for track switching
    }

    // Load new track
    setCurrentTrack(track);
    setIsLoading(true);
    
    try {
      // Get the actual stream URL if not provided or if it's a placeholder
      let streamUrl = track.streamUrl;
      if (!streamUrl || streamUrl.includes('placeholder') || !streamUrl.startsWith('http')) {
        // Fetching real stream URL for track
        const response = await supabase.functions.invoke('audius-api', {
          body: { path: `stream-url/${track.id}` }
        });
        
        if (response.data?.streamUrl) {
          streamUrl = response.data.streamUrl;
          // Stream URL fetched successfully
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
      // Smoothly fade in the new track
      if (gainNodeRef.current && audioContextRef.current) {
        gainNodeRef.current.gain.setValueAtTime(0, audioContextRef.current.currentTime);
        gainNodeRef.current.gain.linearRampToValueAtTime(
          volume, 
          audioContextRef.current.currentTime + 0.3
        );
      }
      
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
    cleanupCurrentSession(false); // Use smooth fade for manual stop
    setCurrentTrack(null);
  }, [cleanupCurrentSession]);

  // Seek to position
  const seekTo = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  // Enhanced volume control with smooth transitions
  const changeVolume = useCallback((newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    
    if (audioRef.current) {
      audioRef.current.volume = clampedVolume;
    }
    
    // Smooth Web Audio API volume transitions
    if (gainNodeRef.current && audioContextRef.current) {
      const currentTime = audioContextRef.current.currentTime;
      gainNodeRef.current.gain.cancelScheduledValues(currentTime);
      gainNodeRef.current.gain.linearRampToValueAtTime(clampedVolume, currentTime + 0.1);
    }
    
    setVolume(clampedVolume);
  }, []);

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

  // Queue management functions
  const addToQueue = useCallback((track: CurrentTrack) => {
    setQueue(prev => [...prev, track]);
  }, []);

  const removeFromQueue = useCallback((index: number) => {
    setQueue(prev => prev.filter((_, i) => i !== index));
    if (queueIndex === index) {
      setQueueIndex(-1);
    } else if (queueIndex > index) {
      setQueueIndex(prev => prev - 1);
    }
  }, [queueIndex]);

  const clearQueue = useCallback(() => {
    setQueue([]);
    setQueueIndex(-1);
  }, []);

  const skipToNext = useCallback(() => {
    if (queue.length > 0 && queueIndex < queue.length - 1) {
      const nextIndex = queueIndex + 1;
      setQueueIndex(nextIndex);
      playTrack(queue[nextIndex]);
    }
  }, [queue, queueIndex, playTrack]);

  const skipToPrevious = useCallback(() => {
    if (queue.length > 0 && queueIndex > 0) {
      const prevIndex = queueIndex - 1;
      setQueueIndex(prevIndex);
      playTrack(queue[prevIndex]);
    }
  }, [queue, queueIndex, playTrack]);

  const skipToQueueIndex = useCallback((index: number) => {
    if (queue[index]) {
      setQueueIndex(index);
      playTrack(queue[index]);
    }
  }, [queue, playTrack]);

  const moveQueueItem = useCallback((fromIndex: number, toIndex: number) => {
    setQueue(prev => {
      const newQueue = [...prev];
      const item = newQueue.splice(fromIndex, 1)[0];
      newQueue.splice(toIndex, 0, item);
      return newQueue;
    });
  }, []);

  const shuffleQueue = useCallback(() => {
    setQueue(prev => {
      const newQueue = [...prev];
      for (let i = newQueue.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newQueue[i], newQueue[j]] = [newQueue[j], newQueue[i]];
      }
      return newQueue;
    });
    setQueueIndex(0); // Reset to first track after shuffle
  }, []);

  // Format time for display
  const formatTime = useCallback((time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  // Cleanup on unmount (do not stop global audio or close context here)
  useEffect(() => {
    return () => {
      // no-op: listeners are removed in their own effect cleanup
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
    isMuted,
    playbackRate,
    error,
    queue,
    queueIndex,
    
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
    
    // Queue management
    addToQueue,
    removeFromQueue,
    clearQueue,
    skipToNext,
    skipToPrevious,
    skipToQueueIndex,
    moveQueueItem,
    shuffleQueue,
    
    // Utilities
    formatTime,
    progress: duration > 0 ? (currentTime / duration) * 100 : 0,
    
    // Web Audio API context (for future effects)
    audioContext: audioContextRef.current,
    gainNode: gainNodeRef.current,
  };
};