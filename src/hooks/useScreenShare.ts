import { useState, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

export type ScreenShareMode = 'screen' | 'window' | 'tab';

export interface ScreenShareOptions {
  video?: boolean;
  audio?: boolean;
  preferCurrentTab?: boolean;
  surfaceSwitching?: 'include' | 'exclude';
  systemAudio?: 'include' | 'exclude';
}

export const useScreenShare = () => {
  const [isSharing, setIsSharing] = useState(false);
  const [shareMode, setShareMode] = useState<ScreenShareMode | null>(null);
  const screenStream = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  const startScreenShare = useCallback(async (
    options: ScreenShareOptions = {}
  ): Promise<MediaStream | null> => {
    try {
      const displayMediaOptions: DisplayMediaStreamOptions = {
        video: {
          displaySurface: 'monitor', // Default to full screen
          // @ts-ignore - These are valid but not in all TypeScript definitions
          logicalSurface: true,
          cursor: 'always'
        },
        audio: options.audio !== false
      };

      // Add additional constraints if supported
      // @ts-ignore
      if (options.preferCurrentTab) {
        // @ts-ignore
        displayMediaOptions.preferCurrentTab = true;
      }
      // @ts-ignore
      if (options.surfaceSwitching) {
        // @ts-ignore
        displayMediaOptions.surfaceSwitching = options.surfaceSwitching;
      }
      // @ts-ignore
      if (options.systemAudio) {
        // @ts-ignore
        displayMediaOptions.systemAudio = options.systemAudio;
      }

      const stream = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);

      // Detect what type of surface was shared
      const videoTrack = stream.getVideoTracks()[0];
      const settings = videoTrack.getSettings();
      // @ts-ignore
      const surfaceType = settings.displaySurface as ScreenShareMode;
      
      setShareMode(surfaceType || 'screen');
      screenStream.current = stream;
      setIsSharing(true);

      // Handle stream ending (user clicks "Stop sharing")
      videoTrack.onended = () => {
        stopScreenShare();
      };

      toast({
        title: "Screen Sharing Started",
        description: `Sharing your ${surfaceType || 'screen'} with viewers`
      });

      return stream;
    } catch (error: any) {
      console.error('Error starting screen share:', error);
      
      if (error.name === 'NotAllowedError') {
        toast({
          title: "Permission Denied",
          description: "Screen sharing was cancelled or denied.",
          variant: "destructive"
        });
      } else if (error.name === 'NotFoundError') {
        toast({
          title: "No Screen Found",
          description: "No screen, window, or tab available to share.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Screen Share Error",
          description: "Failed to start screen sharing.",
          variant: "destructive"
        });
      }

      return null;
    }
  }, [toast]);

  const stopScreenShare = useCallback(() => {
    if (screenStream.current) {
      screenStream.current.getTracks().forEach(track => track.stop());
      screenStream.current = null;
    }
    setIsSharing(false);
    setShareMode(null);

    toast({
      title: "Screen Sharing Stopped",
      description: "You've stopped sharing your screen."
    });
  }, [toast]);

  const switchScreenShare = useCallback(async (): Promise<MediaStream | null> => {
    // Stop current share and start new one
    if (screenStream.current) {
      screenStream.current.getTracks().forEach(track => track.stop());
    }
    return await startScreenShare();
  }, [startScreenShare]);

  return {
    isSharing,
    shareMode,
    screenStream: screenStream.current,
    startScreenShare,
    stopScreenShare,
    switchScreenShare
  };
};

export default useScreenShare;
