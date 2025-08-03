import { Metadata } from 'next';
import { GdprHero } from './components/gdpr-hero';
import { GdprSection } from './components/gdpr-section';
import { GdprTableOfContents } from './components/gdpr-table-of-contents';
import { LegalCallout } from '@/components/ui/legal-callout';
import { Separator } from '@/components/ui/separator';

export const metadata: Metadata = {
  title: 'GDPR Compliance - LawnQuote',
  description: 'Learn about your data protection rights under GDPR and how LawnQuote ensures compliance with European data protection regulations.',
  keywords: 'GDPR, data protection, privacy rights, European regulations, data compliance',
  openGraph: {
    title: 'GDPR Compliance - LawnQuote',
    description: 'Learn about your data protection rights under GDPR and how LawnQuote ensures compliance with European data protection regulations.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GDPR Compliance - LawnQuote',
    description: 'Learn about your data protection rights under GDPR and how LawnQuote ensures compliance with European data protection regulations.',
  },
};

export default function GdprPage() {
  return (
    <div className="min-h-screen bg-light-concrete">
      <GdprHero />
      
      {/* GDPR Content */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            
            {/* Table of Contents */}
            <GdprTableOfContents />
            
            {/* Main Content Card */}
            <div className="bg-paper-white p-8 md:p-12 rounded-2xl shadow-lg border border-stone-gray/20 mt-8">
              
              {/* Section 1: Your GDPR Rights */}
              <GdprSection
                id="your-gdpr-rights"
                sectionNumber="1"
                title="Your GDPR Rights"
                description="The fundamental data protection rights you have under the General Data Protection Regulation."
              >
                <LegalCallout>
                  Under GDPR, you have strong rights over your personal data. You can access it, correct it, delete it, move it to another service, or restrict how we use it. You can also object to certain types of processing and withdraw consent at any time.
                </LegalCallout>
                
                <div className="prose-legal text-charcoal/80">
                  <h3 className="text-xl font-bold mt-8 mb-4">1.1. Right to Access</h3>
                  <p className="mb-4">
                    You have the right to know what personal data we hold about you and how we use it. You can request a copy of your personal data at any time through your account dashboard or by contacting us directly.
                  </p>
                  
                  <h3 className="text-xl font-bold mt-8 mb-4">1.2. Right to Rectification</h3>
                  <p className="mb-4">
                    If your personal data is inaccurate or incomplete, you have the right to have it corrected. You can update most of your information directly through your account settings.
                  </p>
                  
                  <h3 className="text-xl font-bold mt-8 mb-4">1.3. Right to Erasure ("Right to be Forgotten")</h3>
                  <p className="mb-4">
                    You can request that we delete your personal data in certain circumstances, such as when it's no longer necessary for the purposes we collected it, or if you withdraw your consent.
                  </p>
                  
                  <h3 className="text-xl font-bold mt-8 mb-4">1.4. Right to Data Portability</h3>
                  <p className="mb-4">
                    You have the right to receive your personal data in a structured, commonly used format and to transmit it to another service provider. We provide data export functionality in your account settings.
                  </p>
                  
                  <h3 className="text-xl font-bold mt-8 mb-4">1.5. Right to Restrict Processing</h3>
                  <p className="mb-4">
                    In certain circumstances, you can ask us to limit how we use your personal data while we resolve any disputes about its accuracy or our right to use it.
                  </p>
                  
                  <h3 className="text-xl font-bold mt-8 mb-4">1.6. Right to Object</h3>
                  <p className="mb-4">
                    You have the right to object to certain types of processing, including processing for direct marketing purposes or processing based on legitimate interests.
                  </p>
                </div>
              </GdprSection>

              <Separator className="my-12" />

              {/* Section 2: Legal Basis for Processing */}
              <GdprSection
                id="legal-basis"
                sectionNumber="2"
                title="Legal Basis for Processing"
                description="The legal grounds under which we process your personal data according to GDPR."
              >
                <LegalCallout>
                  We only process your data when we have a legal reason to do so. Usually, this is because you've given us permission (consent), we need it to provide our service (contract), or we have a legitimate business interest that doesn't override your privacy rights.
                </LegalCallout>
                
                <div className="prose-legal text-charcoal/80">
                  <h3 className="text-xl font-bold mt-8 mb-4">2.1. Contractual Necessity</h3>
                  <p className="mb-4">
                    We process your personal data to provide the LawnQuote service as outlined in our Terms of Service. This includes creating your account, generating quotes, storing your business data, and processing payments.
                  </p>
                  
                  <h3 className="text-xl font-bold mt-8 mb-4">2.2. Legitimate Interests</h3>
                  <p className="mb-4">
                    We may process your data based on our legitimate business interests, such as improving our service, preventing fraud, and ensuring security. We always balance these interests against your privacy rights.
                  </p>
                  
                  <h3 className="text-xl font-bold mt-8 mb-4">2.3. Consent</h3>
                  <p className="mb-4">
                    For certain types of processing, such as marketing communications or non-essential cookies, we rely on your explicit consent. You can withdraw this consent at any time.
                  </p>
                  
                  <h3 className="text-xl font-bold mt-8 mb-4">2.4. Legal Obligations</h3>
                  <p className="mb-4">
                    In some cases, we may need to process your data to comply with legal obligations, such as tax requirements or responding to lawful requests from authorities.
                  </p>
                </div>
              </GdprSection>

              <Separator className="my-12" />

              {/* Section 3: Data Protection Measures */}
              <GdprSection
                id="data-protection"
                sectionNumber="3"
                title="Data Protection Measures"
                description="The technical and organizational measures we implement to protect your personal data."
              >
                <LegalCallout>
                  We take data protection seriously and use industry-standard security measures. This includes encryption, access controls, regular security audits, and staff training. We also have procedures in place to detect and respond to data breaches quickly.
                </LegalCallout>
                
                <div className="prose-legal text-charcoal/80">
                  <h3 className="text-xl font-bold mt-8 mb-4">3.1. Technical Safeguards</h3>
                  <p className="mb-4">
                    We implement appropriate technical measures including encryption in transit and at rest, secure authentication systems, regular security updates, and network security monitoring.
                  </p>
                  
                  <h3 className="text-xl font-bold mt-8 mb-4">3.2. Organizational Measures</h3>
                  <p className="mb-4">
                    Our organizational measures include staff training on data protection, access controls based on the principle of least privilege, regular security audits, and clear data handling procedures.
                  </p>
                  
                  <h3 className="text-xl font-bold mt-8 mb-4">3.3. Data Breach Response</h3>
                  <p className="mb-4">
                    We have procedures in place to detect, investigate, and respond to personal data breaches. If a breach is likely to result in high risk to your rights and freedoms, we will notify you within 72 hours.
                  </p>
                  
                  <h3 className="text-xl font-bold mt-8 mb-4">3.4. Third-Party Processors</h3>
                  <p className="mb-4">
                    We only work with third-party service providers who provide sufficient guarantees regarding data protection. All processors are bound by data processing agreements that ensure GDPR compliance.
                  </p>
                </div>
              </GdprSection>

              <Separator className="my-12" />

              {/* Section 4: International Data Transfers */}
              <GdprSection
                id="data-transfers"
                sectionNumber="4"
                title="International Data Transfers"
                description="How we handle transfers of personal data outside the European Economic Area."
              >
                <LegalCallout>
                  Your data is primarily stored in secure data centers within the EU/EEA. When we do transfer data outside these regions (like to our US-based service providers), we use approved safeguards like Standard Contractual Clauses to ensure your data remains protected.
                </LegalCallout>
                
                <div className="prose-legal text-charcoal/80">
                  <h3 className="text-xl font-bold mt-8 mb-4">4.1. Primary Data Storage</h3>
                  <p className="mb-4">
                    Your personal data is primarily stored and processed within the European Economic Area (EEA) using secure data centers that comply with European data protection standards.
                  </p>
                  
                  <h3 className="text-xl font-bold mt-8 mb-4">4.2. Approved Safeguards</h3>
                  <p className="mb-4">
                    When we transfer personal data outside the EEA, we use appropriate safeguards such as Standard Contractual Clauses (SCCs) approved by the European Commission, or rely on adequacy decisions for certain countries.
                  </p>
                  
                  <h3 className="text-xl font-bold mt-8 mb-4">4.3. Service Provider Agreements</h3>
                  <p className="mb-4">
                    All our service providers who may access your personal data are contractually bound to provide adequate protection and to process data only according to our instructions and applicable data protection laws.
                  </p>
                </div>
              </GdprSection>

              <Separator className="my-12" />

              {/* Section 5: Exercising Your Rights */}
              <GdprSection
                id="exercising-rights"
                sectionNumber="5"
                title="How to Exercise Your Rights"
                description="Practical steps for exercising your GDPR rights and contacting our Data Protection Officer."
              >
                <LegalCallout>
                  Exercising your GDPR rights is easy. Most things you can do directly in your account settings. For other requests, just email our Data Protection Officer. We'll respond within one month and won't charge you unless your request is clearly unfounded or excessive.
                </LegalCallout>
                
                <div className="prose-legal text-charcoal/80">
                  <h3 className="text-xl font-bold mt-8 mb-4">5.1. Self-Service Options</h3>
                  <p className="mb-4">
                    Many of your rights can be exercised directly through your account dashboard, including accessing your data, updating your information, exporting your data, and deleting your account.
                  </p>
                  
                  <h3 className="text-xl font-bold mt-8 mb-4">5.2. Contacting Us</h3>
                  <p className="mb-4">
                    For rights that cannot be exercised through your account, or if you need assistance, you can contact our Data Protection Officer at the email address provided below. Please include sufficient information to verify your identity.
                  </p>
                  
                  <h3 className="text-xl font-bold mt-8 mb-4">5.3. Response Times</h3>
                  <p className="mb-4">
                    We will respond to your request within one month of receipt. In complex cases, we may extend this by up to two additional months, and we will inform you of any such extension and the reasons for it.
                  </p>
                  
                  <h3 className="text-xl font-bold mt-8 mb-4">5.4. Right to Complain</h3>
                  <p className="mb-4">
                    If you are not satisfied with how we handle your personal data or respond to your requests, you have the right to lodge a complaint with your local data protection authority.
                  </p>
                </div>
              </GdprSection>

              <Separator className="my-12" />

              {/* Contact Information */}
              <div className="bg-forest-green/5 p-6 rounded-lg border border-forest-green/20">
                <h2 className="text-2xl font-bold text-forest-green mb-4">Data Protection Officer</h2>
                <p className="text-charcoal/80 mb-4">
                  For any questions about your data protection rights or to exercise your GDPR rights, please contact our Data Protection Officer.
                </p>
                <div className="space-y-2 text-charcoal/80">
                  <p><strong>Email:</strong> dpo@lawnquote.com</p>
                  <p><strong>Address:</strong> Data Protection Officer, LawnQuote, [Company Address]</p>
                </div>
                <p className="text-sm text-charcoal/60 mt-4">
                  This GDPR information was last updated on August 3, 2025.
                </p>
              </div>

            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
