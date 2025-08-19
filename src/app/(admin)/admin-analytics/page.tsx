import { Metadata } from 'next';

import { PostHogAdminDashboard } from './posthog-admin-dashboard';

export const metadata: Metadata = {
  title: 'PostHog Analytics Dashboard | QuoteKit',
  description: 'Real-time analytics dashboard powered by PostHog for comprehensive user behavior tracking.',
};

export default function AdminAnalyticsPage() {
  return <PostHogAdminDashboard />;
}
