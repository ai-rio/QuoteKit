import { redirect } from 'next/navigation';

import { getSession } from '@/features/account/controllers/get-session';
import { getCompanySettings } from '@/features/settings/actions';
import { SettingsManager } from '@/features/settings/components/SettingsManager';

export default async function SettingsPage() {
  const session = await getSession();
  
  if (!session) {
    redirect('/login');
  }

  const response = await getCompanySettings();
  const settings = response?.data;

  return (
    <div className="bg-light-concrete min-h-screen">
      <div className="container mx-auto max-w-4xl py-8">
        <SettingsManager 
          initialSettings={settings || null} 
          userId={session.user.id}
        />
      </div>
    </div>
  );
}