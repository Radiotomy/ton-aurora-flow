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
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  Filter,
  X,
  Clock,
  Heart,
  Zap,
  Plus
} from 'lucide-react';

interface AdvancedSearchModalProps {
  open: boolean;
  onClose: () => void;
}

interface SearchFilters {
  genre?: string;
  mood?: string;
  bpmRange: [number, number];
  duration?: 'short' | 'medium' | 'long';
  sortBy: 'relevance' | 'plays' | 'favorites' | 'recent';
  minPlays?: number;
  verified?: boolean;
}

export const AdvancedSearchModal: React.FC<AdvancedSearchModalProps> = ({ open, onClose }) => {
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState<'tracks' | 'users'>('tracks');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    bpmRange: [60, 200],
    sortBy: 'relevance'
  });

  const { tracks, users, loading, searchTracks, searchUsers, clearResults } = useAudiusSearch();
  const { playTrack } = useAudioPlayer();

  const genres = AudiusService.getGenres();
  const moods = [
    { id: 'energetic', label: 'Energetic' },
    { id: 'chill', label: 'Chill' },
    { id: 'emotional', label: 'Emotional' },
    { id: 'uplifting', label: 'Uplifting' },
    { id: 'dark', label: 'Dark' },
    { id: 'peaceful', label: 'Peaceful' }
  ];

  // Enhanced debounced search with filters
  const debouncedSearch = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return (searchQuery: string, searchFilters: SearchFilters) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          if (searchQuery.trim()) {
            if (searchType === 'tracks') {
              // Pass filters to search function (would need to enhance AudiusService)
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
    debouncedSearch(query, filters);
  }, [query, filters, debouncedSearch]);

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

  const handleAddToQueue = async (track: any) => {
    // Queue functionality would be implemented here
    console.log('Add to queue:', track);
  };

  const clearFilters = () => {
    setFilters({
      bpmRange: [60, 200],
      sortBy: 'relevance'
    });
  };

  const hasActiveFilters = filters.genre || filters.mood || filters.duration || 
    filters.minPlays || filters.verified || filters.sortBy !== 'relevance';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="glass-panel max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Advanced Music Search
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
              {hasActiveFilters && <Badge variant="secondary" className="ml-1">On</Badge>}
            </Button>
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

          {/* Advanced Filters */}
          {showFilters && searchType === 'tracks' && (
            <div className="glass-panel p-4 space-y-4 border border-glass-border rounded-lg">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Advanced Filters</h4>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="h-4 w-4 mr-1" />
                    Clear All
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Genre Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Genre</label>
                  <Select value={filters.genre || ''} onValueChange={(value) => 
                    setFilters(prev => ({ ...prev, genre: value || undefined }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Any Genre" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any Genre</SelectItem>
                      {genres.map(genre => (
                        <SelectItem key={genre.id} value={genre.id}>{genre.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Mood Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Mood</label>
                  <Select value={filters.mood || ''} onValueChange={(value) => 
                    setFilters(prev => ({ ...prev, mood: value || undefined }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Any Mood" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any Mood</SelectItem>
                      {moods.map(mood => (
                        <SelectItem key={mood.id} value={mood.id}>{mood.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort By */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Sort By</label>
                  <Select value={filters.sortBy} onValueChange={(value: any) => 
                    setFilters(prev => ({ ...prev, sortBy: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="relevance">Relevance</SelectItem>
                      <SelectItem value="plays">Most Plays</SelectItem>
                      <SelectItem value="favorites">Most Liked</SelectItem>
                      <SelectItem value="recent">Most Recent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* BPM Range */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  BPM Range: {filters.bpmRange[0]} - {filters.bpmRange[1]}
                </label>
                <Slider
                  value={filters.bpmRange}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, bpmRange: value as [number, number] }))}
                  min={60}
                  max={200}
                  step={1}
                  className="w-full"
                />
              </div>

              {/* Duration Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">Duration</label>
                <div className="flex gap-2">
                  {[
                    { value: undefined, label: 'Any' },
                    { value: 'short' as const, label: 'Short (< 3min)', icon: Zap },
                    { value: 'medium' as const, label: 'Medium (3-6min)', icon: Clock },
                    { value: 'long' as const, label: 'Long (> 6min)', icon: Music }
                  ].map(({ value, label, icon: Icon }) => (
                    <Button
                      key={label}
                      variant={filters.duration === value ? 'aurora' : 'outline'}
                      size="sm"
                      onClick={() => setFilters(prev => ({ ...prev, duration: value }))}
                      className="flex items-center gap-1"
                    >
                      {Icon && <Icon className="h-3 w-3" />}
                      {label}
                    </Button>
                  ))}
                </div>
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
                    className="flex items-center gap-3 p-3 glass-panel rounded-lg hover:bg-accent/50"
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
                        {track.genre && (
                          <Badge variant="outline" className="text-xs">
                            {track.genre}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8"
                        onClick={() => handleAddToQueue(track)}
                        title="Add to Queue"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8"
                        onClick={() => handleTrackPlay(track)}
                        title="Play Now"
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                    </div>
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
                  Try adjusting your filters or search terms
                </p>
              </div>
            ) : null}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};