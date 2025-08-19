import React, { useState, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAudiusSearch } from '@/hooks/useAudius';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { AudiusService } from '@/services/audiusService';
import {
  Search,
  Music,
  User,
  Play,
  Loader2,
  TrendingUp,
} from 'lucide-react';

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ open, onClose }) => {
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState<'tracks' | 'users'>('tracks');
  const { tracks, users, loading, searchTracks, searchUsers, clearResults } = useAudiusSearch();
  const { playTrack } = useAudioPlayer();

  // Debounced search
  const debouncedSearch = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return (searchQuery: string) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          if (searchQuery.trim()) {
            if (searchType === 'tracks') {
              searchTracks(searchQuery);
            } else {
              searchUsers(searchQuery);
            }
          } else {
            clearResults();
          }
        }, 300);
      };
    })(),
    [searchType, searchTracks, searchUsers, clearResults]
  );

  useEffect(() => {
    debouncedSearch(query);
  }, [query, debouncedSearch]);

  const handleTrackPlay = async (track: any) => {
    const trackData = {
      id: track.id,
      title: track.title,
      artist: track.user.name,
      artwork: AudiusService.getArtworkUrl(track.artwork),
      streamUrl: AudiusService.getStreamUrl(track.id),
      duration: track.duration,
    };
    
    await playTrack(trackData);
    onClose();
  };

  const popularQueries = [
    'electronic',
    'synthwave',
    'house',
    'techno',
    'ambient',
    'hip hop',
    'web3',
    'crypto',
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="glass-panel max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Music
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search tracks or artists..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10"
              autoFocus
            />
          </div>

          {/* Search Type Toggle */}
          <div className="flex gap-2">
            <Button
              variant={searchType === 'tracks' ? 'aurora' : 'outline'}
              size="sm"
              onClick={() => setSearchType('tracks')}
            >
              <Music className="h-4 w-4 mr-2" />
              Tracks
            </Button>
            <Button
              variant={searchType === 'users' ? 'aurora' : 'outline'}
              size="sm"
              onClick={() => setSearchType('users')}
            >
              <User className="h-4 w-4 mr-2" />
              Artists
            </Button>
          </div>

          {/* Popular Searches */}
          {!query && (
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Popular Searches
              </h4>
              <div className="flex flex-wrap gap-2">
                {popularQueries.map((popularQuery) => (
                  <Badge
                    key={popularQuery}
                    variant="outline"
                    className="cursor-pointer hover:bg-accent"
                    onClick={() => setQuery(popularQuery)}
                  >
                    {popularQuery}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Search Results */}
          <ScrollArea className="h-96">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Searching...</span>
              </div>
            ) : searchType === 'tracks' && tracks.length > 0 ? (
              <div className="space-y-2">
                {tracks.map((track) => (
                  <div
                    key={track.id}
                    className="flex items-center gap-3 p-3 glass-panel rounded-lg hover:bg-accent/50 cursor-pointer"
                    onClick={() => handleTrackPlay(track)}
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg flex items-center justify-center">
                      <Music className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">{track.title}</h4>
                      <p className="text-xs text-muted-foreground truncate">
                        {track.user.name}
                      </p>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {AudiusService.formatDuration(track.duration)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {track.favorite_count?.toLocaleString()} likes
                        </span>
                      </div>
                    </div>
                    <Button size="icon" variant="ghost" className="h-8 w-8">
                      <Play className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : searchType === 'users' && users.length > 0 ? (
              <div className="space-y-2">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 p-3 glass-panel rounded-lg hover:bg-accent/50 cursor-pointer"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-secondary/20 to-primary/20 rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-secondary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">{user.name}</h4>
                      <p className="text-xs text-muted-foreground truncate">
                        @{user.handle}
                      </p>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {user.follower_count?.toLocaleString()} followers
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {user.track_count} tracks
                        </span>
                      </div>
                    </div>
                    {user.verified && (
                      <Badge variant="secondary" className="text-xs">
                        Verified
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            ) : query && !loading ? (
              <div className="text-center py-8">
                <Search className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">
                  No {searchType} found for "{query}"
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Try a different search term
                </p>
              </div>
            ) : null}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};