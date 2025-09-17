import React, { useState } from 'react';
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
import { Calendar, Clock, DollarSign, Users, Plus } from 'lucide-react';

interface LiveEventCreatorProps {
  onEventCreated?: (event: LiveEvent) => void;
}

export const LiveEventCreator: React.FC<LiveEventCreatorProps> = ({ onEventCreated }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
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

      // Create the event
      const eventData: Partial<LiveEvent> = {
        title: formData.title,
        description: formData.description,
        artist_name: profile.display_name || 'Anonymous Artist',
        artist_id: profile.id,
        scheduled_start: new Date(formData.scheduled_start).toISOString(),
        scheduled_end: formData.scheduled_end ? new Date(formData.scheduled_end).toISOString() : undefined,
        status: 'upcoming',
        ticket_price_ton: formData.ticket_price_ton,
        max_attendees: formData.max_attendees || undefined,
        current_attendees: 0,
        requires_ticket: formData.requires_ticket
      };

      const createdEvent = await LiveStreamService.createEvent(eventData);
      
      // Transform to match frontend interface
      const newEvent: LiveEvent = {
        ...createdEvent,
        artist_name: createdEvent.artist_name || eventData.artist_name || 'Unknown Artist'
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
      
      <DialogContent className="max-w-2xl">
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
              disabled={loading || !formData.title || !formData.scheduled_start}
            >
              {loading ? 'Creating...' : 'Create Event'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};