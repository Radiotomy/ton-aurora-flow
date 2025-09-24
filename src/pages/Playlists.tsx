import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlaylistCard } from '@/components/PlaylistCard';
import { PlaylistModal } from '@/components/PlaylistModal';
import { usePlaylist, LocalPlaylist, StoredPlaylist } from '@/hooks/usePlaylist';
import { useWeb3 } from '@/hooks/useWeb3';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { AudiusService } from '@/services/audiusService';
import { 
  Plus, 
  Search, 
  Filter,
  Music,
  Sparkles,
  Globe,
  Users,
  Clock
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const Playlists = () => {
  const { isConnected } = useWeb3();
  const { 
    playlists, 
    loading, 
    createPlaylist, 
    deletePlaylist, 
    getPublicPlaylists,
    migrateToWeb3 
  } = usePlaylist();
  
  const { playTrack } = useAudioPlayer();
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState<LocalPlaylist | StoredPlaylist | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('my-playlists');
  const [publicPlaylists, setPublicPlaylists] = useState<(LocalPlaylist | StoredPlaylist)[]>([]);
  const [loadingPublic, setLoadingPublic] = useState(false);

  // Load public playlists when tab changes
  useEffect(() => {
    if (activeTab === 'discover') {
      loadPublicPlaylists();
    }
  }, [activeTab]);

  const loadPublicPlaylists = async () => {
    setLoadingPublic(true);
    try {
      const publicList = await getPublicPlaylists();
      setPublicPlaylists(publicList);
    } catch (error) {
      console.error('Error loading public playlists:', error);
    } finally {
      setLoadingPublic(false);
    }
  };

  // Filter playlists based on search query
  const filterPlaylists = (playlists: (LocalPlaylist | StoredPlaylist)[]) => {
    if (!searchQuery) return playlists;
    
    return playlists.filter(playlist => {
      const playlistData = 'metadata' in playlist ? playlist.metadata : playlist;
      return (
        playlistData.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        playlistData.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  };

  const myPlaylists = filterPlaylists(playlists);
  const discoveryPlaylists = filterPlaylists(publicPlaylists);

  const handlePlayPlaylist = async (playlist: LocalPlaylist | StoredPlaylist) => {
    const playlistData = 'metadata' in playlist ? playlist.metadata : playlist;
    
    if (playlistData.tracks.length === 0) {
      toast({
        title: "Empty Playlist",
        description: "This playlist doesn't have any tracks yet",
        variant: "destructive",
      });
      return;
    }

    // Play the first track and queue the rest
    const firstTrack = playlistData.tracks[0];
    const trackProps = AudiusService.convertToTrackCardProps(firstTrack);
    
    // Convert duration from string to number for the player
    const trackForPlayer = {
      ...trackProps,
      duration: firstTrack.duration, // Use original number duration
    };
    
    playTrack(trackForPlayer);
    
    toast({
      title: "Playing Playlist",
      description: `Started playing "${playlistData.name}"`,
    });
  };

  const handleEditPlaylist = (playlist: LocalPlaylist | StoredPlaylist) => {
    setEditingPlaylist(playlist);
  };

  const handleDeletePlaylist = async (playlist: LocalPlaylist | StoredPlaylist) => {
    const playlistData = 'metadata' in playlist ? playlist.metadata : playlist;
    
    if (window.confirm(`Are you sure you want to delete "${playlistData.name}"?`)) {
      const success = await deletePlaylist(playlist.id);
      if (success && activeTab === 'discover') {
        // Refresh public playlists if we're on discover tab
        loadPublicPlaylists();
      }
    }
  };

  const handleMigratePlaylist = async (playlist: LocalPlaylist | StoredPlaylist) => {
    if (!isConnected) {
      toast({
        title: "Wallet Required",
        description: "Connect your wallet to migrate playlists to blockchain",
        variant: "destructive",
      });
      return;
    }

    await migrateToWeb3(playlist.id);
  };

  const getStats = () => {
    const totalPlaylists = playlists.length;
    const web3Playlists = playlists.filter(p => 'metadata' in p).length;
    const localPlaylists = totalPlaylists - web3Playlists;
    const totalTracks = playlists.reduce((sum, playlist) => {
      const playlistData = 'metadata' in playlist ? playlist.metadata : playlist;
      return sum + playlistData.tracks.length;
    }, 0);

    return { totalPlaylists, web3Playlists, localPlaylists, totalTracks };
  };

  const stats = getStats();

  return (
    <div className="min-h-screen bg-background pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Music className="w-8 h-8 text-aurora" />
              My Playlists
            </h1>
            <p className="text-muted-foreground mt-2">
              Create, organize, and share your music collections
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="aurora-gradient"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Playlist
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="p-4 rounded-lg glass-panel">
            <div className="flex items-center gap-2">
              <Music className="w-5 h-5 text-aurora" />
              <div>
                <p className="text-2xl font-bold">{stats.totalPlaylists}</p>
                <p className="text-sm text-muted-foreground">Total Playlists</p>
              </div>
            </div>
          </div>
          
          <div className="p-4 rounded-lg glass-panel">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-aurora" />
              <div>
                <p className="text-2xl font-bold">{stats.web3Playlists}</p>
                <p className="text-sm text-muted-foreground">Web3 Playlists</p>
              </div>
            </div>
          </div>
          
          <div className="p-4 rounded-lg glass-panel">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{stats.localPlaylists}</p>
                <p className="text-sm text-muted-foreground">Local Playlists</p>
              </div>
            </div>
          </div>
          
          <div className="p-4 rounded-lg glass-panel">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats.totalTracks}</p>
                <p className="text-sm text-muted-foreground">Total Tracks</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search playlists..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 focus:ring-aurora focus:border-aurora"
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="my-playlists" className="flex items-center gap-2">
              <Music className="w-4 h-4" />
              My Playlists
            </TabsTrigger>
            <TabsTrigger value="discover" className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Discover
            </TabsTrigger>
          </TabsList>

          {/* My Playlists Tab */}
          <TabsContent value="my-playlists" className="space-y-6">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="aspect-square bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : myPlaylists.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {myPlaylists.map((playlist) => (
                  <PlaylistCard
                    key={playlist.id}
                    playlist={playlist}
                    onPlay={() => handlePlayPlaylist(playlist)}
                    onEdit={() => handleEditPlaylist(playlist)}
                    onDelete={() => handleDeletePlaylist(playlist)}
                    onMigrate={!('metadata' in playlist) ? () => handleMigratePlaylist(playlist) : undefined}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Music className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Playlists Yet</h3>
                <p className="text-muted-foreground mb-6">
                  Create your first playlist to organize your favorite tracks
                </p>
                <Button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="aurora-gradient"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Playlist
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Discover Tab */}
          <TabsContent value="discover" className="space-y-6">
            {loadingPublic ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="aspect-square bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : discoveryPlaylists.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {discoveryPlaylists.map((playlist) => (
                  <PlaylistCard
                    key={playlist.id}
                    playlist={playlist}
                    onPlay={() => handlePlayPlaylist(playlist)}
                    // Only show edit/delete for own playlists
                    onEdit={undefined}
                    onDelete={undefined}
                    onMigrate={undefined}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Globe className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Public Playlists</h3>
                <p className="text-muted-foreground">
                  Be the first to create a public playlist for others to discover
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Playlist Modal */}
      <PlaylistModal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        mode="create"
      />

      {/* Edit Playlist Modal */}
      {editingPlaylist && (
        <PlaylistModal
          open={!!editingPlaylist}
          onClose={() => setEditingPlaylist(null)}
          mode="edit"
          existingPlaylist={{
            id: editingPlaylist.id,
            name: 'metadata' in editingPlaylist ? editingPlaylist.metadata.name : editingPlaylist.name,
            description: 'metadata' in editingPlaylist ? editingPlaylist.metadata.description : editingPlaylist.description,
            cover_url: 'metadata' in editingPlaylist ? editingPlaylist.metadata.cover_url : editingPlaylist.cover_url,
            is_public: 'metadata' in editingPlaylist ? editingPlaylist.metadata.is_public : editingPlaylist.is_public,
          }}
        />
      )}
    </div>
  );
};

export default Playlists;