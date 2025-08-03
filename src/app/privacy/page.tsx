import { Metadata } from 'next';
import { PrivacyHero } from './components/privacy-hero';
import { PrivacySection } from './components/privacy-section';
import { TableOfContents } from './components/table-of-contents';
import { LegalCallout } from '@/components/ui/legal-callout';
import { Separator } from '@/components/ui/separator';

export const metadata: Metadata = {
  title: 'Privacy Policy - LawnQuote',
  description: 'Your data is your business. We protect it. Learn how LawnQuote handles your business information with transparency and security.',
  keywords: 'privacy policy, data protection, landscaping software, business data security',
  openGraph: {
    title: 'Privacy Policy - LawnQuote',
    description: 'Your data is your business. We protect it. Learn how LawnQuote handles your business information with transparency and security.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Privacy Policy - LawnQuote',
    description: 'Your data is your business. We protect it. Learn how LawnQuote handles your business information with transparency and security.',
  },
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-light-concrete">
      <PrivacyHero />
      
      {/* Privacy Policy Content */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            
            {/* Table of Contents */}
            <TableOfContents />
            
            {/* Main Content Card */}
            <div className="bg-paper-white p-8 md:p-12 rounded-2xl shadow-lg border border-stone-gray/20 mt-8">
              
              {/* Section 1: Information We Collect */}
              <PrivacySection
                id="information-we-collect"
                sectionNumber="1"
                title="Information We Collect"
                description="To provide our service, we need to collect some basic information. We only ask for what's necessary to make LawnQuote work for you."
              >
                <LegalCallout>
                  We collect three types of information: what you tell us (like your name and company), what you create in the app (like your quotes), and payment info (handled securely by Stripe).
                </LegalCallout>
                
                <div className="prose-legal text-charcoal/80">
                  <h3 className="text-xl font-bold mt-8 mb-4">1.1. Information You Provide to Us</h3>
                  <p className="mb-4">
                    This includes personal and business data you give us when you create an account, configure your settings, or contact support. This data includes your name, email address, password, company name, address, phone number, and company logo.
                  </p>
                  
                  <h3 className="text-xl font-bold mt-8 mb-4">1.2. Your Business Data</h3>
                  <p className="mb-4">
                    This is the data you create within the application, such as your list of services and materials ("Line Items"), their costs, client information, and the quotes you generate. This data is fundamental to the functionality of the application.
                  </p>
                  
                  <h3 className="text-xl font-bold mt-8 mb-4">1.3. Payment Information</h3>
                  <p className="mb-4">
                    When you upgrade to a Pro plan, we do not directly store your credit card information. All payments are processed by our secure, PCI-compliant payment partner, Stripe. We only receive a token representing your payment method and subscription status.
                  </p>
                </div>
              </PrivacySection>

              <Separator className="my-12" />

              {/* Section 2: How We Use Your Information */}
              <PrivacySection
                id="how-we-use-information"
                sectionNumber="2"
                title="How We Use Your Information"
                description="Our goal is to use your data to make your life easier. We never sell your data."
              >
                <LegalCallout>
                  We use your info to make the app work, like putting your company name on your quotes. We also use it to communicate with you and improve the product. We will never sell your client list or pricing to anyone.
                </LegalCallout>
                
                <div className="prose-legal text-charcoal/80">
                  <h3 className="text-xl font-bold mt-8 mb-4">2.1. To Provide and Maintain the Service</h3>
                  <p className="mb-4">
                    Your company information and logo are used to brand the PDF quotes you generate. Your list of line items is stored so you can quickly add them to new quotes. Your client data is saved for your records.
                  </p>
                  
                  <h3 className="text-xl font-bold mt-8 mb-4">2.2. To Communicate With You</h3>
                  <p className="mb-4">
                    We use your email address to send important service updates, notifications about your account, and information about new features. You can opt-out of marketing communications at any time.
                  </p>
                  
                  <h3 className="text-xl font-bold mt-8 mb-4">2.3. To Improve Our Service</h3>
                  <p className="mb-4">
                    We may analyze anonymized usage data (e.g., which features are used most often) to understand how we can make LawnQuote better. This data is aggregated and never contains your personal or specific business information.
                  </p>
                </div>
              </PrivacySection>

              <Separator className="my-12" />

              {/* Section 3: Data Security */}
              <PrivacySection
                id="data-security"
                sectionNumber="3"
                title="Data Security"
                description="We take the security of your business data seriously, employing industry-standard practices to protect it."
              >
                <LegalCallout>
                  Your data is yours, not ours. It's protected by strong security measures. Your client list is private to your account. We use trusted, industry-leading partners like Supabase and Stripe to handle data storage and payments.
                </LegalCallout>
                
                <div className="prose-legal text-charcoal/80">
                  <h3 className="text-xl font-bold mt-8 mb-4">3.1. Technical Safeguards</h3>
                  <p className="mb-4">
                    We use industry-standard encryption (SSL/TLS) for all data transmitted between your device and our servers. Our database, managed by Supabase, employs robust security protocols, including Row Level Security, to ensure your data is isolated and accessible only by you.
                  </p>
                  
                  <h3 className="text-xl font-bold mt-8 mb-4">3.2. Your Control</h3>
                  <p className="mb-4">
                    You have full control to add, edit, and delete your business data (line items, clients, quotes) at any time. If you choose to delete your account, all associated business data will be permanently removed from our active databases.
                  </p>
                </div>
              </PrivacySection>

              <Separator className="my-12" />

              {/* Section 4: Data Sharing and Third Parties */}
              <PrivacySection
                id="data-sharing"
                sectionNumber="4"
                title="Data Sharing and Third Parties"
                description="We work with trusted partners to provide our service, but we never sell your data."
              >
                <LegalCallout>
                  We only share your data with trusted partners who help us run the service (like Supabase for data storage and Stripe for payments). We never sell your information to advertisers or marketers.
                </LegalCallout>
                
                <div className="prose-legal text-charcoal/80">
                  <h3 className="text-xl font-bold mt-8 mb-4">4.1. Service Providers</h3>
                  <p className="mb-4">
                    We work with carefully selected third-party service providers who help us operate LawnQuote. These include Supabase (database hosting), Stripe (payment processing), and Vercel (application hosting). These partners are bound by strict data protection agreements.
                  </p>
                  
                  <h3 className="text-xl font-bold mt-8 mb-4">4.2. Legal Requirements</h3>
                  <p className="mb-4">
                    We may disclose your information if required by law, such as in response to a valid court order or government request. We will notify you of such requests unless prohibited by law.
                  </p>
                  
                  <h3 className="text-xl font-bold mt-8 mb-4">4.3. Business Transfers</h3>
                  <p className="mb-4">
                    In the unlikely event that LawnQuote is acquired or merged with another company, your data would be transferred as part of that transaction. We would notify you of any such change in ownership.
                  </p>
                </div>
              </PrivacySection>

              <Separator className="my-12" />

              {/* Section 5: Your Rights and Choices */}
              <PrivacySection
                id="your-rights"
                sectionNumber="5"
                title="Your Rights and Choices"
                description="You have full control over your data and can manage your privacy preferences at any time."
              >
                <LegalCallout>
                  You can access, update, or delete your data anytime. You can also export your quotes and client information. If you delete your account, we'll remove all your data from our systems.
                </LegalCallout>
                
                <div className="prose-legal text-charcoal/80">
                  <h3 className="text-xl font-bold mt-8 mb-4">5.1. Access and Portability</h3>
                  <p className="mb-4">
                    You can access all your data through your account dashboard. You can export your quotes as PDFs and your client information as CSV files at any time.
                  </p>
                  
                  <h3 className="text-xl font-bold mt-8 mb-4">5.2. Correction and Updates</h3>
                  <p className="mb-4">
                    You can update your personal information, company details, and business data directly through the application interface.
                  </p>
                  
                  <h3 className="text-xl font-bold mt-8 mb-4">5.3. Deletion</h3>
                  <p className="mb-4">
                    You can delete your account and all associated data at any time through your account settings. This action is permanent and cannot be undone.
                  </p>
                </div>
              </PrivacySection>

              <Separator className="my-12" />

              {/* Contact Information */}
              <div className="bg-forest-green/5 p-6 rounded-lg border border-forest-green/20">
                <h2 className="text-2xl font-bold text-forest-green mb-4">Questions About This Policy?</h2>
                <p className="text-charcoal/80 mb-4">
                  If you have any questions about this privacy policy or how we handle your data, please don't hesitate to contact us.
                </p>
                <div className="space-y-2 text-charcoal/80">
                  <p><strong>Email:</strong> privacy@lawnquote.com</p>
                  <p><strong>Address:</strong> LawnQuote Privacy Team, [Company Address]</p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
