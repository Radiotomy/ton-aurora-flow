import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useAudiusSearch } from '@/hooks/useAudius';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { AudiusService } from '@/services/audiusService';

// Extend Window interface for speech recognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface VoiceSearchProps {
  onResults?: (query: string) => void;
  onClose?: () => void;
}

export const VoiceSearch = ({ onResults, onClose }: VoiceSearchProps) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const recognitionRef = useRef<any>(null);
  
  const { searchTracks, tracks, loading } = useAudiusSearch();
  const { playTrack } = useAudioPlayer();

  useEffect(() => {
    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      const recognition = recognitionRef.current;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setTranscript('');
      };

      recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
          } else {
            interimTranscript += result[0].transcript;
          }
        }

        setTranscript(finalTranscript || interimTranscript);

        if (finalTranscript) {
          handleVoiceCommand(finalTranscript.trim().toLowerCase());
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        toast({
          title: "Voice recognition error",
          description: "Please try again or check your microphone permissions.",
          variant: "destructive",
        });
      };

      recognition.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const handleVoiceCommand = async (command: string) => {
    setIsProcessing(true);
    
    try {
      // Parse voice commands
      if (command.startsWith('play ') || command.startsWith('search ')) {
        const query = command.replace(/^(play|search)\s+/, '');
        
        if (query) {
          onResults?.(query);
          await searchTracks(query);
          
          // If it's a "play" command and we get results, play the first track
          if (command.startsWith('play ') && tracks.length > 0) {
            setTimeout(async () => {
              const firstTrack = tracks[0];
              const trackData = {
                id: firstTrack.id,
                title: firstTrack.title,
                artist: firstTrack.user.name,
                artwork: AudiusService.getArtworkUrl(firstTrack.artwork),
                streamUrl: AudiusService.getStreamUrl(firstTrack.id),
                duration: firstTrack.duration,
              };
              
              await playTrack(trackData);
              
              toast({
                title: "Now Playing",
                description: `${firstTrack.title} by ${firstTrack.user.name}`,
              });
            }, 1000);
          }
          
          toast({
            title: "Voice command recognized",
            description: `Searching for: "${query}"`,
          });
        }
      } else if (command.includes('pause') || command.includes('stop')) {
        // Handle pause/stop commands
        toast({
          title: "Voice command recognized",
          description: "Pausing playback",
        });
      } else if (command.includes('skip') || command.includes('next')) {
        toast({
          title: "Voice command recognized", 
          description: "Skip functionality coming soon",
        });
      } else {
        // Treat unknown commands as search queries
        onResults?.(command);
        await searchTracks(command);
        
        toast({
          title: "Voice search",
          description: `Searching for: "${command}"`,
        });
      }
    } catch (error) {
      console.error('Error processing voice command:', error);
      toast({
        title: "Error",
        description: "Failed to process voice command",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        toast({
          title: "Microphone Error",
          description: "Unable to access microphone. Please check permissions.",
          variant: "destructive",
        });
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  const isSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;

  if (!isSupported) {
    return null;
  }

  return (
    <div className="flex flex-col items-center space-y-4 p-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Voice Search & Control
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Try saying: "Play Cosmic Dreams" or "Search electronic music"
        </p>
      </div>
      
      <div className="flex items-center space-x-4">
        <Button
          variant={isListening ? "destructive" : "default"}
          size="lg"
          onClick={isListening ? stopListening : startListening}
          disabled={isProcessing || loading}
          className="relative"
        >
          {isProcessing || loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : isListening ? (
            <MicOff className="w-5 h-5" />
          ) : (
            <Mic className="w-5 h-5" />
          )}
          <span className="ml-2">
            {isProcessing ? 'Processing...' : 
             loading ? 'Searching...' :
             isListening ? 'Stop Listening' : 'Start Voice Search'}
          </span>
          
          {isListening && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full animate-pulse" />
          )}
        </Button>
      </div>

      {transcript && (
        <div className="w-full max-w-md p-3 bg-accent/50 rounded-lg">
          <p className="text-sm text-muted-foreground mb-1">Heard:</p>
          <p className="text-sm font-medium text-foreground">{transcript}</p>
        </div>
      )}

      {tracks.length > 0 && (
        <div className="w-full max-w-md">
          <p className="text-sm text-muted-foreground mb-2">Voice search results:</p>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {tracks.slice(0, 3).map((track) => (
              <div 
                key={track.id}
                className="p-2 bg-accent/30 rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={async () => {
                  const trackData = {
                    id: track.id,
                    title: track.title,
                    artist: track.user.name,
                    artwork: AudiusService.getArtworkUrl(track.artwork),
                    streamUrl: AudiusService.getStreamUrl(track.id),
                    duration: track.duration,
                  };
                  await playTrack(trackData);
                  onClose?.();
                }}
              >
                <p className="text-sm font-medium text-foreground">{track.title}</p>
                <p className="text-xs text-muted-foreground">{track.user.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};