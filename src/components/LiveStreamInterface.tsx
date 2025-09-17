import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/useAuth';
import { useWeb3 } from '@/hooks/useWeb3';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Settings, 
  Share2, 
  Maximize,
  Users,
  Heart,
  DollarSign,
  MessageCircle,
  Send
} from 'lucide-react';

interface LiveStreamInterfaceProps {
  eventId: string;
  isStreamer: boolean;
  onStreamEnd?: () => void;
}

interface StreamSession {
  id: string;
  peer_id: string;
  profile_id: string;
  joined_at: string;
  is_active: boolean;
}

interface ChatMessage {
  id: string;
  user_name: string;
  user_avatar?: string;
  message: string;
  timestamp: string;
  type: 'message' | 'tip' | 'join';
  metadata?: {
    amount?: number;
  };
}

export const LiveStreamInterface: React.FC<LiveStreamInterfaceProps> = ({
  eventId,
  isStreamer,
  onStreamEnd
}) => {
  const [isLive, setIsLive] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [viewerCount, setViewerCount] = useState(0);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [tipAmount, setTipAmount] = useState('');
  const [streamSessions, setStreamSessions] = useState<StreamSession[]>([]);
  
  const { isAuthenticated, user } = useAuth();
  const { isConnected, sendTransaction } = useWeb3();
  const { toast } = useToast();
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const localStream = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (isStreamer) {
      initializeStreaming();
    }
    
    // Set up real-time subscriptions
    const streamChannel = supabase
      .channel(`stream-${eventId}`)
      .on('presence', { event: 'sync' }, () => {
        const presenceState = streamChannel.presenceState();
        setViewerCount(Object.keys(presenceState).length);
      })
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'stream_sessions', filter: `event_id=eq.${eventId}` },
        (payload) => {
          console.log('Stream session change:', payload);
          loadStreamSessions();
        }
      )
      .subscribe();

    const chatChannel = supabase
      .channel(`chat-${eventId}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `event_id=eq.${eventId}` },
        (payload) => {
          handleNewChatMessage(payload.new);
        }
      )
      .subscribe();

    // Track user presence
    if (isAuthenticated && user) {
      streamChannel.track({
        user_id: user.id,
        user_name: user.email?.split('@')[0] || 'Anonymous',
        online_at: new Date().toISOString()
      });
    }

    loadStreamSessions();

    return () => {
      cleanup();
      supabase.removeChannel(streamChannel);
      supabase.removeChannel(chatChannel);
    };
  }, [eventId, isStreamer, isAuthenticated, user]);

  const initializeStreaming = async () => {
    try {
      // Initialize WebRTC for streamers
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: { echoCancellation: true, noiseSuppression: true }
      });
      
      localStream.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Set up peer connection
      peerConnection.current = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });

      stream.getTracks().forEach(track => {
        peerConnection.current?.addTrack(track, stream);
      });

      setIsLive(true);
      toast({
        title: "Stream Started",
        description: "You are now live streaming!"
      });

    } catch (error) {
      console.error('Error initializing stream:', error);
      toast({
        title: "Stream Error",
        description: "Failed to start streaming. Please check your camera and microphone permissions.",
        variant: "destructive"
      });
    }
  };

  const loadStreamSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('stream_sessions')
        .select('*')
        .eq('event_id', eventId)
        .eq('is_active', true);

      if (error) throw error;
      setStreamSessions(data || []);
    } catch (error) {
      console.error('Error loading stream sessions:', error);
    }
  };

  const handleNewChatMessage = async (messageData: any) => {
    try {
      // Fetch profile data for the message
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, avatar_url')
        .eq('id', messageData.profile_id)
        .single();

      const chatMessage: ChatMessage = {
        id: messageData.id,
        user_name: profile?.display_name || 'Anonymous',
        user_avatar: profile?.avatar_url,
        message: messageData.message,
        timestamp: messageData.created_at,
        type: messageData.message_type || 'message',
        metadata: messageData.metadata
      };

      setMessages(prev => [...prev, chatMessage]);
    } catch (error) {
      console.error('Error handling new chat message:', error);
    }
  };

  const sendChatMessage = async () => {
    if (!newMessage.trim() || !isAuthenticated) return;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('auth_user_id', user?.id)
        .single();

      if (!profile) return;

      const { error } = await supabase
        .from('chat_messages')
        .insert({
          profile_id: profile.id,
          event_id: eventId,
          artist_id: 'general', // Default artist_id for event messages
          message: newMessage.trim(),
          message_type: 'message'
        });

      if (error) throw error;
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Message Failed",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    }
  };

  const sendTip = async () => {
    if (!tipAmount || !isConnected || !isAuthenticated) return;

    try {
      const amount = parseFloat(tipAmount);
      if (isNaN(amount) || amount <= 0) {
        toast({
          title: "Invalid Amount",
          description: "Please enter a valid tip amount.",
          variant: "destructive"
        });
        return;
      }

      // Send TON transaction (simplified)
      await sendTransaction({
        to: 'artist_wallet_address', // Would be fetched from event data
        amount: amount
      });

      // Record tip in chat
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('auth_user_id', user?.id)
        .single();

      if (profile) {
        await supabase
          .from('chat_messages')
          .insert({
            profile_id: profile.id,
            event_id: eventId,
            artist_id: 'general', // Default artist_id for tip messages
            message: `Sent ${amount} TON`,
            message_type: 'tip',
            metadata: { amount }
          });
      }

      setTipAmount('');
      toast({
        title: "Tip Sent!",
        description: `Successfully sent ${amount} TON to the artist.`
      });
    } catch (error) {
      console.error('Error sending tip:', error);
      toast({
        title: "Tip Failed",
        description: "Failed to send tip. Please try again.",
        variant: "destructive"
      });
    }
  };

  const toggleVideo = () => {
    if (localStream.current) {
      const videoTrack = localStream.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (localStream.current) {
      const audioTrack = localStream.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setAudioEnabled(audioTrack.enabled);
      }
    }
  };

  const endStream = () => {
    cleanup();
    setIsLive(false);
    onStreamEnd?.();
    toast({
      title: "Stream Ended",
      description: "The live stream has been ended."
    });
  };

  const cleanup = () => {
    if (localStream.current) {
      localStream.current.getTracks().forEach(track => track.stop());
      localStream.current = null;
    }
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
  };

  const shareStream = async () => {
    const url = `${window.location.origin}/live-events/${eventId}`;
    
    if (navigator.share) {
      await navigator.share({
        title: 'Live Stream',
        text: 'Join me for this live stream!',
        url
      });
    } else {
      await navigator.clipboard.writeText(url);
      toast({
        title: "Link Copied",
        description: "Stream link copied to clipboard!"
      });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-screen max-h-[80vh]">
      {/* Main Video Area */}
      <div className="lg:col-span-2 space-y-4">
        <Card className="glass-card">
          <CardContent className="p-0 relative aspect-video bg-black rounded-lg overflow-hidden">
            {isStreamer ? (
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            )}
            
            {/* Stream Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/50">
              {/* Live Badge */}
              {isLive && (
                <div className="absolute top-4 left-4">
                  <Badge className="bg-red-500 animate-pulse">
                    ● LIVE
                  </Badge>
                </div>
              )}
              
              {/* Viewer Count */}
              <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/50 rounded-full px-3 py-1">
                <Users className="h-4 w-4 text-white" />
                <span className="text-white text-sm">{viewerCount}</span>
              </div>

              {/* Stream Controls */}
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isStreamer && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={toggleVideo}
                        className={`text-white hover:bg-white/20 ${!videoEnabled ? 'bg-red-500' : ''}`}
                      >
                        {videoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={toggleAudio}
                        className={`text-white hover:bg-white/20 ${!audioEnabled ? 'bg-red-500' : ''}`}
                      >
                        {audioEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                      </Button>
                    </>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={shareStream}
                    className="text-white hover:bg-white/20"
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20"
                  >
                    <Maximize className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stream Actions */}
        {isStreamer && (
          <div className="flex items-center gap-4">
            <Button onClick={endStream} variant="destructive">
              End Stream
            </Button>
            <Badge variant={isLive ? "default" : "secondary"}>
              {isLive ? "Live" : "Offline"}
            </Badge>
          </div>
        )}
      </div>

      {/* Chat & Interactions */}
      <div className="space-y-4">
        {/* Quick Actions */}
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-2">
              <Button variant="ghost" size="sm" className="flex items-center gap-2">
                <Heart className="h-4 w-4" />
                Like
              </Button>
              <Button variant="ghost" size="sm" className="flex items-center gap-2">
                <Share2 className="h-4 w-4" />
                Share
              </Button>
            </div>
            
            {/* Tipping */}
            {!isStreamer && isConnected && (
              <div className="mt-4 space-y-2">
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Tip amount"
                    value={tipAmount}
                    onChange={(e) => setTipAmount(e.target.value)}
                    className="flex-1 px-2 py-1 text-sm bg-background border border-border rounded"
                  />
                  <Button size="sm" onClick={sendTip} className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    Tip
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Live Chat */}
        <Card className="glass-card flex-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <MessageCircle className="h-4 w-4" />
              Live Chat
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex flex-col h-[400px]">
            {/* Messages */}
            <ScrollArea className="flex-1 px-4">
              <div className="space-y-2">
                {messages.map(message => (
                  <div key={message.id} className="flex gap-2">
                    <Avatar className="w-6 h-6 flex-shrink-0">
                      <AvatarImage src={message.user_avatar} />
                      <AvatarFallback className="text-xs">
                        {message.user_name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="font-medium text-sm truncate">{message.user_name}</span>
                        {message.type === 'tip' && (
                          <Badge variant="secondary" className="text-xs">
                            Tip: {message.metadata?.amount} TON
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm break-words">{message.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t border-border">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={isAuthenticated ? "Type a message..." : "Sign in to chat"}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                  disabled={!isAuthenticated}
                  className="flex-1 px-3 py-2 text-sm bg-background border border-border rounded focus:outline-none focus:ring-1 focus:ring-aurora/50"
                />
                <Button 
                  size="sm" 
                  onClick={sendChatMessage}
                  disabled={!isAuthenticated || !newMessage.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};