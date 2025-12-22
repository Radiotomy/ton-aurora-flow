import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useScreenShare } from '@/hooks/useScreenShare';
import { useMultiCamera, type CameraDevice } from '@/hooks/useMultiCamera';
import { useStreamRecording } from '@/hooks/useStreamRecording';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  MonitorUp,
  MonitorX,
  Camera,
  CameraOff,
  Circle,
  Square,
  Pause,
  Play,
  Download,
  Upload,
  SwitchCamera,
  Settings,
  ChevronDown
} from 'lucide-react';

interface StreamControlsProps {
  eventId: string;
  localStream: MediaStream | null;
  videoEnabled: boolean;
  audioEnabled: boolean;
  onToggleVideo: () => void;
  onToggleAudio: () => void;
  onScreenStreamChange?: (stream: MediaStream | null) => void;
  onCameraStreamChange?: (stream: MediaStream | null) => void;
}

export const StreamControls: React.FC<StreamControlsProps> = ({
  eventId,
  localStream,
  videoEnabled,
  audioEnabled,
  onToggleVideo,
  onToggleAudio,
  onScreenStreamChange,
  onCameraStreamChange
}) => {
  const {
    isSharing: isScreenSharing,
    shareMode,
    startScreenShare,
    stopScreenShare
  } = useScreenShare();

  const {
    cameras,
    activeCamera,
    isLoading: isCameraLoading,
    switchCamera,
    nextCamera,
    refreshCameras
  } = useMultiCamera();

  const {
    isRecording,
    isPaused,
    duration,
    size,
    recordedBlob,
    isUploading,
    uploadProgress,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    uploadRecording,
    downloadRecording
  } = useStreamRecording(eventId);

  const handleScreenShare = async () => {
    if (isScreenSharing) {
      stopScreenShare();
      onScreenStreamChange?.(null);
    } else {
      const stream = await startScreenShare({ audio: true });
      onScreenStreamChange?.(stream);
    }
  };

  const handleCameraSwitch = async (deviceId: string) => {
    const success = await switchCamera(deviceId);
    if (success && onCameraStreamChange) {
      // Get the new stream from the camera
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: deviceId } }
      });
      onCameraStreamChange(stream);
    }
  };

  const handleStartRecording = async () => {
    if (localStream) {
      await startRecording(localStream);
    }
  };

  const handleStopRecording = async () => {
    await stopRecording();
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatSize = (bytes: number): string => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2 flex-wrap">
        {/* Video Toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleVideo}
              className={`text-white hover:bg-white/20 ${!videoEnabled ? 'bg-red-500 hover:bg-red-600' : ''}`}
            >
              {videoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {videoEnabled ? 'Turn off camera' : 'Turn on camera'}
          </TooltipContent>
        </Tooltip>

        {/* Audio Toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleAudio}
              className={`text-white hover:bg-white/20 ${!audioEnabled ? 'bg-red-500 hover:bg-red-600' : ''}`}
            >
              {audioEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {audioEnabled ? 'Mute microphone' : 'Unmute microphone'}
          </TooltipContent>
        </Tooltip>

        {/* Screen Share */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleScreenShare}
              className={`text-white hover:bg-white/20 ${isScreenSharing ? 'bg-aurora hover:bg-aurora/90' : ''}`}
            >
              {isScreenSharing ? <MonitorX className="h-4 w-4" /> : <MonitorUp className="h-4 w-4" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {isScreenSharing ? `Stop sharing ${shareMode}` : 'Share screen'}
          </TooltipContent>
        </Tooltip>

        {/* Camera Selector */}
        {cameras.length > 1 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
                disabled={isCameraLoading}
              >
                <SwitchCamera className="h-4 w-4 mr-1" />
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>Select Camera</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {cameras.map((camera) => (
                <DropdownMenuItem
                  key={camera.deviceId}
                  onClick={() => handleCameraSwitch(camera.deviceId)}
                  className={activeCamera === camera.deviceId ? 'bg-accent' : ''}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  {camera.label}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={refreshCameras}>
                <Settings className="h-4 w-4 mr-2" />
                Refresh Cameras
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Recording Controls */}
        <div className="flex items-center gap-1 border-l border-white/20 pl-2 ml-1">
          {!isRecording ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleStartRecording}
                  className="text-white hover:bg-white/20"
                  disabled={!localStream}
                >
                  <Circle className="h-4 w-4 text-red-500 fill-red-500" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Start Recording</TooltipContent>
            </Tooltip>
          ) : (
            <>
              {/* Recording indicator */}
              <Badge variant="destructive" className="animate-pulse mr-1">
                REC {formatDuration(duration)}
              </Badge>

              {/* Pause/Resume */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={isPaused ? resumeRecording : pauseRecording}
                    className="text-white hover:bg-white/20"
                  >
                    {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{isPaused ? 'Resume' : 'Pause'}</TooltipContent>
              </Tooltip>

              {/* Stop */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleStopRecording}
                    className="text-white hover:bg-white/20"
                  >
                    <Square className="h-4 w-4 text-red-500 fill-red-500" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Stop Recording</TooltipContent>
              </Tooltip>
            </>
          )}

          {/* Post-recording actions */}
          {recordedBlob && !isRecording && (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={downloadRecording}
                    className="text-white hover:bg-white/20"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Download Recording</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => uploadRecording()}
                    className="text-white hover:bg-white/20"
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <span className="text-xs">{uploadProgress}%</span>
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Upload to IPFS</TooltipContent>
              </Tooltip>
            </>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
};

export default StreamControls;
