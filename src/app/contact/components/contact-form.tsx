'use client';

import Image from 'next/image';
import { useState } from 'react';

import { useContactForm } from '../hooks/use-contact-form';

const contactReasons = [
  'I have a question about LawnQuote',
  'I have a feature idea',
  'I need help with my account',
  'Billing or subscription question',
  'I\'m from the press',
  'Partnership opportunity',
  'Just want to say hi!',
];

export function ContactForm() {
  const { submitForm, isSubmitting, isSubmitted, error, resetForm } = useContactForm();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    reason: contactReasons[0],
    message: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitForm(formData);
  };

  const handleSendAnother = () => {
    resetForm();
    setFormData({
      fullName: '',
      email: '',
      reason: contactReasons[0],
      message: '',
    });
  };

  if (isSubmitted) {
    return (
      <section className="bg-light-concrete py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-paper-white p-8 rounded-2xl shadow-lg border border-stone-gray/20">
              <div className="w-16 h-16 bg-forest-green/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-forest-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-3xl font-black text-charcoal mb-4">Message Sent!</h2>
              <p className="text-lg text-charcoal/90 mb-6">
                Thanks for reaching out. We'll get back to you within 24 hours.
              </p>
              <button
                onClick={handleSendAnother}
                className="bg-equipment-yellow text-charcoal font-bold px-8 py-4 rounded-lg hover:brightness-110 transition-all duration-200 shadow-lg hover:shadow-xl text-lg"
              >
                Send Another Message
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-light-concrete py-20">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-12">
          {/* Left: Personal Note & Contact Info */}
          <div className="md:col-span-1 space-y-6">
            {/* Personal Note */}
            <div className="bg-paper-white p-6 rounded-2xl shadow-sm border border-stone-gray/20">
              <div className="relative w-20 h-20 mx-auto mb-4">
                <Image
                  src="https://placehold.co/100x100/2A3D2F/FFFFFF?text=J&font=source-sans-pro"
                  alt="Founder of LawnQuote"
                  fill
                  className="rounded-full object-cover"
                />
              </div>
              <h3 className="text-center font-bold text-lg text-charcoal mb-3">
                A Note from John
              </h3>
              <p className="text-center text-sm text-charcoal/90 leading-relaxed">
                "Your feedback directly shapes the future of this tool. If you have an idea that would make your life easier, I genuinely want to hear it. Let's build the best quoting tool for the trade, together."
              </p>
            </div>

            {/* Quick Contact Info */}
            <div className="bg-paper-white p-6 rounded-2xl shadow-sm border border-stone-gray/20">
              <h4 className="font-bold text-charcoal mb-4">Other Ways to Reach Us</h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-forest-green/10 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-forest-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-charcoal">Email</p>
                    <p className="text-sm text-charcoal/90">hello@lawnquote.com</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-forest-green/10 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-forest-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-charcoal">Response Time</p>
                    <p className="text-sm text-charcoal/90">Usually within 24 hours</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Contact Form */}
          <div className="md:col-span-2">
            <div className="bg-paper-white p-8 rounded-2xl shadow-lg border border-stone-gray/20">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path>
                    </svg>
                    <span className="font-medium">{error}</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Full Name */}
                <div>
                  <label htmlFor="fullName" className="block text-sm font-bold text-charcoal mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    id="fullName"
                    required
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="block w-full rounded-lg border-0 py-3 px-4 bg-light-concrete text-charcoal shadow-sm ring-1 ring-inset ring-stone-gray/50 placeholder:text-charcoal/60 focus:ring-2 focus:ring-inset focus:ring-forest-green transition-all"
                    placeholder="Jane Doe"
                  />
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-bold text-charcoal mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="block w-full rounded-lg border-0 py-3 px-4 bg-light-concrete text-charcoal shadow-sm ring-1 ring-inset ring-stone-gray/50 placeholder:text-charcoal/60 focus:ring-2 focus:ring-inset focus:ring-forest-green transition-all"
                    placeholder="you@example.com"
                  />
                </div>

                {/* Reason */}
                <div>
                  <label htmlFor="reason" className="block text-sm font-bold text-charcoal mb-2">
                    What can we help with? *
                  </label>
                  <select
                    name="reason"
                    id="reason"
                    value={formData.reason}
                    onChange={handleInputChange}
                    className="block w-full rounded-lg border-0 py-3 px-4 bg-light-concrete text-charcoal shadow-sm ring-1 ring-inset ring-stone-gray/50 focus:ring-2 focus:ring-inset focus:ring-forest-green transition-all"
                  >
                    {contactReasons.map((reason) => (
                      <option key={reason} value={reason}>
                        {reason}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Message */}
                <div>
                  <label htmlFor="message" className="block text-sm font-bold text-charcoal mb-2">
                    Message *
                  </label>
                  <textarea
                    name="message"
                    id="message"
                    rows={5}
                    required
                    value={formData.message}
                    onChange={handleInputChange}
                    className="block w-full rounded-lg border-0 py-3 px-4 bg-light-concrete text-charcoal shadow-sm ring-1 ring-inset ring-stone-gray/50 placeholder:text-charcoal/60 focus:ring-2 focus:ring-inset focus:ring-forest-green transition-all resize-none"
                    placeholder="Tell us what's on your mind..."
                  />
                  <p className="mt-1 text-xs text-charcoal/70">Please be as specific as possible so we can help you better.</p>
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-forest-green text-paper-white font-bold py-4 px-6 rounded-lg hover:opacity-90 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-forest-green focus:ring-offset-2"
                  >
                    {isSubmitting ? 'Sending Message...' : 'Send Message'}
                  </button>
                </div>
                
                <p className="text-xs text-charcoal/70 text-center">
                  We'll get back to you within 24 hours. For urgent matters, email us directly at{' '}
                  <a href="mailto:hello@lawnquote.com" className="text-forest-green hover:underline font-medium">
                    hello@lawnquote.com
                  </a>
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
