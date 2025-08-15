'use client';

import { ChevronLeft, ChevronRight, Send, X } from 'lucide-react';
import React, { useCallback, useEffect, useRef,useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { useFormbricksTracking } from '@/hooks/use-formbricks-tracking';
import { FORMBRICKS_EVENTS } from '@/libs/formbricks/types';
import { cn } from '@/utils/cn';

/**
 * Survey question types that align with Formbricks
 */
type SurveyQuestionType = 
  | 'rating' 
  | 'multiple_choice' 
  | 'single_choice' 
  | 'open_text' 
  | 'email'
  | 'nps'
  | 'cta';

/**
 * Survey question structure
 */
interface SurveyQuestion {
  id: string;
  type: SurveyQuestionType;
  question: string;
  description?: string;
  required?: boolean;
  options?: string[];
  placeholder?: string;
  buttonText?: string;
  minRating?: number;
  maxRating?: number;
  lowLabel?: string;
  highLabel?: string;
}

/**
 * Survey response structure
 */
interface SurveyResponse {
  questionId: string;
  type: SurveyQuestionType;
  value: string | number | string[];
  timestamp: number;
}

/**
 * Survey configuration
 */
interface Survey {
  id: string;
  title: string;
  description?: string;
  questions: SurveyQuestion[];
  welcomeCard?: {
    headline: string;
    description: string;
    buttonText?: string;
  };
  thankYouCard?: {
    headline: string;
    description: string;
    buttonText?: string;
  };
}

/**
 * SurveyModal Props
 */
interface SurveyModalProps {
  /** Survey configuration */
  survey?: Survey | null;
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal is closed */
  onClose: () => void;
  /** Callback when survey is completed */
  onComplete?: (responses: SurveyResponse[]) => void;
  /** Custom trigger component */
  trigger?: React.ReactNode;
  /** Custom class name */
  className?: string;
}

/**
 * Default survey for testing/fallback
 */
const DEFAULT_SURVEY: Survey = {
  id: 'default-feedback',
  title: 'QuoteKit Feedback',
  description: 'Help us improve your experience',
  welcomeCard: {
    headline: 'We value your feedback!',
    description: 'This quick survey will help us understand how to make QuoteKit better for you.',
    buttonText: 'Start Survey'
  },
  questions: [
    {
      id: 'overall_satisfaction',
      type: 'rating',
      question: 'How satisfied are you with QuoteKit overall?',
      description: 'Rate your overall experience from 1 to 5',
      required: true,
      minRating: 1,
      maxRating: 5,
      lowLabel: 'Not satisfied',
      highLabel: 'Very satisfied'
    },
    {
      id: 'most_valuable_feature',
      type: 'single_choice',
      question: 'Which feature do you find most valuable?',
      required: true,
      options: [
        'Quote Creation',
        'PDF Generation', 
        'Item Management',
        'Client Communication',
        'Analytics & Reports',
        'Template System',
        'Other'
      ]
    },
    {
      id: 'improvement_suggestions',
      type: 'open_text',
      question: 'What would you like us to improve?',
      description: 'Share any suggestions or pain points you\'ve experienced',
      placeholder: 'Your suggestions help us build better features...',
      required: false
    },
    {
      id: 'recommendation_likelihood',
      type: 'nps',
      question: 'How likely are you to recommend QuoteKit to a colleague?',
      description: 'Scale from 0 (not at all likely) to 10 (extremely likely)',
      required: true
    }
  ],
  thankYouCard: {
    headline: 'Thank you for your feedback!',
    description: 'Your responses help us make QuoteKit better for everyone.',
    buttonText: 'Close'
  }
};

/**
 * Survey step type
 */
type SurveyStep = 'welcome' | 'question' | 'thank-you';

/**
 * SurveyModal Component
 * 
 * A comprehensive survey modal that integrates with Formbricks
 * Features:
 * - Multi-step survey flow
 * - Multiple question types (rating, NPS, multiple choice, etc.)
 * - Progress indication
 * - Responsive design
 * - Accessibility compliant
 * - Integration with Formbricks tracking
 */
export function SurveyModal({
  survey = DEFAULT_SURVEY,
  isOpen,
  onClose,
  onComplete,
  trigger,
  className
}: SurveyModalProps) {
  // State management
  const [currentStep, setCurrentStep] = useState<SurveyStep>('welcome');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [currentResponse, setCurrentResponse] = useState<string | number | string[]>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Refs
  const modalRef = useRef<HTMLDivElement>(null);

  // Hooks
  const { trackEvent, trackFeatureUsage } = useFormbricksTracking();

  // Derived state
  const currentQuestion = survey?.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === (survey?.questions.length || 0) - 1;
  const progress = survey?.questions.length ? ((currentQuestionIndex + 1) / survey.questions.length) * 100 : 0;

  /**
   * Reset survey state when modal opens/closes
   */
  useEffect(() => {
    if (isOpen) {
      setCurrentStep('welcome');
      setCurrentQuestionIndex(0);
      setResponses([]);
      setCurrentResponse('');
      
      // Track survey started
      trackEvent(FORMBRICKS_EVENTS.FEATURE_USED, {
        featureName: 'survey-modal',
        action: 'started',
        surveyId: survey?.id
      });
    }
  }, [isOpen, survey?.id, trackEvent]);

  /**
   * Handle starting the survey
   */
  const handleStartSurvey = useCallback(() => {
    setCurrentStep('question');
    
    trackFeatureUsage('survey-modal', 'used', {
      action: 'welcome-dismissed',
      surveyId: survey?.id
    });
  }, [survey?.id, trackFeatureUsage]);

  /**
   * Handle response change for current question
   */
  const handleResponseChange = useCallback((value: string | number | string[]) => {
    setCurrentResponse(value);
  }, []);

  /**
   * Validate current response
   */
  const isResponseValid = useCallback(() => {
    if (!currentQuestion?.required) return true;
    
    if (typeof currentResponse === 'string') {
      return currentResponse.trim().length > 0;
    }
    
    if (typeof currentResponse === 'number') {
      return currentResponse > 0;
    }
    
    if (Array.isArray(currentResponse)) {
      return currentResponse.length > 0;
    }
    
    return false;
  }, [currentQuestion?.required, currentResponse]);

  /**
   * Handle moving to next question
   */
  const handleNextQuestion = useCallback(() => {
    if (!currentQuestion || !isResponseValid()) return;

    // Save current response
    const response: SurveyResponse = {
      questionId: currentQuestion.id,
      type: currentQuestion.type,
      value: currentResponse,
      timestamp: Date.now()
    };

    const newResponses = [...responses, response];
    setResponses(newResponses);

    // Track question completion
    trackEvent(FORMBRICKS_EVENTS.FEATURE_USED, {
      featureName: 'survey-modal',
      action: 'question-answered',
      questionId: currentQuestion.id,
      questionType: currentQuestion.type,
      surveyId: survey?.id
    });

    if (isLastQuestion) {
      // Complete survey
      handleCompleteSurvey(newResponses);
    } else {
      // Move to next question
      setCurrentQuestionIndex(prev => prev + 1);
      setCurrentResponse('');
    }
  }, [currentQuestion, isResponseValid, currentResponse, responses, trackEvent, survey?.id, isLastQuestion]);

  /**
   * Handle going to previous question
   */
  const handlePreviousQuestion = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      
      // Restore previous response
      const previousResponse = responses[currentQuestionIndex - 1];
      if (previousResponse) {
        setCurrentResponse(previousResponse.value);
      }
    }
  }, [currentQuestionIndex, responses]);

  /**
   * Complete the survey
   */
  const handleCompleteSurvey = useCallback(async (finalResponses: SurveyResponse[]) => {
    setIsSubmitting(true);

    try {
      // Track survey completion
      trackEvent(FORMBRICKS_EVENTS.FEATURE_USED, {
        featureName: 'survey-modal',
        action: 'completed',
        surveyId: survey?.id,
        responseCount: finalResponses.length,
        completionTime: Date.now() - (finalResponses[0]?.timestamp || Date.now())
      });

      // Call completion callback
      onComplete?.(finalResponses);

      // Show thank you step
      setCurrentStep('thank-you');

    } catch (error) {
      console.error('Failed to complete survey:', error);
      
      // Track error
      trackEvent(FORMBRICKS_EVENTS.ERROR_ENCOUNTERED, {
        errorType: 'survey-submission',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        surveyId: survey?.id
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [survey?.id, trackEvent, onComplete]);

  /**
   * Handle closing the modal
   */
  const handleClose = useCallback(() => {
    // Track abandonment if in progress
    if (currentStep === 'question') {
      trackEvent(FORMBRICKS_EVENTS.FEATURE_USED, {
        featureName: 'survey-modal',
        action: 'abandoned',
        surveyId: survey?.id,
        questionIndex: currentQuestionIndex,
        totalQuestions: survey?.questions.length || 0
      });
    }

    onClose();
  }, [currentStep, currentQuestionIndex, survey?.id, survey?.questions.length, trackEvent, onClose]);

  if (!survey) return null;

  const modalContent = (
    <DialogContent 
      ref={modalRef}
      className={cn('max-w-lg w-full max-h-[90vh] overflow-hidden', className)}
      onOpenAutoFocus={(e) => e.preventDefault()}
    >
      <div className="relative">
        {/* Close Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClose}
          className="absolute right-0 top-0 z-10 h-8 w-8 p-0"
          aria-label="Close survey"
        >
          <X className="h-4 w-4" />
        </Button>

        {/* Progress Bar (only during questions) */}
        {currentStep === 'question' && (
          <div className="mb-6">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-sm text-muted-foreground mt-2">
              <span>Question {currentQuestionIndex + 1} of {survey.questions.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
          </div>
        )}

        {/* Welcome Step */}
        {currentStep === 'welcome' && survey.welcomeCard && (
          <Card className="border-0 shadow-none">
            <CardHeader className="text-center pb-4">
              <h2 className="text-2xl font-bold">{survey.welcomeCard.headline}</h2>
              {survey.welcomeCard.description && (
                <p className="text-muted-foreground">{survey.welcomeCard.description}</p>
              )}
            </CardHeader>
            <CardContent className="pt-0">
              <Button 
                onClick={handleStartSurvey}
                className="w-full"
                size="lg"
              >
                {survey.welcomeCard.buttonText || 'Start Survey'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Question Step */}
        {currentStep === 'question' && currentQuestion && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">{currentQuestion.question}</h3>
              {currentQuestion.description && (
                <p className="text-sm text-muted-foreground mb-4">{currentQuestion.description}</p>
              )}
            </div>

            <div className="space-y-4">
              <QuestionInput
                question={currentQuestion}
                value={currentResponse}
                onChange={handleResponseChange}
              />
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between gap-3">
              <Button
                variant="outline"
                onClick={handlePreviousQuestion}
                disabled={currentQuestionIndex === 0}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>

              <Button
                onClick={handleNextQuestion}
                disabled={!isResponseValid() || isSubmitting}
                className="flex items-center gap-2 min-w-[100px]"
              >
                {isLastQuestion ? (
                  <>
                    <Send className="h-4 w-4" />
                    Submit
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Thank You Step */}
        {currentStep === 'thank-you' && survey.thankYouCard && (
          <Card className="border-0 shadow-none">
            <CardHeader className="text-center pb-4">
              <h2 className="text-2xl font-bold">{survey.thankYouCard.headline}</h2>
              {survey.thankYouCard.description && (
                <p className="text-muted-foreground">{survey.thankYouCard.description}</p>
              )}
            </CardHeader>
            <CardContent className="pt-0">
              <Button 
                onClick={handleClose}
                className="w-full"
                size="lg"
              >
                {survey.thankYouCard.buttonText || 'Close'}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DialogContent>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      {modalContent}
    </Dialog>
  );
}

/**
 * QuestionInput Component
 * Renders different input types based on question type
 */
interface QuestionInputProps {
  question: SurveyQuestion;
  value: string | number | string[];
  onChange: (value: string | number | string[]) => void;
}

function QuestionInput({ question, value, onChange }: QuestionInputProps) {
  switch (question.type) {
    case 'rating':
      return (
        <RatingInput
          minRating={question.minRating || 1}
          maxRating={question.maxRating || 5}
          lowLabel={question.lowLabel}
          highLabel={question.highLabel}
          value={typeof value === 'number' ? value : 0}
          onChange={(rating) => onChange(rating)}
        />
      );

    case 'nps':
      return (
        <NPSInput
          value={typeof value === 'number' ? value : -1}
          onChange={(rating) => onChange(rating)}
        />
      );

    case 'single_choice':
    case 'multiple_choice':
      return (
        <ChoiceInput
          options={question.options || []}
          multiple={question.type === 'multiple_choice'}
          value={question.type === 'multiple_choice' ? (Array.isArray(value) ? value : []) : (typeof value === 'string' ? value : '')}
          onChange={onChange}
        />
      );

    case 'open_text':
      return (
        <Textarea
          placeholder={question.placeholder || 'Type your response...'}
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-[100px] resize-none"
        />
      );

    case 'email':
      return (
        <Input
          type="email"
          placeholder={question.placeholder || 'your@email.com'}
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    default:
      return (
        <Input
          placeholder={question.placeholder || 'Type your response...'}
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
        />
      );
  }
}

/**
 * Rating Input Component
 */
interface RatingInputProps {
  minRating: number;
  maxRating: number;
  lowLabel?: string;
  highLabel?: string;
  value: number;
  onChange: (rating: number) => void;
}

function RatingInput({ minRating, maxRating, lowLabel, highLabel, value, onChange }: RatingInputProps) {
  const ratings = Array.from({ length: maxRating - minRating + 1 }, (_, i) => minRating + i);

  return (
    <div className="space-y-3">
      <div className="flex justify-center gap-2">
        {ratings.map((rating) => (
          <Button
            key={rating}
            variant={value === rating ? 'default' : 'outline'}
            size="lg"
            onClick={() => onChange(rating)}
            className={cn(
              'h-12 w-12 text-lg font-semibold',
              value === rating && 'ring-2 ring-primary'
            )}
          >
            {rating}
          </Button>
        ))}
      </div>
      
      {(lowLabel || highLabel) && (
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{lowLabel}</span>
          <span>{highLabel}</span>
        </div>
      )}
    </div>
  );
}

/**
 * NPS Input Component (0-10 scale)
 */
interface NPSInputProps {
  value: number;
  onChange: (rating: number) => void;
}

function NPSInput({ value, onChange }: NPSInputProps) {
  const ratings = Array.from({ length: 11 }, (_, i) => i);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-11 gap-1">
        {ratings.map((rating) => (
          <Button
            key={rating}
            variant={value === rating ? 'default' : 'outline'}
            size="sm"
            onClick={() => onChange(rating)}
            className={cn(
              'h-10 text-sm font-semibold',
              value === rating && 'ring-2 ring-primary'
            )}
          >
            {rating}
          </Button>
        ))}
      </div>
      
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Not at all likely</span>
        <span>Extremely likely</span>
      </div>
    </div>
  );
}

/**
 * Choice Input Component
 */
interface ChoiceInputProps {
  options: string[];
  multiple: boolean;
  value: string | string[];
  onChange: (value: string | string[]) => void;
}

function ChoiceInput({ options, multiple, value, onChange }: ChoiceInputProps) {
  const handleChange = useCallback((option: string) => {
    if (multiple) {
      const currentValues = Array.isArray(value) ? value : [];
      const newValues = currentValues.includes(option)
        ? currentValues.filter(v => v !== option)
        : [...currentValues, option];
      onChange(newValues);
    } else {
      onChange(option);
    }
  }, [multiple, value, onChange]);

  return (
    <div className="space-y-2">
      {options.map((option) => {
        const isSelected = multiple 
          ? Array.isArray(value) && value.includes(option)
          : value === option;

        return (
          <Button
            key={option}
            variant={isSelected ? 'default' : 'outline'}
            onClick={() => handleChange(option)}
            className={cn(
              'w-full justify-start text-left h-auto py-3 px-4',
              isSelected && 'ring-2 ring-primary'
            )}
          >
            {option}
          </Button>
        );
      })}
    </div>
  );
}

export default SurveyModal;