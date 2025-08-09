import { default as UnifiedTableOfContents } from '@/components/mdx/TableOfContents';

const sections = [
  {
    id: 'what-are-cookies',
    title: 'What Are Cookies?',
    description: 'Simple explanation of cookies and how they work'
  },
  {
    id: 'types-of-cookies',
    title: 'Types of Cookies We Use',
    description: 'Essential, functional, analytics, and security cookies'
  },
  {
    id: 'managing-cookies',
    title: 'Managing Your Cookie Preferences',
    description: 'How to control cookies in your browser and on our site'
  },
  {
    id: 'third-party-cookies',
    title: 'Third-Party Cookies',
    description: 'Cookies from our trusted partners and service providers'
  }
];

export function CookieTableOfContents() {
  return (
    <UnifiedTableOfContents
      sections={sections}
      title="Table of Contents"
      subtitle="Navigate to any section of our cookie policy"
      showNumbers={true}
      enableScrollTracking={false}
    />
  );
}
