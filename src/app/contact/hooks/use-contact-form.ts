import { useState } from 'react';

interface ContactFormData {
  fullName: string;
  email: string;
  reason: string;
  message: string;
}

interface UseContactFormReturn {
  submitForm: (data: ContactFormData) => Promise<void>;
  isSubmitting: boolean;
  isSubmitted: boolean;
  error: string | null;
  resetForm: () => void;
}

export function useContactForm(): UseContactFormReturn {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitForm = async (data: ContactFormData): Promise<void> => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Validate form data
      if (!data.fullName.trim()) {
        throw new Error('Full name is required');
      }
      if (!data.email.trim()) {
        throw new Error('Email is required');
      }
      if (!data.message.trim()) {
        throw new Error('Message is required');
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        throw new Error('Please enter a valid email address');
      }

      // Simulate API call - replace with actual submission logic
      await new Promise(resolve => setTimeout(resolve, 2000));

      // In a real implementation, you would send the data to your backend:
      // const response = await fetch('/api/contact', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify(data),
      // });
      // 
      // if (!response.ok) {
      //   throw new Error('Failed to send message');
      // }

      // For now, we'll just log the data and mark as submitted
      console.log('Contact form submitted:', data);
      
      setIsSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setIsSubmitting(false);
    setIsSubmitted(false);
    setError(null);
  };

  return {
    submitForm,
    isSubmitting,
    isSubmitted,
    error,
    resetForm,
  };
}
