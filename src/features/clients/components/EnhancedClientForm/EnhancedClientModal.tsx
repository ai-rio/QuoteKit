/**
 * Enhanced Client Modal Component
 * Responsive modal with address autocomplete and mobile bottom sheet design
 */

'use client';

import { ChevronDown,Loader2, X } from 'lucide-react';
import React, { useEffect, useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription,DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetDescription,SheetHeader, SheetTitle } from '@/components/ui/sheet';

import { createClient, updateClient } from '../../actions';
import { Client, ClientFormData, ClientFormErrors, ClientStructuredAddress,CommercialClientFormData } from '../../types';
import { BasicInfoSection,ClientTypeSection, CommercialInfoSection } from './ClientFormSections';

interface EnhancedClientModalProps {
  client?: Client;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (client: Client) => void;
  mode?: 'create' | 'edit';
}

export function EnhancedClientModal({
  client,
  isOpen,
  onClose,
  onSuccess,
  mode = client ? 'edit' : 'create',
}: EnhancedClientModalProps) {
  
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<ClientFormErrors>({});
  const [isMobile, setIsMobile] = useState(false);
  const [clientType, setClientType] = useState<'residential' | 'commercial'>(
    client?.client_type || 'residential'
  );

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Initialize form data based on client type
  const initializeFormData = (): ClientFormData => {
    const baseData = {
      name: client?.name || '',
      email: client?.email || '',
      phone: client?.phone || '',
      address: client?.address || '',
      notes: client?.notes || '',
      client_status: client?.client_status || 'lead' as const,
      preferred_communication: client?.preferred_communication || '' as const,
      structured_address: client?.structured_address || undefined,
    };

    if (clientType === 'commercial') {
      return {
        ...baseData,
        client_type: 'commercial',
        company_name: client?.company_name || '',
        billing_address: client?.billing_address || '',
        primary_contact_person: client?.primary_contact_person || '',
        tax_id: client?.tax_id || '',
        business_license: client?.business_license || '',
        service_area: client?.service_area || '',
        credit_terms: Number(client?.credit_terms ?? 30),
        credit_limit: Number(client?.credit_limit ?? 0),
        structured_billing_address: client?.structured_billing_address || undefined,
      };
    }

    return {
      ...baseData,
      client_type: 'residential',
    };
  };

  const [formData, setFormData] = useState<ClientFormData>(initializeFormData());

  // Update form data when client type changes
  useEffect(() => {
    setFormData(initializeFormData());
  }, [clientType]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData(initializeFormData());
      setErrors({});
    }
  }, [isOpen, client]);

  const isEditing = !!client;

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: ClientFormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Client name is required';
    }

    if (formData.email && formData.email.trim()) {
      const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = 'Please enter a valid email address';
      }
    }

    // Commercial client validation
    if (clientType === 'commercial') {
      const commercialData = formData as CommercialClientFormData;
      
      if (!commercialData.company_name.trim()) {
        newErrors.company_name = 'Company name is required for commercial clients';
      }
      
      if (!commercialData.primary_contact_person.trim()) {
        newErrors.primary_contact_person = 'Primary contact person is required for commercial clients';
      }

      if (commercialData.credit_terms < 0 || commercialData.credit_terms > 365) {
        newErrors.credit_terms = 'Credit terms must be between 0 and 365 days';
      }

      if (commercialData.credit_limit < 0) {
        newErrors.credit_limit = 'Credit limit cannot be negative';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    startTransition(async () => {
      const formDataObj = new FormData();
      
      // Base fields
      formDataObj.append('name', formData.name.trim());
      formDataObj.append('email', formData.email.trim());
      formDataObj.append('phone', formData.phone.trim());
      formDataObj.append('address', formData.address.trim());
      formDataObj.append('notes', formData.notes.trim());
      formDataObj.append('client_type', formData.client_type);
      formDataObj.append('client_status', formData.client_status);
      formDataObj.append('preferred_communication', formData.preferred_communication);

      // Structured address data (serialize as JSON)
      if (formData.structured_address) {
        formDataObj.append('structured_address', JSON.stringify(formData.structured_address));
      }

      // Commercial fields
      if (formData.client_type === 'commercial') {
        const commercialData = formData as CommercialClientFormData;
        formDataObj.append('company_name', commercialData.company_name.trim());
        formDataObj.append('billing_address', commercialData.billing_address.trim());
        formDataObj.append('primary_contact_person', commercialData.primary_contact_person.trim());
        formDataObj.append('tax_id', commercialData.tax_id.trim());
        formDataObj.append('business_license', commercialData.business_license.trim());
        formDataObj.append('service_area', commercialData.service_area.trim());
        formDataObj.append('credit_terms', commercialData.credit_terms.toString());
        formDataObj.append('credit_limit', commercialData.credit_limit.toString());

        // Structured billing address data
        if (commercialData.structured_billing_address) {
          formDataObj.append('structured_billing_address', JSON.stringify(commercialData.structured_billing_address));
        }
      }

      try {
        const result = isEditing 
          ? await updateClient(client.id, formDataObj)
          : await createClient(formDataObj);

        if (result?.error) {
          setErrors({ name: result.error.message });
        } else if (result?.data) {
          onSuccess?.(result.data);
          onClose();
        }
      } catch (error) {
        setErrors({ name: 'An unexpected error occurred' });
      }
    });
  };

  // Handle input changes
  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field as keyof ClientFormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Handle structured address changes
  const handleStructuredAddressChange = (field: string, address: ClientStructuredAddress) => {
    setFormData(prev => ({ ...prev, [field]: address }));
  };

  // Handle client type change
  const handleClientTypeChange = (newType: 'residential' | 'commercial') => {
    setClientType(newType);
    setErrors({}); // Clear all errors when switching types
  };

  // Form content component - form fields only, no footer
  const FormContent = () => (
    <div className="space-y-8 w-full">
      {/* Client Type Selection */}
      <ClientTypeSection
        clientType={clientType}
        onClientTypeChange={handleClientTypeChange}
      />

      {/* Commercial Information Section */}
      {clientType === 'commercial' && (
        <>
          <Separator className="my-8" />
          <CommercialInfoSection
            formData={formData}
            errors={errors}
            onInputChange={handleInputChange}
            onStructuredAddressChange={handleStructuredAddressChange}
            clientType={clientType}
            onClientTypeChange={handleClientTypeChange}
          />
        </>
      )}

      {/* Basic Information Section */}
      <Separator className="my-8" />
      <div className="space-y-6">
        <h3 className="text-2xl font-bold text-forest-green">
          {clientType === 'commercial' ? 'Contact Information' : 'Client Information'}
        </h3>
        <BasicInfoSection
          formData={formData}
          errors={errors}
          onInputChange={handleInputChange}
          onStructuredAddressChange={handleStructuredAddressChange}
          clientType={clientType}
          onClientTypeChange={handleClientTypeChange}
        />
      </div>
    </div>
  );

  // Form actions component - extracted for reuse
  const FormActions = ({ className = "" }: { className?: string }) => (
    <div className={`border-t border-stone-gray/20 pt-6 ${className}`}>
      <div className="flex flex-col-reverse sm:flex-row gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          className="bg-paper-white text-charcoal border-2 border-stone-gray hover:bg-stone-gray/20 font-bold px-8 py-3 rounded-lg transition-all duration-200 min-h-[44px] touch-manipulation"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isPending || !formData.name.trim()}
          className="bg-forest-green text-paper-white hover:opacity-90 active:opacity-80 font-bold px-8 py-3 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg min-h-[44px] touch-manipulation"
          onClick={handleSubmit}
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isEditing ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            isEditing ? 'Update Client' : 'Create Client'
          )}
        </Button>
      </div>
    </div>
  );

  // Mobile bottom sheet version
  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent 
          side="bottom" 
          className="h-[95vh] max-h-[95vh] bg-paper-white rounded-t-2xl border-t-2 border-stone-gray/20 p-0 overflow-hidden"
        >
          <form onSubmit={handleSubmit} className="flex flex-col h-full max-h-full">
            {/* Mobile header with drag indicator */}
            <div className="flex-shrink-0 flex flex-col items-center px-6 pt-4 pb-2">
              <div className="w-12 h-1 bg-stone-gray/40 rounded-full mb-4" />
              <SheetHeader className="text-center space-y-2">
                <SheetTitle className="text-2xl font-bold text-forest-green">
                  {isEditing ? 'Edit Client' : 'New Client'}
                </SheetTitle>
                <SheetDescription className="text-charcoal/70">
                  {isEditing 
                    ? 'Update client information and preferences'
                    : 'Add a new client to your system'
                  }
                </SheetDescription>
              </SheetHeader>
            </div>

            {/* Scrollable form content with explicit height calculation for mobile */}
            <div className="flex-1 min-h-0">
              <ScrollArea className="h-[calc(95vh-220px)] w-full">
                <div className="px-6 pb-4 pt-2">
                  <FormContent />
                </div>
              </ScrollArea>
            </div>

            {/* Fixed footer outside of scroll area */}
            <div className="flex-shrink-0 px-6 pb-6 bg-paper-white">
              <FormActions />
            </div>
          </form>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop modal version
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-[90vw] h-[90vh] bg-paper-white rounded-2xl border border-stone-gray/20 shadow-xl p-0 overflow-hidden sm:max-w-4xl [&>button]:hidden">
        <form onSubmit={handleSubmit} className="flex flex-col h-full max-h-full">
          {/* Desktop header */}
          <DialogHeader className="flex-shrink-0 px-8 py-6 border-b border-stone-gray/20 relative">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <DialogTitle className="text-3xl font-bold text-forest-green">
                  {isEditing ? 'Edit Client' : 'New Client'}
                </DialogTitle>
                <DialogDescription className="text-lg text-charcoal/70 mt-2">
                  {isEditing 
                    ? 'Update client information and preferences'
                    : 'Add a new client with enhanced address lookup'
                  }
                </DialogDescription>
              </div>
              <Button
                variant="ghost"
                onClick={onClose}
                className="h-10 w-10 rounded-full hover:bg-stone-gray/20 p-0 absolute top-6 right-8 z-10"
              >
                <X className="h-5 w-5 text-charcoal/70" />
                <span className="sr-only">Close</span>
              </Button>
            </div>
          </DialogHeader>

          {/* Scrollable form content with explicit height calculation */}
          <div className="flex-1 min-h-0">
            <ScrollArea className="h-[calc(90vh-200px)] w-full">
              <div className="px-8 py-6 pb-4">
                <FormContent />
              </div>
            </ScrollArea>
          </div>

          {/* Fixed footer outside of scroll area */}
          <div className="flex-shrink-0 px-8 pb-6 bg-paper-white">
            <FormActions />
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}