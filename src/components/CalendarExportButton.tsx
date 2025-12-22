import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import {
  downloadICSFile,
  generateGoogleCalendarURL,
  generateOutlookCalendarURL,
  type CalendarEvent
} from '@/utils/calendarExport';
import { Calendar, Download, ExternalLink } from 'lucide-react';

interface CalendarExportButtonProps {
  event: {
    id: string;
    title: string;
    description?: string;
    artist_name: string;
    scheduled_start: string;
    scheduled_end?: string;
  };
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export const CalendarExportButton: React.FC<CalendarExportButtonProps> = ({
  event,
  variant = 'outline',
  size = 'sm',
  className = ''
}) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  const calendarEvent: CalendarEvent = {
    title: `🎵 ${event.title} - Live on AudioTon`,
    description: `${event.description || 'Live streaming event'}\n\nArtist: ${event.artist_name}\n\nJoin at: ${window.location.origin}/live-events`,
    startTime: new Date(event.scheduled_start),
    endTime: event.scheduled_end ? new Date(event.scheduled_end) : undefined,
    url: `${window.location.origin}/live-events?event=${event.id}`,
    organizer: event.artist_name,
    location: 'AudioTon - https://audioton.app'
  };

  const handleDownloadICS = () => {
    try {
      downloadICSFile(calendarEvent, `audioton-${event.title.replace(/[^a-z0-9]/gi, '-')}.ics`);
      toast({
        title: "Calendar File Downloaded",
        description: "Open the .ics file to add the event to your calendar."
      });
    } catch (error) {
      console.error('Error downloading ICS:', error);
      toast({
        title: "Download Failed",
        description: "Failed to generate calendar file.",
        variant: "destructive"
      });
    }
    setIsOpen(false);
  };

  const handleGoogleCalendar = () => {
    const url = generateGoogleCalendarURL(calendarEvent);
    window.open(url, '_blank');
    setIsOpen(false);
  };

  const handleOutlookCalendar = () => {
    const url = generateOutlookCalendarURL(calendarEvent);
    window.open(url, '_blank');
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <Calendar className="h-4 w-4 mr-1" />
          Add to Calendar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={handleDownloadICS}>
          <Download className="h-4 w-4 mr-2" />
          Download .ics File
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleGoogleCalendar}>
          <ExternalLink className="h-4 w-4 mr-2" />
          Google Calendar
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleOutlookCalendar}>
          <ExternalLink className="h-4 w-4 mr-2" />
          Outlook Calendar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default CalendarExportButton;
