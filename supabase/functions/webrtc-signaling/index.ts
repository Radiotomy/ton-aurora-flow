import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SignalingMessage {
  type: 'offer' | 'answer' | 'ice-candidate' | 'join' | 'leave';
  eventId: string;
  senderId: string;
  targetId?: string;
  payload: any;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { type, eventId, senderId, targetId, payload } = await req.json() as SignalingMessage;

    console.log(`[WebRTC Signaling] ${type} from ${senderId} for event ${eventId}`);

    switch (type) {
      case 'offer': {
        // Store the offer in realtime channel for viewers to pick up
        const channel = supabase.channel(`webrtc-${eventId}`);
        
        await channel.send({
          type: 'broadcast',
          event: 'offer',
          payload: {
            senderId,
            sdp: payload.sdp,
            timestamp: new Date().toISOString()
          }
        });

        // Also store in database for late joiners
        const { error } = await supabase
          .from('stream_sessions')
          .update({ 
            peer_id: payload.sdp?.substring(0, 100), // Store SDP signature for reference
          })
          .eq('event_id', eventId)
          .eq('profile_id', senderId);

        if (error) {
          console.warn('Could not update stream session:', error);
        }

        return new Response(
          JSON.stringify({ success: true, message: 'Offer broadcasted' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'answer': {
        // Send answer back to the streamer
        const channel = supabase.channel(`webrtc-${eventId}`);
        
        await channel.send({
          type: 'broadcast',
          event: 'answer',
          payload: {
            senderId,
            targetId,
            sdp: payload.sdp,
            timestamp: new Date().toISOString()
          }
        });

        return new Response(
          JSON.stringify({ success: true, message: 'Answer sent' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'ice-candidate': {
        // Broadcast ICE candidate to target peer
        const channel = supabase.channel(`webrtc-${eventId}`);
        
        await channel.send({
          type: 'broadcast',
          event: 'ice-candidate',
          payload: {
            senderId,
            targetId,
            candidate: payload.candidate,
            timestamp: new Date().toISOString()
          }
        });

        return new Response(
          JSON.stringify({ success: true, message: 'ICE candidate sent' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'join': {
        // Create stream session for this viewer
        const { error } = await supabase
          .from('stream_sessions')
          .insert({
            event_id: eventId,
            profile_id: senderId,
            session_token: `session_${Date.now()}_${Math.random().toString(36).substring(7)}`,
            is_active: true
          });

        if (error && error.code !== '23505') { // Ignore duplicate key errors
          console.error('Error creating stream session:', error);
        }

        // Notify streamer that a viewer joined
        const channel = supabase.channel(`webrtc-${eventId}`);
        await channel.send({
          type: 'broadcast',
          event: 'viewer-joined',
          payload: {
            viewerId: senderId,
            timestamp: new Date().toISOString()
          }
        });

        return new Response(
          JSON.stringify({ success: true, message: 'Joined stream' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'leave': {
        // Mark stream session as inactive
        const { error } = await supabase
          .from('stream_sessions')
          .update({ 
            is_active: false,
            left_at: new Date().toISOString()
          })
          .eq('event_id', eventId)
          .eq('profile_id', senderId);

        if (error) {
          console.warn('Error updating stream session:', error);
        }

        // Notify streamer that a viewer left
        const channel = supabase.channel(`webrtc-${eventId}`);
        await channel.send({
          type: 'broadcast',
          event: 'viewer-left',
          payload: {
            viewerId: senderId,
            timestamp: new Date().toISOString()
          }
        });

        return new Response(
          JSON.stringify({ success: true, message: 'Left stream' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Unknown signaling type' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

  } catch (error) {
    console.error('[WebRTC Signaling] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
