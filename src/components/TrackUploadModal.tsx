import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Upload, Music, Image, X, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AudiusSDKService } from '@/services/audiusSDK';
import { AudioTokenService } from '@/services/audioTokenService';

interface TrackUploadData {
  title: string;
  description?: string;
  genre: string;
  mood?: string;
  tags?: string[];
  audio: File;
  artwork?: File;
  is_unlisted?: boolean;
  field_visibility?: {
    genre: boolean;
    mood: boolean;
    tags: boolean;
    share: boolean;
    play_count: boolean;
  };
}

interface TrackUploadModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (trackId: string) => void;
}

export const TrackUploadModal = ({ open, onClose, onSuccess }: TrackUploadModalProps) => {
  const [formData, setFormData] = useState<Partial<TrackUploadData>>({
    title: '',
    description: '',
    genre: '',
    mood: '',
    tags: [],
    is_unlisted: false,
    field_visibility: {
      genre: true,
      mood: true,
      tags: true,
      share: true,
      play_count: true,
    }
  });
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [artworkFile, setArtworkFile] = useState<File | null>(null);
  const [tagInput, setTagInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();

  const genres = [
    { id: 'Electronic', label: 'Electronic' },
    { id: 'Rock', label: 'Rock' },
    { id: 'Metal', label: 'Metal' },
    { id: 'Alternative', label: 'Alternative' },
    { id: 'Hip-Hop/Rap', label: 'Hip-Hop/Rap' },
    { id: 'Experimental', label: 'Experimental' },
    { id: 'Punk', label: 'Punk' },
    { id: 'Folk', label: 'Folk' },
    { id: 'Pop', label: 'Pop' },
    { id: 'Ambient', label: 'Ambient' },
    { id: 'Soundtrack', label: 'Soundtrack' },
    { id: 'World', label: 'World' },
    { id: 'Jazz', label: 'Jazz' },
    { id: 'Acoustic', label: 'Acoustic' },
    { id: 'Funk', label: 'Funk' },
    { id: 'R&B/Soul', label: 'R&B/Soul' },
    { id: 'Devotional', label: 'Devotional' },
    { id: 'Classical', label: 'Classical' },
    { id: 'Reggae', label: 'Reggae' },
    { id: 'Podcast', label: 'Podcast' },
    { id: 'Country', label: 'Country' },
    { id: 'Spoken Word', label: 'Spoken Word' }
  ];
  const moods = [
    'Peaceful', 'Romantic', 'Sentimental', 'Tender', 'Easygoing', 'Yearning',
    'Sophisticated', 'Sensual', 'Cool', 'Gritty', 'Melancholy', 'Serious',
    'Brooding', 'Fiery', 'Defiant', 'Aggressive', 'Rowdy', 'Excited',
    'Energizing', 'Empowering', 'Cool', 'Upbeat', 'Festive'
  ];

  const handleInputChange = (field: keyof TrackUploadData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleVisibilityChange = (field: keyof NonNullable<TrackUploadData['field_visibility']>, visible: boolean) => {
    setFormData(prev => ({
      ...prev,
      field_visibility: {
        ...prev.field_visibility,
        [field]: visible
      }
    }));
  };

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>, type: 'audio' | 'artwork') => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (type === 'audio') {
      // Validate audio file
      const validAudioTypes = ['audio/mpeg', 'audio/wav', 'audio/flac', 'audio/aac', 'audio/ogg'];
      if (!validAudioTypes.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: "Please upload a valid audio file (MP3, WAV, FLAC, AAC, OGG)",
          variant: "destructive",
        });
        return;
      }
      if (file.size > 100 * 1024 * 1024) { // 100MB limit
        toast({
          title: "File Too Large",
          description: "Audio file must be less than 100MB",
          variant: "destructive",
        });
        return;
      }
      setAudioFile(file);
    } else {
      // Validate artwork file
      const validImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!validImageTypes.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: "Please upload a valid image file (JPEG, PNG, WebP)",
          variant: "destructive",
        });
        return;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          title: "File Too Large",
          description: "Artwork file must be less than 10MB",
          variant: "destructive",
        });
        return;
      }
      setArtworkFile(file);
    }
  }, [toast]);

  const addTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || []
    }));
  };

  const handleSubmit = async () => {
    if (!formData.title?.trim()) {
      toast({
        title: "Missing Title",
        description: "Please enter a track title",
        variant: "destructive",
      });
      return;
    }

    if (!audioFile) {
      toast({
        title: "Missing Audio File",
        description: "Please upload an audio file",
        variant: "destructive",
      });
      return;
    }

    if (!formData.genre) {
      toast({
        title: "Missing Genre",
        description: "Please select a genre",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    setUploadProgress(10);

    try {
      const result = await AudiusSDKService.uploadTrack({
        title: formData.title!,
        description: formData.description,
        genre: formData.genre!,
        mood: formData.mood,
        tags: formData.tags?.join(','),
        trackFile: audioFile,
        coverArtFile: artworkFile || undefined,
      });
      
      setUploadProgress(90);

      toast({
        title: "Upload Successful",
        description: "Your track has been uploaded to Audius successfully!",
      });

      setUploadProgress(100);
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        genre: '',
        mood: '',
        tags: [],
        is_unlisted: false,
        field_visibility: {
          genre: true,
          mood: true,
          tags: true,
          share: true,
          play_count: true,
        }
      });
      setAudioFile(null);
      setArtworkFile(null);

      onSuccess?.(result.trackId);
      onClose();
    } catch (error) {
      console.error('Upload failed:', error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload track",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Music className="h-5 w-5" />
            Upload Track to Audius
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Track Title *</Label>
              <Input
                id="title"
                value={formData.title || ''}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Enter track title"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe your track..."
                rows={3}
              />
            </div>
          </div>

          {/* File Uploads */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Audio File *</Label>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4">
                {audioFile ? (
                  <div className="flex items-center gap-2">
                    <Music className="h-4 w-4 text-primary" />
                    <span className="text-sm truncate">{audioFile.name}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setAudioFile(null)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <div className="flex flex-col items-center gap-2 text-center">
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Click to upload audio
                      </span>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="audio/*"
                      onChange={(e) => handleFileUpload(e, 'audio')}
                    />
                  </label>
                )}
              </div>
            </div>

            <div>
              <Label>Artwork</Label>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4">
                {artworkFile ? (
                  <div className="flex items-center gap-2">
                    <Image className="h-4 w-4 text-primary" />
                    <span className="text-sm truncate">{artworkFile.name}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setArtworkFile(null)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <div className="flex flex-col items-center gap-2 text-center">
                      <Image className="h-8 w-8 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Click to upload image
                      </span>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'artwork')}
                    />
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Genre *</Label>
              <Select value={formData.genre || ''} onValueChange={(value) => handleInputChange('genre', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select genre" />
                </SelectTrigger>
                <SelectContent>
                  {genres.map(genre => (
                    <SelectItem key={genre.id} value={genre.id}>
                      {genre.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Mood</Label>
              <Select value={formData.mood || ''} onValueChange={(value) => handleInputChange('mood', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select mood" />
                </SelectTrigger>
                <SelectContent>
                  {moods.map(mood => (
                    <SelectItem key={mood} value={mood}>
                      {mood}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tags */}
          <div>
            <Label>Tags</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Add a tag"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <Button onClick={addTag} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {formData.tags && formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <button onClick={() => removeTag(tag)}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Privacy & Visibility */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="unlisted"
                checked={formData.is_unlisted || false}
                onCheckedChange={(checked) => handleInputChange('is_unlisted', checked)}
              />
              <Label htmlFor="unlisted">Make track unlisted (not shown in public feeds)</Label>
            </div>

            <div>
              <Label>Field Visibility</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {Object.entries(formData.field_visibility || {}).map(([field, visible]) => (
                  <div key={field} className="flex items-center space-x-2">
                    <Switch
                      checked={visible}
                      onCheckedChange={(checked) => handleVisibilityChange(field as any, checked)}
                    />
                    <Label className="capitalize">{field.replace('_', ' ')}</Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Upload Progress */}
          {uploading && (
            <div className="space-y-2">
              <Label>Upload Progress</Label>
              <Progress value={uploadProgress} className="w-full" />
              <p className="text-sm text-muted-foreground text-center">
                {uploadProgress < 30 ? 'Preparing upload...' : 
                 uploadProgress < 90 ? 'Uploading to Audius...' : 'Finalizing...'}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose} disabled={uploading}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={uploading}>
              {uploading ? 'Uploading...' : 'Upload Track'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};