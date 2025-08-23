import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { useWeb3 } from '@/hooks/useWeb3';
import { supabase } from '@/integrations/supabase/client';
import { 
  Send, 
  Smile, 
  Gift, 
  Crown,
  Star,
  Heart,
  Volume2,
  MessageCircle
} from 'lucide-react';
import { format } from 'date-fns';

interface ChatMessage {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  message: string;
  timestamp: string;
  type: 'message' | 'tip' | 'join' | 'reaction';
  metadata?: {
    amount?: number;
    emoji?: string;
  };
  user_badges?: string[];
}

interface CommunityChatProps {
  eventId?: string;
  roomId?: string;
}

export const CommunityChat: React.FC<CommunityChatProps> = ({ 
  eventId, 
  roomId = 'general' 
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<number>(127);
  const { isAuthenticated, user } = useAuth();
  const { isConnected: walletConnected } = useWeb3();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mock messages for demonstration
  const mockMessages: ChatMessage[] = [
    {
      id: '1',
      user_id: 'user_1',
      user_name: 'MusicLover42',
      user_avatar: '/api/placeholder/32/32',
      message: 'This beat is incredible! 🔥',
      timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
      type: 'message',
      user_badges: ['fan-club']
    },
    {
      id: '2',
      user_id: 'user_2',
      user_name: 'BeatDropper',
      message: 'Sent 2.5 TON',
      timestamp: new Date(Date.now() - 4 * 60000).toISOString(),
      type: 'tip',
      metadata: { amount: 2.5 },
      user_badges: ['supporter']
    },
    {
      id: '3',
      user_id: 'user_3',
      user_name: 'VibeMaster',
      message: 'Just joined the stream!',
      timestamp: new Date(Date.now() - 3 * 60000).toISOString(),
      type: 'join'
    },
    {
      id: '4',
      user_id: 'user_4',
      user_name: 'ElectroFan',
      user_avatar: '/api/placeholder/32/32',
      message: 'Can we get some more bass? 🎵',
      timestamp: new Date(Date.now() - 2 * 60000).toISOString(),
      type: 'message',
      user_badges: ['early-supporter']
    },
    {
      id: '5',
      user_id: 'user_5',
      user_name: 'WaveRider',
      message: '❤️',
      timestamp: new Date(Date.now() - 1 * 60000).toISOString(),
      type: 'reaction',
      metadata: { emoji: '❤️' }
    }
  ];

  useEffect(() => {
    // Initialize with mock messages
    setMessages(mockMessages);
    
    // Set up real-time subscription for chat messages
    const channel = supabase
      .channel(`chat-${roomId}-${eventId || 'general'}`)
      .on('presence', { event: 'sync' }, () => {
        // Update online user count
        const presenceState = channel.presenceState();
        setOnlineUsers(Object.keys(presenceState).length);
      })
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        (payload) => {
          // Handle new chat messages
          const newMsg = payload.new as ChatMessage;
          setMessages(prev => [...prev, newMsg]);
        }
      )
      .subscribe();

    // Track user presence if authenticated
    if (isAuthenticated && user) {
      channel.track({
        user_id: user.id,
        user_name: user?.email?.split('@')[0] || 'Anonymous',
        online_at: new Date().toISOString()
      });
    }

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId, roomId, isAuthenticated, user]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !isAuthenticated) return;

    try {
      // For now, add message locally (will be replaced with Supabase insert)
      const message: ChatMessage = {
        id: Date.now().toString(),
        user_id: user?.id || 'anonymous',
        user_name: user?.email?.split('@')[0] || 'Anonymous',
        user_avatar: undefined,
        message: newMessage.trim(),
        timestamp: new Date().toISOString(),
        type: 'message',
        user_badges: walletConnected ? ['wallet-connected'] : []
      };

      setMessages(prev => [...prev, message]);
      setNewMessage('');

      // TODO: Replace with actual Supabase insert when chat_messages table is created
      // const { error } = await supabase
      //   .from('chat_messages')
      //   .insert([{
      //     room_id: `${roomId}-${eventId || 'general'}`,
      //     user_id: user.id,
      //     message: newMessage.trim(),
      //     message_type: 'message',
      //     event_id: eventId
      //   }]);

    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleReaction = async (emoji: string) => {
    if (!isAuthenticated) return;

    try {
      const reaction: ChatMessage = {
        id: Date.now().toString(),
        user_id: user?.id || 'anonymous',
        user_name: user?.email?.split('@')[0] || 'Anonymous',
        message: emoji,
        timestamp: new Date().toISOString(),
        type: 'reaction',
        metadata: { emoji }
      };

      setMessages(prev => [...prev, reaction]);
    } catch (error) {
      console.error('Error sending reaction:', error);
    }
  };

  const getBadgeIcon = (badge: string) => {
    switch (badge) {
      case 'fan-club':
        return <Crown className="h-3 w-3 text-yellow-500" />;
      case 'supporter':
        return <Gift className="h-3 w-3 text-purple-500" />;
      case 'early-supporter':
        return <Star className="h-3 w-3 text-blue-500" />;
      case 'wallet-connected':
        return <Volume2 className="h-3 w-3 text-aurora" />;
      default:
        return null;
    }
  };

  const renderMessage = (message: ChatMessage) => {
    const isCurrentUser = message.user_id === user?.id;

    if (message.type === 'tip') {
      return (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
          <Gift className="h-4 w-4 text-purple-400" />
          <span className="font-medium text-purple-400">{message.user_name}</span>
          <span className="text-sm">sent {message.metadata?.amount} TON</span>
        </div>
      );
    }

    if (message.type === 'join') {
      return (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-green-500/10 border border-green-500/20">
          <MessageCircle className="h-4 w-4 text-green-400" />
          <span className="font-medium text-green-400">{message.user_name}</span>
          <span className="text-sm text-muted-foreground">joined the chat</span>
        </div>
      );
    }

    if (message.type === 'reaction') {
      return (
        <div className="flex items-center gap-2 p-2">
          <Avatar className="w-6 h-6">
            <AvatarImage src={message.user_avatar} />
            <AvatarFallback className="text-xs">
              {message.user_name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium text-sm">{message.user_name}</span>
          <span className="text-lg">{message.metadata?.emoji}</span>
        </div>
      );
    }

    return (
      <div className={`flex gap-3 p-2 rounded-lg ${
        isCurrentUser ? 'bg-aurora/10 ml-8' : ''
      }`}>
        <Avatar className="w-8 h-8 flex-shrink-0">
          <AvatarImage src={message.user_avatar} />
          <AvatarFallback className="text-xs">
            {message.user_name.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm truncate">{message.user_name}</span>
            {message.user_badges?.map(badge => (
              <div key={badge} className="flex-shrink-0">
                {getBadgeIcon(badge)}
              </div>
            ))}
            <span className="text-xs text-muted-foreground flex-shrink-0">
              {format(new Date(message.timestamp), 'HH:mm')}
            </span>
          </div>
          <p className="text-sm break-words">{message.message}</p>
        </div>
      </div>
    );
  };

  if (!eventId && roomId === 'general') {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-aurora" />
            Community Chat
            <Badge variant="outline" className="ml-auto">
              {onlineUsers} online
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ScrollArea className="h-64">
            <div className="space-y-2">
              {messages.map(message => (
                <div key={message.id}>
                  {renderMessage(message)}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Quick Reactions */}
          <div className="flex gap-2 justify-center border-t border-border pt-3">
            {['🔥', '❤️', '🎵', '👏', '🚀'].map(emoji => (
              <Button
                key={emoji}
                variant="ghost"
                size="sm"
                onClick={() => handleReaction(emoji)}
                disabled={!isAuthenticated}
                className="text-lg p-2"
              >
                {emoji}
              </Button>
            ))}
          </div>

          {/* Message Input */}
          <div className="flex gap-2 border-t border-border pt-3">
            <input
              type="text"
              placeholder={isAuthenticated ? "Type a message..." : "Sign in to chat"}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              disabled={!isAuthenticated}
              className="flex-1 px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-aurora/50"
            />
            <Button 
              size="sm" 
              onClick={handleSendMessage}
              disabled={!isAuthenticated || !newMessage.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>

          {!isAuthenticated && (
            <p className="text-xs text-muted-foreground text-center">
              Sign in to join the conversation
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Chat Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Live Chat</h3>
          <Badge variant="outline">
            {onlineUsers} viewers
          </Badge>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-2">
          {messages.map(message => (
            <div key={message.id}>
              {renderMessage(message)}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Quick Reactions */}
      <div className="p-2 border-t border-border">
        <div className="flex gap-1 justify-center">
          {['🔥', '❤️', '🎵', '👏'].map(emoji => (
            <Button
              key={emoji}
              variant="ghost"
              size="sm"
              onClick={() => handleReaction(emoji)}
              disabled={!isAuthenticated}
              className="text-sm p-1"
            >
              {emoji}
            </Button>
          ))}
        </div>
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder={isAuthenticated ? "Say something..." : "Sign in to chat"}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            disabled={!isAuthenticated}
            className="flex-1 px-3 py-2 text-sm bg-background border border-border rounded focus:outline-none focus:ring-1 focus:ring-aurora/50"
          />
          <Button 
            size="sm" 
            onClick={handleSendMessage}
            disabled={!isAuthenticated || !newMessage.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};