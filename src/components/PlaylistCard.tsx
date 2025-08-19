import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  MoreVertical, 
  Music, 
  Lock, 
  Unlock,
  Sparkles,
  Calendar,
  User
} from 'lucide-react';
import { LocalPlaylist, StoredPlaylist } from '@/hooks/usePlaylist';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface PlaylistCardProps {
  playlist: LocalPlaylist | StoredPlaylist;
  onPlay?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onMigrate?: () => void;
  className?: string;
}

export const PlaylistCard: React.FC<PlaylistCardProps> = ({
  playlist,
  onPlay,
  onEdit,
  onDelete,
  onMigrate,
  className = '',
}) => {
  // Extract data from either type of playlist
  const isWeb3Playlist = 'metadata' in playlist;
  const playlistData = isWeb3Playlist ? playlist.metadata : playlist;
  
  const {
    name,
    description,
    cover_url,
    tracks,
    is_public,
    created_at,
    updated_at,
  } = playlistData;

  const ownerAddress = isWeb3Playlist && 'owner_address' in playlistData
    ? playlistData.owner_address 
    : null;

  const trackCount = tracks.length;
  const isLocal = !isWeb3Playlist;
  
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDuration = () => {
    const totalSeconds = tracks.reduce((sum, track) => sum + (track.duration || 0), 0);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <Card className={`group hover:shadow-lg transition-all duration-300 overflow-hidden ${className}`}>
      <CardContent className="p-0">
        {/* Cover Image */}
        <div className="relative aspect-square bg-gradient-to-br from-aurora/20 to-primary/20 overflow-hidden">
          {cover_url ? (
            <img
              src={cover_url}
              alt={`${name} cover`}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Music className="w-12 h-12 text-muted-foreground" />
            </div>
          )}
          
          {/* Play Button Overlay */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <Button
              size="lg"
              className="rounded-full w-16 h-16 aurora-gradient"
              onClick={onPlay}
              disabled={trackCount === 0}
            >
              <Play className="w-6 h-6 fill-current" />
            </Button>
          </div>

          {/* Storage Type Badge */}
          <div className="absolute top-2 left-2">
            {isWeb3Playlist ? (
              <Badge className="bg-aurora/90 text-aurora-foreground">
                <Sparkles className="w-3 h-3 mr-1" />
                Web3
              </Badge>
            ) : (
              <Badge variant="secondary">
                Local
              </Badge>
            )}
          </div>

          {/* Privacy Badge */}
          <div className="absolute top-2 right-2">
            <Badge variant={is_public ? "secondary" : "outline"}>
              {is_public ? (
                <Unlock className="w-3 h-3" />
              ) : (
                <Lock className="w-3 h-3" />
              )}
            </Badge>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground truncate" title={name}>
                {name}
              </h3>
              {description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                  {description}
                </p>
              )}
            </div>
            
            {/* Actions Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="shrink-0 ml-2">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onEdit && (
                  <DropdownMenuItem onClick={onEdit}>
                    Edit Playlist
                  </DropdownMenuItem>
                )}
                {onMigrate && isLocal && (
                  <DropdownMenuItem onClick={onMigrate}>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Migrate to Web3
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem onClick={onDelete} className="text-destructive">
                    Delete Playlist
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
            <span className="flex items-center gap-1">
              <Music className="w-4 h-4" />
              {trackCount} {trackCount === 1 ? 'track' : 'tracks'}
            </span>
            {trackCount > 0 && (
              <span>{formatDuration()}</span>
            )}
          </div>

          {/* Metadata */}
          <div className="space-y-1 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Created {formatDate(created_at)}
            </div>
            
            {ownerAddress && (
              <div className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {ownerAddress.slice(0, 6)}...{ownerAddress.slice(-4)}
              </div>
            )}
          </div>

          {/* Migration Prompt for Local Playlists */}
          {isLocal && onMigrate && (
            <div className="mt-3 p-2 rounded border border-aurora/20 bg-aurora/5">
              <div className="flex items-center justify-between">
                <div className="text-xs">
                  <p className="font-medium text-aurora">Save Permanently</p>
                  <p className="text-muted-foreground">Connect wallet to migrate</p>
                </div>
                <Button size="sm" variant="outline" onClick={onMigrate}>
                  <Sparkles className="w-3 h-3" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};