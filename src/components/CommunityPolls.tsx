import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { useWeb3 } from '@/hooks/useWeb3';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Vote, 
  TrendingUp, 
  Clock, 
  Users,
  CheckCircle,
  AlertCircle,
  Star,
  Music,
  Calendar,
  Award
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

interface PollOption {
  id: string;
  text: string;
  votes: number;
  percentage: number;
}

interface Poll {
  id: string;
  title: string;
  description: string;
  options: PollOption[];
  total_votes: number;
  ends_at: string;
  created_at: string;
  created_by: string;
  creator_name: string;
  status: 'active' | 'ended';
  poll_type: 'general' | 'artist' | 'event' | 'feature';
  requires_wallet?: boolean;
  user_voted?: boolean;
  user_vote_option?: string;
}

export const CommunityPolls: React.FC = () => {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [votingPoll, setVotingPoll] = useState<string | null>(null);
  const { isAuthenticated, user } = useAuth();
  const { isConnected, profile } = useWeb3();
  const { toast } = useToast();

  // Mock polls for demonstration
  const mockPolls: Poll[] = [
    {
      id: '1',
      title: 'What genre should we feature next week?',
      description: 'Help us choose the spotlight genre for next week\'s discovery section!',
      options: [
        { id: '1a', text: 'Electronic/EDM', votes: 245, percentage: 45 },
        { id: '1b', text: 'Hip-Hop/Rap', votes: 189, percentage: 35 },
        { id: '1c', text: 'Indie Rock', votes: 87, percentage: 16 },
        { id: '1d', text: 'Jazz/Blues', votes: 22, percentage: 4 }
      ],
      total_votes: 543,
      ends_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      created_by: 'audioton_team',
      creator_name: 'AudioTon Team',
      status: 'active',
      poll_type: 'general',
      user_voted: false
    },
    {
      id: '2',
      title: 'Luna Echo\'s Next Single Choice',
      description: 'Vote for which track Luna Echo should release as her next single!',
      options: [
        { id: '2a', text: 'Midnight Dreams', votes: 156, percentage: 52 },
        { id: '2b', text: 'Electric Nights', votes: 98, percentage: 33 },
        { id: '2c', text: 'Cosmic Dance', votes: 46, percentage: 15 }
      ],
      total_votes: 300,
      ends_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 1 day
      created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      created_by: 'luna_echo',
      creator_name: 'Luna Echo',
      status: 'active',
      poll_type: 'artist',
      requires_wallet: true,
      user_voted: false
    },
    {
      id: '3',
      title: 'New Feature Request Priority',
      description: 'Which feature would you like us to implement first?',
      options: [
        { id: '3a', text: 'Collaborative Playlists', votes: 234, percentage: 39 },
        { id: '3b', text: 'Voice Messages in Chat', votes: 187, percentage: 31 },
        { id: '3c', text: 'NFT Trading Marketplace', votes: 123, percentage: 21 },
        { id: '3d', text: 'Advanced Audio Effects', votes: 56, percentage: 9 }
      ],
      total_votes: 600,
      ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      created_by: 'audioton_team',
      creator_name: 'AudioTon Team',
      status: 'active',
      poll_type: 'feature',
      user_voted: true,
      user_vote_option: '3a'
    }
  ];

  useEffect(() => {
    loadPolls();

    // Set up real-time subscription for poll updates
    const channel = supabase
      .channel('polls-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'community_polls' },
        () => loadPolls()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadPolls = async () => {
    try {
      // For now, use mock data
      setPolls(mockPolls);
      setLoading(false);

      // For production, would fetch from database:
      // const { data, error } = await supabase
      //   .from('community_polls')
      //   .select('*')
      //   .eq('is_active', true)
      //   .order('created_at', { ascending: false });
      //   .from('community_polls')
      //   .select(`
      //     *,
      //     poll_options (*),
      //     poll_votes (*)
      //   `)
      //   .order('created_at', { ascending: false });
    } catch (error) {
      console.error('Error loading polls:', error);
      setPolls(mockPolls);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (pollId: string, optionId: string) => {
    if (!isAuthenticated) {
      toast({
        title: "Sign In Required",
        description: "Please sign in to vote in polls",
        variant: "destructive"
      });
      return;
    }

    const poll = polls.find(p => p.id === pollId);
    if (!poll) return;

    if (poll.requires_wallet && !isConnected) {
      toast({
        title: "Wallet Required",
        description: "This poll requires a connected TON wallet to vote",
        variant: "destructive"
      });
      return;
    }

    if (poll.user_voted) {
      toast({
        title: "Already Voted",
        description: "You have already voted in this poll",
        variant: "destructive"
      });
      return;
    }

    setVotingPoll(pollId);

    try {
      // Update local state immediately for better UX
      setPolls(prev => prev.map(p => {
        if (p.id === pollId) {
          const updatedOptions = p.options.map(opt => {
            if (opt.id === optionId) {
              return { ...opt, votes: opt.votes + 1 };
            }
            return opt;
          });
          
          const newTotal = p.total_votes + 1;
          const updatedOptionsWithPercentage = updatedOptions.map(opt => ({
            ...opt,
            percentage: Math.round((opt.votes / newTotal) * 100)
          }));

          return {
            ...p,
            options: updatedOptionsWithPercentage,
            total_votes: newTotal,
            user_voted: true,
            user_vote_option: optionId
          };
        }
        return p;
      }));

      toast({
        title: "Vote Recorded!",
        description: "Thank you for participating in the poll",
      });

      // For production, would insert vote to database:
      // const { error } = await supabase
      //   .from('poll_votes')
      //   .insert({
      //     poll_id: pollId,
      //     profile_id: profile?.id,
      //     option_index: optionId
      //   });
      //   .from('poll_votes')
      //   .insert([{
      //     poll_id: pollId,
      //     option_id: optionId,
      //     user_id: user.id
      //   }]);

    } catch (error) {
      console.error('Error voting:', error);
      toast({
        title: "Vote Failed",
        description: "Failed to record your vote. Please try again.",
        variant: "destructive"
      });
    } finally {
      setVotingPoll(null);
    }
  };

  const getPollTypeIcon = (type: string) => {
    switch (type) {
      case 'artist':
        return <Star className="h-4 w-4 text-yellow-500" />;
      case 'event':
        return <Calendar className="h-4 w-4 text-purple-500" />;
      case 'feature':
        return <Award className="h-4 w-4 text-blue-500" />;
      default:
        return <Vote className="h-4 w-4 text-aurora" />;
    }
  };

  const getPollTypeLabel = (type: string) => {
    switch (type) {
      case 'artist': return 'Artist Poll';
      case 'event': return 'Event Poll';
      case 'feature': return 'Feature Request';
      default: return 'Community Poll';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map(i => (
          <Card key={i} className="glass-card animate-pulse">
            <CardHeader>
              <div className="h-6 bg-muted rounded w-3/4" />
              <div className="h-4 bg-muted rounded w-1/2" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[1, 2, 3].map(j => (
                  <div key={j} className="h-10 bg-muted rounded" />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="glass-card">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-aurora/20">
              <Vote className="h-6 w-6 text-aurora" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Community Polls</h2>
              <p className="text-muted-foreground">
                Help shape the future of AudioTon by voting on community decisions
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-aurora">{polls.length}</div>
              <div className="text-sm text-muted-foreground">Active Polls</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">
                {polls.reduce((sum, poll) => sum + poll.total_votes, 0).toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Total Votes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-500">
                {polls.filter(p => p.user_voted).length}
              </div>
              <div className="text-sm text-muted-foreground">Your Votes</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Polls List */}
      <div className="space-y-4">
        {polls.map(poll => (
          <Card key={poll.id} className="glass-card">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="flex items-center gap-1">
                      {getPollTypeIcon(poll.poll_type)}
                      {getPollTypeLabel(poll.poll_type)}
                    </Badge>
                    {poll.requires_wallet && (
                      <Badge variant="outline" className="border-aurora text-aurora">
                        Wallet Required
                      </Badge>
                    )}
                    {poll.user_voted && (
                      <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Voted
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg">{poll.title}</CardTitle>
                  <p className="text-muted-foreground text-sm">{poll.description}</p>
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  <div className="flex items-center gap-1 mb-1">
                    <Users className="h-3 w-3" />
                    {poll.total_votes} votes
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(poll.ends_at), { addSuffix: true })}
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Poll Options */}
              <div className="space-y-3">
                {poll.options.map(option => (
                  <div key={option.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Button
                        variant={poll.user_voted ? "ghost" : "outline"}
                        className={`flex-1 justify-start h-auto p-3 ${
                          poll.user_vote_option === option.id 
                            ? "bg-aurora/20 border-aurora text-aurora" 
                            : ""
                        }`}
                        onClick={() => handleVote(poll.id, option.id)}
                        disabled={poll.user_voted || votingPoll === poll.id}
                      >
                        <div className="flex-1 text-left">
                          <div className="font-medium">{option.text}</div>
                          {poll.user_voted && (
                            <div className="text-sm text-muted-foreground">
                              {option.votes} votes ({option.percentage}%)
                            </div>
                          )}
                        </div>
                        {poll.user_vote_option === option.id && (
                          <CheckCircle className="h-4 w-4 text-aurora" />
                        )}
                      </Button>
                    </div>
                    
                    {poll.user_voted && (
                      <Progress value={option.percentage} className="h-2" />
                    )}
                  </div>
                ))}
              </div>

              {/* Poll Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>By {poll.creator_name}</span>
                  <span>•</span>
                  <span>{format(new Date(poll.created_at), 'MMM d')}</span>
                </div>
                
                {!poll.user_voted && !isAuthenticated && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <AlertCircle className="h-4 w-4" />
                    Sign in to vote
                  </div>
                )}
                
                {!poll.user_voted && poll.requires_wallet && isAuthenticated && !isConnected && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <AlertCircle className="h-4 w-4" />
                    Connect wallet to vote
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};