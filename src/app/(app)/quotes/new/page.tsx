import { redirect } from 'next/navigation';

import { getSession } from '@/features/account/controllers/get-session';
import { getLineItems } from '@/features/items/actions';
import { QuoteCreator } from '@/features/quotes/components/QuoteCreator';
import { getTemplateById } from '@/features/quotes/actions';
import { getCompanySettings } from '@/features/settings/actions';

interface NewQuotePageProps {
  searchParams: { template?: string };
}

export default async function NewQuotePage({ searchParams }: NewQuotePageProps) {
  const session = await getSession();
  
  if (!session) {
    redirect('/login');
  }

  // Fetch items and settings
  const [itemsResponse, settingsResponse] = await Promise.all([
    getLineItems(),
    getCompanySettings(),
  ]);
  
  const items = itemsResponse?.data;
  const settings = settingsResponse?.data;

  // Fetch template data if template ID is provided
  let templateData = null;
  if (searchParams.template) {
    try {
      const templateResponse = await getTemplateById(searchParams.template);
      if (templateResponse.data) {
        templateData = templateResponse.data;
      }
    } catch (error) {
      console.error('Failed to load template:', error);
      // Continue without template data if loading fails
    }
  }

  return (
    <div className="min-h-screen bg-light-concrete py-4 sm:py-6 lg:py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <QuoteCreator 
          availableItems={items || []} 
          defaultSettings={settings || null}
          templateData={templateData}
        />
      </div>
    </div>
  );
}