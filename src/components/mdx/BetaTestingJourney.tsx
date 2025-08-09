'use client';

import { 
  CheckCircle, 
  Crown,
  Gift,
  Rocket, 
  Star,
  Target,
  Trophy} from 'lucide-react';
import React, { useState } from 'react';

interface JourneyStepProps {
  step: number;
  title: string;
  description: string;
  milestone?: string;
  reward?: string;
  icon?: React.ReactNode;
  completed?: boolean;
  current?: boolean;
}

interface BetaTestingJourneyProps {
  steps: JourneyStepProps[];
  className?: string;
}

/**
 * BetaTestingJourney Component
 * 
 * A delightful, gamified journey component that shows users their progression
 * through the beta testing process with playful milestones and rewards.
 * Features hover animations, completion states, and encouraging copy.
 */
export function BetaTestingJourney({ steps, className = '' }: BetaTestingJourneyProps) {
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);

  return (
    <div 
      className={`
        bg-gradient-to-br from-blue-50 to-green-50 
        rounded-3xl 
        p-8 
        my-12 
        border-2 
        border-dashed 
        border-forest-green/30
        ${className}
      `}
      role="region"
      aria-labelledby="journey-title"
    >
      <div className="text-center mb-10">
        <h3 
          id="journey-title" 
          className="text-3xl font-bold text-forest-green mb-4 flex items-center justify-center gap-3"
        >
          <Rocket className="w-8 h-8 text-equipment-yellow animate-bounce" />
          Your Beta Testing Adventure Awaits!
          <Rocket className="w-8 h-8 text-equipment-yellow animate-bounce" style={{ animationDelay: '0.5s' }} />
        </h3>
        <p className="text-lg text-charcoal/80 max-w-2xl mx-auto">
          From free tier explorer to pro power user - every step is a win! 
          Complete challenges, unlock rewards, and help shape the future of QuoteKit.
        </p>
      </div>

      <div className="space-y-6">
        {steps.map((step, index) => {
          const isHovered = hoveredStep === index;
          const nextStepLine = index < steps.length - 1;
          
          return (
            <div key={index} className="relative">
              {/* Step Card */}
              <div
                className={`
                  relative 
                  bg-paper-white 
                  rounded-2xl 
                  border-2 
                  p-6 
                  transition-all 
                  duration-300 
                  cursor-pointer
                  transform
                  ${
                    step.completed 
                      ? 'border-green-400 shadow-green-100 shadow-lg scale-105' 
                      : step.current 
                      ? 'border-equipment-yellow shadow-yellow-100 shadow-lg scale-105 animate-pulse' 
                      : 'border-stone-gray/20 hover:border-forest-green/50'
                  }
                  ${
                    isHovered ? 'scale-105 shadow-xl' : ''
                  }
                `}
                onMouseEnter={() => setHoveredStep(index)}
                onMouseLeave={() => setHoveredStep(null)}
              >
                {/* Step Number Badge */}
                <div 
                  className={`
                    absolute 
                    -top-4 
                    left-6 
                    w-8 
                    h-8 
                    rounded-full 
                    flex 
                    items-center 
                    justify-center 
                    font-bold 
                    text-sm
                    ${
                      step.completed 
                        ? 'bg-green-400 text-white' 
                        : step.current 
                        ? 'bg-equipment-yellow text-charcoal animate-pulse' 
                        : 'bg-stone-gray/20 text-charcoal'
                    }
                  `}
                >
                  {step.completed ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    step.step
                  )}
                </div>

                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div 
                    className={`
                      w-12 
                      h-12 
                      rounded-full 
                      flex 
                      items-center 
                      justify-center 
                      flex-shrink-0
                      ${
                        step.completed 
                          ? 'bg-green-100 text-green-600' 
                          : step.current 
                          ? 'bg-yellow-100 text-equipment-yellow' 
                          : 'bg-stone-gray/10 text-charcoal'
                      }
                      ${
                        isHovered ? 'animate-bounce' : ''
                      }
                    `}
                  >
                    {step.icon || <Target className="w-6 h-6" />}
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <h4 className="text-xl font-semibold text-charcoal mb-2">
                      {step.title}
                      {step.completed && (
                        <span className="ml-2 text-green-600 text-sm font-normal">
                          ✨ Completed!
                        </span>
                      )}
                      {step.current && (
                        <span className="ml-2 text-equipment-yellow text-sm font-normal animate-pulse">
                          🚀 In Progress...
                        </span>
                      )}
                    </h4>
                    <p className="text-charcoal/80 mb-3">
                      {step.description}
                    </p>
                    
                    {/* Milestone Badge */}
                    {step.milestone && (
                      <div className="inline-flex items-center gap-2 bg-forest-green/10 text-forest-green px-3 py-1 rounded-full text-sm font-medium mb-2">
                        <Trophy className="w-4 h-4" />
                        Milestone: {step.milestone}
                      </div>
                    )}
                    
                    {/* Reward */}
                    {step.reward && (
                      <div className="inline-flex items-center gap-2 bg-equipment-yellow/20 text-equipment-yellow px-3 py-1 rounded-full text-sm font-medium">
                        <Gift className="w-4 h-4" />
                        Reward: {step.reward}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Celebration Particles for Completed Steps */}
                {step.completed && isHovered && (
                  <div className="absolute inset-0 pointer-events-none">
                    {[...Array(6)].map((_, i) => (
                      <Star 
                        key={i}
                        className={`
                          absolute 
                          w-4 
                          h-4 
                          text-equipment-yellow 
                          animate-ping
                        `}
                        style={{
                          top: `${20 + Math.random() * 60}%`,
                          left: `${20 + Math.random() * 60}%`,
                          animationDelay: `${i * 0.1}s`,
                          animationDuration: '1s'
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
              
              {/* Connection Line */}
              {nextStepLine && (
                <div 
                  className={`
                    w-1 
                    h-8 
                    mx-auto 
                    my-2
                    ${
                      step.completed 
                        ? 'bg-green-400' 
                        : 'bg-stone-gray/20'
                    }
                    rounded-full
                  `}
                />
              )}
            </div>
          );
        })}
      </div>
      
      {/* Footer Motivation */}
      <div className="text-center mt-10 p-6 bg-gradient-to-r from-forest-green/5 to-equipment-yellow/5 rounded-2xl border border-dashed border-forest-green/20">
        <Crown className="w-8 h-8 text-equipment-yellow mx-auto mb-3" />
        <p className="text-lg font-medium text-charcoal mb-2">
          Complete your journey and become a QuoteKit Champion!
        </p>
        <p className="text-charcoal/70">
          Every step you take helps us build something amazing together. Thank you for being part of our story! 🙌
        </p>
      </div>
    </div>
  );
}

export default BetaTestingJourney;