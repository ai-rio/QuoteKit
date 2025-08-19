import { Metadata } from 'next';

import { InsightsRecommendationPage } from './insights-recommendation-page';

export const metadata: Metadata = {
  title: 'AI Insights | Admin Analytics | QuoteKit',
  description: 'AI-powered insights and automated recommendations from your analytics data.',
};

export default function InsightsPage() {
  return <InsightsRecommendationPage />;
}
