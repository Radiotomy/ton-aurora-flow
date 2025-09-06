import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RecommendationRequest {
  profileId: string;
  count?: number;
  genres?: string[];
  moods?: string[];
}

serve(async (req) => {
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

    console.log('User context for recommendations:', JSON.stringify(userContext, null, 2));

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

    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { role: 'system', content: 'You are an expert music recommendation engine with deep knowledge of music genres, moods, and user preferences. Always respond with valid JSON.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 1000,
        temperature: 0.7
      }),
    });

    if (!aiResponse.ok) {
      throw new Error(`OpenAI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const aiRecommendations = JSON.parse(aiData.choices[0].message.content);

    console.log('AI recommendations generated:', aiRecommendations);

    // Fetch trending tracks from Audius API to match with AI suggestions
    const audiusResponse = await supabase.functions.invoke('audius-api', {
      body: { 
        endpoint: 'trending-tracks',
        params: { 
          limit: 50,
          genre: genres.length > 0 ? genres[0] : undefined 
        }
      }
    });

    if (audiusResponse.error) {
      console.error('Audius API error:', audiusResponse.error);
      throw new Error('Failed to fetch tracks from Audius');
    }

    const tracks = audiusResponse.data?.tracks || [];
    console.log(`Fetched ${tracks.length} tracks from Audius`);

    // Match AI recommendations with actual tracks
    const matchedRecommendations = aiRecommendations.recommendations.slice(0, count).map((rec: any, index: number) => {
      // Simple matching logic - in production, this could be more sophisticated
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

    // Store recommendations in database
    const { data: storedRecommendations, error: storeError } = await supabase
      .from('user_recommendations')
      .upsert(
        matchedRecommendations.map(rec => ({
          ...rec,
          profile_id: profileId,
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
        })),
        { onConflict: 'profile_id,track_id' }
      )
      .select();

    if (storeError) {
      console.error('Error storing recommendations:', storeError);
      throw new Error('Failed to store recommendations');
    }

    console.log(`Stored ${storedRecommendations?.length} recommendations for user ${profileId}`);

    return new Response(JSON.stringify({
      success: true,
      recommendations: matchedRecommendations,
      count: matchedRecommendations.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-recommendations function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});