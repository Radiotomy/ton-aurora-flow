import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Event schema
const MonitoringEventSchema = z.object({
  level: z.enum(['info', 'warn', 'error', 'critical']),
  category: z.enum(['auth', 'wallet', 'nft', 'payment', 'playback', 'social', 'system', 'security']),
  message: z.string(),
  details: z.record(z.any()).optional(),
  userId: z.string().optional(),
  timestamp: z.string(),
  userAgent: z.string().optional(),
  url: z.string().optional(),
});

const RequestSchema = z.object({
  events: z.array(MonitoringEventSchema).max(100), // Max 100 events per batch
});

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse and validate request
    const body = await req.json();
    const { events } = RequestSchema.parse(body);

    console.log(`Processing ${events.length} monitoring events`);

    // Filter critical events for immediate notification
    const criticalEvents = events.filter(e => e.level === 'critical');
    if (criticalEvents.length > 0) {
      console.warn(`⚠️ ${criticalEvents.length} CRITICAL events detected:`, 
        criticalEvents.map(e => e.message));
    }

    // Store events in database (you would need to create a monitoring_logs table)
    // For now, we'll just log them
    for (const event of events) {
      const logLevel = event.level.toUpperCase();
      const logMessage = `[${logLevel}] [${event.category}] ${event.message}`;
      
      if (event.level === 'critical' || event.level === 'error') {
        console.error(logMessage, event.details);
      } else if (event.level === 'warn') {
        console.warn(logMessage, event.details);
      } else {
        console.log(logMessage, event.details);
      }
    }

    // Group events by level for summary
    const summary = events.reduce((acc, event) => {
      acc[event.level] = (acc[event.level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: events.length,
        summary,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Monitoring logs error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error instanceof z.ZodError ? error.errors : undefined,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
