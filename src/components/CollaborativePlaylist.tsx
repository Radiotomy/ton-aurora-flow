import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import TrackCard from '@/components/TrackCard';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { AudiusService } from '@/services/audiusService';
import {
  Users,
  Plus,
  UserPlus,
  Settings,
  Crown,
  Vote,
  Clock,
  Music,
  Send,
  ThumbsUp,
  ThumbsDown,
  Share,
  Copy
} from 'lucide-react';

interface Collaborator {
  id: string;
  name: string;
  handle: string;
  avatar?: string;
  role: 'owner' | 'admin' | 'contributor' | 'viewer';
  joinedAt: string;
  verified?: boolean;
}

interface TrackSuggestion {
  id: string;
  track: any;
  suggestedBy: Collaborator;
  votes: number;
  votedUsers: string[];
  timestamp: string;
  status: 'pending' | 'approved' | 'rejected';
  note?: string;
}

interface CollaborativePlaylistProps {
  playlistId: string;
  isOwner: boolean;
}

export const CollaborativePlaylist: React.FC<CollaborativePlaylistProps> = ({
  playlistId,
  isOwner
}) => {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [suggestions, setSuggestions] = useState<TrackSuggestion[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [playlistSettings, setPlaylistSettings] = useState({
    allowSuggestions: true,
    requireApproval: true,
    votingEnabled: true,
    minVotesRequired: 2,
    autoAddThreshold: 3
  });
  const [activeTab, setActiveTab] = useState<'collaborators' | 'suggestions' | 'settings'>('collaborators');

  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    loadCollaborativeData();
  }, [playlistId]);

  const loadCollaborativeData = async () => {
    try {
      setLoading(true);
      
      // Get playlist details
      const { data: playlist, error: playlistError } = await supabase
        .from('playlists')
        .select(`
          *,
          profiles:profile_id (
            id,
            display_name,
            avatar_url,
            wallet_address
          )
        `)
        .eq('id', playlistId)
        .single();

      if (playlistError) throw playlistError;

      // For now, just show the playlist owner as the only collaborator
      // In a full implementation, you'd have a separate collaborators table
      const owner: Collaborator = {
        id: playlist.profiles?.id || 'unknown',
        name: playlist.profiles?.display_name || 'Unknown User',
        handle: playlist.profiles?.wallet_address?.slice(0, 8) + '...' || 'Unknown',
        role: 'owner',
        joinedAt: playlist.created_at,
        verified: false
      };

      setCollaborators([owner]);
      setPermissions({
        canAddTracks: playlist.profile_id === playlist.profiles?.id,
        canRemoveTracks: playlist.profile_id === playlist.profiles?.id,
        canInviteUsers: playlist.profile_id === playlist.profiles?.id,
        canModifyPlaylist: playlist.profile_id === playlist.profiles?.id
      });
      
    } catch (error) {
      console.error('Error loading collaborative data:', error);
      // Fallback to empty state
      setCollaborators([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInviteUser = async () => {
    if (!inviteEmail.trim()) return;

    try {
      // In production, would send actual invitation
      const newCollaborator: Collaborator = {
        id: `collab_${Date.now()}`,
        name: inviteEmail.split('@')[0],
        handle: inviteEmail.split('@')[0],
        role: 'contributor',
        joinedAt: new Date().toISOString()
      };

      setCollaborators(prev => [...prev, newCollaborator]);
      setInviteEmail('');

      toast({
        title: "Invitation Sent",
        description: `Invitation sent to ${inviteEmail}`,
      });
    } catch (error) {
      toast({
        title: "Failed to Send Invitation",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  };

  const handleVoteSuggestion = (suggestionId: string, vote: 'up' | 'down') => {
    setSuggestions(prev => prev.map(suggestion => {
      if (suggestion.id === suggestionId) {
        const hasVoted = suggestion.votedUsers.includes(user?.id || 'current-user');
        if (hasVoted) return suggestion;

        const newVotes = vote === 'up' ? suggestion.votes + 1 : suggestion.votes - 1;
        const newVotedUsers = [...suggestion.votedUsers, user?.id || 'current-user'];
        
        // Auto-approve if threshold met
        const newStatus = newVotes >= playlistSettings.autoAddThreshold ? 'approved' : suggestion.status;

        return {
          ...suggestion,
          votes: newVotes,
          votedUsers: newVotedUsers,
          status: newStatus
        };
      }
      return suggestion;
    }));

    toast({
      title: vote === 'up' ? "Voted Up" : "Voted Down",
      description: "Your vote has been recorded",
    });
  };

  const handleApproveSuggestion = (suggestionId: string) => {
    setSuggestions(prev => prev.map(suggestion =>
      suggestion.id === suggestionId
        ? { ...suggestion, status: 'approved' as const }
        : suggestion
    ));

    toast({
      title: "Track Approved",
      description: "Track has been added to the playlist",
    });
  };

  const handleRejectSuggestion = (suggestionId: string) => {
    setSuggestions(prev => prev.map(suggestion =>
      suggestion.id === suggestionId
        ? { ...suggestion, status: 'rejected' as const }
        : suggestion
    ));

    toast({
      title: "Track Rejected",
      description: "Track suggestion has been rejected",
    });
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return Crown;
      case 'admin': return Settings;
      default: return Users;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return 'text-yellow-400';
      case 'admin': return 'text-blue-400';
      case 'contributor': return 'text-green-400';
      default: return 'text-muted-foreground';
    }
  };

  const copyPlaylistLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Link Copied",
      description: "Playlist link copied to clipboard",
    });
  };

  const sharePlaylist = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Collaborative Playlist',
        text: 'Check out this collaborative playlist!',
        url: window.location.href
      });
    } else {
      copyPlaylistLink();
    }
  };

  return (
    <Card className="glass-panel">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Collaborative Playlist
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={sharePlaylist}>
              <Share className="h-4 w-4 mr-1" />
              Share
            </Button>
            <Button variant="outline" size="sm" onClick={copyPlaylistLink}>
              <Copy className="h-4 w-4 mr-1" />
              Copy Link
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6">
          {[
            { id: 'collaborators', label: 'Collaborators', icon: Users },
            { id: 'suggestions', label: 'Suggestions', icon: Vote },
            { id: 'settings', label: 'Settings', icon: Settings }
          ].map(({ id, label, icon: Icon }) => (
            <Button
              key={id}
              variant={activeTab === id ? 'aurora' : 'outline'}
              size="sm"
              onClick={() => setActiveTab(id as any)}
              className="flex items-center gap-1"
            >
              <Icon className="h-4 w-4" />
              {label}
              {id === 'suggestions' && suggestions.filter(s => s.status === 'pending').length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {suggestions.filter(s => s.status === 'pending').length}
                </Badge>
              )}
            </Button>
          ))}
        </div>

        {/* Collaborators Tab */}
        {activeTab === 'collaborators' && (
          <div className="space-y-4">
            {/* Invite Section */}
            <div className="flex gap-2">
              <Input
                placeholder="Enter email or username"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleInviteUser} disabled={!inviteEmail.trim()}>
                <UserPlus className="h-4 w-4 mr-1" />
                Invite
              </Button>
            </div>

            {/* Collaborators List */}
            <ScrollArea className="h-64">
              <div className="space-y-3">
                {collaborators.map((collaborator) => {
                  const RoleIcon = getRoleIcon(collaborator.role);
                  return (
                    <div key={collaborator.id} className="flex items-center gap-3 p-3 glass-panel rounded-lg">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={collaborator.avatar} alt={collaborator.name} />
                        <AvatarFallback>
                          <Music className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{collaborator.name}</span>
                          {collaborator.verified && (
                            <Badge variant="secondary" className="text-xs">✓</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">@{collaborator.handle}</p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`flex items-center gap-1 ${getRoleColor(collaborator.role)}`}>
                          <RoleIcon className="h-3 w-3" />
                          {collaborator.role}
                        </Badge>
                        {isOwner && collaborator.role !== 'owner' && (
                          <Button variant="ghost" size="sm">
                            <Settings className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Suggestions Tab */}
        {activeTab === 'suggestions' && (
          <div className="space-y-4">
            <ScrollArea className="h-96">
              {suggestions.length === 0 ? (
                <div className="text-center py-8">
                  <Vote className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No suggestions yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {suggestions.map((suggestion) => (
                    <div key={suggestion.id} className="glass-panel p-4 rounded-lg">
                      <div className="flex items-start gap-3 mb-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={suggestion.suggestedBy.avatar} alt={suggestion.suggestedBy.name} />
                          <AvatarFallback>
                            <Music className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">{suggestion.suggestedBy.name}</span>
                            <Badge variant="outline" className={`text-xs ${
                              suggestion.status === 'approved' ? 'border-green-400 text-green-400' :
                              suggestion.status === 'rejected' ? 'border-red-400 text-red-400' :
                              'border-yellow-400 text-yellow-400'
                            }`}>
                              {suggestion.status}
                            </Badge>
                          </div>
                          {suggestion.note && (
                            <p className="text-sm text-muted-foreground mb-2">{suggestion.note}</p>
                          )}
                        </div>
                      </div>

                      {/* Track Preview */}
                      <div className="mb-3">
                        <TrackCard {...AudiusService.convertToTrackCardProps(suggestion.track)} />
                      </div>

                      {/* Voting/Actions */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleVoteSuggestion(suggestion.id, 'up')}
                            className="flex items-center gap-1"
                            disabled={suggestion.votedUsers.includes(user?.id || 'current-user')}
                          >
                            <ThumbsUp className="h-4 w-4" />
                            {suggestion.votes}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleVoteSuggestion(suggestion.id, 'down')}
                            disabled={suggestion.votedUsers.includes(user?.id || 'current-user')}
                          >
                            <ThumbsDown className="h-4 w-4" />
                          </Button>
                        </div>

                        {isOwner && suggestion.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRejectSuggestion(suggestion.id)}
                              className="text-destructive"
                            >
                              Reject
                            </Button>
                            <Button
                              variant="aurora"
                              size="sm"
                              onClick={() => handleApproveSuggestion(suggestion.id)}
                            >
                              Approve
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && isOwner && (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="allowSuggestions">Allow Suggestions</Label>
                  <p className="text-sm text-muted-foreground">Let collaborators suggest new tracks</p>
                </div>
                <Switch
                  id="allowSuggestions"
                  checked={playlistSettings.allowSuggestions}
                  onCheckedChange={(checked) =>
                    setPlaylistSettings(prev => ({ ...prev, allowSuggestions: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="requireApproval">Require Approval</Label>
                  <p className="text-sm text-muted-foreground">Manually approve all suggested tracks</p>
                </div>
                <Switch
                  id="requireApproval"
                  checked={playlistSettings.requireApproval}
                  onCheckedChange={(checked) =>
                    setPlaylistSettings(prev => ({ ...prev, requireApproval: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="votingEnabled">Enable Voting</Label>
                  <p className="text-sm text-muted-foreground">Let collaborators vote on suggestions</p>
                </div>
                <Switch
                  id="votingEnabled"
                  checked={playlistSettings.votingEnabled}
                  onCheckedChange={(checked) =>
                    setPlaylistSettings(prev => ({ ...prev, votingEnabled: checked }))
                  }
                />
              </div>
            </div>

            {playlistSettings.votingEnabled && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="minVotes">Minimum Votes Required</Label>
                  <Input
                    id="minVotes"
                    type="number"
                    min="1"
                    value={playlistSettings.minVotesRequired}
                    onChange={(e) =>
                      setPlaylistSettings(prev => ({
                        ...prev,
                        minVotesRequired: parseInt(e.target.value) || 1
                      }))
                    }
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="autoAdd">Auto-Add Threshold</Label>
                  <Input
                    id="autoAdd"
                    type="number"
                    min="1"
                    value={playlistSettings.autoAddThreshold}
                    onChange={(e) =>
                      setPlaylistSettings(prev => ({
                        ...prev,
                        autoAddThreshold: parseInt(e.target.value) || 1
                      }))
                    }
                    className="mt-1"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Automatically add tracks that reach this many votes
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};