import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { usePlaylist } from '@/hooks/usePlaylist';
import { CurrentTrack } from '@/hooks/useAudioPlayer';
import { Plus, Music, Users, Lock } from 'lucide-react';

interface PlaylistModalProps {
  open: boolean;
  onClose: () => void;
  track?: CurrentTrack; // If provided, will show "Add to Playlist" mode
}

export const PlaylistModal: React.FC<PlaylistModalProps> = ({
  open,
  onClose,
  track,
}) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDescription, setNewPlaylistDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const {
    playlists,
    createPlaylist,
    addTrackToPlaylist,
    isLoading,
  } = usePlaylist();

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) return;

    setIsCreating(true);
    const playlist = await createPlaylist(
      newPlaylistName.trim(),
      newPlaylistDescription.trim() || undefined,
      isPublic
    );

    if (playlist && track) {
      await addTrackToPlaylist(playlist.id, track);
    }

    setIsCreating(false);
    setNewPlaylistName('');
    setNewPlaylistDescription('');
    setIsPublic(false);
    setShowCreateForm(false);
    
    if (!track) {
      onClose(); // Close modal if not adding a track
    }
  };

  const handleAddToPlaylist = async (playlistId: string) => {
    if (!track) return;
    
    const success = await addTrackToPlaylist(playlistId, track);
    if (success) {
      onClose();
    }
  };

  const resetForm = () => {
    setShowCreateForm(false);
    setNewPlaylistName('');
    setNewPlaylistDescription('');
    setIsPublic(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="glass-panel border-glass max-w-md">
        <DialogHeader>
          <DialogTitle className="text-aurora">
            {track ? `Add "${track.title}" to Playlist` : 'My Playlists'}
          </DialogTitle>
          <DialogDescription>
            {track 
              ? 'Choose a playlist or create a new one'
              : 'Manage your music collections'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {showCreateForm ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="playlist-name">Playlist Name</Label>
                <Input
                  id="playlist-name"
                  placeholder="My Awesome Playlist"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  className="glass-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="playlist-description">Description (Optional)</Label>
                <Textarea
                  id="playlist-description"
                  placeholder="Describe your playlist..."
                  value={newPlaylistDescription}
                  onChange={(e) => setNewPlaylistDescription(e.target.value)}
                  className="glass-input resize-none"
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is-public"
                  checked={isPublic}
                  onCheckedChange={setIsPublic}
                />
                <Label htmlFor="is-public" className="text-sm">
                  Make playlist public
                </Label>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleCreatePlaylist}
                  disabled={!newPlaylistName.trim() || isCreating}
                  className="flex-1"
                >
                  {isCreating ? 'Creating...' : 'Create Playlist'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                  className="glass-button"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              <Button
                variant="outline"
                className="w-full glass-button border-dashed"
                onClick={() => setShowCreateForm(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create New Playlist
              </Button>

              {playlists.length > 0 && <Separator className="bg-glass-border" />}

              <ScrollArea className="max-h-64">
                <div className="space-y-2">
                  {isLoading ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Loading playlists...
                    </div>
                  ) : playlists.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Music className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No playlists yet</p>
                      <p className="text-xs">Create your first playlist above</p>
                    </div>
                  ) : (
                    playlists.map((playlist) => (
                      <div
                        key={playlist.id}
                        className="flex items-center justify-between p-3 rounded-lg glass-panel border-glass hover:bg-white/5 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium truncate">{playlist.name}</h4>
                            <div className="flex gap-1">
                              {playlist.is_public ? (
                                <Users className="w-3 h-3 text-muted-foreground" />
                              ) : (
                                <Lock className="w-3 h-3 text-muted-foreground" />
                              )}
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {playlist.tracks.length} track{playlist.tracks.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                        
                        {track && (
                          <Button
                            size="sm"
                            variant="glass"
                            onClick={() => handleAddToPlaylist(playlist.id)}
                            className="ml-2"
                          >
                            Add
                          </Button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};