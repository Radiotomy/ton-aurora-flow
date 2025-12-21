import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";

const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Check if origin is allowed
function isAllowedOrigin(origin: string): boolean {
  if (!origin) return true;
  
  const exactOrigins = [
    'https://audioton.co',
    'https://www.audioton.co',
    'http://localhost:5173',
    'http://localhost:8080',
    'http://localhost:3000',
  ];
  
  if (exactOrigins.includes(origin)) return true;
  
  // Allow all Lovable preview subdomains
  if (origin.endsWith('.lovableproject.com') || origin.endsWith('.lovable.app')) {
    return true;
  }
  
  return false;
}

function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin') || '';
  const allowedOrigin = isAllowedOrigin(origin) ? origin : 'https://audioton.co';
  
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
  };
}

interface RecommendationRequest {
  profileId: string;
  count?: number;
  genres?: string[];
  moods?: string[];
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { profileId, count = 5, genres = [], moods = [] }: RecommendationRequest = await req.json();
    console.log(`Generating AI recommendations for profile: ${profileId}`);

    // Get user's listening history and preferences
    const { data: listeningHistory } = await supabase
      .from('listening_history')
      .select('track_id, artist_id')
      .eq('profile_id', profileId)
      .order('played_at', { ascending: false })
      .limit(20);

    const { data: favorites } = await supabase
      .from('user_favorites')
      .select('track_id, artist_id')
      .eq('profile_id', profileId)
      .limit(10);

    // Get user profile for personalization
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, bio')
      .eq('id', profileId)
      .single();

    // Create a context for AI recommendations
    const userContext = {
      recentlyPlayed: listeningHistory?.slice(0, 10) || [],
      favorites: favorites || [],
      preferredGenres: genres,
      preferredMoods: moods,
      profileInfo: profile
    };

    console.log('User context prepared for recommendations');

    // Generate AI recommendations
    const prompt = `As a music recommendation AI, analyze this user's listening patterns and suggest ${count} music tracks. 

User Context:
- Recently played tracks: ${JSON.stringify(userContext.recentlyPlayed)}
- Favorite tracks: ${JSON.stringify(userContext.favorites)}
- Preferred genres: ${genres.join(', ') || 'any'}
- Preferred moods: ${moods.join(', ') || 'any'}

Please provide a JSON response with recommendations in this format:
{
  "recommendations": [
    {
      "reason": "Brief explanation why this fits the user's taste",
      "genres": ["genre1", "genre2"],
      "moods": ["mood1", "mood2"],
      "confidence": 0.8
    }
  ]
}

Focus on music discovery, diversity, and matching the user's demonstrated preferences. Consider both similar and complementary styles to their listening history.`;

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const aiBody: any = {
      model: 'google/gemini-2.5-flash',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert music recommendation engine. Use the provided tool to return structured recommendations.'
        },
        { role: 'user', content: prompt }
      ],
      max_tokens: 1000,
      temperature: 0.7,
      tools: [
        {
          type: 'function',
          function: {
            name: 'recommend_tracks',
            description: 'Return a list of track recommendation rationales (no track IDs).',
            parameters: {
              type: 'object',
              properties: {
                recommendations: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      reason: { type: 'string' },
                      genres: { type: 'array', items: { type: 'string' } },
                      moods: { type: 'array', items: { type: 'string' } },
                      confidence: { type: 'number' }
                    },
                    required: ['reason', 'genres', 'moods', 'confidence'],
                    additionalProperties: false
                  }
                }
              },
              required: ['recommendations'],
              additionalProperties: false
            }
          }
        }
      ],
      tool_choice: { type: 'function', function: { name: 'recommend_tracks' } }
    };

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(aiBody),
    });

    if (!aiResponse.ok) {
      console.error('Lovable AI gateway error:', aiResponse.status);

      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({
          error: 'Rate limit exceeded. Please try again in a moment.',
          success: false,
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({
          error: 'AI credits exhausted. Please add credits to your Lovable AI workspace.',
          success: false,
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();

    const toolArgsStr =
      aiData?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments ?? null;

    const parseLooseJson = (raw: string) => {
      const cleaned = raw
        .trim()
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```\s*$/i, '')
        .replace(/,\s*([}\]])/g, '$1');

      const start = cleaned.indexOf('{');
      const end = cleaned.lastIndexOf('}');
      const candidate = start !== -1 && end !== -1 && end > start ? cleaned.slice(start, end + 1) : cleaned;
      return JSON.parse(candidate);
    };

    let aiRecommendations: any;
    try {
      if (toolArgsStr) {
        aiRecommendations = JSON.parse(toolArgsStr);
      } else {
        const content = aiData?.choices?.[0]?.message?.content ?? '';
        aiRecommendations = parseLooseJson(content);
      }
    } catch (e) {
      console.error('Failed to parse AI response');
      throw new Error('AI response was not valid JSON');
    }

    if (!aiRecommendations?.recommendations || !Array.isArray(aiRecommendations.recommendations)) {
      console.error('AI returned invalid schema');
      throw new Error('AI returned invalid recommendation schema');
    }

    console.log('AI recommendations generated');
    
    // Fetch trending tracks from Audius API to match with AI suggestions
    const audiusUrl = `${supabaseUrl}/functions/v1/audius-api/trending-tracks?limit=50${genres.length > 0 ? `&genre=${encodeURIComponent(genres[0])}` : ''}`;
    
    console.log('Calling Audius API');
    
    const audiusResponse = await fetch(audiusUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!audiusResponse.ok) {
      console.error('Audius API error:', audiusResponse.status);
      throw new Error('Failed to fetch tracks from Audius');
    }

    const audiusData = await audiusResponse.json();

    if (!audiusData.success) {
      console.error('Audius API returned error');
      throw new Error('Failed to fetch tracks from Audius');
    }

    const tracks = audiusData.tracks || [];
    console.log(`Fetched ${tracks.length} tracks from Audius`);

    // Match AI recommendations with actual tracks
    const matchedRecommendations = aiRecommendations.recommendations.slice(0, count).map((rec: any, index: number) => {
      const matchedTrack = tracks[index % tracks.length];
      
      return {
        track_id: matchedTrack.id,
        artist_id: matchedTrack.user.id,
        recommendation_type: 'ai_generated',
        score: rec.confidence || 0.7,
        metadata: {
          reason: rec.reason,
          ai_genres: rec.genres,
          ai_moods: rec.moods,
          track_data: {
            title: matchedTrack.title,
            artist: matchedTrack.user.name,
            genre: matchedTrack.genre,
            mood: matchedTrack.mood,
            artwork: matchedTrack.artwork
          }
        }
      };
    });

    // Clear old recommendations for this user first
    const { error: deleteError } = await supabase
      .from('user_recommendations')
      .delete()
      .eq('profile_id', profileId);

    if (deleteError) {
      console.error('Error deleting old recommendations');
    }

    // Store new recommendations in database
    const { data: storedRecommendations, error: storeError } = await supabase
      .from('user_recommendations')
      .insert(
        matchedRecommendations.map(rec => ({
          ...rec,
          profile_id: profileId,
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        }))
      )
      .select();

    if (storeError) {
      console.error('Error storing recommendations');
      throw new Error('Failed to store recommendations');
    }

    console.log(`Stored ${storedRecommendations?.length} recommendations`);

    return new Response(JSON.stringify({
      success: true,
      recommendations: matchedRecommendations,
      count: matchedRecommendations.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const corsHeaders = getCorsHeaders(req);
    console.error('Error in ai-recommendations function');
    return new Response(JSON.stringify({ 
      error: 'Failed to generate recommendations',
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
