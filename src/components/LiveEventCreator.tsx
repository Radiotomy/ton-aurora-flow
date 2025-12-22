import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import LiveStreamService, { type LiveEvent } from '@/services/liveStreamService';
import { supabase } from '@/integrations/supabase/client';
import { pinataService } from '@/services/pinataService';
import { Calendar, Clock, DollarSign, Users, Plus, Image, Upload, X, Cloud } from 'lucide-react';

interface LiveEventCreatorProps {
  onEventCreated?: (event: LiveEvent) => void;
}

export const LiveEventCreator: React.FC<LiveEventCreatorProps> = ({ onEventCreated }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    scheduled_start: '',
    scheduled_end: '',
    ticket_price_ton: 0,
    max_attendees: null as number | null,
    requires_ticket: false
  });

  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();

  const handleThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid File",
          description: "Please select an image file",
          variant: "destructive"
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please select an image under 5MB",
          variant: "destructive"
        });
        return;
      }

      setThumbnailFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeThumbnail = () => {
    setThumbnailFile(null);
    setThumbnailPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadThumbnail = async (eventId: string, artistId: string): Promise<{ url: string; ipfsCid?: string } | null> => {
    if (!thumbnailFile) return null;

    setUploadingThumbnail(true);
    try {
      // Upload to IPFS via Pinata (Phase 1)
      const ipfsResult = await pinataService.uploadEventThumbnail(
        thumbnailFile,
        eventId,
        artistId
      );

      if (ipfsResult.success && ipfsResult.gatewayUrl) {
        console.log('[LiveEventCreator] Thumbnail uploaded to IPFS:', ipfsResult.cid);
        return {
          url: ipfsResult.gatewayUrl,
          ipfsCid: ipfsResult.cid
        };
      }

      // Fallback to Supabase storage if IPFS fails
      console.warn('[LiveEventCreator] IPFS upload failed, falling back to Supabase storage');
      const fileExt = thumbnailFile.name.split('.').pop();
      const fileName = `${eventId}/${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('event-thumbnails')
        .upload(fileName, thumbnailFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('event-thumbnails')
        .getPublicUrl(data.path);

      return { url: publicUrl };
    } catch (error) {
      console.error('Error uploading thumbnail:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload thumbnail. Event created without image.",
        variant: "destructive"
      });
      return null;
    } finally {
      setUploadingThumbnail(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated || !user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to create events",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, display_name')
        .eq('auth_user_id', user.id)
        .single();

      if (!profile) {
        throw new Error('User profile not found');
      }

      // Create the event first (without thumbnail)
      const eventData: Partial<LiveEvent> = {
        title: formData.title,
        description: formData.description,
        artist_name: profile.display_name || 'Anonymous Artist',
        artist_id: profile.id,
        creator_profile_id: profile.id,
        scheduled_start: new Date(formData.scheduled_start).toISOString(),
        scheduled_end: formData.scheduled_end ? new Date(formData.scheduled_end).toISOString() : undefined,
        status: 'upcoming',
        ticket_price_ton: formData.ticket_price_ton,
        max_attendees: formData.max_attendees || undefined,
        current_attendees: 0,
        requires_ticket: formData.requires_ticket
      };

      const createdEvent = await LiveStreamService.createEvent(eventData);

      // Upload thumbnail if provided (to IPFS via Pinata)
      let thumbnailUrl: string | null = null;
      let thumbnailIpfsCid: string | undefined;
      if (thumbnailFile && createdEvent.id) {
        const uploadResult = await uploadThumbnail(createdEvent.id, profile.id);
        
        if (uploadResult) {
          thumbnailUrl = uploadResult.url;
          thumbnailIpfsCid = uploadResult.ipfsCid;
          
          // Update event with thumbnail URL and IPFS CID
          await supabase
            .from('live_events')
            .update({ 
              thumbnail_url: thumbnailUrl,
              thumbnail_ipfs_cid: thumbnailIpfsCid,
              storage_type: thumbnailIpfsCid ? 'ipfs' : 'supabase'
            })
            .eq('id', createdEvent.id);
        }
      }
      
      // Transform to match frontend interface
      const newEvent: LiveEvent = {
        ...createdEvent,
        artist_name: eventData.artist_name || 'Unknown Artist',
        status: createdEvent.status as 'upcoming' | 'live' | 'ended',
        thumbnail_url: thumbnailUrl || undefined
      };
      
      toast({
        title: "Event Created! 🎉",
        description: `${formData.title} has been scheduled successfully`
      });

      // Reset form
      setFormData({
        title: '',
        description: '',
        scheduled_start: '',
        scheduled_end: '',
        ticket_price_ton: 0,
        max_attendees: null,
        requires_ticket: false
      });
      removeThumbnail();

      setIsOpen(false);
      onEventCreated?.(newEvent);

    } catch (error) {
      console.error('Error creating event:', error);
      toast({
        title: "Creation Failed",
        description: "Failed to create event. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getTomorrowDateTime = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(20, 0, 0, 0); // Default to 8 PM tomorrow
    return tomorrow.toISOString().slice(0, 16); // Format for datetime-local input
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Live Event
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-aurora" />
            Create Live Event
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Event Title *</Label>
                <Input
                  id="title"
                  placeholder="Acoustic Sessions Live"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Tell your fans what to expect..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="scheduled_start">Start Time *</Label>
                <Input
                  id="scheduled_start"
                  type="datetime-local"
                  value={formData.scheduled_start}
                  onChange={(e) => setFormData(prev => ({ ...prev, scheduled_start: e.target.value }))}
                  min={new Date().toISOString().slice(0, 16)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="scheduled_end">End Time (Optional)</Label>
                <Input
                  id="scheduled_end"
                  type="datetime-local"
                  value={formData.scheduled_end}
                  onChange={(e) => setFormData(prev => ({ ...prev, scheduled_end: e.target.value }))}
                  min={formData.scheduled_start}
                />
              </div>
            </div>

            {/* Event Settings */}
            <div className="space-y-4">
              {/* Thumbnail Upload */}
              <Card className="glass-card">
                <CardContent className="p-4 space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <Image className="h-4 w-4" />
                    Event Thumbnail
                  </h4>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailSelect}
                    className="hidden"
                  />

                  {thumbnailPreview ? (
                    <div className="relative rounded-lg overflow-hidden">
                      <img 
                        src={thumbnailPreview} 
                        alt="Thumbnail preview" 
                        className="w-full h-32 object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={removeThumbnail}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-32 flex flex-col items-center justify-center gap-2 border-dashed"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Click to upload thumbnail
                      </span>
                    </Button>
                  )}
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardContent className="p-4 space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Audience Settings
                  </h4>

                  <div>
                    <Label htmlFor="max_attendees">Max Attendees (Optional)</Label>
                    <Input
                      id="max_attendees"
                      type="number"
                      placeholder="Leave blank for unlimited"
                      value={formData.max_attendees || ''}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        max_attendees: e.target.value ? parseInt(e.target.value) : null 
                      }))}
                      min="1"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="requires_ticket">Require Tickets</Label>
                      <p className="text-sm text-muted-foreground">
                        Make this a ticketed event
                      </p>
                    </div>
                    <Switch
                      id="requires_ticket"
                      checked={formData.requires_ticket}
                      onCheckedChange={(checked) => setFormData(prev => ({ 
                        ...prev, 
                        requires_ticket: checked 
                      }))}
                    />
                  </div>

                  {formData.requires_ticket && (
                    <div>
                      <Label htmlFor="ticket_price_ton" className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Ticket Price (TON)
                      </Label>
                      <Input
                        id="ticket_price_ton"
                        type="number"
                        step="0.1"
                        min="0"
                        placeholder="5.0"
                        value={formData.ticket_price_ton}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          ticket_price_ton: parseFloat(e.target.value) || 0 
                        }))}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardContent className="p-4">
                  <h4 className="font-medium mb-2">Quick Setup</h4>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      scheduled_start: getTomorrowDateTime()
                    }))}
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Tomorrow 8PM
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            
            <Button 
              type="submit" 
              disabled={loading || uploadingThumbnail || !formData.title || !formData.scheduled_start}
            >
              {loading || uploadingThumbnail ? 'Creating...' : 'Create Event'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
