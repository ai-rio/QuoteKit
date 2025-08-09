import { default as UnifiedTableOfContents } from '@/components/mdx/TableOfContents';

const sections = [
  {
    id: 'account-responsibilities',
    title: 'Your Account & Responsibilities',
    description: 'Account security, acceptable use, and data ownership'
  },
  {
    id: 'service-limitations',
    title: 'Our Service & Limitations',
    description: 'Service availability, changes, and liability limits'
  },
  {
    id: 'payment-subscription',
    title: 'Payment & Subscription',
    description: 'Free plan, Pro billing, cancellation, and refunds'
  },
  {
    id: 'intellectual-property',
    title: 'Intellectual Property',
    description: 'Software ownership, your content rights, and trademarks'
  },
  {
    id: 'termination',
    title: 'Termination',
    description: 'How this agreement ends and data retention policies'
  }
];

export function TermsTableOfContents() {
  return (
    <UnifiedTableOfContents
      sections={sections}
      title="Table of Contents"
      subtitle="Navigate to any section of our terms of service"
      showNumbers={true}
      enableScrollTracking={false}
    />
  );
}
