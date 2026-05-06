import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { parseMeta } from './parse.ts';

const TIMEOUT_MS = 8000;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'content-type': 'application/json' },
    });
  }

  // Auth check
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
      status: 401,
      headers: { ...corsHeaders, 'content-type': 'application/json' },
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'content-type': 'application/json' },
    });
  }

  // Parse request body
  let url: string;
  try {
    const body = (await req.json()) as { url?: string };
    if (!body.url || typeof body.url !== 'string') throw new Error('missing url');
    url = body.url;
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body. Expected { url: string }' }), {
      status: 400,
      headers: { ...corsHeaders, 'content-type': 'application/json' },
    });
  }

  // Fetch the page — best effort, never 500
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    let html: string;
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: { 'User-Agent': 'Links-Fetcher/1.0' },
      });
      html = await response.text();
    } finally {
      clearTimeout(timeoutId);
    }

    const meta = parseMeta(html, url);
    return new Response(JSON.stringify(meta), {
      status: 200,
      headers: { ...corsHeaders, 'content-type': 'application/json' },
    });
  } catch {
    // Best-effort: return nulls on any fetch/parse failure
    return new Response(
      JSON.stringify({
        title: null,
        description: null,
        thumbnail_url: null,
        favicon_url: null,
        site_name: null,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'content-type': 'application/json' },
      },
    );
  }
});
