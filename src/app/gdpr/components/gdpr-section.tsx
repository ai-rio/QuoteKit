import { ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface GdprSectionProps {
  id?: string;
  sectionNumber: string;
  title: string;
  description: string;
  children: ReactNode;
  className?: string;
}

export function GdprSection({ 
  id,
  sectionNumber, 
  title, 
  description, 
  children, 
  className 
}: GdprSectionProps) {
  return (
    <section id={id} className={cn("grid md:grid-cols-3 gap-8 pb-8", className)}>
      <div className="md:col-span-1">
        <h2 className="text-2xl font-bold text-forest-green">
          {sectionNumber}. {title}
        </h2>
        <p className="mt-2 text-charcoal/70 text-sm">
          {description}
        </p>
      </div>
      <div className="md:col-span-2">
        {children}
      </div>
    </section>
  );
}
