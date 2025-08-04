import Link from 'next/link';

export function FeaturesCTA() {
  return (
    <section className="bg-paper-white py-20">
      <div className="container mx-auto px-6 text-center">
        <h2 className="text-3xl md:text-4xl font-black text-charcoal">
          Ready to Stop Leaving Money on the Table?
        </h2>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-charcoal/90">
          Join thousands of landscapers who are saving time, looking professional, and winning more jobs. Create your free account today.
        </p>
        <div className="mt-8">
          <Link
            href="/signup"
            className="bg-equipment-yellow text-charcoal font-bold px-8 py-4 rounded-lg hover:brightness-110 transition-all duration-200 shadow-lg hover:shadow-xl text-lg inline-block"
          >
            Start for Free
          </Link>
        </div>
        <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center items-center text-sm text-charcoal/80">
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-forest-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span>Free 14-day trial</span>
          </div>
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-forest-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span>No credit card required</span>
          </div>
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-forest-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span>Cancel anytime</span>
          </div>
        </div>
      </div>
    </section>
  );
}
