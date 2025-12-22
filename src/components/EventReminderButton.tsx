import React from 'react';
import { Button } from '@/components/ui/button';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { Bell, BellOff, BellRing } from 'lucide-react';

interface EventReminderButtonProps {
  event: {
    id: string;
    title: string;
    scheduled_start: string;
  };
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  showLabel?: boolean;
}

export const EventReminderButton: React.FC<EventReminderButtonProps> = ({
  event,
  variant = 'outline',
  size = 'sm',
  className = '',
  showLabel = true
}) => {
  const { 
    permission, 
    isSupported, 
    scheduleEventReminder, 
    cancelEventReminder, 
    hasReminderForEvent 
  } = usePushNotifications();

  const hasReminder = hasReminderForEvent(event.id);
  const eventDate = new Date(event.scheduled_start);
  const isPastEvent = eventDate < new Date();

  if (!isSupported || isPastEvent) {
    return null;
  }

  const handleToggleReminder = async () => {
    if (hasReminder) {
      cancelEventReminder(event.id);
    } else {
      await scheduleEventReminder(event.id, event.title, eventDate, [30, 5]);
    }
  };

  const Icon = hasReminder ? BellRing : (permission === 'denied' ? BellOff : Bell);
  const label = hasReminder ? 'Reminder Set' : 'Set Reminder';

  return (
    <Button
      variant={hasReminder ? 'default' : variant}
      size={size}
      className={`${className} ${hasReminder ? 'bg-aurora hover:bg-aurora/90' : ''}`}
      onClick={handleToggleReminder}
      disabled={permission === 'denied'}
      title={permission === 'denied' ? 'Notifications are blocked. Enable in browser settings.' : label}
    >
      <Icon className={`h-4 w-4 ${showLabel ? 'mr-1' : ''}`} />
      {showLabel && label}
    </Button>
  );
};

export default EventReminderButton;
