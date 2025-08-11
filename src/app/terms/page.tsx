import type { Metadata } from 'next';

import { MarketingLayout } from '@/components/layout/marketing-layout';

import { TermsHero } from './components/terms-hero';
import { TermsSection } from './components/terms-section';
import { TermsTableOfContents } from './components/terms-table-of-contents';

export const metadata: Metadata = {
  title: 'Terms of Service - LawnQuote',
  description: 'Read our terms of service to understand your rights and responsibilities when using LawnQuote.',
  keywords: 'terms of service, user agreement, landscaping software terms',
};

export default function TermsPage() {
  return (
    <MarketingLayout 
      showBreadcrumbs={true}
      
    >
      <div className="min-h-screen bg-light-concrete">
        <TermsHero />
        
        <div className="container mx-auto px-4 py-12 max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Table of Contents - Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-8">
                <TermsTableOfContents />
              </div>
            </div>
            
            {/* Main Content */}
            <div className="lg:col-span-3">
              <div className="bg-paper-white rounded-2xl border border-stone-gray/20 shadow-lg p-8">
                <TermsSection 
                  id="acceptance"
                  sectionNumber="1"
                  title="Acceptance of Terms"
                  description="Agreement to these terms"
                >
                  <div className="prose prose-lg max-w-none text-charcoal">
                    <p>By accessing and using LawnQuote, you accept and agree to be bound by the terms and provision of this agreement.</p>
                    
                    <p>If you do not agree to abide by the above, please do not use this service.</p>
                  </div>
                </TermsSection>
                
                <TermsSection 
                  id="service-description"
                  sectionNumber="2"
                  title="Service Description"
                  description="What LawnQuote provides"
                >
                  <div className="prose prose-lg max-w-none text-charcoal">
                    <p>LawnQuote is a professional quoting and business management platform designed for landscaping professionals.</p>
                    
                    <h4>Our Services Include:</h4>
                    <ul>
                      <li>Quote creation and management</li>
                      <li>Client relationship management</li>
                      <li>Business analytics and reporting</li>
                      <li>Item library and pricing tools</li>
                    </ul>
                  </div>
                </TermsSection>
                
                <TermsSection 
                  id="user-accounts"
                  sectionNumber="3"
                  title="User Accounts"
                  description="Account responsibilities and requirements"
                >
                  <div className="prose prose-lg max-w-none text-charcoal">
                    <p>To access certain features of our service, you must create an account and provide accurate information.</p>
                    
                    <h4>Account Responsibilities:</h4>
                    <ul>
                      <li>Maintain the security of your account credentials</li>
                      <li>Provide accurate and current information</li>
                      <li>Notify us of any unauthorized use</li>
                      <li>Comply with all applicable laws and regulations</li>
                    </ul>
                  </div>
                </TermsSection>
                
                <TermsSection 
                  id="acceptable-use"
                  sectionNumber="4"
                  title="Acceptable Use"
                  description="Rules for using our service"
                >
                  <div className="prose prose-lg max-w-none text-charcoal">
                    <p>You agree to use our service only for lawful purposes and in accordance with these terms.</p>
                    
                    <h4>Prohibited Activities:</h4>
                    <ul>
                      <li>Violating any applicable laws or regulations</li>
                      <li>Infringing on intellectual property rights</li>
                      <li>Transmitting harmful or malicious content</li>
                      <li>Attempting to gain unauthorized access</li>
                    </ul>
                  </div>
                </TermsSection>
                
                <TermsSection 
                  id="payment-terms"
                  sectionNumber="5"
                  title="Payment Terms"
                  description="Billing and payment policies"
                >
                  <div className="prose prose-lg max-w-none text-charcoal">
                    <p>Certain features of our service require payment of fees.</p>
                    
                    <h4>Billing:</h4>
                    <ul>
                      <li>Fees are billed in advance on a subscription basis</li>
                      <li>All fees are non-refundable unless otherwise stated</li>
                      <li>We may change our fees with 30 days notice</li>
                      <li>Failure to pay may result in service suspension</li>
                    </ul>
                  </div>
                </TermsSection>
                
                <TermsSection 
                  id="limitation-of-liability"
                  sectionNumber="6"
                  title="Limitation of Liability"
                  description="Legal limitations and disclaimers"
                >
                  <div className="prose prose-lg max-w-none text-charcoal">
                    <p>In no event shall LawnQuote be liable for any indirect, incidental, special, consequential, or punitive damages.</p>
                    
                    <p>Our total liability shall not exceed the amount paid by you for the service during the twelve months preceding the claim.</p>
                  </div>
                </TermsSection>
                
                <TermsSection 
                  id="contact-information"
                  sectionNumber="7"
                  title="Contact Information"
                  description="How to reach us about these terms"
                >
                  <div className="prose prose-lg max-w-none text-charcoal">
                    <p>If you have any questions about these Terms of Service, please contact us:</p>
                    
                    <ul>
                      <li>Email: legal@lawnquote.online</li>
                      <li>Address: [Company Address]</li>
                    </ul>
                    
                    <p>These terms were last updated on [Date].</p>
                  </div>
                </TermsSection>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}
