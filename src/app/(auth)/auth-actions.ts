'use server';

import { redirect } from 'next/navigation';

import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { ActionResponse } from '@/types/action-response';
import { getURL } from '@/utils/get-url';

export async function signInWithOAuth(provider: 'google'): Promise<ActionResponse> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: getURL('/auth/callback'),
    },
  });

  if (error) {
    console.error(error);
    return { data: null, error: error };
  }

  return redirect(data.url);
}

export async function signInWithEmail(formData: FormData): Promise<ActionResponse> {
  const email = formData.get('email') as string;
  
  if (!email || !email.trim()) {
    return { data: null, error: { message: 'Email is required' } };
  }

  const supabase = await createSupabaseServerClient();

  // Check if the user exists
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('email', email.trim())
    .single();

  if (userError || !user) {
    return { data: null, error: { message: 'User not found. Please sign up first.' } };
  }

  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim(),
    options: {
      emailRedirectTo: getURL('/auth/callback'),
    },
  });

  if (error) {
    console.error(error);
    return { data: null, error: error };
  }

  return { data: null, error: null };
}

export async function signUpWithEmail(formData: FormData): Promise<ActionResponse> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !email.trim()) {
    return { data: null, error: { message: 'Email is required' } };
  }

  if (!password || !password.trim()) {
    return { data: null, error: { message: 'Password is required' } };
  }

  const supabase = await createSupabaseServerClient();

  // Get current URL to preserve plan parameters
  const headers = await import('next/headers');
  const headersList = await headers.headers();
  const referer = headersList.get('referer') || '';
  const refererUrl = new URL(referer);
  const planParams = new URLSearchParams();
  
  // Preserve plan selection parameters
  if (refererUrl.searchParams.get('plan')) {
    planParams.set('plan', refererUrl.searchParams.get('plan')!);
  }
  if (refererUrl.searchParams.get('amount')) {
    planParams.set('amount', refererUrl.searchParams.get('amount')!);
  }
  if (refererUrl.searchParams.get('interval')) {
    planParams.set('interval', refererUrl.searchParams.get('interval')!);
  }

  const redirectUrl = planParams.toString() 
    ? `${getURL('/auth/callback')}?${planParams.toString()}`
    : getURL('/auth/callback');

  const { error } = await supabase.auth.signUp({
    email: email.trim(),
    password: password.trim(),
    options: {
      emailRedirectTo: redirectUrl,
    },
  });

  if (error) {
    console.error(error);
    return { data: null, error: error };
  }

  return { data: null, error: null };
}

export async function signInWithPassword(formData: FormData): Promise<ActionResponse> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !email.trim()) {
    return { data: null, error: { message: 'Email is required' } };
  }

  if (!password || !password.trim()) {
    return { data: null, error: { message: 'Password is required' } };
  }

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password: password.trim(),
  });

  if (error) {
    console.error(error);
    return { data: null, error: error };
  }

  // Redirect to dashboard after successful login
  redirect('/dashboard');
}

export async function signOut(): Promise<ActionResponse> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error(error);
    return { data: null, error: error };
  }

  return { data: null, error: null };
}
