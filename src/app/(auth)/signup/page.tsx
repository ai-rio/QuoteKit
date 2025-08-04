import { redirect } from 'next/navigation';

import { getSession } from '@/features/account/controllers/get-session';
import { getSubscription } from '@/features/account/controllers/get-subscription';

import { signInWithEmail, signInWithOAuth, signUpWithEmail } from '../auth-actions';
import { AuthUI } from '../auth-ui';

export default async function SignUp({ searchParams }: { searchParams: Promise<{ plan?: string; amount?: string; interval?: string }> }) {
  const session = await getSession();
  // Temporarily disable subscription check until database schema is set up
  // const subscription = await getSubscription();
  
  // Await searchParams for Next.js 15 compatibility
  const resolvedSearchParams = await searchParams;

  if (session) {
    // If user is already authenticated and has plan parameters, redirect back to pricing for plan selection
    if (resolvedSearchParams.plan) {
      // User is authenticated and came from a plan selection - redirect back to pricing 
      // with a message that they can now select their plan
      redirect(`/pricing?authenticated=true&plan=${resolvedSearchParams.plan}`);
    }
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-light-concrete flex items-center justify-center p-6">
      <AuthUI 
        mode='signup' 
        signInWithOAuth={signInWithOAuth} 
        signInWithEmail={signInWithEmail} 
        signUpWithEmail={signUpWithEmail}
      />
    </div>
  );
}
