export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  category: 'pricing' | 'operations' | 'tools';
  image: string;
  summary: string;
  author: string;
  publishedAt: string;
  readTime: number;
  featured?: boolean;
}

export const blogPosts: BlogPost[] = [
  {
    id: '1',
    title: 'The 5-Minute Quote: How to Price a Paver Patio',
    slug: 'how-to-price-a-paver-patio',
    category: 'pricing',
    image: 'https://placehold.co/600x400/2A3D2F/F2B705?text=Pricing+Guide&font=source-sans-pro',
    summary: 'Stop guessing. Learn the formula for calculating materials, labor, and profit to create bids that win.',
    author: 'John D.',
    publishedAt: '2025-01-15',
    readTime: 8,
    featured: true,
  },
  {
    id: '2',
    title: '3 Things Your Quote Must Include to Build Client Trust',
    slug: 'build-client-trust-with-quotes',
    category: 'operations',
    image: 'https://placehold.co/600x400/2A3D2F/FFFFFF?text=Pro+Tips&font=source-sans-pro',
    summary: 'Elevate your brand and protect yourself with a professional quote structure that builds client trust from day one.',
    author: 'Sarah M.',
    publishedAt: '2025-01-12',
    readTime: 6,
  },
  {
    id: '3',
    title: 'The $12 Tool with a Better ROI Than a New Mower',
    slug: 'software-roi-vs-equipment',
    category: 'tools',
    image: 'https://placehold.co/600x400/F2B705/1C1C1C?text=ROI+Analysis&font=source-sans-pro',
    summary: 'How a small software investment can save you more time and make you more money than expensive hardware.',
    author: 'Mike R.',
    publishedAt: '2025-01-10',
    readTime: 5,
  },
  {
    id: '4',
    title: 'Avoiding Scope Creep: How to Set Clear Expectations',
    slug: 'avoiding-scope-creep',
    category: 'operations',
    image: 'https://placehold.co/600x400/2A3D2F/FFFFFF?text=Project+Management&font=source-sans-pro',
    summary: 'Learn the secrets to defining project boundaries that keep clients happy and your profits secure.',
    author: 'Lisa K.',
    publishedAt: '2025-01-08',
    readTime: 7,
  },
  {
    id: '5',
    title: 'The Art of the Upsell: How to Increase Quote Value',
    slug: 'increase-quote-value-upselling',
    category: 'pricing',
    image: 'https://placehold.co/600x400/2A3D2F/F2B705?text=Upselling+Strategies&font=source-sans-pro',
    summary: 'Simple techniques to offer more value to your clients and increase the average value of every job you win.',
    author: 'Tom H.',
    publishedAt: '2025-01-05',
    readTime: 9,
  },
  {
    id: '6',
    title: 'Digital Toolbox: 5 Must-Have Apps for Landscapers',
    slug: 'must-have-apps-for-landscapers',
    category: 'tools',
    image: 'https://placehold.co/600x400/F2B705/1C1C1C?text=Digital+Tools&font=source-sans-pro',
    summary: 'Beyond quoting, these essential apps will help you manage every aspect of your growing business.',
    author: 'Alex P.',
    publishedAt: '2025-01-03',
    readTime: 10,
  },
  {
    id: '7',
    title: 'Seasonal Pricing: Adjusting Rates Throughout the Year',
    slug: 'seasonal-pricing-strategies',
    category: 'pricing',
    image: 'https://placehold.co/600x400/2A3D2F/F2B705?text=Seasonal+Strategy&font=source-sans-pro',
    summary: 'Maximize your profits by understanding when to raise rates and when to offer competitive pricing.',
    author: 'Jennifer L.',
    publishedAt: '2025-01-01',
    readTime: 6,
  },
  {
    id: '8',
    title: 'Client Communication: The Key to Repeat Business',
    slug: 'client-communication-strategies',
    category: 'operations',
    image: 'https://placehold.co/600x400/2A3D2F/FFFFFF?text=Communication&font=source-sans-pro',
    summary: 'Build lasting relationships that turn one-time clients into your biggest advocates and referral sources.',
    author: 'David W.',
    publishedAt: '2024-12-28',
    readTime: 8,
  },
];
