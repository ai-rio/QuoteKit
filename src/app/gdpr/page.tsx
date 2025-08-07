import type { Metadata } from 'next';

import { MarketingLayout } from '@/components/layout/marketing-layout';

import { GdprHero } from './components/gdpr-hero';
import { GdprSection } from './components/gdpr-section';
import { GdprTableOfContents } from './components/gdpr-table-of-contents';

export const metadata: Metadata = {
  title: 'GDPR Compliance - LawnQuote',
  description: 'Learn about LawnQuote\'s commitment to GDPR compliance and how we protect your personal data.',
  keywords: 'GDPR compliance, data protection, privacy rights, landscaping software GDPR',
};

export default function GdprPage() {
  return (
    <MarketingLayout 
      showBreadcrumbs={true}
      
    >
      <div className="min-h-screen bg-light-concrete">
        <GdprHero />
        
        <div className="container mx-auto px-4 py-12 max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Table of Contents - Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-8">
                <GdprTableOfContents />
              </div>
            </div>
            
            {/* Main Content */}
            <div className="lg:col-span-3">
              <div className="bg-paper-white rounded-2xl border border-stone-gray/20 shadow-lg p-8">
                <GdprSection 
                  id="our-commitment"
                  sectionNumber="1"
                  title="Our Commitment to GDPR"
                  description="Our approach to data protection"
                >
                  <div className="prose prose-lg max-w-none text-charcoal">
                    <p>LawnQuote is committed to protecting your personal data and respecting your privacy rights under the General Data Protection Regulation (GDPR).</p>
                    
                    <p>We have implemented comprehensive measures to ensure compliance with GDPR requirements and to give you control over your personal data.</p>
                    
                    <h4>Key Principles:</h4>
                    <ul>
                      <li>Lawfulness, fairness, and transparency</li>
                      <li>Purpose limitation</li>
                      <li>Data minimization</li>
                      <li>Accuracy</li>
                      <li>Storage limitation</li>
                      <li>Integrity and confidentiality</li>
                      <li>Accountability</li>
                    </ul>
                  </div>
                </GdprSection>
                
                <GdprSection 
                  id="your-rights"
                  sectionNumber="2"
                  title="Your Rights Under GDPR"
                  description="Your data protection rights"
                >
                  <div className="prose prose-lg max-w-none text-charcoal">
                    <p>Under GDPR, you have several rights regarding your personal data:</p>
                    
                    <h4>Right to Information</h4>
                    <p>You have the right to be informed about how we collect and use your personal data.</p>
                    
                    <h4>Right of Access</h4>
                    <p>You can request access to your personal data and receive a copy of the data we process about you.</p>
                    
                    <h4>Right to Rectification</h4>
                    <p>You can request that we correct any inaccurate or incomplete personal data.</p>
                    
                    <h4>Right to Erasure</h4>
                    <p>You can request that we delete your personal data in certain circumstances.</p>
                    
                    <h4>Right to Restrict Processing</h4>
                    <p>You can request that we limit how we use your personal data in certain situations.</p>
                    
                    <h4>Right to Data Portability</h4>
                    <p>You can request a copy of your data in a structured, machine-readable format.</p>
                    
                    <h4>Right to Object</h4>
                    <p>You can object to certain types of processing, including direct marketing.</p>
                  </div>
                </GdprSection>
                
                <GdprSection 
                  id="legal-basis"
                  sectionNumber="3"
                  title="Legal Basis for Processing"
                  description="Why we process your data"
                >
                  <div className="prose prose-lg max-w-none text-charcoal">
                    <p>We process your personal data based on the following legal grounds:</p>
                    
                    <h4>Contract Performance</h4>
                    <p>Processing necessary to provide our services and fulfill our contractual obligations to you.</p>
                    
                    <h4>Legitimate Interest</h4>
                    <p>Processing necessary for our legitimate business interests, such as:</p>
                    <ul>
                      <li>Improving our services</li>
                      <li>Ensuring security and preventing fraud</li>
                      <li>Direct marketing (where you haven&apos;t opted out)</li>
                    </ul>
                    
                    <h4>Consent</h4>
                    <p>Where you have given clear consent for specific processing activities.</p>
                    
                    <h4>Legal Obligation</h4>
                    <p>Where processing is necessary to comply with legal requirements.</p>
                  </div>
                </GdprSection>
                
                <GdprSection 
                  id="data-transfers"
                  sectionNumber="4"
                  title="International Data Transfers"
                  description="How we handle cross-border data transfers"
                >
                  <div className="prose prose-lg max-w-none text-charcoal">
                    <p>We may transfer your personal data outside the European Economic Area (EEA) to provide our services.</p>
                    
                    <h4>Safeguards:</h4>
                    <ul>
                      <li>Standard Contractual Clauses approved by the European Commission</li>
                      <li>Adequacy decisions for certain countries</li>
                      <li>Appropriate technical and organizational measures</li>
                    </ul>
                    
                    <p>We ensure that any international transfers comply with GDPR requirements and provide adequate protection for your data.</p>
                  </div>
                </GdprSection>
                
                <GdprSection 
                  id="data-retention"
                  sectionNumber="5"
                  title="Data Retention"
                  description="How long we keep your data"
                >
                  <div className="prose prose-lg max-w-none text-charcoal">
                    <p>We retain your personal data only for as long as necessary to fulfill the purposes for which it was collected.</p>
                    
                    <h4>Retention Periods:</h4>
                    <ul>
                      <li><strong>Account Data:</strong> Retained while your account is active and for 30 days after deletion</li>
                      <li><strong>Transaction Data:</strong> Retained for 7 years for accounting and legal purposes</li>
                      <li><strong>Marketing Data:</strong> Retained until you opt out or for 3 years of inactivity</li>
                      <li><strong>Support Data:</strong> Retained for 2 years after the last interaction</li>
                    </ul>
                  </div>
                </GdprSection>
                
                <GdprSection 
                  id="exercising-rights"
                  sectionNumber="6"
                  title="How to Exercise Your Rights"
                  description="Making data protection requests"
                >
                  <div className="prose prose-lg max-w-none text-charcoal">
                    <p>To exercise any of your GDPR rights, please contact us using the following methods:</p>
                    
                    <h4>Contact Information:</h4>
                    <ul>
                      <li>Email: gdpr@lawnquote.com</li>
                      <li>Subject Line: &quot;GDPR Request - [Type of Request]&quot;</li>
                      <li>Include: Your full name, email address, and specific request details</li>
                    </ul>
                    
                    <h4>Response Time:</h4>
                    <p>We will respond to your request within one month of receipt. In complex cases, we may extend this period by two additional months.</p>
                    
                    <h4>Verification:</h4>
                    <p>We may need to verify your identity before processing your request to protect your personal data.</p>
                    
                    <h4>Right to Complain:</h4>
                    <p>If you&apos;re not satisfied with our response, you have the right to lodge a complaint with your local data protection authority.</p>
                  </div>
                </GdprSection>
                
                <GdprSection 
                  id="contact-dpo"
                  sectionNumber="7"
                  title="Contact Our Data Protection Officer"
                  description="Direct contact for data protection matters"
                >
                  <div className="prose prose-lg max-w-none text-charcoal">
                    <p>If you have any questions about our GDPR compliance or data protection practices, you can contact our Data Protection Officer:</p>
                    
                    <ul>
                      <li>Email: dpo@lawnquote.com</li>
                      <li>Address: [DPO Address]</li>
                    </ul>
                    
                    <p>This policy was last updated on [Date].</p>
                  </div>
                </GdprSection>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}
