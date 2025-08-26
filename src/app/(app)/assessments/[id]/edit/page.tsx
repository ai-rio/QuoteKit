import { notFound, redirect } from 'next/navigation';

import { PageBreadcrumbs } from '@/components/ui/page-breadcrumbs';
import { getSession } from '@/features/account/controllers/get-session';
import { EditAssessmentForm } from '@/features/assessments/components/EditAssessmentForm';
import { PropertyAssessment, PropertyAssessmentWithDetails } from '@/features/assessments/types';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

interface EditAssessmentPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditAssessmentPage({ params }: EditAssessmentPageProps) {
  const session = await getSession();
  
  if (!session) {
    redirect('/login');
  }

  // Await params to handle the async nature
  const { id } = await params;

  // Fetch assessment with property details for editing
  const supabase = await createSupabaseServerClient();
  let assessment: PropertyAssessmentWithDetails | null = null;

  try {
    const { data, error } = await supabase
      .from('property_assessments')
      .select(`
        *,
        properties!inner (
          *,
          clients!inner (*)
        )
      `)
      .eq('id', id)
      .eq('user_id', session.user.id)
      .single();

    if (error) {
      console.error('Error fetching assessment:', error);
      if (error.code === 'PGRST116') {
        notFound();
      }
    } else {
      assessment = data;
    }
  } catch (err) {
    console.error('Error fetching assessment:', err);
    notFound();
  }

  if (!assessment) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-light-concrete py-4 sm:py-6 lg:py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <PageBreadcrumbs />
        <div className="max-w-4xl mx-auto">
          <EditAssessmentForm assessment={assessment} />
        </div>
      </div>
    </div>
  );
}
