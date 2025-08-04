import { redirect } from 'next/navigation';

import { getSession } from '@/features/account/controllers/get-session';
import { getSubscription } from '@/features/account/controllers/get-subscription';

import { signInWithEmail, signInWithOAuth, signInWithPassword } from '../auth-actions';
import { AuthUI } from '../auth-ui';

export default async function LoginPage() {
  const session = await getSession();
  // Temporarily disable subscription check until database schema is set up
  // const subscription = await getSubscription();

  if (session) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-light-concrete flex items-center justify-center p-6">
      <AuthUI mode='login' signInWithOAuth={signInWithOAuth} signInWithEmail={signInWithEmail} signInWithPassword={signInWithPassword} />
    </div>
  );
}
