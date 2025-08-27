'use client';

import { Calendar, Users } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getClients } from '@/features/clients/actions';
import { PropertySelector } from '@/features/clients/components/PropertySelector';
import { Property } from '@/features/clients/types';

import { AssessmentStatus } from '../../types';

interface BasicInformationFieldsProps {
  formData: {
    property_id: string;
    assessor_name: string;
    assessor_contact: string;
    scheduled_date: string;
    assessment_status: AssessmentStatus;
    weather_conditions: string;
    temperature_f: number | '';
  };
  errors: Record<string, string>;
  onChange: (field: string, value: any) => void;
  initialProperty?: Property | null;
  initialClientId?: string | null;
}

export function BasicInformationFields({ 
  formData, 
  errors, 
  onChange, 
  initialProperty, 
  initialClientId 
}: BasicInformationFieldsProps) {
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>(initialClientId || '');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(initialProperty || null);
  const [loadingClients, setLoadingClients] = useState(false);

  // Load clients on component mount
  useEffect(() => {
    const loadClients = async () => {
      setLoadingClients(true);
      try {
        const response = await getClients();
        if (response?.data) {
          setClients(response.data);
          
          // If we have an initial property, find its client
          if (initialProperty && !initialClientId) {
            const propertyClient = response.data.find(client => 
              client.id === initialProperty.client_id
            );
            if (propertyClient) {
              setSelectedClientId(propertyClient.id);
            }
          }
        }
      } catch (error) {
        console.error('Error loading clients:', error);
      } finally {
        setLoadingClients(false);
      }
    };

    loadClients();
  }, [initialProperty, initialClientId]);

  // Update selected property when form data changes
  useEffect(() => {
    if (formData.property_id && !selectedProperty) {
      // Property ID exists but no selected property - this happens when editing
      // The property will be set by the parent component
    }
  }, [formData.property_id, selectedProperty]);

  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId);
    setSelectedProperty(null);
    onChange('property_id', '');
  };

  const handlePropertySelect = (property: Property | null) => {
    setSelectedProperty(property);
    onChange('property_id', property?.id || '');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Users className="h-6 w-6 text-forest-green" />
        <h3 className="text-xl md:text-2xl font-bold text-forest-green">Basic Information</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Client Selection */}
        <div className="space-y-2">
          <Label htmlFor="client_select" className="text-lg text-charcoal font-medium">
            Client *
          </Label>
          <Select
            value={selectedClientId}
            onValueChange={handleClientSelect}
            disabled={loadingClients || !!initialClientId}
          >
            <SelectTrigger>
              <SelectValue placeholder={loadingClients ? "Loading clients..." : "Select client"} />
            </SelectTrigger>
            <SelectContent>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.company_name || client.name}
                  {client.company_name && (
                    <span className="text-sm text-stone-gray ml-2">({client.name})</span>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {initialClientId && (
            <p className="text-sm text-stone-gray">Client pre-selected</p>
          )}
        </div>

        {/* Property Selection */}
        <div className="space-y-2">
          <Label className="text-lg text-charcoal font-medium">
            Property *
          </Label>
          <PropertySelector
            clientId={selectedClientId}
            selectedProperty={selectedProperty}
            onPropertySelect={handlePropertySelect}
            placeholder="Select property for assessment..."
            className={errors.property_id ? 'border-red-500' : ''}
            disabled={!selectedClientId}
          />
          {errors.property_id && (
            <p className="text-sm text-red-600">{errors.property_id}</p>
          )}
          {!selectedClientId && (
            <p className="text-sm text-stone-gray">Select a client first</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="assessor_name" className="text-lg text-charcoal font-medium">
            Assessor Name *
          </Label>
          <Input
            id="assessor_name"
            value={formData.assessor_name}
            onChange={(e) => onChange('assessor_name', e.target.value)}
            className={errors.assessor_name ? 'border-red-500' : ''}
            placeholder="Enter assessor name"
          />
          {errors.assessor_name && (
            <p className="text-sm text-red-600">{errors.assessor_name}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="assessor_contact" className="text-lg text-charcoal font-medium">
            Assessor Contact
          </Label>
          <Input
            id="assessor_contact"
            value={formData.assessor_contact}
            onChange={(e) => onChange('assessor_contact', e.target.value)}
            placeholder="Phone or email"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="scheduled_date" className="text-lg text-charcoal font-medium">
            Scheduled Date
          </Label>
          <div className="relative">
            <Calendar className="absolute left-3 top-3 h-4 w-4 text-stone-gray" />
            <Input
              id="scheduled_date"
              type="datetime-local"
              value={formData.scheduled_date}
              onChange={(e) => onChange('scheduled_date', e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="assessment_status" className="text-lg text-charcoal font-medium">
            Assessment Status
          </Label>
          <Select
            value={formData.assessment_status}
            onValueChange={(value) => onChange('assessment_status', value as AssessmentStatus)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="reviewed">Reviewed</SelectItem>
              <SelectItem value="requires_followup">Requires Follow-up</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="weather_conditions" className="text-lg text-charcoal font-medium">
            Weather Conditions
          </Label>
          <Input
            id="weather_conditions"
            value={formData.weather_conditions}
            onChange={(e) => onChange('weather_conditions', e.target.value)}
            placeholder="e.g., Sunny, Cloudy, Light rain"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="temperature_f" className="text-lg text-charcoal font-medium">
            Temperature (°F)
          </Label>
          <Input
            id="temperature_f"
            type="number"
            value={formData.temperature_f}
            onChange={(e) => onChange('temperature_f', e.target.value ? Number(e.target.value) : '')}
            placeholder="Temperature in Fahrenheit"
          />
        </div>
      </div>

      {/* Property Context Display */}
      {selectedProperty && (
        <div className="mt-6 p-4 bg-forest-green/5 border border-forest-green/20 rounded-lg">
          <h4 className="font-medium text-forest-green mb-2">Selected Property</h4>
          <div className="text-sm text-charcoal space-y-1">
            <p><strong>Name:</strong> {selectedProperty.property_name || 'Unnamed Property'}</p>
            <p><strong>Address:</strong> {selectedProperty.service_address}</p>
            <p><strong>Type:</strong> {selectedProperty.property_type}</p>
            {selectedProperty.square_footage && (
              <p><strong>Size:</strong> {selectedProperty.square_footage.toLocaleString()} sq ft</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
