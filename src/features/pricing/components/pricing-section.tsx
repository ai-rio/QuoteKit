import Image from 'next/image';

import { PricingCard } from '@/features/pricing/components/price-card';
import { getProducts } from '@/features/pricing/controllers/get-products';

import { createCheckoutAction } from '../actions/create-checkout-action';

export async function PricingSection({ isPricingPage }: { isPricingPage?: boolean }) {
  const products = await getProducts();

  const HeadingLevel = isPricingPage ? 'h1' : 'h2';

  return (
    <section className='rounded-lg bg-paper-white py-8'>
      <div className='relative z-10 m-auto flex max-w-[1200px] flex-col items-center gap-8 px-4 pt-8 lg:pt-16'>
        <HeadingLevel className='max-w-4xl text-center text-4xl font-bold text-charcoal lg:text-6xl'>
          Predictable pricing for every use case.
        </HeadingLevel>
        <p className='text-center text-xl text-charcoal/70'>
          Find a plan that fits you. Upgrade at any time to enable additional features.
        </p>
        <div className='grid w-full gap-4 grid-cols-2 md:grid-cols-4 lg:gap-8'>
          {products.map((product) => {
            return <PricingCard key={product.id} product={product} createCheckoutAction={createCheckoutAction} />;
          })}
        </div>
      </div>
    </section>
  );
}
