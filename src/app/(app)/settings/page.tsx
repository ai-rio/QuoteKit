import { redirect } from 'next/navigation';

import { getSession } from '@/features/account/controllers/get-session';
import { getCompanySettings } from '@/features/settings/actions';

import { SettingsForm } from './settings-form';

export default async function SettingsPage() {
  const session = await getSession();
  
  if (!session) {
    redirect('/login');
  }

  const response = await getCompanySettings();
  const settings = response?.data;

  return (
    <div className="container mx-auto max-w-2xl py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Manage your company information and quote settings.
          </p>
        </div>
        
        <SettingsForm initialSettings={settings || null} />
      </div>
    </div>
  );
}