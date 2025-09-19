-- Fix critical security issue: Chat messages should not be readable by all users
-- Users should only see messages from events they have tickets for, or public artist chats

-- Drop the overly permissive existing policy
DROP POLICY IF EXISTS "Authenticated users can view chat messages" ON public.chat_messages;

-- Create new secure policies for reading chat messages
CREATE POLICY "Users can view public artist chat messages" 
ON public.chat_messages 
FOR SELECT 
USING (
  -- Allow reading general artist chat messages (public community chats)
  event_id IS NULL
  AND is_deleted = false
);

CREATE POLICY "Users can view event chat messages if they have tickets" 
ON public.chat_messages 
FOR SELECT 
USING (
  -- Allow reading event-specific messages only if user has a ticket to that event
  event_id IS NOT NULL
  AND is_deleted = false
  AND EXISTS (
    SELECT 1 
    FROM public.event_tickets et
    JOIN public.profiles p ON p.id = et.profile_id
    WHERE et.event_id = chat_messages.event_id
    AND p.auth_user_id = auth.uid()
    AND et.is_valid = true
  )
);

CREATE POLICY "Users can view their own chat messages" 
ON public.chat_messages 
FOR SELECT 
USING (
  -- Users can always read their own messages
  profile_id IN (
    SELECT profiles.id
    FROM profiles
    WHERE profiles.auth_user_id = auth.uid()
  )
);