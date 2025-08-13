'use client';

import { Loader2 } from 'lucide-react';
import { useRef, useState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/use-toast';
import { saveCompanySettings } from '@/features/settings/actions';
import { type FormData,useChangeTracking } from '@/features/settings/hooks/useChangeTracking';
import { CompanySettings } from '@/features/settings/types';
import { deleteLogo, uploadLogo } from '@/features/settings/utils/logo-upload';

import { CompanyProfileCard } from './CompanyProfileCard';
import { FinancialDefaultsCard } from './FinancialDefaultsCard';
import { QuoteTermsCard } from './QuoteTermsCard';

interface SettingsManagerProps {
  initialSettings: CompanySettings | null;
  userId: string;
}

export function SettingsManager({ initialSettings, userId }: SettingsManagerProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(initialSettings?.logo_url || null);
  const formRef = useRef<HTMLFormElement>(null);

  const { formData, updateField, hasChanges, canSave, resetChanges } = useChangeTracking(initialSettings);

  // Wrapper function to handle type conversion for card components
  const handleFieldChange = (field: string, value: string) => {
    updateField(field as keyof FormData, value);
  };

  const handleLogoChange = async (file: File | null) => {
    if (file) {
      setLogoFile(file);
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setLogoUrl(previewUrl);
    } else {
      setLogoFile(null);
      setLogoUrl(null);
      // Don't delete immediately - wait for save
    }
  };

  const handleSave = async () => {
    if (!canSave) return;

    setIsSaving(true);
    setError(null);

    try {
      let finalLogoUrl = logoUrl;
      let finalLogoFileName = initialSettings?.logo_file_name || null;

      // Handle logo changes
      if (logoFile) {
        // New file was selected - upload it
        const uploadResult = await uploadLogo(logoFile, userId);
        
        if (uploadResult.error) {
          setError(uploadResult.error);
          setIsSaving(false);
          return;
        }

        if (uploadResult.url && uploadResult.fileName) {
          finalLogoUrl = uploadResult.url;
          finalLogoFileName = uploadResult.fileName;

          // Clean up old logo if it exists
          if (initialSettings?.logo_file_name && initialSettings.logo_file_name !== uploadResult.fileName) {
            await deleteLogo(initialSettings.logo_file_name);
          }
        }
      } else if (logoUrl === null && initialSettings?.logo_file_name) {
        // Logo was removed - delete the existing file
        await deleteLogo(initialSettings.logo_file_name);
        finalLogoUrl = null;
        finalLogoFileName = null;
      }

      // Create form data for submission
      const submissionData = new FormData();
      submissionData.append('company_name', formData.company_name);
      submissionData.append('company_address', formData.company_address);
      submissionData.append('company_phone', formData.company_phone);
      submissionData.append('company_email', formData.company_email);
      submissionData.append('preferred_currency', formData.preferred_currency);
      submissionData.append('quote_terms', formData.quote_terms);
      submissionData.append('default_tax_rate', formData.default_tax_rate);
      submissionData.append('default_markup_rate', formData.default_markup_rate);
      
      if (finalLogoUrl) {
        submissionData.append('logo_url', finalLogoUrl);
      }
      if (finalLogoFileName) {
        submissionData.append('logo_file_name', finalLogoFileName);
      }

      const response = await saveCompanySettings(submissionData);

      if (response?.error) {
        setError(response.error.message || 'Failed to save settings');
      } else {
        toast({
          description: 'Settings saved successfully',
        });
        
        // Reset change tracking after successful save
        resetChanges();
        
        // Clean up preview URL if it was created
        if (logoFile && logoUrl?.startsWith('blob:')) {
          URL.revokeObjectURL(logoUrl);
        }
        setLogoFile(null);
      }
    } catch (err) {
      console.error('Save error:', err);
      setError('Failed to save settings');
    }

    setIsSaving(false);
  };

  return (
    <div className="space-y-6">
      {/* Header with Save Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-3xl md:text-4xl font-bold text-charcoal">Settings</h1>
          <p className="text-sm sm:text-base text-charcoal/70">
            Manage your company information and quote settings.
          </p>
        </div>
        
        <Button
          onClick={handleSave}
          disabled={!canSave || isSaving}
          className={`w-full sm:w-auto min-h-[44px] px-6 py-3 rounded-lg font-bold transition-all duration-200 ${
            !canSave 
              ? 'bg-paper-white text-charcoal/60' 
              : 'bg-equipment-yellow text-charcoal hover:bg-equipment-yellow/90 hover:text-charcoal active:bg-equipment-yellow/80'
          } border border-stone-gray`}
          data-tour="save-settings"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Form Sections */}
      <form ref={formRef} className="space-y-6">
        {/* Company Profile Section */}
        <div data-tour="company-profile">
          <CompanyProfileCard
          companyName={formData.company_name}
          companyAddress={formData.company_address}
          companyPhone={formData.company_phone}
          companyEmail={formData.company_email}
          logoUrl={logoUrl}
          onFieldChange={handleFieldChange}
          onLogoChange={handleLogoChange}
        />
        </div>

        <Separator className="bg-stone-gray" />

        {/* Financial Defaults Section */}
        <div data-tour="financial-defaults">
          <FinancialDefaultsCard
            taxRate={formData.default_tax_rate}
            markupRate={formData.default_markup_rate}
            onFieldChange={handleFieldChange}
          />
        </div>

        <Separator className="bg-stone-gray" />

        {/* Quote Terms Section */}
        <div data-tour="quote-terms">
          <QuoteTermsCard
            preferredCurrency={formData.preferred_currency}
            quoteTerms={formData.quote_terms}
            onFieldChange={handleFieldChange}
          />
        </div>
      </form>

      {/* Change Indicator - Mobile Optimized */}
      {hasChanges && (
        <div className="fixed bottom-4 left-4 right-4 sm:bottom-6 sm:left-auto sm:right-6 sm:w-auto bg-equipment-yellow text-charcoal px-4 py-3 rounded-lg shadow-lg border border-stone-gray z-50">
          <p className="text-sm font-medium text-center sm:text-left">Unsaved changes</p>
        </div>
      )}
    </div>
  );
}