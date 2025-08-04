export function FeaturesHero() {
  return (
    <section className="bg-paper-white py-20 md:py-32">
      <div className="container mx-auto px-6 text-center">
        <h1 className="text-4xl md:text-6xl font-black text-charcoal leading-tight">
          The Pro-Grade Kit for Your Business.
        </h1>
        <p className="mt-6 max-w-3xl mx-auto text-lg md:text-xl text-charcoal/90">
          LawnQuote is a complete system of simple, powerful tools designed to solve your biggest headaches. Save time, look professional, and win more profitable jobs.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center items-center text-sm text-charcoal/80">
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-forest-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span>No setup fees or contracts</span>
          </div>
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-forest-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span>Start creating quotes in minutes</span>
          </div>
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-forest-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span>Built for landscaping professionals</span>
          </div>
        </div>
      </div>
    </section>
  );
}
