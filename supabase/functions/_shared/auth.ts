/**
 * Authentication utilities for Edge Functions
 * Handles JWT validation and user authentication
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Get authenticated user from request
 */
export async function getUser(request: Request) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const authorization = request.headers.get('Authorization');
  if (!authorization) {
    return { user: null, error: 'No authorization header' };
  }

  const token = authorization.replace('Bearer ', '');
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return { user: null, error: error?.message || 'Invalid token' };
  }

  return { user, error: null };
}

/**
 * Get Supabase admin client for Edge Functions
 */
export function getSupabaseAdmin() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Check if user is admin
 */
export async function isAdmin(userId: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  
  const { data } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('role', 'admin')
    .single();
    
  return !!data;
}

/**
 * Middleware for protected routes
 */
export async function requireAuth(request: Request) {
  const { user, error } = await getUser(request);
  
  if (!user) {
    return {
      response: new Response(
        JSON.stringify({ error: 'Unauthorized', message: error }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      ),
      user: null,
    };
  }
  
  return { response: null, user };
}

/**
 * Middleware for admin-only routes
 */
export async function requireAdmin(request: Request) {
  const { response, user } = await requireAuth(request);
  
  if (response) {
    return { response, user: null };
  }
  
  const userIsAdmin = await isAdmin(user!.id);
  if (!userIsAdmin) {
    return {
      response: new Response(
        JSON.stringify({ error: 'Forbidden', message: 'Admin access required' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      ),
      user: null,
    };
  }
  
  return { response: null, user };
}