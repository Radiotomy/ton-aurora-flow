import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import {
  MessageCircle,
  Send,
  Heart,
  Reply,
  MoreHorizontal,
  Music,
  Pin,
  Flag
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Comment {
  id: string;
  text: string;
  author: {
    id: string;
    name: string;
    handle: string;
    avatar?: string;
    verified: boolean;
  };
  timestamp: string;
  likes: number;
  replies: Comment[];
  isPinned?: boolean;
  isArtist?: boolean;
}

interface TrackCommentsProps {
  trackId: string;
  artistId?: string;
}

export const TrackComments: React.FC<TrackCommentsProps> = ({ trackId, artistId }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { toast } = useToast();
  const { isAuthenticated, user } = useAuth();

  // Mock data for demonstration
  useEffect(() => {
    loadComments();
  }, [trackId]);

  const loadComments = async () => {
    // For now, using mock data - in production would fetch from Audius API
    const mockComments: Comment[] = [
      {
        id: '1',
        text: 'This track is absolutely incredible! The production quality is next level 🔥',
        author: {
          id: 'user1',
          name: 'Alex Chen',
          handle: 'alexc_music',
          avatar: '',
          verified: false
        },
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
        likes: 24,
        replies: [
          {
            id: '1-1',
            text: 'Totally agree! Been on repeat all day',
            author: {
              id: 'user2',
              name: 'Sarah Kim',
              handle: 'sarahk',
              avatar: '',
              verified: false
            },
            timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 minutes ago
            likes: 5,
            replies: []
          }
        ]
      },
      {
        id: '2',
        text: 'Thanks for listening everyone! This one was really special to make ❤️',
        author: {
          id: artistId || 'artist1',
          name: 'Artist Name',
          handle: 'artisthandle',
          avatar: '',
          verified: true
        },
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
        likes: 156,
        replies: [],
        isPinned: true,
        isArtist: true
      }
    ];

    setComments(mockComments);
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !isAuthenticated) return;

    setLoading(true);
    try {
      // In production, this would post to Audius API
      const comment: Comment = {
        id: Date.now().toString(),
        text: newComment.trim(),
        author: {
          id: user?.id || 'current-user',
          name: user?.user_metadata?.name || 'Current User',
          handle: user?.email?.split('@')[0] || 'user',
          verified: false
        },
        timestamp: new Date().toISOString(),
        likes: 0,
        replies: []
      };

      setComments(prev => [...prev, comment]);
      setNewComment('');
      
      toast({
        title: "Comment Posted",
        description: "Your comment has been added to the track",
      });
    } catch (error) {
      toast({
        title: "Failed to Post Comment",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReply = async (parentId: string) => {
    if (!replyText.trim() || !isAuthenticated) return;

    setLoading(true);
    try {
      const reply: Comment = {
        id: `${parentId}-${Date.now()}`,
        text: replyText.trim(),
        author: {
          id: user?.id || 'current-user',
          name: user?.user_metadata?.name || 'Current User',
          handle: user?.email?.split('@')[0] || 'user',
          verified: false
        },
        timestamp: new Date().toISOString(),
        likes: 0,
        replies: []
      };

      setComments(prev => prev.map(comment => 
        comment.id === parentId 
          ? { ...comment, replies: [...comment.replies, reply] }
          : comment
      ));
      
      setReplyText('');
      setReplyingTo(null);
      
      toast({
        title: "Reply Posted",
        description: "Your reply has been added",
      });
    } catch (error) {
      toast({
        title: "Failed to Post Reply",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    // Mock like functionality
    setComments(prev => prev.map(comment => 
      comment.id === commentId 
        ? { ...comment, likes: comment.likes + 1 }
        : {
            ...comment,
            replies: comment.replies.map(reply =>
              reply.id === commentId
                ? { ...reply, likes: reply.likes + 1 }
                : reply
            )
          }
    ));
  };

  const renderComment = (comment: Comment, isReply = false) => (
    <div key={comment.id} className={`${isReply ? 'ml-8 mt-3' : ''} space-y-3`}>
      <div className="flex gap-3">
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={comment.author.avatar} alt={comment.author.name} />
          <AvatarFallback>
            <Music className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm">{comment.author.name}</span>
            <span className="text-xs text-muted-foreground">@{comment.author.handle}</span>
            {comment.author.verified && (
              <Badge variant="secondary" className="text-xs px-1 py-0">
                ✓
              </Badge>
            )}
            {comment.isArtist && (
              <Badge variant="aurora" className="text-xs px-1 py-0">
                Artist
              </Badge>
            )}
            {comment.isPinned && (
              <Pin className="h-3 w-3 text-primary" />
            )}
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(comment.timestamp), { addSuffix: true })}
            </span>
          </div>
          
          <p className="text-sm mt-1 break-words">{comment.text}</p>
          
          <div className="flex items-center gap-4 mt-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => handleLikeComment(comment.id)}
            >
              <Heart className="h-3 w-3 mr-1" />
              {comment.likes}
            </Button>
            
            {!isReply && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => setReplyingTo(comment.id)}
              >
                <Reply className="h-3 w-3 mr-1" />
                Reply
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-1 text-xs"
            >
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </div>
          
          {replyingTo === comment.id && (
            <div className="mt-3 flex gap-2">
              <Input
                placeholder="Write a reply..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="text-sm"
                onKeyPress={(e) => e.key === 'Enter' && handleSubmitReply(comment.id)}
              />
              <Button 
                size="sm" 
                onClick={() => handleSubmitReply(comment.id)}
                disabled={!replyText.trim() || loading}
              >
                <Send className="h-3 w-3" />
              </Button>
              <Button 
                size="sm" 
                variant="ghost"
                onClick={() => {
                  setReplyingTo(null);
                  setReplyText('');
                }}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>
      
      {comment.replies.map(reply => renderComment(reply, true))}
    </div>
  );

  return (
    <Card className="glass-panel">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Comments ({comments.length})
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Comment Input */}
        {isAuthenticated ? (
          <div className="flex gap-2">
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarFallback>
                <Music className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 flex gap-2">
              <Input
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSubmitComment()}
                className="flex-1"
              />
              <Button 
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || loading}
                size="sm"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 glass-panel rounded-lg">
            <p className="text-muted-foreground">Sign in to leave a comment</p>
          </div>
        )}
        
        {/* Comments List */}
        <ScrollArea className="h-96">
          <div className="space-y-4">
            {comments.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No comments yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Be the first to share your thoughts
                </p>
              </div>
            ) : (
              comments.map(comment => renderComment(comment))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};