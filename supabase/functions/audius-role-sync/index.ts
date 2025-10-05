import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema for Audius user data
const audiusUserSchema = z.object({
  id: z.string().min(1, { message: "User ID is required" }),
  name: z.string().optional(),
  handle: z.string().min(1, { message: "Handle is required" }),
  track_count: z.number().int().min(0).optional(),
  follower_count: z.number().int().min(0).optional(),
  verified: z.boolean().optional(),
  is_verified: z.boolean().optional(),
  is_deactivated: z.boolean().optional(),
});

interface AudiusUserProfile {
  id: string;
  name: string;
  handle: string;
  bio?: string;
  location?: string;
  profile_picture?: {
    '150x150'?: string;
    '480x480'?: string;
    '1000x1000'?: string;
  };
  cover_photo?: {
    '640x': string;
    '2000x': string;
  };
  follower_count?: number;
  followee_count?: number;
  track_count?: number;
  playlist_count?: number;
  verified?: boolean;
  is_verified?: boolean;
  email?: string;
  wallet?: string;
  associated_wallets?: string[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Get user from JWT
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Invalid user token');
    }

    // Parse and validate input
    const rawBody = await req.json();
    const { audiusUserData: rawAudiusData } = rawBody;

    if (!rawAudiusData) {
      return new Response(
        JSON.stringify({ error: 'No Audius user data provided' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Validate Audius user data
    const validationResult = audiusUserSchema.safeParse(rawAudiusData);
    
    if (!validationResult.success) {
      console.error('Audius data validation failed:', validationResult.error);
      return new Response(
        JSON.stringify({ 
          error: "Invalid Audius user data",
          details: validationResult.error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    const audiusUserData = validationResult.data;

    console.log('Syncing roles for user:', user.id, 'with Audius data:', audiusUserData);

    // Get user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();

    if (profileError || !profile) {
      throw new Error('User profile not found');
    }

    // Rate limiting check (5 requests per 5 minutes for role sync)
    const { data: rateLimitCheck, error: rateLimitError } = await supabase
      .rpc('secure_rate_limit_check', {
        operation_type: 'role_sync',
        max_operations: 5,
        time_window: '00:05:00'
      });

    if (rateLimitError) {
      console.error('Rate limit check error:', rateLimitError);
    } else if (!rateLimitCheck) {
      console.warn(`Rate limit exceeded for user ${user.id}`);
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 429 
        }
      );
    }

    const rolesToAssign: { role: string; metadata: any }[] = [];

    // Check if user has tracks (is an artist)
    if (audiusUserData.track_count > 0) {
      rolesToAssign.push({
        role: 'audius_artist',
        metadata: {
          audius_user_id: audiusUserData.id,
          audius_handle: audiusUserData.handle,
          track_count: audiusUserData.track_count,
          synced_at: new Date().toISOString()
        }
      });

      // Check if verified on Audius
      const isVerified = audiusUserData.verified || audiusUserData.is_verified;
      if (isVerified) {
        rolesToAssign.push({
          role: 'verified_audius_artist',
          metadata: {
            audius_user_id: audiusUserData.id,
            audius_handle: audiusUserData.handle,
            verified_on_audius: true,
            verification_synced_at: new Date().toISOString()
          }
        });
      }
    }

    // Assign roles in database
    const results = [];
    for (const { role, metadata } of rolesToAssign) {
      const { data, error } = await supabase
        .from('user_roles')
        .upsert({
          user_id: user.id,
          role,
          metadata,
          assigned_at: new Date().toISOString(),
          assigned_by: user.id // Self-assigned through Audius sync
        }, {
          onConflict: 'user_id,role'
        })
        .select();

      if (error && !error.message.includes('duplicate key')) {
        console.error('Error assigning role:', role, error);
      } else {
        results.push({ role, status: 'assigned', data });
        console.log(`Successfully assigned ${role} role to user ${user.id}`);
      }
    }

    // Create audit log of role changes
    const { error: logError } = await supabase
      .from('artist_applications')
      .insert({
        profile_id: profile.id,
        application_type: 'audius_upgrade',
        status: 'approved',
        audius_user_id: audiusUserData.id,
        audius_handle: audiusUserData.handle,
        audius_verification_data: audiusUserData,
        admin_notes: `Automatically approved via Audius sync. Track count: ${audiusUserData.track_count}, Verified: ${audiusUserData.verified || audiusUserData.is_verified}`,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString()
      });

    if (logError) {
      console.error('Error creating audit log:', logError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully synced ${results.length} role(s)`,
        roles: results,
        audiusData: {
          id: audiusUserData.id,
          handle: audiusUserData.handle,
          track_count: audiusUserData.track_count,
          verified: audiusUserData.verified || audiusUserData.is_verified,
          follower_count: audiusUserData.follower_count
        }
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Audius role sync error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        message: 'Failed to sync Audius roles'
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 400,
      }
    );
  }
});