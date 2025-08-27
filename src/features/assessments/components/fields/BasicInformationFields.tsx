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
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [loadingClients, setLoadingClients] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load clients on component mount
  useEffect(() => {
    const loadClients = async () => {
      setLoadingClients(true);
      try {
        const response = await getClients();
        if (response?.data) {
          setClients(response.data);
          setIsInitialized(true);
        }
      } catch (error) {
        console.error('Error loading clients:', error);
        setIsInitialized(true);
      } finally {
        setLoadingClients(false);
      }
    };

    loadClients();
  }, []);

  // Set initial data after clients are loaded
  useEffect(() => {
    if (isInitialized && clients.length > 0) {
      // Set initial client
      let clientId = initialClientId;
      
      // If we have an initial property but no explicit client ID, find the client
      if (initialProperty && !initialClientId) {
        const propertyClient = clients.find(client => 
          client.id === initialProperty.client_id
        );
        if (propertyClient) {
          clientId = propertyClient.id;
        }
      }

      if (clientId) {
        setSelectedClientId(clientId);
      }

      // Set initial property
      if (initialProperty) {
        setSelectedProperty(initialProperty);
        // Make sure the form data is updated with the property ID
        if (initialProperty.id !== formData.property_id) {
          onChange('property_id', initialProperty.id);
        }
      }
    }
  }, [isInitialized, clients, initialProperty, initialClientId, formData.property_id, onChange]);

  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId);
    setSelectedProperty(null);
    onChange('property_id', '');
  };

  const handlePropertySelect = (property: Property | null) => {
    setSelectedProperty(property);
    onChange('property_id', property?.id || '');
  };

  // Get the currently selected client name for display
  const selectedClient = clients.find(client => client.id === selectedClientId);
  const selectedClientName = selectedClient 
    ? (selectedClient.company_name || selectedClient.name)
    : '';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Users className="h-6 w-6 text-forest-green" />
        <h3 className="text-xl md:text-2xl font-bold text-forest-green">Basic Information</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Client Selection */}
        <div className="space-y-3">
          <Label htmlFor="client_select" className="text-base text-charcoal font-semibold">
            Client *
          </Label>
          {initialClientId ? (
            // Show read-only client when pre-selected
            <div className="h-11 px-3 py-2 border border-stone-gray bg-stone-gray/10 rounded-md flex items-center text-charcoal">
              <Users className="mr-2 h-4 w-4 text-forest-green" />
              {loadingClients ? (
                <span className="text-stone-gray/60">Loading...</span>
              ) : selectedClientName ? (
                <span>{selectedClientName}</span>
              ) : (
                <span className="text-stone-gray/60">Client pre-selected</span>
              )}
            </div>
          ) : (
            <Select
              value={selectedClientId}
              onValueChange={handleClientSelect}
              disabled={loadingClients}
            >
              <SelectTrigger className="h-11">
                <SelectValue placeholder={loadingClients ? "Loading clients..." : "Select client"} />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.company_name || client.name}
                    {client.company_name && client.name && (
                      <span className="text-sm text-charcoal ml-2">({client.name})</span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {initialClientId && (
            <p className="text-sm text-charcoal">Client pre-selected from URL</p>
          )}
        </div>

        {/* Property Selection */}
        <div className="space-y-3">
          <Label className="text-base text-charcoal font-semibold">
            Property *
          </Label>
          <PropertySelector
            clientId={selectedClientId}
            selectedProperty={selectedProperty}
            onPropertySelect={handlePropertySelect}
            placeholder="Select property for assessment..."
            className={errors.property_id ? 'border-error-red' : ''}
            disabled={!selectedClientId}
          />
          {errors.property_id && (
            <p className="text-sm text-error-red font-medium" role="alert">{errors.property_id}</p>
          )}
          {!selectedClientId && (
            <p className="text-sm text-charcoal">
              {loadingClients ? "Loading clients..." : "Select a client first"}
            </p>
          )}
        </div>

        <div className="space-y-3">
          <Label htmlFor="assessor_name" className="text-base text-charcoal font-semibold">
            Assessor Name *
          </Label>
          <Input
            id="assessor_name"
            value={formData.assessor_name}
            onChange={(e) => onChange('assessor_name', e.target.value)}
            className={errors.assessor_name ? 'border-error-red' : ''}
            placeholder="Enter assessor name"
            aria-invalid={errors.assessor_name ? 'true' : 'false'}
            aria-describedby={errors.assessor_name ? 'assessor_name-error' : undefined}
          />
          {errors.assessor_name && (
            <p id="assessor_name-error" className="text-sm text-error-red font-medium" role="alert">{errors.assessor_name}</p>
          )}
        </div>

        <div className="space-y-3">
          <Label htmlFor="assessor_contact" className="text-base text-charcoal font-semibold">
            Assessor Contact
          </Label>
          <Input
            id="assessor_contact"
            value={formData.assessor_contact}
            onChange={(e) => onChange('assessor_contact', e.target.value)}
            placeholder="Phone or email"
          />
        </div>

        <div className="space-y-3">
          <Label htmlFor="scheduled_date" className="text-base text-charcoal font-semibold">
            Scheduled Date
          </Label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 h-4 w-4 text-charcoal transform -translate-y-1/2 pointer-events-none" />
            <Input
              id="scheduled_date"
              type="datetime-local"
              value={formData.scheduled_date}
              onChange={(e) => onChange('scheduled_date', e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="space-y-3">
          <Label htmlFor="assessment_status" className="text-base text-charcoal font-semibold">
            Assessment Status
          </Label>
          <Select
            value={formData.assessment_status}
            onValueChange={(value) => onChange('assessment_status', value as AssessmentStatus)}
          >
            <SelectTrigger className="h-11">
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

        <div className="space-y-3">
          <Label htmlFor="weather_conditions" className="text-base text-charcoal font-semibold">
            Weather Conditions
          </Label>
          <Input
            id="weather_conditions"
            value={formData.weather_conditions}
            onChange={(e) => onChange('weather_conditions', e.target.value)}
            placeholder="e.g., Sunny, Cloudy, Light rain"
          />
        </div>

        <div className="space-y-3">
          <Label htmlFor="temperature_f" className="text-base text-charcoal font-semibold">
            Temperature (°F)
          </Label>
          <Input
            id="temperature_f"
            type="number"
            value={formData.temperature_f}
            onChange={(e) => onChange('temperature_f', e.target.value ? Number(e.target.value) : '')}
            placeholder="Temperature in Fahrenheit"
            min="-50"
            max="150"
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