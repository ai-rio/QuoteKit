import { Metadata } from 'next';
import { CookieHero } from './components/cookie-hero';
import { CookieSection } from './components/cookie-section';
import { CookieTableOfContents } from './components/cookie-table-of-contents';
import { LegalCallout } from '@/components/ui/legal-callout';
import { Separator } from '@/components/ui/separator';

export const metadata: Metadata = {
  title: 'Cookie Policy - LawnQuote',
  description: 'Learn how LawnQuote uses cookies to improve your experience and keep your account secure. Simple explanations of our cookie practices.',
  keywords: 'cookie policy, web cookies, privacy, data tracking, landscaping software',
  openGraph: {
    title: 'Cookie Policy - LawnQuote',
    description: 'Learn how LawnQuote uses cookies to improve your experience and keep your account secure. Simple explanations of our cookie practices.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cookie Policy - LawnQuote',
    description: 'Learn how LawnQuote uses cookies to improve your experience and keep your account secure. Simple explanations of our cookie practices.',
  },
};

export default function CookiePage() {
  return (
    <div className="min-h-screen bg-light-concrete">
      <CookieHero />
      
      {/* Cookie Policy Content */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            
            {/* Table of Contents */}
            <CookieTableOfContents />
            
            {/* Main Content Card */}
            <div className="bg-paper-white p-8 md:p-12 rounded-2xl shadow-lg border border-stone-gray/20 mt-8">
              
              {/* Section 1: What Are Cookies */}
              <CookieSection
                id="what-are-cookies"
                sectionNumber="1"
                title="What Are Cookies?"
                description="A simple explanation of cookies and how they work on websites."
              >
                <LegalCallout>
                  Cookies are tiny text files that websites store on your device to remember things like your login status and preferences. Think of them as digital sticky notes that help websites work better for you.
                </LegalCallout>
                
                <div className="prose-legal text-charcoal/80">
                  <h3 className="text-xl font-bold mt-8 mb-4">1.1. Technical Definition</h3>
                  <p className="mb-4">
                    Cookies are small data files that are placed on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently and to provide information to website owners.
                  </p>
                  
                  <h3 className="text-xl font-bold mt-8 mb-4">1.2. How Cookies Work</h3>
                  <p className="mb-4">
                    When you visit LawnQuote, our server sends a cookie to your browser, which stores it on your device. The next time you visit, your browser sends the cookie back to our server, allowing us to recognize you and remember your preferences.
                  </p>
                  
                  <h3 className="text-xl font-bold mt-8 mb-4">1.3. Cookie Lifespan</h3>
                  <p className="mb-4">
                    Some cookies are temporary (session cookies) and are deleted when you close your browser. Others are permanent (persistent cookies) and remain on your device until they expire or you delete them manually.
                  </p>
                </div>
              </CookieSection>

              <Separator className="my-12" />

              {/* Section 2: Types of Cookies We Use */}
              <CookieSection
                id="types-of-cookies"
                sectionNumber="2"
                title="Types of Cookies We Use"
                description="The different categories of cookies used on LawnQuote and their purposes."
              >
                <LegalCallout>
                  We use four main types of cookies: essential ones that make the site work, functional ones that remember your preferences, analytics ones that help us improve the site, and security ones that keep your account safe.
                </LegalCallout>
                
                <div className="prose-legal text-charcoal/80">
                  <h3 className="text-xl font-bold mt-8 mb-4">2.1. Essential Cookies</h3>
                  <p className="mb-4">
                    These cookies are necessary for the website to function properly. They enable core functionality such as security, network management, and accessibility. You cannot opt-out of these cookies as they are essential for the service to work.
                  </p>
                  <ul className="list-disc list-inside mb-4 space-y-2">
                    <li>Authentication cookies to keep you logged in</li>
                    <li>Security cookies to prevent fraud and attacks</li>
                    <li>Load balancing cookies to distribute traffic</li>
                    <li>Cookie consent preferences</li>
                  </ul>
                  
                  <h3 className="text-xl font-bold mt-8 mb-4">2.2. Functional Cookies</h3>
                  <p className="mb-4">
                    These cookies allow the website to remember choices you make and provide enhanced, more personal features. They may be set by us or by third-party providers whose services we have added to our pages.
                  </p>
                  <ul className="list-disc list-inside mb-4 space-y-2">
                    <li>Language and region preferences</li>
                    <li>Theme and display preferences</li>
                    <li>Form data to prevent re-entry</li>
                    <li>Dashboard layout preferences</li>
                  </ul>
                  
                  <h3 className="text-xl font-bold mt-8 mb-4">2.3. Analytics Cookies</h3>
                  <p className="mb-4">
                    These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously. This helps us improve our service and user experience.
                  </p>
                  <ul className="list-disc list-inside mb-4 space-y-2">
                    <li>Page views and user journey tracking</li>
                    <li>Feature usage statistics</li>
                    <li>Performance monitoring</li>
                    <li>Error tracking and debugging</li>
                  </ul>
                  
                  <h3 className="text-xl font-bold mt-8 mb-4">2.4. Marketing Cookies</h3>
                  <p className="mb-4">
                    <strong>Currently not used.</strong> LawnQuote does not use marketing cookies or track users for advertising purposes. We believe in respecting your privacy and not following you around the internet.
                  </p>
                </div>
              </CookieSection>

              <Separator className="my-12" />

              {/* Section 3: Managing Your Cookie Preferences */}
              <CookieSection
                id="managing-cookies"
                sectionNumber="3"
                title="Managing Your Cookie Preferences"
                description="How to control and manage cookies on your device and browser."
              >
                <LegalCallout>
                  You have full control over cookies. You can accept all, reject non-essential ones, or customize your preferences through our cookie banner or your account settings. You can also delete cookies from your browser settings.
                </LegalCallout>
                
                <div className="prose-legal text-charcoal/80">
                  <h3 className="text-xl font-bold mt-8 mb-4">3.1. Cookie Consent Banner</h3>
                  <p className="mb-4">
                    When you first visit LawnQuote, you'll see a cookie consent banner at the bottom of the page. This banner allows you to:
                  </p>
                  <ul className="list-disc list-inside mb-4 space-y-2">
                    <li><strong>Accept All Cookies</strong> - Enable all cookie types for the best experience</li>
                    <li><strong>Reject Non-Essential</strong> - Only allow essential cookies required for basic functionality</li>
                    <li><strong>Customize</strong> - Choose exactly which types of cookies you want to allow</li>
                  </ul>
                  <p className="mb-4">
                    Your choice is remembered for future visits and stored locally on your device.
                  </p>
                  
                  <h3 className="text-xl font-bold mt-8 mb-4">3.2. Account Settings</h3>
                  <p className="mb-4">
                    If you have a LawnQuote account, you can manage your cookie preferences at any time through your account settings. Navigate to Settings → Privacy → Cookie Preferences to update your choices.
                  </p>
                  
                  <h3 className="text-xl font-bold mt-8 mb-4">3.3. Browser Settings</h3>
                  <p className="mb-4">
                    Most web browsers allow you to control cookies through their settings. You can usually find these options in the 'Privacy' or 'Security' section of your browser's settings menu.
                  </p>
                  <ul className="list-disc list-inside mb-4 space-y-2">
                    <li><strong>Chrome:</strong> Settings → Privacy and Security → Cookies and other site data</li>
                    <li><strong>Firefox:</strong> Settings → Privacy & Security → Cookies and Site Data</li>
                    <li><strong>Safari:</strong> Preferences → Privacy → Manage Website Data</li>
                    <li><strong>Edge:</strong> Settings → Cookies and site permissions → Cookies and site data</li>
                  </ul>
                  
                  <h3 className="text-xl font-bold mt-8 mb-4">3.4. Impact of Disabling Cookies</h3>
                  <p className="mb-4">
                    While you can disable cookies, please note that doing so may affect your ability to use certain features of our website:
                  </p>
                  <ul className="list-disc list-inside mb-4 space-y-2">
                    <li>You may need to log in repeatedly</li>
                    <li>Your preferences won't be remembered</li>
                    <li>Some features may not work properly</li>
                    <li>The site may load more slowly</li>
                  </ul>
                  <p className="mb-4">
                    Essential cookies cannot be disabled as they are necessary for the basic functionality of the service.
                  </p>
                </div>
              </CookieSection>

              <Separator className="my-12" />

              {/* Section 4: Third-Party Cookies */}
              <CookieSection
                id="third-party-cookies"
                sectionNumber="4"
                title="Third-Party Cookies"
                description="Information about cookies set by our trusted partners and service providers."
              >
                <LegalCallout>
                  Some cookies come from our trusted partners like Stripe (for payments) and analytics providers. These help us provide better service but follow the same privacy standards. We don't allow advertising cookies or tracking for marketing purposes.
                </LegalCallout>
                
                <div className="prose-legal text-charcoal/80">
                  <h3 className="text-xl font-bold mt-8 mb-4">4.1. Payment Processing</h3>
                  <p className="mb-4">
                    Stripe, our payment processor, may set cookies to ensure secure payment processing and fraud prevention. These cookies are essential for handling your subscription and payment information safely.
                  </p>
                  
                  <h3 className="text-xl font-bold mt-8 mb-4">4.2. Analytics Services</h3>
                  <p className="mb-4">
                    We use privacy-focused analytics services to understand how our website is used. These services may set cookies to track page views and user interactions in an anonymized manner. These cookies are only set if you consent to analytics cookies.
                  </p>
                  
                  <h3 className="text-xl font-bold mt-8 mb-4">4.3. Content Delivery</h3>
                  <p className="mb-4">
                    Our hosting provider (Vercel) may set cookies to optimize content delivery and ensure fast loading times. These cookies help provide a better user experience and are considered essential for performance.
                  </p>
                  
                  <h3 className="text-xl font-bold mt-8 mb-4">4.4. No Advertising Networks</h3>
                  <p className="mb-4">
                    We do not work with advertising networks or allow third-party advertising cookies on our website. Your browsing behavior on LawnQuote is not tracked for advertising purposes.
                  </p>
                </div>
              </CookieSection>

              <Separator className="my-12" />

              {/* Contact Information */}
              <div className="bg-forest-green/5 p-6 rounded-lg border border-forest-green/20">
                <h2 className="text-2xl font-bold text-forest-green mb-4">Questions About Cookies?</h2>
                <p className="text-charcoal/80 mb-4">
                  If you have any questions about our use of cookies or need help managing your preferences, please contact us.
                </p>
                <div className="space-y-2 text-charcoal/80">
                  <p><strong>Email:</strong> privacy@lawnquote.com</p>
                  <p><strong>Address:</strong> LawnQuote Privacy Team, [Company Address]</p>
                </div>
                <p className="text-sm text-charcoal/60 mt-4">
                  This cookie policy was last updated on August 3, 2025.
                </p>
              </div>

            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
