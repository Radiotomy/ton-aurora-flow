// Calendar Export Utility - Generate .ics files for event reminders

export interface CalendarEvent {
  title: string;
  description?: string;
  location?: string;
  startTime: Date;
  endTime?: Date;
  url?: string;
  organizer?: string;
}

/**
 * Formats a date to iCalendar format (YYYYMMDDTHHmmssZ)
 */
const formatDateToICS = (date: Date): string => {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
};

/**
 * Escapes special characters in iCalendar text fields
 */
const escapeICSText = (text: string): string => {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
};

/**
 * Generates a unique identifier for the calendar event
 */
const generateUID = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}@audioton.app`;
};

/**
 * Generates an iCalendar (.ics) file content for an event
 */
export const generateICSContent = (event: CalendarEvent): string => {
  const uid = generateUID();
  const now = new Date();
  const startTime = formatDateToICS(event.startTime);
  const endTime = event.endTime 
    ? formatDateToICS(event.endTime) 
    : formatDateToICS(new Date(event.startTime.getTime() + 2 * 60 * 60 * 1000)); // Default 2 hour duration
  
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//AudioTon//Live Events//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${formatDateToICS(now)}`,
    `DTSTART:${startTime}`,
    `DTEND:${endTime}`,
    `SUMMARY:${escapeICSText(event.title)}`,
  ];

  if (event.description) {
    lines.push(`DESCRIPTION:${escapeICSText(event.description)}`);
  }

  if (event.location) {
    lines.push(`LOCATION:${escapeICSText(event.location)}`);
  }

  if (event.url) {
    lines.push(`URL:${event.url}`);
  }

  if (event.organizer) {
    lines.push(`ORGANIZER;CN=${escapeICSText(event.organizer)}:mailto:noreply@audioton.app`);
  }

  // Add reminders: 30 minutes and 5 minutes before
  lines.push(
    'BEGIN:VALARM',
    'TRIGGER:-PT30M',
    'ACTION:DISPLAY',
    'DESCRIPTION:Event starts in 30 minutes!',
    'END:VALARM',
    'BEGIN:VALARM',
    'TRIGGER:-PT5M',
    'ACTION:DISPLAY',
    'DESCRIPTION:Event starts in 5 minutes!',
    'END:VALARM'
  );

  lines.push('END:VEVENT', 'END:VCALENDAR');

  return lines.join('\r\n');
};

/**
 * Downloads an .ics file for the given event
 */
export const downloadICSFile = (event: CalendarEvent, filename?: string): void => {
  const icsContent = generateICSContent(event);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `${event.title.replace(/[^a-z0-9]/gi, '-')}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};

/**
 * Generates a Google Calendar URL for the event
 */
export const generateGoogleCalendarURL = (event: CalendarEvent): string => {
  const formatGoogleDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  };

  const startTime = formatGoogleDate(event.startTime);
  const endTime = event.endTime 
    ? formatGoogleDate(event.endTime) 
    : formatGoogleDate(new Date(event.startTime.getTime() + 2 * 60 * 60 * 1000));

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${startTime}/${endTime}`,
    details: event.description || '',
    location: event.location || '',
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

/**
 * Generates an Outlook Calendar URL for the event
 */
export const generateOutlookCalendarURL = (event: CalendarEvent): string => {
  const startTime = event.startTime.toISOString();
  const endTime = event.endTime?.toISOString() || 
    new Date(event.startTime.getTime() + 2 * 60 * 60 * 1000).toISOString();

  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: event.title,
    startdt: startTime,
    enddt: endTime,
    body: event.description || '',
    location: event.location || '',
  });

  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
};
