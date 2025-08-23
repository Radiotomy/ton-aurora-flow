import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import {
  Music,
  Play,
  Pause,
  SkipForward,
  Trash2,
  Shuffle,
  Repeat,
  List,
  X,
  GripVertical
} from 'lucide-react';

interface QueueManagerProps {
  open: boolean;
  onClose: () => void;
}

export const QueueManager: React.FC<QueueManagerProps> = ({ open, onClose }) => {
  const [shuffleMode, setShuffleMode] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'off' | 'track' | 'queue'>('off');

  const {
    currentTrack,
    queue,
    queueIndex,
    isPlaying,
    playTrack,
    pauseTrack,
    skipToNext,
    skipToPrevious,
    skipToQueueIndex,
    removeFromQueue,
    clearQueue,
    moveQueueItem,
    shuffleQueue,
    formatTime
  } = useAudioPlayer();

  if (!open) return null;

  const handleTrackClick = (index: number) => {
    skipToQueueIndex(index);
  };

  const handleRemoveTrack = (index: number) => {
    removeFromQueue(index);
  };

  const handleShuffle = () => {
    setShuffleMode(!shuffleMode);
    if (!shuffleMode) {
      shuffleQueue();
    }
  };

  const handleRepeat = () => {
    const modes: Array<'off' | 'track' | 'queue'> = ['off', 'track', 'queue'];
    const currentIndex = modes.indexOf(repeatMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    setRepeatMode(nextMode);
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="fixed bottom-0 left-0 right-0 h-[70vh] glass-panel border-0 border-t border-glass-border rounded-t-xl">
        <Card className="h-full glass-panel border-0 rounded-t-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div className="flex items-center gap-2">
              <List className="h-5 w-5" />
              <CardTitle>Play Queue</CardTitle>
              <Badge variant="outline" className="ml-2">
                {queue.length} tracks
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={shuffleMode ? 'aurora' : 'ghost'}
                size="icon"
                onClick={handleShuffle}
                className="h-8 w-8"
                title="Shuffle"
              >
                <Shuffle className="h-4 w-4" />
              </Button>
              <Button
                variant={repeatMode !== 'off' ? 'aurora' : 'ghost'}
                size="icon"
                onClick={handleRepeat}
                className="h-8 w-8"
                title={`Repeat: ${repeatMode}`}
              >
                <Repeat className="h-4 w-4" />
                {repeatMode === 'track' && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full text-[8px] flex items-center justify-center text-primary-foreground">
                    1
                  </span>
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="flex-1 p-0">
            {/* Current Track */}
            {currentTrack && (
              <div className="px-6 pb-4">
                <div className="flex items-center gap-3 p-4 glass-panel rounded-lg border border-aurora/30">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={currentTrack.artwork} alt={currentTrack.title} />
                    <AvatarFallback>
                      <Music className="h-6 w-6" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">{currentTrack.title}</h4>
                    <p className="text-sm text-muted-foreground truncate">{currentTrack.artist}</p>
                    <Badge variant="secondary" className="mt-1">Now Playing</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={skipToPrevious}
                      className="h-8 w-8"
                    >
                      <SkipForward className="h-4 w-4 rotate-180" />
                    </Button>
                    <Button
                      size="icon"
                      variant="aurora"
                      onClick={isPlaying ? pauseTrack : () => playTrack(currentTrack)}
                      className="h-10 w-10"
                    >
                      {isPlaying ? (
                        <Pause className="h-5 w-5" />
                      ) : (
                        <Play className="h-5 w-5" />
                      )}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={skipToNext}
                      className="h-8 w-8"
                    >
                      <SkipForward className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Queue List */}
            <div className="px-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold">Up Next</h4>
                {queue.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearQueue}
                    className="text-destructive"
                  >
                    Clear Queue
                  </Button>
                )}
              </div>

              <ScrollArea className="h-[40vh]">
                {queue.length === 0 ? (
                  <div className="text-center py-12">
                    <Music className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Queue is Empty</h3>
                    <p className="text-muted-foreground">
                      Add some tracks to start building your queue
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {queue.map((track, index) => {
                      const isCurrentTrack = index === queueIndex;
                      return (
                        <div
                          key={`${track.id}-${index}`}
                          className={`
                            flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all
                            ${isCurrentTrack 
                              ? 'bg-aurora/20 border border-aurora/40' 
                              : 'hover:bg-accent/50 glass-panel'
                            }
                          `}
                          onClick={() => handleTrackClick(index)}
                        >
                          <div className="flex items-center gap-2">
                            <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                            <span className="text-sm text-muted-foreground w-6 text-center">
                              {index + 1}
                            </span>
                          </div>
                          
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={track.artwork} alt={track.title} />
                            <AvatarFallback>
                              <Music className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm truncate">{track.title}</h4>
                            <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {formatTime(track.duration)}
                            </span>
                            
                            {isCurrentTrack ? (
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  isPlaying ? pauseTrack() : playTrack(track);
                                }}
                                className="h-8 w-8"
                              >
                                {isPlaying ? (
                                  <Pause className="h-4 w-4" />
                                ) : (
                                  <Play className="h-4 w-4" />
                                )}
                              </Button>
                            ) : (
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  playTrack(track);
                                }}
                                className="h-8 w-8"
                              >
                                <Play className="h-4 w-4" />
                              </Button>
                            )}
                            
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveTrack(index);
                              }}
                              className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};