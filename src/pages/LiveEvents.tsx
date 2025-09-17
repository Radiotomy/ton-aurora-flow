import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LiveEventCard } from '@/components/LiveEventCard';
import { CommunityChat } from '@/components/CommunityChat';
import { CommunityPolls } from '@/components/CommunityPolls';
import { LiveEventCreator } from '@/components/LiveEventCreator';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { 
  Calendar, 
  Users, 
  PlayCircle, 
  Star,
  MessageCircle,
  Vote,
  Clock,
  TrendingUp
} from 'lucide-react';

interface LiveEvent {
  id: string;
  title: string;
  artist_name: string;
  artist_id: string;
  description: string;
  scheduled_start: string;
  status: 'upcoming' | 'live' | 'ended';
  thumbnail_url?: string;
  ticket_price_ton: number;
  max_attendees?: number;
  current_attendees: number;
  created_at: string;
}

const LiveEvents = () => {
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('events');
  const { isAuthenticated } = useAuth();

  const handleEventCreated = (newEvent: LiveEvent) => {
    setEvents(prev => [...prev, newEvent]);
    loadEvents(); // Refresh the list
  };

  // Mock data for initial implementation
  const mockEvents: LiveEvent[] = [
    {
      id: '1',
      title: 'Acoustic Sessions Live',
      artist_name: 'Luna Echo',
      artist_id: 'artist_1',
      description: 'Intimate acoustic performance with exclusive tracks and Q&A',
      scheduled_start: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
      status: 'upcoming',
      thumbnail_url: '/api/placeholder/300/200',
      ticket_price_ton: 5,
      max_attendees: 100,
      current_attendees: 47,
      created_at: new Date().toISOString()
    },
    {
      id: '2',
      title: 'Electronic Beats Showcase',
      artist_name: 'Neon Pulse',
      artist_id: 'artist_2',
      description: 'Live electronic music with visual effects and fan interaction',
      scheduled_start: new Date().toISOString(), // Live now
      status: 'live',
      thumbnail_url: '/api/placeholder/300/200',
      ticket_price_ton: 8,
      max_attendees: 200,
      current_attendees: 156,
      created_at: new Date().toISOString()
    },
    {
      id: '3',
      title: 'Indie Rock Festival',
      artist_name: 'The Wavelengths',
      artist_id: 'artist_3',
      description: 'Multi-artist showcase featuring indie rock favorites',
      scheduled_start: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      status: 'upcoming',
      thumbnail_url: '/api/placeholder/300/200',
      ticket_price_ton: 12,
      max_attendees: 500,
      current_attendees: 234,
      created_at: new Date().toISOString()
    }
  ];

  useEffect(() => {
    loadEvents();
    
    // Set up real-time subscription for event updates
    const channel = supabase
      .channel('live-events-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'live_events' },
        () => loadEvents()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      
      // Fetch real events from database
      const { data: eventsData, error } = await supabase
        .from('live_events')
        .select('*')
        .order('scheduled_start', { ascending: true });
      
      if (error) {
        console.error('Database error:', error);
        // Fallback to mock data on error
        setEvents(mockEvents);
        return;
      }
      
      // Transform database events to match interface
      const transformedEvents: LiveEvent[] = eventsData?.map(event => ({
        id: event.id,
        title: event.title,
        artist_name: event.artist_id || 'Unknown Artist', // Use artist_id as display name for now
        artist_id: event.artist_id,
        description: event.description || '',
        scheduled_start: event.scheduled_start,
        status: event.status as 'upcoming' | 'live' | 'ended',
        thumbnail_url: event.thumbnail_url,
        ticket_price_ton: event.ticket_price_ton || 0,
        max_attendees: event.max_attendees,
        current_attendees: event.current_attendees || 0,
        created_at: event.created_at
      })) || [];
      
      // If no real events, show mock data for demo
      setEvents(transformedEvents.length > 0 ? transformedEvents : mockEvents);
      
    } catch (error) {
      console.error('Error loading events:', error);
      setEvents(mockEvents);
    } finally {
      setLoading(false);
    }
  };

  const liveEvents = events.filter(e => e.status === 'live');
  const upcomingEvents = events.filter(e => e.status === 'upcoming');
  const endedEvents = events.filter(e => e.status === 'ended');

  const stats = [
    {
      label: 'Live Events',
      value: liveEvents.length,
      icon: PlayCircle,
      className: 'text-green-400'
    },
    {
      label: 'Total Attendees',
      value: events.reduce((sum, e) => sum + e.current_attendees, 0).toLocaleString(),
      icon: Users,
      className: 'text-aurora'
    },
    {
      label: 'This Week',
      value: events.filter(e => {
        const eventDate = new Date(e.scheduled_start);
        const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        return eventDate <= weekFromNow && e.status !== 'ended';
      }).length,
      icon: Calendar,
      className: 'text-blue-400'
    },
    {
      label: 'Community Score',
      value: '9.2k',
      icon: TrendingUp,
      className: 'text-purple-400'
    }
  ];

  if (loading) {
    return (
      <main className="pt-16 min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-32 bg-muted rounded-lg" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-64 bg-muted rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="pt-16 min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-aurora/20">
                <PlayCircle className="h-6 w-6 text-aurora" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Live Events & Community</h1>
                <p className="text-muted-foreground">
                  Join live performances, chat with artists, and participate in the community
                </p>
              </div>
            </div>
            
            {isAuthenticated && (
              <LiveEventCreator onEventCreated={handleEventCreated} />
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {stats.map((stat, index) => (
              <Card key={index} className="glass-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="text-xl font-bold">{stat.value}</p>
                    </div>
                    <stat.icon className={`h-5 w-5 ${stat.className}`} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Live Events Alert */}
        {liveEvents.length > 0 && (
          <Card className="glass-card border-green-500/50 bg-green-500/10 mb-6">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="animate-pulse">
                  <div className="w-3 h-3 bg-green-400 rounded-full" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-green-400">
                    {liveEvents.length} Event{liveEvents.length > 1 ? 's' : ''} Live Now!
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Join {liveEvents.map(e => e.artist_name).join(', ')} for live performances
                  </p>
                </div>
                <Button size="sm" className="bg-green-500 hover:bg-green-600">
                  <PlayCircle className="h-4 w-4 mr-2" />
                  Watch Live
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="events" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Events
            </TabsTrigger>
            <TabsTrigger value="live" className="flex items-center gap-2">
              <PlayCircle className="h-4 w-4" />
              Live Now
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Community
            </TabsTrigger>
            <TabsTrigger value="polls" className="flex items-center gap-2">
              <Vote className="h-4 w-4" />
              Polls
            </TabsTrigger>
          </TabsList>

          <TabsContent value="events" className="space-y-6">
            {/* Upcoming Events */}
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-aurora" />
                Upcoming Events
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcomingEvents.map(event => (
                  <LiveEventCard key={event.id} event={event} />
                ))}
              </div>
            </div>

            {/* Past Events */}
            {endedEvents.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Past Events</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {endedEvents.map(event => (
                    <LiveEventCard key={event.id} event={event} />
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="live" className="space-y-6">
            {liveEvents.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {liveEvents.map(event => (
                  <LiveEventCard key={event.id} event={event} featured />
                ))}
              </div>
            ) : (
              <Card className="glass-card">
                <CardContent className="p-8 text-center">
                  <PlayCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Live Events</h3>
                  <p className="text-muted-foreground mb-4">
                    Check back later for live performances and community events
                  </p>
                  <Button variant="outline">
                    <Star className="h-4 w-4 mr-2" />
                    Follow Artists for Updates
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="chat">
            <CommunityChat />
          </TabsContent>

          <TabsContent value="polls">
            <CommunityPolls />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
};

export default LiveEvents;