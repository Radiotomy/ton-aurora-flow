import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface EventReminder {
  eventId: string;
  eventTitle: string;
  scheduledStart: Date;
  reminderTimes: number[]; // Minutes before event
}

const NOTIFICATIONS_STORAGE_KEY = 'audioton_event_reminders';

export const usePushNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);
  const [scheduledReminders, setScheduledReminders] = useState<EventReminder[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    // Check if notifications are supported
    const supported = 'Notification' in window && 'serviceWorker' in navigator;
    setIsSupported(supported);

    if (supported) {
      setPermission(Notification.permission);
      loadScheduledReminders();
    }
  }, []);

  const loadScheduledReminders = () => {
    try {
      const stored = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      if (stored) {
        const reminders = JSON.parse(stored);
        // Filter out past events
        const now = new Date();
        const activeReminders = reminders.filter(
          (r: EventReminder) => new Date(r.scheduledStart) > now
        );
        setScheduledReminders(activeReminders);
        localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(activeReminders));
      }
    } catch (error) {
      console.error('Error loading reminders:', error);
    }
  };

  const requestPermission = async (): Promise<boolean> => {
    if (!isSupported) {
      toast({
        title: "Notifications Not Supported",
        description: "Your browser doesn't support push notifications.",
        variant: "destructive"
      });
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === 'granted') {
        toast({
          title: "Notifications Enabled",
          description: "You'll receive reminders for upcoming events!"
        });
        return true;
      } else {
        toast({
          title: "Notifications Blocked",
          description: "Enable notifications in your browser settings to receive event reminders.",
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };

  const scheduleEventReminder = useCallback(async (
    eventId: string,
    eventTitle: string,
    scheduledStart: Date,
    reminderMinutes: number[] = [30, 5] // Default: 30 min and 5 min before
  ) => {
    if (permission !== 'granted') {
      const granted = await requestPermission();
      if (!granted) return false;
    }

    const reminder: EventReminder = {
      eventId,
      eventTitle,
      scheduledStart,
      reminderTimes: reminderMinutes
    };

    // Schedule notifications using setTimeout (for immediate session)
    // In a full implementation, this would use a service worker for background notifications
    const now = new Date();
    const eventTime = new Date(scheduledStart).getTime();

    reminderMinutes.forEach(minutes => {
      const reminderTime = eventTime - (minutes * 60 * 1000);
      const delay = reminderTime - now.getTime();

      if (delay > 0) {
        setTimeout(() => {
          showNotification(eventTitle, minutes);
        }, delay);
      }
    });

    // Store reminder for persistence
    const updatedReminders = [...scheduledReminders.filter(r => r.eventId !== eventId), reminder];
    setScheduledReminders(updatedReminders);
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updatedReminders));

    toast({
      title: "Reminder Set!",
      description: `You'll be notified 30 min and 5 min before "${eventTitle}"`
    });

    return true;
  }, [permission, scheduledReminders, toast]);

  const cancelEventReminder = useCallback((eventId: string) => {
    const updatedReminders = scheduledReminders.filter(r => r.eventId !== eventId);
    setScheduledReminders(updatedReminders);
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updatedReminders));

    toast({
      title: "Reminder Cancelled",
      description: "Event reminder has been removed."
    });
  }, [scheduledReminders, toast]);

  const hasReminderForEvent = useCallback((eventId: string): boolean => {
    return scheduledReminders.some(r => r.eventId === eventId);
  }, [scheduledReminders]);

  const showNotification = (eventTitle: string, minutesBefore: number) => {
    if (permission !== 'granted') return;

    const title = minutesBefore <= 5 
      ? `🔴 Starting Soon: ${eventTitle}`
      : `⏰ Reminder: ${eventTitle}`;
    
    const body = minutesBefore <= 5
      ? `The event starts in ${minutesBefore} minutes! Tap to join.`
      : `The event starts in ${minutesBefore} minutes. Get ready!`;

    try {
      const notification = new Notification(title, {
        body,
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        tag: `event-reminder-${Date.now()}`,
        requireInteraction: minutesBefore <= 5
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  };

  // Test notification
  const sendTestNotification = () => {
    if (permission === 'granted') {
      showNotification('Test Event', 5);
    } else {
      requestPermission();
    }
  };

  return {
    permission,
    isSupported,
    scheduledReminders,
    requestPermission,
    scheduleEventReminder,
    cancelEventReminder,
    hasReminderForEvent,
    sendTestNotification
  };
};

export default usePushNotifications;
