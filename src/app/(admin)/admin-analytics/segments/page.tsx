import { Metadata } from 'next';

import { SegmentManagementPage } from './segment-management-page';

export const metadata: Metadata = {
  title: 'User Segments | Admin Analytics | QuoteKit',
  description: 'Manage user segments for targeted campaigns and analytics.',
};

export default function SegmentsPage() {
  return <SegmentManagementPage />;
}
