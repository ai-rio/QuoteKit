import { Metadata } from 'next';
import { MarketingLayout } from '@/components/layout/marketing-layout';
import { TermsHero } from './components/terms-hero';
import { TermsSection } from './components/terms-section';
import { TermsTableOfContents } from './components/terms-table-of-contents';
import { LegalCallout } from '@/components/ui/legal-callout';
import { Separator } from '@/components/ui/separator';

export const metadata: Metadata = {
  title: 'Terms of Service - LawnQuote',
  description: 'Our agreement with you. Clear, understandable terms for using LawnQuote to grow your landscaping business.',
  keywords: 'terms of service, user agreement, landscaping software, business terms',
  openGraph: {
    title: 'Terms of Service - LawnQuote',
    description: 'Our agreement with you. Clear, understandable terms for using LawnQuote to grow your landscaping business.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Terms of Service - LawnQuote',
    description: 'Our agreement with you. Clear, understandable terms for using LawnQuote to grow your landscaping business.',
  },
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-light-concrete">
      <TermsHero />
      
      {/* Terms of Service Content */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            
            {/* Table of Contents */}
            <TermsTableOfContents />
            
            {/* Main Content Card */}
            <div className="bg-paper-white p-8 md:p-12 rounded-2xl shadow-lg border border-stone-gray/20 mt-8">
              
              {/* Section 1: Your Account & Responsibilities */}
              <TermsSection
                id="account-responsibilities"
                sectionNumber="1"
                title="Your Account & Responsibilities"
                description="This section covers your role in keeping your account secure and using our service fairly."
              >
                <LegalCallout>
                  You're responsible for your account. Keep your password safe. Please use our service for your landscaping business as intended, not for anything illegal or harmful. You own all the business data you put into LawnQuote.
                </LegalCallout>
                
                <div className="prose-legal text-charcoal/80">
                  <h3 className="text-xl font-bold mt-8 mb-4">1.1. Account Security</h3>
                  <p className="mb-4">
                    You are responsible for safeguarding your password and for all activities that occur under your account. You must notify us immediately upon becoming aware of any breach of security or unauthorized use of your account.
                  </p>
                  
                  <h3 className="text-xl font-bold mt-8 mb-4">1.2. Acceptable Use</h3>
                  <p className="mb-4">
                    You agree not to use the Service for any unlawful purpose or to engage in any activity that would disrupt or harm the Service or its users. This includes, but is not limited to, uploading malicious software or attempting to access accounts that do not belong to you.
                  </p>
                  
                  <h3 className="text-xl font-bold mt-8 mb-4">1.3. Ownership of Your Data</h3>
                  <p className="mb-4">
                    You retain full ownership of all the content and data you create and upload to the Service, including your client lists, item pricing, and quotes ("User Content"). We do not claim any ownership rights over your User Content.
                  </p>
                </div>
              </TermsSection>

              <Separator className="my-12" />

              {/* Section 2: Our Service & Limitations */}
              <TermsSection
                id="service-limitations"
                sectionNumber="2"
                title="Our Service & Limitations"
                description="This is our promise to you about the service we provide, and the reality of running a software tool."
              >
                <LegalCallout>
                  We'll do our best to keep LawnQuote running smoothly, but we can't promise it will be perfect 100% of the time. We're constantly improving the tool, which means things might change. We are not responsible for business losses if something goes wrong, but we promise to act in good faith to resolve any issues.
                </LegalCallout>
                
                <div className="prose-legal text-charcoal/80">
                  <h3 className="text-xl font-bold mt-8 mb-4">2.1. Service Availability</h3>
                  <p className="mb-4">
                    We will make reasonable efforts to ensure the Service is available to you. However, access may be interrupted for maintenance, upgrades, or emergency repairs. We will try to provide advance notice of any planned downtime.
                  </p>
                  
                  <h3 className="text-xl font-bold mt-8 mb-4">2.2. Service Changes</h3>
                  <p className="mb-4">
                    We reserve the right to modify or discontinue, temporarily or permanently, the Service (or any part thereof) with or without notice. We will make reasonable efforts to notify users of significant changes that may affect their use of the Service.
                  </p>
                  
                  <h3 className="text-xl font-bold mt-8 mb-4">2.3. Limitation of Liability</h3>
                  <p className="mb-4">
                    To the maximum extent permitted by law, LawnQuote shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.
                  </p>
                </div>
              </TermsSection>

              <Separator className="my-12" />

              {/* Section 3: Payment & Subscription */}
              <TermsSection
                id="payment-subscription"
                sectionNumber="3"
                title="Payment & Subscription"
                description="This covers the terms for our Freemium and Pro plans."
              >
                <LegalCallout>
                  Our Free plan is free forever and includes 5 quotes per month. If you upgrade to Pro, you'll be billed monthly or yearly. You can cancel your Pro plan at any time, and you'll retain access until the end of your billing period. If you cancel, your account will revert to the Free plan.
                </LegalCallout>
                
                <div className="prose-legal text-charcoal/80">
                  <h3 className="text-xl font-bold mt-8 mb-4">3.1. Freemium Plan</h3>
                  <p className="mb-4">
                    The free tier of our Service allows you to create a limited number of quotes per calendar month as specified on our Pricing page. This plan is offered free of charge and can be used indefinitely.
                  </p>
                  
                  <h3 className="text-xl font-bold mt-8 mb-4">3.2. Pro Subscription</h3>
                  <p className="mb-4">
                    For paid subscriptions, you will be billed in advance on a recurring and periodic basis ("Billing Cycle"). Billing cycles are set either on a monthly or annual basis. Your Subscription will automatically renew under the exact same conditions unless you cancel it or LawnQuote cancels it.
                  </p>
                  
                  <h3 className="text-xl font-bold mt-8 mb-4">3.3. Cancellation</h3>
                  <p className="mb-4">
                    You may cancel your Subscription renewal at any time through your account settings page. You will not receive a refund for the fees you already paid for your current subscription period, and you will be able to access the Service until the end of your current subscription period.
                  </p>
                  
                  <h3 className="text-xl font-bold mt-8 mb-4">3.4. Refunds</h3>
                  <p className="mb-4">
                    We offer a 30-day money-back guarantee for new Pro subscriptions. If you're not satisfied with the Service within the first 30 days of your initial subscription, contact us for a full refund.
                  </p>
                </div>
              </TermsSection>

              <Separator className="my-12" />

              {/* Section 4: Intellectual Property */}
              <TermsSection
                id="intellectual-property"
                sectionNumber="4"
                title="Intellectual Property"
                description="This covers ownership of the LawnQuote software and your business data."
              >
                <LegalCallout>
                  We own the LawnQuote software, but you own all your business data. You can't copy our software, but you can export your data anytime. We respect your intellectual property and expect the same from you.
                </LegalCallout>
                
                <div className="prose-legal text-charcoal/80">
                  <h3 className="text-xl font-bold mt-8 mb-4">4.1. LawnQuote Ownership</h3>
                  <p className="mb-4">
                    The Service and its original content, features, and functionality are and will remain the exclusive property of LawnQuote and its licensors. The Service is protected by copyright, trademark, and other laws.
                  </p>
                  
                  <h3 className="text-xl font-bold mt-8 mb-4">4.2. Your Content Rights</h3>
                  <p className="mb-4">
                    You retain all rights to your User Content. By using our Service, you grant us a limited license to use, store, and display your User Content solely for the purpose of providing the Service to you.
                  </p>
                  
                  <h3 className="text-xl font-bold mt-8 mb-4">4.3. Trademark Usage</h3>
                  <p className="mb-4">
                    You may not use our trademarks, service marks, or logos without our prior written consent. This includes using our name or branding in a way that could cause confusion about the source of your services.
                  </p>
                </div>
              </TermsSection>

              <Separator className="my-12" />

              {/* Section 5: Termination */}
              <TermsSection
                id="termination"
                sectionNumber="5"
                title="Termination"
                description="How and when this agreement can end, and what happens to your data."
              >
                <LegalCallout>
                  You can stop using LawnQuote anytime by deleting your account. We can suspend accounts that violate these terms, but we'll try to work with you first. If your account is terminated, you can export your data before it's deleted.
                </LegalCallout>
                
                <div className="prose-legal text-charcoal/80">
                  <h3 className="text-xl font-bold mt-8 mb-4">5.1. Termination by You</h3>
                  <p className="mb-4">
                    You may terminate your account at any time by following the account deletion process in your account settings. Upon termination, your right to use the Service will cease immediately.
                  </p>
                  
                  <h3 className="text-xl font-bold mt-8 mb-4">5.2. Termination by Us</h3>
                  <p className="mb-4">
                    We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms. We will make reasonable efforts to provide notice and opportunity to remedy violations before termination.
                  </p>
                  
                  <h3 className="text-xl font-bold mt-8 mb-4">5.3. Data Retention</h3>
                  <p className="mb-4">
                    Upon termination, we will provide you with a reasonable opportunity to export your User Content. After 30 days, we may delete your User Content from our systems, except as required by law.
                  </p>
                </div>
              </TermsSection>

              <Separator className="my-12" />

              {/* Contact Information */}
              <div className="bg-forest-green/5 p-6 rounded-lg border border-forest-green/20">
                <h2 className="text-2xl font-bold text-forest-green mb-4">Questions About These Terms?</h2>
                <p className="text-charcoal/80 mb-4">
                  If you have any questions about these terms of service or need clarification on any point, please don't hesitate to contact us.
                </p>
                <div className="space-y-2 text-charcoal/80">
                  <p><strong>Email:</strong> legal@lawnquote.com</p>
                  <p><strong>Address:</strong> LawnQuote Legal Team, [Company Address]</p>
                </div>
                <p className="text-sm text-charcoal/60 mt-4">
                  These terms were last updated on August 3, 2025. We'll notify you of any significant changes.
                </p>
              </div>

            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
