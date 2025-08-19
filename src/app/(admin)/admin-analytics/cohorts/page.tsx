import { Metadata } from 'next';

import { CohortsAnalysisPage } from './cohorts-analysis-page';

export const metadata: Metadata = {
  title: 'Cohort Analysis | Admin Analytics | QuoteKit',
  description: 'Advanced user cohort analysis with retention tracking and behavioral insights.',
};

export default function CohortsPage() {
  return <CohortsAnalysisPage />;
}
