import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

export async function getSession() {
  const supabase = await createSupabaseServerClient();

  try {
    // Use getUser() instead of getSession() for security
    // getSession() is insecure as it comes from storage medium (cookies)
    // getUser() authenticates by contacting Supabase Auth server
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
      // Don't log auth errors for unauthenticated users as they're expected
      if (error.message !== 'Auth session missing!') {
        console.error(error);
      }
      return null;
    }

    // If user exists, we can assume there's a valid session
    // Return a session-like object for compatibility
    return user ? { user } : null;
  } catch (error) {
    // Handle any unexpected errors gracefully
    console.error('Unexpected error in getSession:', error);
    return null;
  }
}
