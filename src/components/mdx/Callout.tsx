/**
 * Callout Component for MDX Content
 * Provides styled callout boxes with different variants (info, warning, success, error)
 */

import React from 'react';
import { 
  AlertTriangleIcon, 
  CheckCircleIcon, 
  InfoIcon, 
  LightbulbIcon,
  XCircleIcon 
} from 'lucide-react';

import { cn } from '@/utils/cn';

export type CalloutVariant = 'info' | 'warning' | 'success' | 'error' | 'tip';

interface CalloutProps {
  variant?: CalloutVariant;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

const variantConfig = {
  info: {
    icon: InfoIcon,
    containerClass: 'border-blue-200 bg-blue-50 text-blue-900',
    iconClass: 'text-blue-600',
    titleClass: 'text-blue-900',
  },
  warning: {
    icon: AlertTriangleIcon,
    containerClass: 'border-equipment-yellow bg-yellow-50 text-yellow-900',
    iconClass: 'text-equipment-yellow',
    titleClass: 'text-yellow-900',
  },
  success: {
    icon: CheckCircleIcon,
    containerClass: 'border-green-200 bg-green-50 text-green-900',
    iconClass: 'text-green-600',
    titleClass: 'text-green-900',
  },
  error: {
    icon: XCircleIcon,
    containerClass: 'border-red-200 bg-red-50 text-red-900',
    iconClass: 'text-red-600',
    titleClass: 'text-red-900',
  },
  tip: {
    icon: LightbulbIcon,
    containerClass: 'border-forest-green bg-green-50 text-forest-green',
    iconClass: 'text-forest-green',
    titleClass: 'text-forest-green',
  },
};

export function Callout({ 
  variant = 'info', 
  title, 
  children, 
  className 
}: CalloutProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <div 
      className={cn(
        'border-l-4 rounded-r-lg p-4 mb-6 shadow-sm',
        config.containerClass,
        className
      )}
      role="note"
      aria-label={`${variant} callout`}
    >
      <div className="flex items-start space-x-3">
        <Icon 
          className={cn('w-5 h-5 mt-0.5 flex-shrink-0', config.iconClass)}
          aria-hidden="true"
        />
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className={cn(
              'font-semibold text-lg mb-2',
              config.titleClass
            )}>
              {title}
            </h4>
          )}
          <div className="prose prose-sm max-w-none">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

// Export individual variant components for easier usage
export const InfoCallout = (props: Omit<CalloutProps, 'variant'>) => (
  <Callout variant="info" {...props} />
);

export const WarningCallout = (props: Omit<CalloutProps, 'variant'>) => (
  <Callout variant="warning" {...props} />
);

export const SuccessCallout = (props: Omit<CalloutProps, 'variant'>) => (
  <Callout variant="success" {...props} />
);

export const ErrorCallout = (props: Omit<CalloutProps, 'variant'>) => (
  <Callout variant="error" {...props} />
);

export const TipCallout = (props: Omit<CalloutProps, 'variant'>) => (
  <Callout variant="tip" {...props} />
);
