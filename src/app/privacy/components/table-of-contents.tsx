import { default as UnifiedTableOfContents } from '@/components/mdx/TableOfContents';

const sections = [
  {
    id: 'information-we-collect',
    title: 'Information We Collect',
    description: 'What data we need to make LawnQuote work for you'
  },
  {
    id: 'how-we-use-information',
    title: 'How We Use Your Information',
    description: 'Making your life easier, never selling your data'
  },
  {
    id: 'data-security',
    title: 'Data Security',
    description: 'Industry-standard protection for your business data'
  },
  {
    id: 'data-sharing',
    title: 'Data Sharing and Third Parties',
    description: 'Trusted partners only, no selling to advertisers'
  },
  {
    id: 'your-rights',
    title: 'Your Rights and Choices',
    description: 'Full control over your data and privacy preferences'
  }
];

export function TableOfContents() {
  return (
    <UnifiedTableOfContents
      sections={sections}
      title="Table of Contents"
      subtitle="Jump to any section to find what you're looking for"
      showNumbers={true}
      enableScrollTracking={false}
    />
  );
}
