'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface MultiStepFormContextType {
  currentStep: number;
  totalSteps: number;
  goToStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
  canProceed: boolean;
  setCanProceed: (canProceed: boolean) => void;
}

const MultiStepFormContext = createContext<MultiStepFormContextType | null>(null);

export const useMultiStepForm = () => {
  const context = useContext(MultiStepFormContext);
  if (!context) {
    throw new Error('useMultiStepForm must be used within a MultiStepForm');
  }
  return context;
};

interface MultiStepFormProps {
  children: ReactNode;
  onComplete?: () => void;
  className?: string;
}

export function MultiStepForm({ children, onComplete, className }: MultiStepFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [canProceed, setCanProceed] = useState(false);
  
  const childArray = React.Children.toArray(children);
  const totalSteps = childArray.length;
  
  const goToStep = (step: number) => {
    if (step >= 0 && step < totalSteps) {
      setCurrentStep(step);
      setCanProceed(false); // Reset proceed status for new step
    }
  };
  
  const nextStep = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
      setCanProceed(false); // Reset proceed status for new step
    } else if (onComplete) {
      onComplete();
    }
  };
  
  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setCanProceed(true); // Allow going back
    }
  };
  
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;
  
  // Keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't interfere if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      if (e.key === 'Enter' && canProceed && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        nextStep();
      } else if (e.key === 'ArrowLeft' && !isFirstStep) {
        e.preventDefault();
        prevStep();
      } else if (e.key === 'ArrowRight' && canProceed && !isLastStep) {
        e.preventDefault();
        nextStep();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentStep, canProceed, isFirstStep, isLastStep, nextStep, prevStep]);

  // Touch/swipe navigation for mobile
  React.useEffect(() => {
    let touchStartX = 0;
    let touchStartY = 0;
    let isSwiping = false;
    
    const handleTouchStart = (e: TouchEvent) => {
      // Don't handle swipes if user is interacting with form elements
      const target = e.target as Element;
      if (target?.closest('input, select, textarea, button')) {
        return;
      }
      
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      isSwiping = true;
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      if (!isSwiping) return;
      
      const touchEndX = e.touches[0].clientX;
      const touchEndY = e.touches[0].clientY;
      const diffX = touchStartX - touchEndX;
      const diffY = touchStartY - touchEndY;
      
      // Only prevent default if it's a horizontal swipe
      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
        e.preventDefault();
      }
    };
    
    const handleTouchEnd = (e: TouchEvent) => {
      if (!isSwiping) return;
      
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const diffX = touchStartX - touchEndX;
      const diffY = touchStartY - touchEndY;
      
      // Check if it's a horizontal swipe (more horizontal than vertical)
      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 100) {
        if (diffX > 0 && canProceed && !isLastStep) {
          // Swipe left - go to next step
          nextStep();
        } else if (diffX < 0 && !isFirstStep) {
          // Swipe right - go to previous step
          prevStep();
        }
      }
      
      isSwiping = false;
    };
    
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
    
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [currentStep, canProceed, isFirstStep, isLastStep, nextStep, prevStep]);

  const contextValue: MultiStepFormContextType = {
    currentStep,
    totalSteps,
    goToStep,
    nextStep,
    prevStep,
    isFirstStep,
    isLastStep,
    canProceed,
    setCanProceed,
  };
  
  return (
    <MultiStepFormContext.Provider value={contextValue}>
      <div className={cn('w-full max-w-2xl mx-auto px-4 sm:px-0', className)}>
        {/* Progress Bar */}
        <StepProgress />
        
        {/* Form Content */}
        <div className="relative overflow-hidden bg-paper-white rounded-lg shadow-lg min-h-[500px] sm:min-h-[600px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
                duration: 0.3
              }}
              className="w-full h-full"
            >
              {childArray[currentStep]}
            </motion.div>
          </AnimatePresence>
        </div>
        
        {/* Navigation */}
        <FormNavigation />
        
        {/* Keyboard shortcuts hint */}
        {/* Keyboard shortcuts hint - hidden on mobile */}
        <div className="mt-2 text-center text-xs text-stone-gray hidden sm:block">
          <span className="inline-flex items-center space-x-4">
            <span>Press <kbd className="px-1 py-0.5 bg-stone-gray/20 rounded text-charcoal">Enter</kbd> to continue</span>
            <span>Use <kbd className="px-1 py-0.5 bg-stone-gray/20 rounded text-charcoal">←→</kbd> arrow keys to navigate</span>
          </span>
        </div>
      </div>
    </MultiStepFormContext.Provider>
  );
}

function StepProgress() {
  const { currentStep, totalSteps } = useMultiStepForm();
  const progress = ((currentStep + 1) / totalSteps) * 100;
  
  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-charcoal font-medium">
          Step {currentStep + 1} of {totalSteps}
        </span>
        <span className="text-sm text-forest-green font-bold">
          {Math.round(progress)}% Complete
        </span>
      </div>
      
      <div className="w-full bg-stone-gray/20 rounded-full h-2 overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-forest-green to-forest-green/80 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 30,
            duration: 0.5
          }}
        />
      </div>
    </div>
  );
}

function FormNavigation() {
  const { 
    nextStep, 
    prevStep, 
    isFirstStep, 
    isLastStep, 
    canProceed 
  } = useMultiStepForm();
  
  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0 mt-6 pt-4 border-t border-stone-gray/20">
      <Button
        type="button"
        variant="outline"
        onClick={prevStep}
        disabled={isFirstStep}
        className="w-full sm:w-auto bg-paper-white border-stone-gray/50 text-charcoal hover:bg-stone-gray/10 hover:border-stone-gray disabled:opacity-50 disabled:cursor-not-allowed font-semibold px-6 py-3 h-12 min-h-[44px] rounded-lg transition-all duration-200 touch-manipulation"
      >
        <ChevronLeft className="mr-2 h-4 w-4" />
        Previous
      </Button>
      
      <Button
        type="button"
        onClick={nextStep}
        disabled={!canProceed}
        className="w-full sm:w-auto bg-forest-green border-forest-green text-paper-white hover:bg-forest-green/90 disabled:opacity-50 disabled:cursor-not-allowed font-semibold px-6 py-3 h-12 min-h-[44px] rounded-lg transition-all duration-200 focus-visible:ring-2 focus-visible:ring-forest-green focus-visible:ring-offset-2 touch-manipulation"
      >
        {isLastStep ? 'Complete' : 'Next'}
        {!isLastStep && <ChevronRight className="ml-2 h-4 w-4" />}
      </Button>
    </div>
  );
}

interface FormStepProps {
  title: string;
  description?: string;
  children: ReactNode;
  onValidation?: () => boolean;
  className?: string;
}

export function FormStep({ 
  title, 
  description, 
  children, 
  onValidation,
  className 
}: FormStepProps) {
  const { setCanProceed } = useMultiStepForm();
  
  // Auto-validate when step content changes
  React.useEffect(() => {
    if (onValidation) {
      const isValid = onValidation();
      setCanProceed(isValid);
    } else {
      setCanProceed(true); // Default to allow proceeding if no validation
    }
  }, [onValidation, setCanProceed]);
  
  return (
    <div className={cn('p-6 h-full flex flex-col', className)}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-forest-green mb-2">
          {title}
        </h2>
        {description && (
          <p className="text-charcoal text-base opacity-80">
            {description}
          </p>
        )}
      </div>
      
      <div className="flex-1 flex flex-col justify-center">
        {children}
      </div>
    </div>
  );
}