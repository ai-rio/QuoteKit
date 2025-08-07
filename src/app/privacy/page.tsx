import type { Metadata } from 'next';

import { MarketingLayout } from '@/components/layout/marketing-layout';

import { PrivacyHero } from './components/privacy-hero';
import { PrivacySection } from './components/privacy-section';
import { TableOfContents } from './components/table-of-contents';

export const metadata: Metadata = {
  title: 'Privacy Policy - LawnQuote',
  description: 'Learn how LawnQuote protects your privacy and handles your data. Our commitment to keeping your business information secure.',
  keywords: 'privacy policy, data protection, landscaping software privacy',
};

export default function PrivacyPage() {
  return (
    <MarketingLayout 
      showBreadcrumbs={true}
      breadcrumbClassName="container mx-auto px-4 pt-4 pb-2"
    >
      <div className="min-h-screen bg-light-concrete">
        <PrivacyHero />
        
        <div className="container mx-auto px-4 py-12 max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Table of Contents - Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-8">
                <TableOfContents />
              </div>
            </div>
            
            {/* Main Content */}
            <div className="lg:col-span-3">
              <div className="bg-paper-white rounded-2xl border border-stone-gray/20 shadow-lg p-8">
                <PrivacySection 
                  id="information-collection"
                  sectionNumber="1"
                  title="Information We Collect"
                  description="What data we gather and why"
                >
                  <div className="prose prose-lg max-w-none">
                    <p>We collect information you provide directly to us, such as when you create an account, use our services, or contact us for support.</p>
                    
                    <h4>Personal Information</h4>
                    <ul>
                      <li>Name and contact information</li>
                      <li>Business information</li>
                      <li>Payment information</li>
                      <li>Communication preferences</li>
                    </ul>
                    
                    <h4>Usage Information</h4>
                    <ul>
                      <li>How you use our services</li>
                      <li>Features you access</li>
                      <li>Time spent on different sections</li>
                      <li>Technical information about your device</li>
                    </ul>
                  </div>
                </PrivacySection>
                
                <PrivacySection 
                  id="information-use"
                  sectionNumber="2"
                  title="How We Use Your Information"
                  description="Our data usage practices"
                >
                  <div className="prose prose-lg max-w-none">
                    <p>We use the information we collect to provide, maintain, and improve our services.</p>
                    
                    <h4>Service Provision</h4>
                    <ul>
                      <li>Process your quotes and manage your account</li>
                      <li>Provide customer support</li>
                      <li>Send service-related communications</li>
                    </ul>
                    
                    <h4>Service Improvement</h4>
                    <ul>
                      <li>Analyze usage patterns to improve features</li>
                      <li>Develop new functionality</li>
                      <li>Ensure security and prevent fraud</li>
                    </ul>
                  </div>
                </PrivacySection>
                
                <PrivacySection 
                  id="information-sharing"
                  sectionNumber="3"
                  title="Information Sharing"
                  description="When and how we share your data"
                >
                  <div className="prose prose-lg max-w-none">
                    <p>We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy.</p>
                    
                    <h4>Service Providers</h4>
                    <p>We may share information with trusted service providers who assist us in operating our platform, conducting business, or serving you.</p>
                    
                    <h4>Legal Requirements</h4>
                    <p>We may disclose information when required by law or to protect our rights, property, or safety.</p>
                  </div>
                </PrivacySection>
                
                <PrivacySection 
                  id="data-security"
                  sectionNumber="4"
                  title="Data Security"
                  description="How we protect your information"
                >
                  <div className="prose prose-lg max-w-none">
                    <p>We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.</p>
                    
                    <h4>Security Measures</h4>
                    <ul>
                      <li>Encryption of data in transit and at rest</li>
                      <li>Regular security audits and updates</li>
                      <li>Access controls and authentication</li>
                      <li>Employee training on data protection</li>
                    </ul>
                  </div>
                </PrivacySection>
                
                <PrivacySection 
                  id="your-rights"
                  sectionNumber="5"
                  title="Your Rights"
                  description="Your control over your data"
                >
                  <div className="prose prose-lg max-w-none">
                    <p>You have certain rights regarding your personal information, including:</p>
                    
                    <ul>
                      <li>Access to your personal information</li>
                      <li>Correction of inaccurate information</li>
                      <li>Deletion of your information</li>
                      <li>Portability of your data</li>
                      <li>Objection to processing</li>
                    </ul>
                    
                    <p>To exercise these rights, please contact us at privacy@lawnquote.com.</p>
                  </div>
                </PrivacySection>
                
                <PrivacySection 
                  id="contact-us"
                  sectionNumber="6"
                  title="Contact Us"
                  description="Get in touch about privacy questions"
                >
                  <div className="prose prose-lg max-w-none">
                    <p>If you have any questions about this Privacy Policy, please contact us:</p>
                    
                    <ul>
                      <li>Email: privacy@lawnquote.com</li>
                      <li>Address: [Company Address]</li>
                    </ul>
                    
                    <p>This policy was last updated on [Date].</p>
                  </div>
                </PrivacySection>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}
