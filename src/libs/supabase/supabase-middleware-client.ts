// Ref: https://supabase.com/docs/guides/auth/server-side/nextjs

import { createServerClient } from '@supabase/ssr';
import { type NextRequest,NextResponse } from 'next/server';

import { getEnvVar } from '@/utils/get-env-var';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    getEnvVar(process.env.NEXT_PUBLIC_SUPABASE_URL, 'NEXT_PUBLIC_SUPABASE_URL'),
    getEnvVar(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, 'NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            request.cookies.set(name, value);
          }

          supabaseResponse = NextResponse.next({
            request,
          });

          for (const { name, value, options } of cookiesToSet) {
            supabaseResponse.cookies.set(name, value, options);
          }
        },
      },
    }
  );

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: DO NOT REMOVE auth.getUser()

  try {
    const {
      data: { user },
      error
    } = await supabase.auth.getUser();

    // Handle case where JWT references non-existent user
    if (error?.code === 'user_not_found' || (error?.status === 403 && error?.message?.includes('User from sub claim in JWT does not exist'))) {
      console.log('Clearing invalid session for non-existent user');
      
      // Clear the auth cookies by setting them to expire
      const response = NextResponse.next({ request });
      
      // Clear all Supabase auth cookies
      const authCookies = ['sb-access-token', 'sb-refresh-token', 'supabase-auth-token', 'supabase.auth.token'];
      for (const cookieName of authCookies) {
        response.cookies.set(cookieName, '', {
          expires: new Date(0),
          path: '/',
        });
      }
      
      return response;
    }

    // Add route guards here
    // const guardedRoutes = ['/dashboard'];
    // if (!user && guardedRoutes.includes(request.nextUrl.pathname)) {
    //   // no user, potentially respond by redirecting the user to the login page
    //   const url = request.nextUrl.clone();
    //   url.pathname = '/login';
    //   return NextResponse.redirect(url);
    // }

  } catch (error) {
    console.error('Auth middleware error:', error);
    // On any auth error, clear cookies and continue
    const response = NextResponse.next({ request });
    const authCookies = ['sb-access-token', 'sb-refresh-token', 'supabase-auth-token', 'supabase.auth.token'];
    for (const cookieName of authCookies) {
      response.cookies.set(cookieName, '', {
        expires: new Date(0),
        path: '/',
      });
    }
    return response;
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse;
}
