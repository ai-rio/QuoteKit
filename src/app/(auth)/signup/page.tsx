import { redirect } from 'next/navigation';

import { getSession } from '@/features/account/controllers/get-session';
import { getSubscription } from '@/features/account/controllers/get-subscription';

import { signInWithEmail, signInWithOAuth, signUpWithEmail } from '../auth-actions';
import { AuthUI } from '../auth-ui';

export default async function SignUp() {
  const session = await getSession();
  // Temporarily disable subscription check until database schema is set up
  // const subscription = await getSubscription();

  if (session) {
    redirect('/dashboard');
  }

  return (
    <section className='py-xl m-auto flex h-full max-w-lg items-center'>
      <AuthUI mode='signup' signInWithOAuth={signInWithOAuth} signInWithEmail={signInWithEmail} signUpWithEmail={signUpWithEmail} />
    </section>
  );
}
