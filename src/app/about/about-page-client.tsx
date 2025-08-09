'use client';

import Image from 'next/image';
import Link from 'next/link';

import { Button } from '@/components/ui/button';

export function AboutPageClient() {
  return (
    <div className="bg-light-concrete">
      {/* Hero Section */}
      <section className="bg-paper-white py-20 md:py-32">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-6xl font-black text-charcoal leading-tight">
            I got into landscaping to work with my hands,
            <br className="hidden md:block" /> not to do paperwork.
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg md:text-xl text-charcoal/70">
            LawnQuote was born in the field, not in a boardroom. It&apos;s the tool I wish I had when I was running my own crew, turning messy notes into winning bids.
          </p>
        </div>
      </section>

      {/* Founder's Story Section */}
      <section className="bg-light-concrete py-20">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Image */}
            <div className="relative">
              <div className="aspect-[4/5] relative rounded-2xl overflow-hidden shadow-xl">
                <Image
                  src="https://placehold.co/800x1000/2A3D2F/FFFFFF?text=Founder+Portrait"
                  alt="Founder of LawnQuote"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            </div>
            
            {/* Text Content */}
            <div className="prose prose-lg lg:prose-xl max-w-none text-charcoal/80">
              <h2 className="text-3xl md:text-4xl font-black text-charcoal mb-6">
                The Story Behind the Tool
              </h2>
              <p className="mb-6">
                For years, my office was the front seat of my truck. My filing system was a pile of crumpled, coffee-stained napkins in the center console. I loved the feeling of transforming a client&apos;s yard, but I dreaded the end of the day. That&apos;s when the &quot;real&quot; work began: trying to decipher my own handwriting, guessing at material costs, and typing up quotes in a clunky spreadsheet—all while my family waited for me to come home.
              </p>
              <p className="mb-6">
                I knew two things for sure: <strong className="text-forest-green">I was losing money</strong> from inaccurate bids, and <strong className="text-forest-green">I looked unprofessional</strong>. Every messy quote I sent felt like it undermined the quality of my actual work.
              </p>
              <p className="mb-6">
                I looked for a tool to help, but everything was either too complicated, too expensive, or built for giant corporations. I needed something simple, fast, and professional. A tool that understood that my most valuable asset was my time.
              </p>
              <p className="mb-8">
                So, I built it.
              </p>
              <p className="mt-8 pt-8 border-t border-stone-gray font-bold text-charcoal">
                — John, Founder of LawnQuote
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Mission Section */}
      <section className="bg-forest-green text-paper-white py-20">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-black">Our Pro-Grade Promise</h2>
          <p className="mt-4 max-w-3xl mx-auto text-lg text-stone-gray">
            We believe your skill deserves to be presented professionally. Our mission is to give every solo operator the power to look, quote, and win jobs like a major firm.
          </p>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-paper-white/10 p-8 rounded-2xl border border-paper-white/20">
              <h3 className="text-2xl font-bold text-equipment-yellow">Radical Simplicity</h3>
              <p className="mt-3 text-stone-gray">
                No bloated features you&apos;ll never use. Just a laser-focused tool that helps you create quotes in minutes, not hours.
              </p>
            </div>
            <div className="bg-paper-white/10 p-8 rounded-2xl border border-paper-white/20">
              <h3 className="text-2xl font-bold text-equipment-yellow">Effortless Professionalism</h3>
              <p className="mt-3 text-stone-gray">
                Generate polished, accurate PDF quotes that build client trust and help you win more profitable jobs.
              </p>
            </div>
            <div className="bg-paper-white/10 p-8 rounded-2xl border border-paper-white/20">
              <h3 className="text-2xl font-bold text-equipment-yellow">Built for the Trade</h3>
              <p className="mt-3 text-stone-gray">
                We&apos;re not a generic business app. We speak your language and build features that solve your real-world problems.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="bg-light-concrete py-20">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-black text-charcoal">
            Ready to Stop Leaving Money on the Table?
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-charcoal/70">
            Join thousands of landscapers who are saving time, looking professional, and winning more jobs. Create your free account today.
          </p>
          <div className="mt-8 flex justify-center">
            <Button
              variant="sexy"
              size="lg"
              className="bg-equipment-yellow text-charcoal hover:bg-equipment-yellow/90 font-bold px-8 py-4 text-lg shadow-lg hover:shadow-xl transition-all duration-200"
              asChild
            >
              <Link href="/signup">Start for Free</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
