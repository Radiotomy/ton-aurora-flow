import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useWeb3 } from '@/hooks/useWeb3';
import { usePlaylist, CreatePlaylistData } from '@/hooks/usePlaylist';
import { 
  Plus, 
  Save, 
  Upload, 
  Lock, 
  Unlock, 
  Sparkles,
  Info
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface PlaylistModalProps {
  open: boolean;
  onClose: () => void;
  mode?: 'create' | 'edit';
  existingPlaylist?: {
    id: string;
    name: string;
    description?: string;
    cover_url?: string;
    is_public?: boolean;
  };
}

export const PlaylistModal: React.FC<PlaylistModalProps> = ({
  open,
  onClose,
  mode = 'create',
  existingPlaylist,
}) => {
  const { isConnected, walletAddress } = useWeb3();
  const { createPlaylist, updatePlaylist, loading } = usePlaylist();
  
  const [formData, setFormData] = useState<CreatePlaylistData>({
    name: existingPlaylist?.name || '',
    description: existingPlaylist?.description || '',
    cover_url: existingPlaylist?.cover_url || '',
    is_public: existingPlaylist?.is_public || false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a playlist name",
        variant: "destructive",
      });
      return;
    }

    try {
      if (mode === 'create') {
        const result = await createPlaylist(formData);
        if (result) {
          onClose();
          setFormData({ name: '', description: '', cover_url: '', is_public: false });
        }
      } else if (existingPlaylist) {
        const success = await updatePlaylist(existingPlaylist.id, formData);
        if (success) {
          onClose();
        }
      }
    } catch (error) {
      console.error('Playlist operation error:', error);
    }
  };

  const handleInputChange = (field: keyof CreatePlaylistData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const storageType = isConnected ? 'blockchain' : 'local';
  const isWeb3Mode = isConnected && walletAddress;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === 'create' ? (
              <>
                <Plus className="w-5 h-5" />
                Create Playlist
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Edit Playlist
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Storage Type Indicator */}
          <div className="flex items-center justify-between p-3 rounded-lg glass-panel">
            <div className="flex items-center gap-2">
              {isWeb3Mode ? (
                <>
                  <Sparkles className="w-4 h-4 text-aurora" />
                  <span className="text-sm font-medium">Web3 Storage</span>
                  <Badge variant="secondary" className="text-xs">
                    TON Blockchain
                  </Badge>
                </>
              ) : (
                <>
                  <Info className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Local Storage</span>
                  <Badge variant="outline" className="text-xs">
                    Browser Only
                  </Badge>
                </>
              )}
            </div>
          </div>

          {/* Name Input */}
          <div className="space-y-2">
            <Label htmlFor="name">Playlist Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter playlist name..."
              className="focus:ring-aurora focus:border-aurora"
            />
          </div>

          {/* Description Input */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe your playlist..."
              rows={3}
              className="focus:ring-aurora focus:border-aurora resize-none"
            />
          </div>

          {/* Cover URL Input */}
          <div className="space-y-2">
            <Label htmlFor="cover_url">Cover Image URL</Label>
            <div className="flex gap-2">
              <Input
                id="cover_url"
                value={formData.cover_url}
                onChange={(e) => handleInputChange('cover_url', e.target.value)}
                placeholder="https://example.com/cover.jpg"
                className="focus:ring-aurora focus:border-aurora"
              />
              <Button type="button" variant="outline" size="sm" disabled>
                <Upload className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <Separator />

          {/* Privacy Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {formData.is_public ? (
                  <Unlock className="w-4 h-4 text-green-500" />
                ) : (
                  <Lock className="w-4 h-4 text-orange-500" />
                )}
                <Label htmlFor="is_public" className="font-medium">
                  Public Playlist
                </Label>
              </div>
              <Switch
                id="is_public"
                checked={formData.is_public}
                onCheckedChange={(checked) => handleInputChange('is_public', checked)}
              />
            </div>
            
            <p className="text-sm text-muted-foreground">
              {formData.is_public 
                ? "Anyone can discover and view this playlist"
                : "Only you can access this playlist"
              }
            </p>
          </div>

          {/* Free User Upgrade Prompt */}
          {!isWeb3Mode && (
            <div className="p-3 rounded-lg border border-aurora/20 bg-aurora/5">
              <div className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-aurora mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-aurora">Upgrade to Web3</p>
                  <p className="text-muted-foreground">
                    Connect your wallet to save playlists permanently on the blockchain
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 aurora-gradient"
              disabled={loading || !formData.name.trim()}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-background/20 border-t-background rounded-full animate-spin" />
                  {mode === 'create' ? 'Creating...' : 'Saving...'}
                </div>
              ) : (
                <>
                  {mode === 'create' ? (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Playlist
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};