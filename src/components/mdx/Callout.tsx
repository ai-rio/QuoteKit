/**
 * Callout Component for MDX Content
 * Provides styled callout boxes with different variants (info, warning, success, error)
 */

import { 
  AlertTriangleIcon, 
  CheckCircleIcon, 
  Heart,
  InfoIcon, 
  LightbulbIcon,
  Rocket,
  Sparkles,
  Target,
  Trophy,
  XCircleIcon} from 'lucide-react';
import React from 'react';

import { cn } from '@/utils/cn';

export type CalloutVariant = 'info' | 'warning' | 'success' | 'error' | 'tip' | 'celebration' | 'challenge' | 'motivation' | 'quest' | 'reward';

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
  celebration: {
    icon: Trophy,
    containerClass: 'border-equipment-yellow bg-gradient-to-r from-yellow-50 to-orange-50 text-yellow-900 shadow-lg',
    iconClass: 'text-equipment-yellow animate-bounce',
    titleClass: 'text-yellow-800 font-bold',
  },
  challenge: {
    icon: Target,
    containerClass: 'border-purple-300 bg-gradient-to-r from-purple-50 to-pink-50 text-purple-900 shadow-lg',
    iconClass: 'text-purple-600 animate-pulse',
    titleClass: 'text-purple-800 font-bold',
  },
  motivation: {
    icon: Heart,
    containerClass: 'border-pink-300 bg-gradient-to-r from-pink-50 to-red-50 text-pink-900 shadow-lg',
    iconClass: 'text-pink-600 animate-pulse',
    titleClass: 'text-pink-800 font-bold',
  },
  quest: {
    icon: Rocket,
    containerClass: 'border-indigo-300 bg-gradient-to-r from-indigo-50 to-blue-50 text-indigo-900 shadow-lg',
    iconClass: 'text-indigo-600 animate-bounce',
    titleClass: 'text-indigo-800 font-bold',
  },
  reward: {
    icon: Sparkles,
    containerClass: 'border-green-300 bg-gradient-to-r from-green-50 to-emerald-50 text-green-900 shadow-xl',
    iconClass: 'text-green-600 animate-spin',
    titleClass: 'text-green-800 font-bold',
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

// Beta Testing Specific Callouts
export const CelebrationCallout = (props: Omit<CalloutProps, 'variant'>) => (
  <Callout variant="celebration" {...props} />
);

export const ChallengeCallout = (props: Omit<CalloutProps, 'variant'>) => (
  <Callout variant="challenge" {...props} />
);

export const MotivationCallout = (props: Omit<CalloutProps, 'variant'>) => (
  <Callout variant="motivation" {...props} />
);

export const QuestCallout = (props: Omit<CalloutProps, 'variant'>) => (
  <Callout variant="quest" {...props} />
);

export const RewardCallout = (props: Omit<CalloutProps, 'variant'>) => (
  <Callout variant="reward" {...props} />
);
