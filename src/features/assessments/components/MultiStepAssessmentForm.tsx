'use client';

import React, { useMemo, useState, useTransition } from 'react';
import { Calendar, User, MapPin, Phone, CheckCircle } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MultiStepForm, FormStep, useMultiStepForm } from '@/components/ui/multi-step-form';
import { getClients, getProperties } from '@/features/clients/actions';
import { Client, Property } from '@/features/clients/types';
import { CreateAssessmentData, UpdateAssessmentData, AssessmentStatus, PropertyAssessment } from '../types';

interface MultiStepAssessmentFormProps {
  mode: 'create' | 'edit';
  assessment?: PropertyAssessment;
  initialProperty?: Property | null;
  initialClientId?: string | null;
  onSubmit: (data: CreateAssessmentData | UpdateAssessmentData) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

interface AssessmentFormData {
  client_id: string;
  property_id: string;
  assessor_name: string;
  assessor_contact: string;
  scheduled_date: string;
  assessment_status: AssessmentStatus;
}

interface FormErrors {
  client_id?: string;
  property_id?: string;
  assessor_name?: string;
  assessor_contact?: string;
  scheduled_date?: string;
  assessment_status?: string;
  submit?: string;
}

export function MultiStepAssessmentForm({
  mode,
  assessment,
  initialProperty,
  initialClientId,
  onSubmit,
  onCancel,
  isSubmitting,
}: MultiStepAssessmentFormProps) {
  // State for clients and properties
  const [clients, setClients] = useState<Client[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(true);
  const [isLoadingProperties, setIsLoadingProperties] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Form data state
  const [formData, setFormData] = useState<AssessmentFormData>({
    client_id: initialClientId || '',
    property_id: initialProperty?.id || assessment?.property_id || '',
    assessor_name: assessment?.assessor_name || '',
    assessor_contact: assessment?.assessor_contact || '',
    scheduled_date: assessment?.scheduled_date || '',
    assessment_status: assessment?.assessment_status || 'scheduled',
  });

  const [errors, setErrors] = useState<FormErrors>({});

  // Load clients on component mount
  React.useEffect(() => {
    let mounted = true;

    async function loadClients() {
      try {
        const result = await getClients();
        if (mounted && result?.data) {
          setClients(result.data);
        }
      } catch (error) {
        console.error('Error loading clients:', error);
      } finally {
        if (mounted) {
          setIsLoadingClients(false);
        }
      }
    }

    loadClients();

    return () => {
      mounted = false;
    };
  }, []);

  // Load properties when client changes
  React.useEffect(() => {
    if (!formData.client_id) {
      setProperties([]);
      setFormData(prev => ({ ...prev, property_id: '' }));
      return;
    }

    let mounted = true;

    async function loadProperties() {
      setIsLoadingProperties(true);
      try {
        const result = await getProperties({ client_id: formData.client_id });
        if (mounted && result?.data) {
          const clientProperties = result.data.filter(
            (prop) => prop.client_id === formData.client_id
          );
          setProperties(clientProperties);
          
          // Auto-select property if there's only one or if it matches initialProperty
          if (clientProperties.length === 1) {
            setFormData(prev => ({ ...prev, property_id: clientProperties[0].id }));
          } else if (initialProperty && clientProperties.some(p => p.id === initialProperty.id)) {
            setFormData(prev => ({ ...prev, property_id: initialProperty.id }));
          } else {
            setFormData(prev => ({ ...prev, property_id: '' }));
          }
        }
      } catch (error) {
        console.error('Error loading properties:', error);
      } finally {
        if (mounted) {
          setIsLoadingProperties(false);
        }
      }
    }

    loadProperties();

    return () => {
      mounted = false;
    };
  }, [formData.client_id, initialProperty]);

  // Filter properties for selected client
  const availableProperties = useMemo(() => {
    return properties.filter((property) => property.client_id === formData.client_id);
  }, [properties, formData.client_id]);

  // Handle input changes
  const handleInputChange = (field: keyof AssessmentFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear errors when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Form submission
  const handleComplete = async () => {
    setErrors({});
    
    // Final validation
    const newErrors: FormErrors = {};
    
    if (!formData.client_id.trim()) {
      newErrors.client_id = 'Please select a client';
    }
    
    if (!formData.property_id.trim()) {
      newErrors.property_id = 'Please select a property';
    }
    
    if (!formData.assessor_name.trim()) {
      newErrors.assessor_name = 'Assessor name is required';
    }
    
    if (formData.assessor_contact && !/^[\w\s@.-]+$/.test(formData.assessor_contact)) {
      newErrors.assessor_contact = 'Please enter a valid email or phone number';
    }
    
    if (formData.scheduled_date) {
      const scheduledDate = new Date(formData.scheduled_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (scheduledDate < today) {
        newErrors.scheduled_date = 'Scheduled date cannot be in the past';
      }
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      startTransition(async () => {
        if (mode === 'edit') {
          const updateData: UpdateAssessmentData = {
            assessor_name: formData.assessor_name,
            assessor_contact: formData.assessor_contact || undefined,
            scheduled_date: formData.scheduled_date || undefined,
            assessment_status: formData.assessment_status,
          };
          await onSubmit(updateData);
        } else {
          const createData: CreateAssessmentData = {
            property_id: formData.property_id,
            assessor_name: formData.assessor_name,
            assessor_contact: formData.assessor_contact || undefined,
            scheduled_date: formData.scheduled_date || undefined,
            priority_level: 5, // Default priority
          };
          await onSubmit(createData);
        }
      });
    } catch (error) {
      console.error('Error submitting assessment:', error);
      setErrors({ 
        submit: `Failed to ${mode === 'edit' ? 'update' : 'create'} assessment. Please try again.` 
      });
    }
  };

  const isFormSubmitting = isSubmitting || isPending;

  return (
    <MultiStepForm onComplete={handleComplete} className="w-full max-w-4xl">
      {/* Step 1: Client Selection */}
      <FormStep
        title="Select Client"
        description="Choose the client for this property assessment"
        onValidation={() => !!formData.client_id}
      >
        <ClientSelectionStep
          clients={clients}
          selectedClientId={formData.client_id}
          isLoading={isLoadingClients}
          onClientSelect={(clientId) => handleInputChange('client_id', clientId)}
          error={errors.client_id}
        />
      </FormStep>

      {/* Step 2: Property Selection */}
      <FormStep
        title="Select Property"
        description="Choose the property to assess"
        onValidation={() => !!formData.property_id}
      >
        <PropertySelectionStep
          properties={availableProperties}
          selectedPropertyId={formData.property_id}
          isLoading={isLoadingProperties}
          hasSelectedClient={!!formData.client_id}
          onPropertySelect={(propertyId) => handleInputChange('property_id', propertyId)}
          error={errors.property_id}
        />
      </FormStep>

      {/* Step 3: Assessor Information */}
      <FormStep
        title="Assessor Details"
        description="Enter the assessor's information"
        onValidation={() => !!formData.assessor_name.trim()}
      >
        <AssessorInformationStep
          assessorName={formData.assessor_name}
          assessorContact={formData.assessor_contact}
          onAssessorNameChange={(value) => handleInputChange('assessor_name', value)}
          onAssessorContactChange={(value) => handleInputChange('assessor_contact', value)}
          nameError={errors.assessor_name}
          contactError={errors.assessor_contact}
        />
      </FormStep>

      {/* Step 4: Schedule & Status */}
      <FormStep
        title="Schedule Assessment"
        description="Set the date and status for the assessment"
        onValidation={() => true} // Optional fields, always valid
      >
        <ScheduleStatusStep
          scheduledDate={formData.scheduled_date}
          assessmentStatus={formData.assessment_status}
          onScheduledDateChange={(value) => handleInputChange('scheduled_date', value)}
          onStatusChange={(value) => handleInputChange('assessment_status', value as AssessmentStatus)}
          dateError={errors.scheduled_date}
        />
      </FormStep>

      {/* Step 5: Review & Submit */}
      <FormStep
        title="Review & Submit"
        description="Review your assessment details and submit"
        onValidation={() => !isFormSubmitting}
      >
        <ReviewSubmitStep
          formData={formData}
          clients={clients}
          properties={availableProperties}
          isSubmitting={isFormSubmitting}
          onCancel={onCancel}
          submitError={errors.submit}
        />
      </FormStep>
    </MultiStepForm>
  );
}

// Individual step components
function ClientSelectionStep({ 
  clients, 
  selectedClientId, 
  isLoading, 
  onClientSelect, 
  error 
}: {
  clients: Client[];
  selectedClientId: string;
  isLoading: boolean;
  onClientSelect: (clientId: string) => void;
  error?: string;
}) {
  const { nextStep, canProceed } = useMultiStepForm();
  
  const handleClientSelect = (clientId: string) => {
    onClientSelect(clientId);
    // Auto-advance after selection with a slight delay for UX
    setTimeout(() => {
      if (canProceed) {
        nextStep();
      }
    }, 800);
  };
  return (
    <div className="space-y-4">
      <div className="text-center mb-8">
        <User className="h-16 w-16 text-forest-green mx-auto mb-4" />
        <p className="text-charcoal text-lg">Select the client you'll be assessing a property for</p>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="client_id" className="text-charcoal font-semibold text-lg">
          Client *
        </Label>
        <Select
          value={selectedClientId}
          onValueChange={handleClientSelect}
          disabled={isLoading}
        >
          <SelectTrigger className={`w-full h-14 bg-paper-white border-2 border-stone-gray/40 focus:border-forest-green focus:ring-forest-green/20 data-[placeholder]:text-charcoal text-lg ${
            error ? 'border-red-500' : ''
          }`}>
            <SelectValue 
              placeholder={isLoading ? "Loading clients..." : "Select a client"} 
            />
          </SelectTrigger>
          <SelectContent className="bg-paper-white border-stone-gray/30">
            {clients.map((client) => (
              <SelectItem 
                key={client.id} 
                value={client.id}
                className="focus:bg-forest-green/10 focus:text-forest-green py-4"
              >
                <div className="flex flex-col">
                  <span className="font-medium text-charcoal text-lg">{client.name}</span>
                  {client.company_name && (
                    <span className="text-sm text-charcoal">{client.company_name}</span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {error && (
          <p className="text-sm text-red-500" role="alert">{error}</p>
        )}
      </div>
    </div>
  );
}

function PropertySelectionStep({ 
  properties, 
  selectedPropertyId, 
  isLoading, 
  hasSelectedClient, 
  onPropertySelect, 
  error 
}: {
  properties: Property[];
  selectedPropertyId: string;
  isLoading: boolean;
  hasSelectedClient: boolean;
  onPropertySelect: (propertyId: string) => void;
  error?: string;
}) {
  const { nextStep, canProceed } = useMultiStepForm();
  
  const handlePropertySelect = (propertyId: string) => {
    onPropertySelect(propertyId);
    // Auto-advance after selection with a slight delay for UX
    setTimeout(() => {
      if (canProceed) {
        nextStep();
      }
    }, 800);
  };
  return (
    <div className="space-y-4">
      <div className="text-center mb-8">
        <MapPin className="h-16 w-16 text-forest-green mx-auto mb-4" />
        <p className="text-charcoal text-lg">Choose the property to assess</p>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="property_id" className="text-charcoal font-semibold text-lg">
          Property *
        </Label>
        <Select
          value={selectedPropertyId}
          onValueChange={handlePropertySelect}
          disabled={!hasSelectedClient || isLoading}
        >
          <SelectTrigger className={`w-full h-14 bg-paper-white border-2 border-stone-gray/40 focus:border-forest-green focus:ring-forest-green/20 data-[placeholder]:text-charcoal text-lg ${
            error ? 'border-red-500' : ''
          }`}>
            <SelectValue 
              placeholder={
                !hasSelectedClient 
                  ? "Select a client first" 
                  : isLoading 
                  ? "Loading properties..." 
                  : "Select a property"
              } 
            />
          </SelectTrigger>
          <SelectContent className="bg-paper-white border-stone-gray/30">
            {properties.map((property) => (
              <SelectItem 
                key={property.id} 
                value={property.id}
                className="focus:bg-forest-green/10 focus:text-forest-green py-4"
              >
                <div className="flex flex-col">
                  <span className="font-medium text-charcoal text-lg">
                    {property.property_name || 'Unnamed Property'}
                  </span>
                  <span className="text-sm text-charcoal">
                    {property.service_address}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {error && (
          <p className="text-sm text-red-500" role="alert">{error}</p>
        )}
      </div>
    </div>
  );
}

function AssessorInformationStep({ 
  assessorName, 
  assessorContact, 
  onAssessorNameChange, 
  onAssessorContactChange, 
  nameError, 
  contactError 
}: {
  assessorName: string;
  assessorContact: string;
  onAssessorNameChange: (value: string) => void;
  onAssessorContactChange: (value: string) => void;
  nameError?: string;
  contactError?: string;
}) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <User className="h-16 w-16 text-forest-green mx-auto mb-4" />
        <p className="text-charcoal text-lg">Who will be conducting the assessment?</p>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="assessor_name" className="text-charcoal font-semibold text-lg">
          Assessor Name *
        </Label>
        <Input
          id="assessor_name"
          value={assessorName}
          onChange={(e) => onAssessorNameChange(e.target.value)}
          placeholder="Enter assessor's full name"
          className={`h-14 bg-paper-white border-2 border-stone-gray/40 focus:border-forest-green focus:ring-forest-green/20 placeholder:text-charcoal text-lg ${
            nameError ? 'border-red-500' : ''
          }`}
        />
        {nameError && (
          <p className="text-sm text-red-500" role="alert">{nameError}</p>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="assessor_contact" className="text-charcoal font-semibold text-lg">
          <Phone className="h-4 w-4 inline mr-2" />
          Contact Information
        </Label>
        <Input
          id="assessor_contact"
          value={assessorContact}
          onChange={(e) => onAssessorContactChange(e.target.value)}
          placeholder="Email or phone number (optional)"
          className={`h-14 bg-paper-white border-2 border-stone-gray/40 focus:border-forest-green focus:ring-forest-green/20 placeholder:text-charcoal text-lg ${
            contactError ? 'border-red-500' : ''
          }`}
        />
        {contactError && (
          <p className="text-sm text-red-500" role="alert">{contactError}</p>
        )}
      </div>
    </div>
  );
}

function ScheduleStatusStep({ 
  scheduledDate, 
  assessmentStatus, 
  onScheduledDateChange, 
  onStatusChange, 
  dateError 
}: {
  scheduledDate: string;
  assessmentStatus: AssessmentStatus;
  onScheduledDateChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  dateError?: string;
}) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <Calendar className="h-16 w-16 text-forest-green mx-auto mb-4" />
        <p className="text-charcoal text-lg">When should this assessment take place?</p>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="scheduled_date" className="text-charcoal font-semibold text-lg">
          Scheduled Date
        </Label>
        <Input
          id="scheduled_date"
          type="datetime-local"
          value={scheduledDate}
          onChange={(e) => onScheduledDateChange(e.target.value)}
          className={`h-14 bg-paper-white border-2 border-stone-gray/40 focus:border-forest-green focus:ring-forest-green/20 placeholder:text-charcoal text-lg ${
            dateError ? 'border-red-500' : ''
          }`}
        />
        {dateError && (
          <p className="text-sm text-red-500" role="alert">{dateError}</p>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="assessment_status" className="text-charcoal font-semibold text-lg">
          Status
        </Label>
        <Select value={assessmentStatus} onValueChange={onStatusChange}>
          <SelectTrigger className="w-full h-14 bg-paper-white border-2 border-stone-gray/40 focus:border-forest-green focus:ring-forest-green/20 data-[placeholder]:text-charcoal text-lg">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent className="bg-paper-white border-stone-gray/30">
            <SelectItem value="scheduled" className="focus:bg-forest-green/10 focus:text-forest-green py-3">
              Scheduled
            </SelectItem>
            <SelectItem value="in_progress" className="focus:bg-forest-green/10 focus:text-forest-green py-3">
              In Progress
            </SelectItem>
            <SelectItem value="completed" className="focus:bg-forest-green/10 focus:text-forest-green py-3">
              Completed
            </SelectItem>
            <SelectItem value="reviewed" className="focus:bg-forest-green/10 focus:text-forest-green py-3">
              Reviewed
            </SelectItem>
            <SelectItem value="requires_followup" className="focus:bg-forest-green/10 focus:text-forest-green py-3">
              Requires Follow-up
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function ReviewSubmitStep({ 
  formData, 
  clients, 
  properties, 
  isSubmitting, 
  onCancel, 
  submitError 
}: {
  formData: AssessmentFormData;
  clients: Client[];
  properties: Property[];
  isSubmitting: boolean;
  onCancel: () => void;
  submitError?: string;
}) {
  const selectedClient = clients.find(c => c.id === formData.client_id);
  const selectedProperty = properties.find(p => p.id === formData.property_id);
  
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <CheckCircle className="h-16 w-16 text-forest-green mx-auto mb-4" />
        <p className="text-charcoal text-lg">Review your assessment details before submitting</p>
      </div>
      
      <div className="bg-light-concrete/50 border border-stone-gray/30 rounded-lg p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="font-semibold text-charcoal">Client:</label>
            <p className="text-charcoal">{selectedClient?.name || 'Not selected'}</p>
            {selectedClient?.company_name && (
              <p className="text-sm text-charcoal opacity-80">{selectedClient.company_name}</p>
            )}
          </div>
          
          <div>
            <label className="font-semibold text-charcoal">Property:</label>
            <p className="text-charcoal">{selectedProperty?.property_name || 'Not selected'}</p>
            <p className="text-sm text-charcoal opacity-80">{selectedProperty?.service_address}</p>
          </div>
          
          <div>
            <label className="font-semibold text-charcoal">Assessor:</label>
            <p className="text-charcoal">{formData.assessor_name || 'Not specified'}</p>
            {formData.assessor_contact && (
              <p className="text-sm text-charcoal opacity-80">{formData.assessor_contact}</p>
            )}
          </div>
          
          <div>
            <label className="font-semibold text-charcoal">Schedule:</label>
            <p className="text-charcoal">
              {formData.scheduled_date 
                ? new Date(formData.scheduled_date).toLocaleString()
                : 'Not scheduled'
              }
            </p>
            <p className="text-sm text-charcoal opacity-80 capitalize">
              Status: {formData.assessment_status.replace('_', ' ')}
            </p>
          </div>
        </div>
      </div>
      
      {submitError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4" role="alert">
          <p className="text-red-700 font-medium">{submitError}</p>
        </div>
      )}
      
      <div className="flex justify-center">
        <button
          type="button"
          onClick={onCancel}
          className="mr-4 bg-paper-white border-2 border-stone-gray/50 text-charcoal hover:bg-stone-gray/10 font-semibold px-8 py-4 rounded-lg transition-all duration-200"
          disabled={isSubmitting}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}