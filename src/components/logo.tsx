import Link from 'next/link';
import { LawnQuoteLogoHorizontal } from '@/components/branding/lawn-quote-logo';

export function Logo() {
  return (
    <Link href='/' className='flex w-fit items-center'>
      <LawnQuoteLogoHorizontal textClassName='text-white' />
    </Link>
  );
}
