import { redirect } from 'next/navigation';

import { getSession } from '@/features/account/controllers/get-session';
import { getSubscription } from '@/features/account/controllers/get-subscription';

import { signInWithEmail, signInWithOAuth, signUpWithEmail } from '../auth-actions';
import { AuthUI } from '../auth-ui';

export default async function SignUp({ searchParams }: { searchParams: { plan?: string; amount?: string; interval?: string } }) {
  const session = await getSession();
  // Temporarily disable subscription check until database schema is set up
  // const subscription = await getSubscription();

  if (session) {
    // If user is already authenticated and has plan parameters, redirect back to pricing for plan selection
    if (searchParams.plan) {
      // User is authenticated and came from a plan selection - redirect back to pricing 
      // with a message that they can now select their plan
      redirect(`/pricing?authenticated=true&plan=${searchParams.plan}`);
    }
    redirect('/dashboard');
  }

  return (
    <section className='py-xl m-auto flex h-full max-w-lg items-center'>
      <AuthUI 
        mode='signup' 
        signInWithOAuth={signInWithOAuth} 
        signInWithEmail={signInWithEmail} 
        signUpWithEmail={signUpWithEmail}
        planInfo={searchParams.plan ? {
          plan: searchParams.plan,
          amount: searchParams.amount,
          interval: searchParams.interval
        } : undefined}
      />
    </section>
  );
}
