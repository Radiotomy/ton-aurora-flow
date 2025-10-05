import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const checks: Record<string, any> = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    checks: {},
  };

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check 1: Database Connection
    try {
      const dbStart = Date.now();
      const { error: dbError } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);
      
      checks.checks.database = {
        status: dbError ? 'unhealthy' : 'healthy',
        responseTime: Date.now() - dbStart,
        error: dbError?.message,
      };
    } catch (error) {
      checks.checks.database = {
        status: 'unhealthy',
        error: error.message,
      };
      checks.status = 'degraded';
    }

    // Check 2: Auth Service
    try {
      const authStart = Date.now();
      const { error: authError } = await supabase.auth.getUser();
      
      checks.checks.auth = {
        status: 'healthy',
        responseTime: Date.now() - authStart,
      };
    } catch (error) {
      checks.checks.auth = {
        status: 'unhealthy',
        error: error.message,
      };
      checks.status = 'degraded';
    }

    // Check 3: Edge Functions (self-check)
    checks.checks.edge_functions = {
      status: 'healthy',
      message: 'Edge function responding',
    };

    // Check 4: Environment Variables
    const requiredEnvVars = [
      'SUPABASE_URL',
      'SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'Bot_Token',
    ];

    const missingEnvVars = requiredEnvVars.filter(
      (varName) => !Deno.env.get(varName)
    );

    checks.checks.environment = {
      status: missingEnvVars.length === 0 ? 'healthy' : 'unhealthy',
      missing: missingEnvVars,
    };

    if (missingEnvVars.length > 0) {
      checks.status = 'degraded';
    }

    // Check 5: System Resources (basic)
    checks.checks.system = {
      status: 'healthy',
      memory: Deno.memoryUsage(),
      uptime: performance.now(),
    };

    // Overall response time
    checks.responseTime = Date.now() - startTime;

    // Determine overall status
    const unhealthyChecks = Object.values(checks.checks).filter(
      (check: any) => check.status === 'unhealthy'
    );

    if (unhealthyChecks.length > 0) {
      checks.status = unhealthyChecks.length >= 2 ? 'unhealthy' : 'degraded';
    }

    const statusCode = checks.status === 'healthy' ? 200 : 
                       checks.status === 'degraded' ? 200 : 503;

    return new Response(
      JSON.stringify(checks, null, 2),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: statusCode,
      }
    );
  } catch (error) {
    console.error('Health check error:', error);
    
    return new Response(
      JSON.stringify({ 
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message,
        responseTime: Date.now() - startTime,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 503,
      }
    );
  }
});
