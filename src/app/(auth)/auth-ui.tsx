'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';

import { LawnQuoteLogoHorizontal } from '@/components/branding/lawn-quote-logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { ActionResponse } from '@/types/action-response';
import { cn } from '@/utils/cn';

interface AuthUIProps {
  mode: 'login' | 'signup';
  signInWithOAuth: (provider: 'google') => Promise<ActionResponse>;
  signInWithEmail?: (formData: FormData) => Promise<ActionResponse>;
  signInWithPassword?: (formData: FormData) => Promise<ActionResponse>;
  signUpWithEmail?: (formData: FormData) => Promise<ActionResponse>;
  className?: string;
}

const titleMap = {
  login: 'Welcome back to LawnQuote',
  signup: 'Create your LawnQuote account',
} as const;

const descriptionMap = {
  login: 'Sign in to access your professional quoting dashboard',
  signup: 'Start creating professional landscaping quotes today',
} as const;

export function AuthUI({
  mode,
  signInWithOAuth,
  signInWithEmail,
  signInWithPassword,
  signUpWithEmail,
  className,
}: AuthUIProps) {
  const [pending, setPending] = useState(false);

  async function handleEmailSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    const email = formData.get('email') as string;

    let response: ActionResponse | undefined;

    try {
      if (mode === 'signup') {
        if (signUpWithEmail) {
          response = await signUpWithEmail(formData);
        } else {
          console.error('signUpWithEmail function is not provided in signup mode');
          return;
        }
      } else {
        // Login mode - always use password
        if (signInWithPassword) {
          response = await signInWithPassword(formData);
        } else {
          console.error('signInWithPassword function is not provided in login mode');
          return;
        }
      }

      if (response?.error) {
        toast({
          variant: 'destructive',
          description: response.error.message || 'An error occurred while authenticating. Please try again.',
        });
      } else {
        if (mode === 'signup') {
          toast({
            description: `Account created successfully! Welcome to LawnQuote.`,
          });
        } else {
          // Successful login - redirect to dashboard
          window.location.href = '/dashboard';
        }
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        description: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setPending(false);
    }
  }

  async function handleGoogleClick() {
    setPending(true);
    try {
      const response = await signInWithOAuth('google');

      if (response?.error) {
        toast({
          variant: 'destructive',
          description: 'An error occurred while authenticating with Google. Please try again.',
        });
        setPending(false);
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        description: 'An unexpected error occurred. Please try again.',
      });
      setPending(false);
    }
  }

  return (
    <div className={cn('flex flex-col gap-6 w-full max-w-sm', className)}>
      {/* Logo and Brand */}
      <div className="flex flex-col items-center gap-4 text-center">
        <LawnQuoteLogoHorizontal />
      </div>

      {/* Auth Card */}
      <Card className="bg-paper-white border-stone-gray shadow-sm">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-xl font-bold text-charcoal">{titleMap[mode]}</CardTitle>
          <CardDescription className="text-charcoal/70">
            {descriptionMap[mode]}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Google Login Button */}
          <Button
            variant="outline"
            onClick={handleGoogleClick}
            disabled={pending}
            className="w-full bg-paper-white text-charcoal border-2 border-stone-gray hover:bg-light-concrete hover:text-charcoal focus:border-forest-green focus:ring-forest-green font-medium py-3"
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
              />
            </svg>
            Continue with Google
          </Button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-stone-gray" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-paper-white px-2 text-charcoal/60">Or continue with email</span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div className="grid gap-3">
              <Label htmlFor="email" className="text-label text-charcoal font-medium">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                required
                disabled={pending}
                className="bg-light-concrete text-charcoal border-stone-gray focus:border-forest-green focus:ring-forest-green placeholder:text-charcoal/60"
              />
            </div>

            <div className="grid gap-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-label text-charcoal font-medium">
                  Password
                </Label>
                {mode === 'login' && (
                  <Link
                    href="/reset-password"
                    className="text-sm text-charcoal/70 hover:text-forest-green underline-offset-4 hover:underline"
                  >
                    Forgot password?
                  </Link>
                )}
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder={mode === 'signup' ? 'Create a password' : 'Enter your password'}
                required
                disabled={pending}
                className="bg-light-concrete text-charcoal border-stone-gray focus:border-forest-green focus:ring-forest-green placeholder:text-charcoal/60"
              />
            </div>

            <Button
              type="submit"
              disabled={pending}
              className="w-full bg-forest-green text-paper-white hover:opacity-90 active:opacity-80 font-bold py-3 transition-all duration-200"
            >
              {pending
                ? mode === 'signup'
                  ? 'Creating account...'
                  : 'Signing in...'
                : mode === 'signup'
                ? 'Create account'
                : 'Sign in'}
            </Button>
          </form>

          {/* Switch Mode Link */}
          <div className="text-center text-sm text-charcoal/70">
            {mode === 'signup' ? (
              <>
                Already have an account?{' '}
                <Link
                  href="/login"
                  className="text-forest-green hover:text-forest-green/90 underline-offset-4 hover:underline font-medium"
                >
                  Sign in
                </Link>
              </>
            ) : (
              <>
                Don't have an account?{' '}
                <Link
                  href="/signup"
                  className="text-forest-green hover:text-forest-green/90 underline-offset-4 hover:underline font-medium"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Terms and Privacy for Signup */}
      {mode === 'signup' && (
        <div className="text-center text-xs text-charcoal/60 px-4">
          By creating an account, you agree to our{' '}
          <Link
            href="/terms"
            className="text-forest-green hover:text-forest-green/90 underline-offset-4 hover:underline"
          >
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link
            href="/privacy"
            className="text-forest-green hover:text-forest-green/90 underline-offset-4 hover:underline"
          >
            Privacy Policy
          </Link>
          .
        </div>
      )}
    </div>
  );
}