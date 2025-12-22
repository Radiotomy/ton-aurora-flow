import { useState, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { pinataService } from '@/services/pinataService';
import { supabase } from '@/integrations/supabase/client';

export interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  size: number;
}

export interface RecordingOptions {
  mimeType?: string;
  videoBitsPerSecond?: number;
  audioBitsPerSecond?: number;
}

export const useStreamRecording = (eventId?: string) => {
  const [state, setState] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    size: 0
  });
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const { toast } = useToast();

  // Get supported MIME type
  const getSupportedMimeType = (): string => {
    const types = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm;codecs=h264,opus',
      'video/webm',
      'video/mp4'
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    return 'video/webm';
  };

  const startRecording = useCallback(async (
    stream: MediaStream,
    options: RecordingOptions = {}
  ): Promise<boolean> => {
    try {
      const mimeType = options.mimeType || getSupportedMimeType();
      
      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: options.videoBitsPerSecond || 2500000,
        audioBitsPerSecond: options.audioBitsPerSecond || 128000
      });

      chunksRef.current = [];
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
          setState(prev => ({
            ...prev,
            size: chunksRef.current.reduce((acc, chunk) => acc + chunk.size, 0)
          }));
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setRecordedBlob(blob);
        
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      };

      recorder.onerror = (event) => {
        console.error('Recording error:', event);
        toast({
          title: "Recording Error",
          description: "An error occurred during recording.",
          variant: "destructive"
        });
      };

      // Start recording with timeslice for periodic data
      recorder.start(1000); // Get data every second
      startTimeRef.current = Date.now();

      // Start duration timer
      timerRef.current = setInterval(() => {
        setState(prev => ({
          ...prev,
          duration: Math.floor((Date.now() - startTimeRef.current) / 1000)
        }));
      }, 1000);

      setState({
        isRecording: true,
        isPaused: false,
        duration: 0,
        size: 0
      });

      toast({
        title: "Recording Started",
        description: "Your stream is now being recorded."
      });

      return true;
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Recording Failed",
        description: "Failed to start recording.",
        variant: "destructive"
      });
      return false;
    }
  }, [toast]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.pause();
      setState(prev => ({ ...prev, isPaused: true }));
      toast({ title: "Recording Paused" });
    }
  }, [toast]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'paused') {
      mediaRecorderRef.current.resume();
      setState(prev => ({ ...prev, isPaused: false }));
      toast({ title: "Recording Resumed" });
    }
  }, [toast]);

  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current) {
        resolve(null);
        return;
      }

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { 
          type: mediaRecorderRef.current?.mimeType || 'video/webm' 
        });
        setRecordedBlob(blob);
        
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }

        setState(prev => ({
          ...prev,
          isRecording: false,
          isPaused: false
        }));

        toast({
          title: "Recording Stopped",
          description: `Recorded ${formatDuration(state.duration)} (${formatSize(blob.size)})`
        });

        resolve(blob);
      };

      mediaRecorderRef.current.stop();
    });
  }, [state.duration, toast]);

  const uploadRecording = useCallback(async (
    blob?: Blob
  ): Promise<string | null> => {
    const recordingBlob = blob || recordedBlob;
    if (!recordingBlob) {
      toast({
        title: "No Recording",
        description: "No recording available to upload.",
        variant: "destructive"
      });
      return null;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Upload to IPFS via Pinata
      setUploadProgress(25);
      const result = await pinataService.uploadRecording(recordingBlob, eventId || 'unknown', {
        duration: state.duration
      });
      setUploadProgress(75);

      // Update database if eventId is provided
      if (eventId && result.cid) {
        await supabase
          .from('live_events')
          .update({
            recording_ipfs_cid: result.cid,
            recording_duration: state.duration,
            recording_size: recordingBlob.size,
            storage_type: 'ipfs',
            updated_at: new Date().toISOString()
          })
          .eq('id', eventId);
      }

      setUploadProgress(100);
      
      toast({
        title: "Recording Uploaded",
        description: "Your recording has been saved to IPFS."
      });

      return result.cid || null;
    } catch (error) {
      console.error('Error uploading recording:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload recording.",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  }, [recordedBlob, eventId, state.duration, toast]);

  const downloadRecording = useCallback(() => {
    if (!recordedBlob) {
      toast({
        title: "No Recording",
        description: "No recording available to download.",
        variant: "destructive"
      });
      return;
    }

    const url = URL.createObjectURL(recordedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stream-recording-${Date.now()}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Download Started",
      description: "Your recording is being downloaded."
    });
  }, [recordedBlob, toast]);

  const clearRecording = useCallback(() => {
    setRecordedBlob(null);
    chunksRef.current = [];
    setState({
      isRecording: false,
      isPaused: false,
      duration: 0,
      size: 0
    });
  }, []);

  return {
    ...state,
    recordedBlob,
    uploadProgress,
    isUploading,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    uploadRecording,
    downloadRecording,
    clearRecording
  };
};

// Helper functions
const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const formatSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default useStreamRecording;
