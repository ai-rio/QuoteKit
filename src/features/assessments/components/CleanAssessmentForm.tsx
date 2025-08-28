'use client';

import React, { useMemo, useState, useTransition } from 'react';
import { Loader2, Calendar, User, MapPin, Phone } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getClients, getProperties } from '@/features/clients/actions';
import { Client, Property } from '@/features/clients/types';
import { CreateAssessmentData, UpdateAssessmentData, AssessmentStatus, PropertyAssessment } from '../types';

interface CleanAssessmentFormProps {
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

export function CleanAssessmentForm({
  mode,
  assessment,
  initialProperty,
  initialClientId,
  onSubmit,
  onCancel,
  isSubmitting,
}: CleanAssessmentFormProps) {
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

  // Form validation
  const validateForm = (): boolean => {
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    if (!validateForm()) {
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
    <Card className="w-full max-w-2xl mx-auto bg-paper-white border-stone-gray/30 shadow-lg">
      <CardHeader className="border-b border-stone-gray/20 bg-gradient-to-r from-forest-green/5 to-forest-green/10">
        <CardTitle className="text-xl font-bold text-forest-green flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          {mode === 'create' ? 'Create New Assessment' : 'Edit Assessment'}
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Client Selection */}
          <div className="space-y-2">
            <Label htmlFor="client_id" className="text-charcoal font-semibold">
              <User className="h-4 w-4" />
              Client *
            </Label>
            <Select
              value={formData.client_id}
              onValueChange={(value) => handleInputChange('client_id', value)}
              disabled={isLoadingClients}
            >
              <SelectTrigger 
                className={`w-full bg-paper-white border-stone-gray/40 focus:border-forest-green focus:ring-forest-green/20 data-[placeholder]:text-charcoal ${
                  errors.client_id ? 'border-red-500' : ''
                }`}
              >
                <SelectValue 
                  placeholder={isLoadingClients ? "Loading clients..." : "Select a client"} 
                />
              </SelectTrigger>
              <SelectContent className="bg-paper-white border-stone-gray/30">
                {clients.map((client) => (
                  <SelectItem 
                    key={client.id} 
                    value={client.id}
                    className="focus:bg-forest-green/10 focus:text-forest-green"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium text-charcoal">{client.name}</span>
                      {client.company_name && (
                        <span className="text-sm text-charcoal">{client.company_name}</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.client_id && (
              <p className="text-sm text-red-500" role="alert">{errors.client_id}</p>
            )}
          </div>

          {/* Property Selection */}
          <div className="space-y-2">
            <Label htmlFor="property_id" className="text-charcoal font-semibold">
              <MapPin className="h-4 w-4" />
              Property *
            </Label>
            <Select
              value={formData.property_id}
              onValueChange={(value) => handleInputChange('property_id', value)}
              disabled={!formData.client_id || isLoadingProperties}
            >
              <SelectTrigger 
                className={`w-full bg-paper-white border-stone-gray/40 focus:border-forest-green focus:ring-forest-green/20 data-[placeholder]:text-charcoal ${
                  errors.property_id ? 'border-red-500' : ''
                }`}
              >
                <SelectValue 
                  placeholder={
                    !formData.client_id 
                      ? "Select a client first" 
                      : isLoadingProperties 
                      ? "Loading properties..." 
                      : "Select a property"
                  } 
                />
              </SelectTrigger>
              <SelectContent className="bg-paper-white border-stone-gray/30">
                {availableProperties.map((property) => (
                  <SelectItem 
                    key={property.id} 
                    value={property.id}
                    className="focus:bg-forest-green/10 focus:text-forest-green"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium text-charcoal">
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
            {errors.property_id && (
              <p className="text-sm text-red-500" role="alert">{errors.property_id}</p>
            )}
          </div>

          {/* Assessor Name */}
          <div className="space-y-2">
            <Label htmlFor="assessor_name" className="text-charcoal font-semibold">
              <User className="h-4 w-4" />
              Assessor Name *
            </Label>
            <Input
              id="assessor_name"
              value={formData.assessor_name}
              onChange={(e) => handleInputChange('assessor_name', e.target.value)}
              placeholder="Enter assessor's full name"
              className={`bg-paper-white border-stone-gray/40 focus:border-forest-green focus:ring-forest-green/20 placeholder:text-charcoal ${
                errors.assessor_name ? 'border-red-500' : ''
              }`}
            />
            {errors.assessor_name && (
              <p className="text-sm text-red-500" role="alert">{errors.assessor_name}</p>
            )}
          </div>

          {/* Assessor Contact */}
          <div className="space-y-2">
            <Label htmlFor="assessor_contact" className="text-charcoal font-semibold">
              <Phone className="h-4 w-4" />
              Assessor Contact
            </Label>
            <Input
              id="assessor_contact"
              value={formData.assessor_contact}
              onChange={(e) => handleInputChange('assessor_contact', e.target.value)}
              placeholder="Email or phone number (optional)"
              className={`bg-paper-white border-stone-gray/40 focus:border-forest-green focus:ring-forest-green/20 placeholder:text-charcoal ${
                errors.assessor_contact ? 'border-red-500' : ''
              }`}
            />
            {errors.assessor_contact && (
              <p className="text-sm text-red-500" role="alert">{errors.assessor_contact}</p>
            )}
          </div>

          {/* Scheduled Date */}
          <div className="space-y-2">
            <Label htmlFor="scheduled_date" className="text-charcoal font-semibold">
              <Calendar className="h-4 w-4" />
              Scheduled Date
            </Label>
            <Input
              id="scheduled_date"
              type="datetime-local"
              value={formData.scheduled_date}
              onChange={(e) => handleInputChange('scheduled_date', e.target.value)}
              className={`bg-paper-white border-stone-gray/40 focus:border-forest-green focus:ring-forest-green/20 placeholder:text-charcoal ${
                errors.scheduled_date ? 'border-red-500' : ''
              }`}
            />
            {errors.scheduled_date && (
              <p className="text-sm text-red-500" role="alert">{errors.scheduled_date}</p>
            )}
          </div>

          {/* Assessment Status */}
          <div className="space-y-2">
            <Label htmlFor="assessment_status" className="text-charcoal font-semibold">
              Status
            </Label>
            <Select 
              value={formData.assessment_status} 
              onValueChange={(value) => handleInputChange('assessment_status', value as AssessmentStatus)}
            >
              <SelectTrigger className="w-full bg-paper-white border-stone-gray/40 focus:border-forest-green focus:ring-forest-green/20 data-[placeholder]:text-charcoal">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent className="bg-paper-white border-stone-gray/30">
                <SelectItem value="scheduled" className="focus:bg-forest-green/10 focus:text-forest-green">
                  Scheduled
                </SelectItem>
                <SelectItem value="in_progress" className="focus:bg-forest-green/10 focus:text-forest-green">
                  In Progress
                </SelectItem>
                <SelectItem value="completed" className="focus:bg-forest-green/10 focus:text-forest-green">
                  Completed
                </SelectItem>
                <SelectItem value="reviewed" className="focus:bg-forest-green/10 focus:text-forest-green">
                  Reviewed
                </SelectItem>
                <SelectItem value="requires_followup" className="focus:bg-forest-green/10 focus:text-forest-green">
                  Requires Follow-up
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4" role="alert">
              <p className="text-red-700 font-medium">{errors.submit}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-stone-gray/20">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isFormSubmitting}
              className="bg-paper-white border-stone-gray/50 text-charcoal hover:bg-stone-gray/10 hover:border-stone-gray font-semibold px-6 py-3 h-12 rounded-lg transition-all duration-200 focus-visible:ring-2 focus-visible:ring-forest-green focus-visible:ring-offset-2"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={isFormSubmitting}
              className="bg-forest-green border-forest-green text-paper-white hover:bg-forest-green/90 disabled:opacity-60 disabled:cursor-not-allowed font-semibold px-6 py-3 h-12 rounded-lg transition-all duration-200 focus-visible:ring-2 focus-visible:ring-forest-green focus-visible:ring-offset-2 flex-1"
            >
              {isFormSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Assessment...
                </>
              ) : (
                <>
                  <Calendar className="mr-2 h-4 w-4" />
                  Create Assessment
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}