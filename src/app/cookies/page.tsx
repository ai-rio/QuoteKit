import type { Metadata } from 'next';

import { MarketingLayout } from '@/components/layout/marketing-layout';

import { CookieHero } from './components/cookie-hero';
import { CookieSection } from './components/cookie-section';
import { CookieTableOfContents } from './components/cookie-table-of-contents';

export const metadata: Metadata = {
  title: 'Cookie Policy - LawnQuote',
  description: 'Learn about how LawnQuote uses cookies and similar technologies to improve your experience.',
  keywords: 'cookie policy, web cookies, privacy, landscaping software cookies',
};

export default function CookiesPage() {
  return (
    <MarketingLayout 
      showBreadcrumbs={true}
      
    >
      <div className="min-h-screen bg-light-concrete">
        <CookieHero />
        
        <div className="container mx-auto px-4 py-12 max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Table of Contents - Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-8">
                <CookieTableOfContents />
              </div>
            </div>
            
            {/* Main Content */}
            <div className="lg:col-span-3">
              <div className="bg-paper-white rounded-2xl border border-stone-gray/20 shadow-lg p-8">
                <CookieSection 
                  id="what-are-cookies"
                  sectionNumber="1"
                  title="What Are Cookies"
                  description="Understanding cookies and how they work"
                >
                  <div className="prose prose-lg max-w-none text-charcoal">
                    <p>Cookies are small text files that are stored on your device when you visit our website. They help us provide you with a better experience by remembering your preferences and improving our services.</p>
                    
                    <h4>Types of Cookies:</h4>
                    <ul>
                      <li><strong>Essential Cookies:</strong> Required for the website to function properly</li>
                      <li><strong>Performance Cookies:</strong> Help us understand how visitors use our site</li>
                      <li><strong>Functional Cookies:</strong> Remember your preferences and settings</li>
                      <li><strong>Marketing Cookies:</strong> Used to deliver relevant advertisements</li>
                    </ul>
                  </div>
                </CookieSection>
                
                <CookieSection 
                  id="how-we-use-cookies"
                  sectionNumber="2"
                  title="How We Use Cookies"
                  description="Our specific cookie usage practices"
                >
                  <div className="prose prose-lg max-w-none text-charcoal">
                    <p>We use cookies for various purposes to enhance your experience on our platform:</p>
                    
                    <h4>Authentication & Security</h4>
                    <ul>
                      <li>Keep you logged in to your account</li>
                      <li>Protect against unauthorized access</li>
                      <li>Verify your identity</li>
                    </ul>
                    
                    <h4>Personalization</h4>
                    <ul>
                      <li>Remember your preferences and settings</li>
                      <li>Customize your dashboard layout</li>
                      <li>Save your frequently used items</li>
                    </ul>
                    
                    <h4>Analytics & Performance</h4>
                    <ul>
                      <li>Understand how you use our services</li>
                      <li>Identify areas for improvement</li>
                      <li>Monitor system performance</li>
                    </ul>
                  </div>
                </CookieSection>
                
                <CookieSection 
                  id="cookie-categories"
                  sectionNumber="3"
                  title="Cookie Categories"
                  description="Different types of cookies we use"
                >
                  <div className="prose prose-lg max-w-none text-charcoal">
                    <h4>Strictly Necessary Cookies</h4>
                    <p>These cookies are essential for the website to function and cannot be switched off. They are usually set in response to actions you take, such as logging in or filling out forms.</p>
                    
                    <h4>Performance Cookies</h4>
                    <p>These cookies collect information about how visitors use our website, such as which pages are visited most often. This data helps us improve how our website works.</p>
                    
                    <h4>Functional Cookies</h4>
                    <p>These cookies allow the website to remember choices you make and provide enhanced, more personal features.</p>
                    
                    <h4>Targeting Cookies</h4>
                    <p>These cookies may be set through our site by our advertising partners to build a profile of your interests and show you relevant ads.</p>
                  </div>
                </CookieSection>
                
                <CookieSection 
                  id="managing-cookies"
                  sectionNumber="4"
                  title="Managing Cookies"
                  description="How to control your cookie preferences"
                >
                  <div className="prose prose-lg max-w-none text-charcoal">
                    <p>You have several options for managing cookies:</p>
                    
                    <h4>Browser Settings</h4>
                    <p>Most web browsers allow you to control cookies through their settings preferences. You can:</p>
                    <ul>
                      <li>Block all cookies</li>
                      <li>Allow only first-party cookies</li>
                      <li>Delete existing cookies</li>
                      <li>Set cookies to expire when you close your browser</li>
                    </ul>
                    
                    <h4>Cookie Preferences</h4>
                    <p>You can manage your cookie preferences through our cookie consent banner or by visiting our cookie settings page.</p>
                    
                    <p><strong>Note:</strong> Disabling certain cookies may affect the functionality of our website.</p>
                  </div>
                </CookieSection>
                
                <CookieSection 
                  id="third-party-cookies"
                  sectionNumber="5"
                  title="Third-Party Cookies"
                  description="External services that use cookies"
                >
                  <div className="prose prose-lg max-w-none text-charcoal">
                    <p>We may use third-party services that set their own cookies. These include:</p>
                    
                    <h4>Analytics Services</h4>
                    <ul>
                      <li>Google Analytics - for website usage analysis</li>
                      <li>PostHog - for product analytics</li>
                    </ul>
                    
                    <h4>Payment Processing</h4>
                    <ul>
                      <li>Stripe - for secure payment processing</li>
                    </ul>
                    
                    <h4>Customer Support</h4>
                    <ul>
                      <li>Intercom - for customer support chat</li>
                    </ul>
                    
                    <p>These third parties have their own privacy policies and cookie practices.</p>
                  </div>
                </CookieSection>
                
                <CookieSection 
                  id="contact-us"
                  sectionNumber="6"
                  title="Contact Us"
                  description="Get in touch about cookie questions"
                >
                  <div className="prose prose-lg max-w-none text-charcoal">
                    <p>If you have any questions about our use of cookies, please contact us:</p>
                    
                    <ul>
                      <li>Email: privacy@lawnquote.com</li>
                      <li>Address: [Company Address]</li>
                    </ul>
                    
                    <p>This policy was last updated on [Date].</p>
                  </div>
                </CookieSection>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}
