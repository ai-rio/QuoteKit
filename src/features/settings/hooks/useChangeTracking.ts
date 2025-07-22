import { useEffect, useState } from 'react';

import { CompanySettings, SettingsFormData, SettingsValidation } from '../types';

export interface FormData {
  company_name: string;
  company_address: string;
  company_phone: string;
  company_email: string;
  default_tax_rate: string;
  default_markup_rate: string;
  preferred_currency: string;
  quote_terms: string;
}

export function useChangeTracking(initialSettings: CompanySettings | null) {
  const [formData, setFormData] = useState<FormData>({
    company_name: initialSettings?.company_name || '',
    company_address: initialSettings?.company_address || '',
    company_phone: initialSettings?.company_phone || '',
    company_email: initialSettings?.company_email || '',
    default_tax_rate: initialSettings?.default_tax_rate?.toString() || '',
    default_markup_rate: initialSettings?.default_markup_rate?.toString() || '',
    preferred_currency: initialSettings?.preferred_currency || 'USD',
    quote_terms: initialSettings?.quote_terms || '',
  });

  const [hasChanges, setHasChanges] = useState(false);
  const [isValidForm, setIsValidForm] = useState(false);

  // Check if form has changes from initial state
  useEffect(() => {
    const initial = {
      company_name: initialSettings?.company_name || '',
      company_address: initialSettings?.company_address || '',
      company_phone: initialSettings?.company_phone || '',
      company_email: initialSettings?.company_email || '',
      default_tax_rate: initialSettings?.default_tax_rate?.toString() || '',
      default_markup_rate: initialSettings?.default_markup_rate?.toString() || '',
      preferred_currency: initialSettings?.preferred_currency || 'USD',
      quote_terms: initialSettings?.quote_terms || '',
    };

    const changed = Object.keys(formData).some(
      key => formData[key as keyof FormData] !== initial[key as keyof FormData]
    );
    
    setHasChanges(changed);
  }, [formData, initialSettings]);

  // Enhanced form validation
  const [validation, setValidation] = useState<SettingsValidation>({
    company_name: true,
    company_email: true,
    default_tax_rate: true,
    default_markup_rate: true,
  });

  // Check if form has required data for saving
  useEffect(() => {
    const newValidation: SettingsValidation = {
      company_name: formData.company_name.trim().length > 0,
      company_email: !formData.company_email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.company_email),
      default_tax_rate: !formData.default_tax_rate || (parseFloat(formData.default_tax_rate) >= 0 && parseFloat(formData.default_tax_rate) <= 100),
      default_markup_rate: !formData.default_markup_rate || (parseFloat(formData.default_markup_rate) >= 0 && parseFloat(formData.default_markup_rate) <= 1000),
    };
    
    setValidation(newValidation);
    setIsValidForm(Object.values(newValidation).every(Boolean));
  }, [formData]);

  const updateField = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getValidationMessage = (field: keyof SettingsValidation): string | null => {
    if (validation[field]) return null;
    
    switch (field) {
      case 'company_name':
        return 'Company name is required';
      case 'company_email':
        return 'Please enter a valid email address';
      case 'default_tax_rate':
        return 'Tax rate must be between 0% and 100%';
      case 'default_markup_rate':
        return 'Markup rate must be between 0% and 1000%';
      default:
        return null;
    }
  };

  const resetChanges = () => {
    setHasChanges(false);
  };

  return {
    formData,
    updateField,
    hasChanges,
    isValidForm,
    canSave: hasChanges && isValidForm,
    validation,
    getValidationMessage,
    resetChanges
  };
}