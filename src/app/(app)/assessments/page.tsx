import { redirect } from 'next/navigation';

import { PageBreadcrumbs } from '@/components/ui/page-breadcrumbs';
import { getSession } from '@/features/account/controllers/get-session';
import { AssessmentsManager } from '@/features/assessments/components/AssessmentsManager';
import { PropertyAssessment, PropertyAssessmentWithDetails } from '@/features/assessments/types';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

export default async function AssessmentsPage() {
  const session = await getSession();
  
  if (!session) {
    redirect('/login');
  }

  // Fetch assessments on server side with property and client details
  const supabase = await createSupabaseServerClient();
  let assessments: PropertyAssessmentWithDetails[] = [];

  try {
    const { data, error } = await supabase
      .from('property_assessments')
      .select(`
        *,
        properties!inner (
          id,
          service_address,
          property_name,
          property_type,
          clients!inner (
            id,
            name,
            email,
            phone
          )
        )
      `)
      .eq('user_id', session.user.id)
      .order('assessment_date', { ascending: false });

    if (error) {
      console.error('Error fetching assessments:', error);
    } else {
      assessments = data || [];
    }
  } catch (err) {
    console.error('Error fetching assessments:', err);
  }

  return (
    <div className="min-h-screen bg-light-concrete py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          <PageBreadcrumbs />
          <AssessmentsManager initialAssessments={assessments} />
        </div>
      </div>
    </div>
  );
}
