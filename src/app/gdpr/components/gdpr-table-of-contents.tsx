import { default as UnifiedTableOfContents } from '@/components/mdx/TableOfContents';

const sections = [
  {
    id: 'your-gdpr-rights',
    title: 'Your GDPR Rights',
    description: 'Access, rectification, erasure, portability, and more'
  },
  {
    id: 'legal-basis',
    title: 'Legal Basis for Processing',
    description: 'Why and how we process your personal data'
  },
  {
    id: 'data-protection',
    title: 'Data Protection Measures',
    description: 'Technical and organizational safeguards we implement'
  },
  {
    id: 'data-transfers',
    title: 'International Data Transfers',
    description: 'How we handle data transfers outside the EU/EEA'
  },
  {
    id: 'exercising-rights',
    title: 'How to Exercise Your Rights',
    description: 'Practical steps and contact information'
  }
];

export function GdprTableOfContents() {
  return (
    <UnifiedTableOfContents
      sections={sections}
      title="Table of Contents"
      subtitle="Navigate to any section of our GDPR compliance information"
      showNumbers={true}
      enableScrollTracking={false}
    />
  );
}
