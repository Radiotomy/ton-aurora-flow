import { useState, useRef, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface CameraDevice {
  deviceId: string;
  label: string;
  groupId: string;
}

export interface CameraFeed {
  id: string;
  label: string;
  stream: MediaStream;
  isActive: boolean;
}

export const useMultiCamera = () => {
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [activeCamera, setActiveCamera] = useState<string | null>(null);
  const [feeds, setFeeds] = useState<CameraFeed[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const streamsRef = useRef<Map<string, MediaStream>>(new Map());
  const { toast } = useToast();

  // Get available cameras
  const refreshCameras = useCallback(async () => {
    try {
      // Request permission first to get full device labels
      await navigator.mediaDevices.getUserMedia({ video: true });
      
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices
        .filter(device => device.kind === 'videoinput')
        .map(device => ({
          deviceId: device.deviceId,
          label: device.label || `Camera ${device.deviceId.slice(0, 8)}`,
          groupId: device.groupId
        }));

      setCameras(videoDevices);
      
      if (videoDevices.length > 0 && !activeCamera) {
        setActiveCamera(videoDevices[0].deviceId);
      }

      return videoDevices;
    } catch (error) {
      console.error('Error getting cameras:', error);
      toast({
        title: "Camera Error",
        description: "Failed to access camera devices.",
        variant: "destructive"
      });
      return [];
    }
  }, [activeCamera, toast]);

  // Start a camera feed
  const startCamera = useCallback(async (
    deviceId: string,
    constraints?: MediaTrackConstraints
  ): Promise<MediaStream | null> => {
    setIsLoading(true);
    
    try {
      // Stop existing stream for this device if any
      const existingStream = streamsRef.current.get(deviceId);
      if (existingStream) {
        existingStream.getTracks().forEach(track => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: { exact: deviceId },
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
          ...constraints
        },
        audio: false // Audio handled separately
      });

      streamsRef.current.set(deviceId, stream);

      const camera = cameras.find(c => c.deviceId === deviceId);
      const feed: CameraFeed = {
        id: deviceId,
        label: camera?.label || 'Camera',
        stream,
        isActive: true
      };

      setFeeds(prev => {
        const filtered = prev.filter(f => f.id !== deviceId);
        return [...filtered, feed];
      });

      setActiveCamera(deviceId);
      setIsLoading(false);

      return stream;
    } catch (error) {
      console.error('Error starting camera:', error);
      setIsLoading(false);
      toast({
        title: "Camera Error",
        description: "Failed to start camera feed.",
        variant: "destructive"
      });
      return null;
    }
  }, [cameras, toast]);

  // Stop a specific camera feed
  const stopCamera = useCallback((deviceId: string) => {
    const stream = streamsRef.current.get(deviceId);
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      streamsRef.current.delete(deviceId);
    }

    setFeeds(prev => prev.filter(f => f.id !== deviceId));

    if (activeCamera === deviceId) {
      const remaining = Array.from(streamsRef.current.keys());
      setActiveCamera(remaining.length > 0 ? remaining[0] : null);
    }
  }, [activeCamera]);

  // Stop all camera feeds
  const stopAllCameras = useCallback(() => {
    streamsRef.current.forEach(stream => {
      stream.getTracks().forEach(track => track.stop());
    });
    streamsRef.current.clear();
    setFeeds([]);
    setActiveCamera(null);
  }, []);

  // Switch to a different camera
  const switchCamera = useCallback(async (deviceId: string): Promise<boolean> => {
    if (activeCamera === deviceId) return true;

    const stream = await startCamera(deviceId);
    return stream !== null;
  }, [activeCamera, startCamera]);

  // Get the active camera stream
  const getActiveStream = useCallback((): MediaStream | null => {
    if (!activeCamera) return null;
    return streamsRef.current.get(activeCamera) || null;
  }, [activeCamera]);

  // Cycle to next camera
  const nextCamera = useCallback(async () => {
    if (cameras.length <= 1) return;

    const currentIndex = cameras.findIndex(c => c.deviceId === activeCamera);
    const nextIndex = (currentIndex + 1) % cameras.length;
    await switchCamera(cameras[nextIndex].deviceId);

    toast({
      title: "Camera Switched",
      description: `Now using ${cameras[nextIndex].label}`
    });
  }, [cameras, activeCamera, switchCamera, toast]);

  // Initialize cameras on mount
  useEffect(() => {
    refreshCameras();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      streamsRef.current.forEach(stream => {
        stream.getTracks().forEach(track => track.stop());
      });
    };
  }, []);

  return {
    cameras,
    activeCamera,
    feeds,
    isLoading,
    refreshCameras,
    startCamera,
    stopCamera,
    stopAllCameras,
    switchCamera,
    nextCamera,
    getActiveStream
  };
};

export default useMultiCamera;
