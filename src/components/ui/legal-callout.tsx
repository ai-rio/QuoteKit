import { Info } from 'lucide-react';
import { ReactNode } from 'react';

interface LegalCalloutProps {
  children: ReactNode;
  title?: string;
}

export function LegalCallout({ children, title = "Plain English Summary:" }: LegalCalloutProps) {
  return (
    <div className="bg-forest-green/10 p-6 rounded-lg border border-forest-green/20 mb-6">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <Info className="w-5 h-5 text-forest-green mt-0.5" />
        </div>
        <div>
          <p className="font-bold text-forest-green mb-2">{title}</p>
          <p className="text-charcoal/90 leading-relaxed">{children}</p>
        </div>
      </div>
    </div>
  );
}
