import { redirect } from 'next/navigation';

import { PageBreadcrumbs } from '@/components/ui/page-breadcrumbs';
import { getSession } from '@/features/account/controllers/get-session';
import { NewAssessmentForm } from '@/features/assessments/components/NewAssessmentForm';
import { getPropertyById } from '@/features/clients/actions';
import { Property } from '@/features/clients/types';

interface NewAssessmentPageProps {
  searchParams: Promise<{ property_id?: string; client_id?: string }>;
}

export default async function NewAssessmentPage({ searchParams }: NewAssessmentPageProps) {
  const session = await getSession();
  
  if (!session) {
    redirect('/login');
  }

  // Await searchParams to handle the async nature
  const params = await searchParams;

  // Fetch property data if property_id is provided
  let selectedProperty: Property | null = null;
  if (params.property_id) {
    try {
      const propertyResponse = await getPropertyById(params.property_id);
      if (propertyResponse?.data) {
        selectedProperty = propertyResponse.data;
      }
    } catch (error) {
      console.error('Failed to load property:', error);
      // Continue without property data if loading fails
    }
  }

  return (
    <div className="min-h-screen bg-light-concrete py-4 sm:py-6 lg:py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <PageBreadcrumbs />
        <div className="max-w-4xl mx-auto">
          <NewAssessmentForm 
            initialProperty={selectedProperty}
            initialClientId={params.client_id || null}
          />
        </div>
      </div>
    </div>
  );
}
