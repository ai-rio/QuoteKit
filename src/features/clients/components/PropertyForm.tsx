'use client';

import { ChevronDown, Info, Loader2, MapPin } from 'lucide-react';
import { useEffect,useState, useTransition } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

import { createProperty, getClientOptions,updateProperty } from '../actions';
import { 
  ClientOption, 
  Property, 
  PropertyAccess,
  PropertyFormData, 
  PropertyFormErrors, 
  PropertyType} from '../types';

interface PropertyFormProps {
  property?: Property;
  clientId?: string;
  onSuccess?: (property: Property) => void;
  onCancel?: () => void;
  showCard?: boolean;
}

const propertyTypeOptions: { value: PropertyType; label: string; description: string }[] = [
  { value: 'residential', label: 'Residential', description: 'Single-family homes, condos, townhouses' },
  { value: 'commercial', label: 'Commercial', description: 'Office buildings, retail stores, restaurants' },
  { value: 'municipal', label: 'Municipal', description: 'City parks, government buildings, public spaces' },
  { value: 'industrial', label: 'Industrial', description: 'Warehouses, manufacturing facilities, industrial parks' }
];

const propertyAccessOptions: { value: PropertyAccess; label: string; description: string }[] = [
  { value: 'easy', label: 'Easy Access', description: 'Standard driveway, no obstacles' },
  { value: 'moderate', label: 'Moderate Access', description: 'Some obstacles, narrow spaces' },
  { value: 'difficult', label: 'Difficult Access', description: 'Steep grades, tight spaces, obstacles' },
  { value: 'gate_required', label: 'Gated Access', description: 'Requires gate code or key access' }
];

const serviceFrequencyOptions = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'bi-weekly', label: 'Bi-weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'seasonal', label: 'Seasonal' },
  { value: 'one-time', label: 'One-time' }
];

const preferredTimeOptions = [
  { value: 'morning', label: 'Morning (7am - 12pm)' },
  { value: 'afternoon', label: 'Afternoon (12pm - 5pm)' },
  { value: 'evening', label: 'Evening (5pm - 8pm)' },
  { value: 'any', label: 'Anytime' }
];

const commonEquipmentOptions = [
  'Mower', 'Trimmer', 'Blower', 'Hedge Trimmer', 'Pressure Washer',
  'Aerator', 'Dethatcher', 'Seeder', 'Fertilizer Spreader', 'Chainsaw'
];

export function PropertyForm({ 
  property, 
  clientId, 
  onSuccess, 
  onCancel, 
  showCard = true 
}: PropertyFormProps) {
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<PropertyFormErrors>({});
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(false);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [formData, setFormData] = useState<PropertyFormData>({
    property_name: property?.property_name || '',
    service_address: property?.service_address || '',
    billing_address: property?.billing_address || '',
    property_type: property?.property_type || 'residential',
    square_footage: property?.square_footage?.toString() || '',
    lot_size: property?.lot_size?.toString() || '',
    property_access: property?.property_access || 'easy',
    access_instructions: property?.access_instructions || '',
    gate_code: property?.gate_code || '',
    parking_location: property?.parking_location || '',
    lawn_area: property?.lawn_area?.toString() || '',
    landscape_area: property?.landscape_area?.toString() || '',
    hardscape_area: property?.hardscape_area?.toString() || '',
    special_equipment_needed: property?.special_equipment_needed || [],
    safety_considerations: property?.safety_considerations || '',
    pet_information: property?.pet_information || '',
    latitude: property?.latitude?.toString() || '',
    longitude: property?.longitude?.toString() || '',
    service_frequency: property?.service_frequency || '',
    preferred_service_time: property?.preferred_service_time || '',
    season_start_date: property?.season_start_date || '',
    season_end_date: property?.season_end_date || '',
    property_notes: property?.property_notes || '',
    client_requirements: property?.client_requirements || '',
    billing_notes: property?.billing_notes || '',
  });

  const [selectedClientId, setSelectedClientId] = useState<string>(
    property?.client_id || clientId || ''
  );

  const isEditing = !!property;

  // Load clients on mount
  useEffect(() => {
    const loadClients = async () => {
      setIsLoadingClients(true);
      try {
        const result = await getClientOptions();
        if (result?.data) {
          setClients(result.data);
        }
      } catch (error) {
        console.error('Failed to load clients:', error);
      } finally {
        setIsLoadingClients(false);
      }
    };

    loadClients();
  }, []);

  const validateForm = (): boolean => {
    const newErrors: PropertyFormErrors = {};

    if (!selectedClientId) {
      newErrors.property_name = 'Client selection is required';
    }

    if (!formData.service_address.trim()) {
      newErrors.service_address = 'Service address is required';
    }

    if (!formData.property_type) {
      newErrors.property_type = 'Property type is required';
    }

    // Validate numeric fields if provided
    if (formData.square_footage && isNaN(parseFloat(formData.square_footage))) {
      newErrors.square_footage = 'Please enter a valid number';
    }

    if (formData.lot_size && isNaN(parseFloat(formData.lot_size))) {
      newErrors.lot_size = 'Please enter a valid number';
    }

    if (formData.lawn_area && isNaN(parseFloat(formData.lawn_area))) {
      newErrors.lawn_area = 'Please enter a valid number';
    }

    if (formData.landscape_area && isNaN(parseFloat(formData.landscape_area))) {
      newErrors.landscape_area = 'Please enter a valid number';
    }

    if (formData.hardscape_area && isNaN(parseFloat(formData.hardscape_area))) {
      newErrors.hardscape_area = 'Please enter a valid number';
    }

    if (formData.latitude && isNaN(parseFloat(formData.latitude))) {
      newErrors.latitude = 'Please enter a valid latitude';
    }

    if (formData.longitude && isNaN(parseFloat(formData.longitude))) {
      newErrors.longitude = 'Please enter a valid longitude';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    startTransition(async () => {
      const formDataObj = new FormData();
      
      // Required fields
      if (!isEditing) {
        formDataObj.append('client_id', selectedClientId);
      }
      formDataObj.append('service_address', formData.service_address.trim());
      formDataObj.append('property_type', formData.property_type);
      formDataObj.append('property_access', formData.property_access);

      // Optional fields
      if (formData.property_name.trim()) {
        formDataObj.append('property_name', formData.property_name.trim());
      }
      if (formData.billing_address.trim()) {
        formDataObj.append('billing_address', formData.billing_address.trim());
      }
      if (formData.square_footage) {
        formDataObj.append('square_footage', formData.square_footage);
      }
      if (formData.lot_size) {
        formDataObj.append('lot_size', formData.lot_size);
      }
      if (formData.access_instructions.trim()) {
        formDataObj.append('access_instructions', formData.access_instructions.trim());
      }
      if (formData.gate_code.trim()) {
        formDataObj.append('gate_code', formData.gate_code.trim());
      }
      if (formData.parking_location.trim()) {
        formDataObj.append('parking_location', formData.parking_location.trim());
      }
      if (formData.lawn_area) {
        formDataObj.append('lawn_area', formData.lawn_area);
      }
      if (formData.landscape_area) {
        formDataObj.append('landscape_area', formData.landscape_area);
      }
      if (formData.hardscape_area) {
        formDataObj.append('hardscape_area', formData.hardscape_area);
      }

      // Special equipment as array
      formData.special_equipment_needed.forEach(equipment => {
        formDataObj.append('special_equipment_needed', equipment);
      });

      if (formData.safety_considerations.trim()) {
        formDataObj.append('safety_considerations', formData.safety_considerations.trim());
      }
      if (formData.pet_information.trim()) {
        formDataObj.append('pet_information', formData.pet_information.trim());
      }
      if (formData.latitude) {
        formDataObj.append('latitude', formData.latitude);
      }
      if (formData.longitude) {
        formDataObj.append('longitude', formData.longitude);
      }
      if (formData.service_frequency) {
        formDataObj.append('service_frequency', formData.service_frequency);
      }
      if (formData.preferred_service_time) {
        formDataObj.append('preferred_service_time', formData.preferred_service_time);
      }
      if (formData.season_start_date) {
        formDataObj.append('season_start_date', formData.season_start_date);
      }
      if (formData.season_end_date) {
        formDataObj.append('season_end_date', formData.season_end_date);
      }
      if (formData.property_notes.trim()) {
        formDataObj.append('property_notes', formData.property_notes.trim());
      }
      if (formData.client_requirements.trim()) {
        formDataObj.append('client_requirements', formData.client_requirements.trim());
      }
      if (formData.billing_notes.trim()) {
        formDataObj.append('billing_notes', formData.billing_notes.trim());
      }

      try {
        const result = isEditing 
          ? await updateProperty(property.id, formDataObj)
          : await createProperty(formDataObj);

        if (result?.error) {
          setErrors({ service_address: result.error.message });
        } else if (result?.data) {
          onSuccess?.(result.data);
        }
      } catch (error) {
        setErrors({ service_address: 'An unexpected error occurred' });
      }
    });
  };

  const handleInputChange = (field: keyof PropertyFormData, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleEquipmentToggle = (equipment: string) => {
    const current = formData.special_equipment_needed;
    const updated = current.includes(equipment)
      ? current.filter(item => item !== equipment)
      : [...current, equipment];
    
    handleInputChange('special_equipment_needed', updated);
  };

  const FormContent = () => (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Client Selection - Only show if not editing and no client pre-selected */}
      {!isEditing && !clientId && (
        <div className="grid gap-3">
          <Label htmlFor="client-select" className="text-lg text-charcoal font-medium">
            Client *
          </Label>
          <Select value={selectedClientId} onValueChange={setSelectedClientId}>
            <SelectTrigger className="border-stone-gray bg-light-concrete text-charcoal focus:border-forest-green focus:ring-forest-green data-[placeholder]:text-charcoal/60">
              <SelectValue placeholder={isLoadingClients ? "Loading clients..." : "Select a client"} />
            </SelectTrigger>
            <SelectContent>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  <div className="flex flex-col">
                    <span className="font-medium">{client.name}</span>
                    {client.email && (
                      <span className="text-sm text-charcoal/70">{client.email}</span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.property_name && (
            <p className="text-red-600 text-sm font-medium">{errors.property_name}</p>
          )}
        </div>
      )}

      {/* Basic Property Information */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <h3 className="text-xl font-bold text-forest-green">Basic Information</h3>
        </div>
        
        {/* Property Name and Service Address */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid gap-3">
            <Label htmlFor="property-name" className="text-lg text-charcoal font-medium">
              Property Name
            </Label>
            <Input
              id="property-name"
              name="property_name"
              value={formData.property_name}
              onChange={(e) => handleInputChange('property_name', e.target.value)}
              className="border-stone-gray bg-light-concrete text-charcoal focus:border-forest-green focus:ring-forest-green placeholder:text-charcoal/60"
              placeholder="e.g., Main Office Building"
            />
            {errors.property_name && (
              <p className="text-red-600 text-sm font-medium">{errors.property_name}</p>
            )}
          </div>

          <div className="grid gap-3">
            <Label htmlFor="service-address" className="text-lg text-charcoal font-medium">
              Service Address *
            </Label>
            <Input
              id="service-address"
              name="service_address"
              value={formData.service_address}
              onChange={(e) => handleInputChange('service_address', e.target.value)}
              className="border-stone-gray bg-light-concrete text-charcoal focus:border-forest-green focus:ring-forest-green placeholder:text-charcoal/60"
              placeholder="123 Main St, City, State 12345"
              required
            />
            {errors.service_address && (
              <p className="text-red-600 text-sm font-medium">{errors.service_address}</p>
            )}
          </div>
        </div>

        {/* Billing Address */}
        <div className="grid gap-3">
          <Label htmlFor="billing-address" className="text-lg text-charcoal font-medium">
            Billing Address
          </Label>
          <Input
            id="billing-address"
            name="billing_address"
            value={formData.billing_address}
            onChange={(e) => handleInputChange('billing_address', e.target.value)}
            className="border-stone-gray bg-light-concrete text-charcoal focus:border-forest-green focus:ring-forest-green placeholder:text-charcoal/60"
            placeholder="If different from service address"
          />
          {errors.billing_address && (
            <p className="text-red-600 text-sm font-medium">{errors.billing_address}</p>
          )}
        </div>

        {/* Property Type and Access */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid gap-3">
            <Label htmlFor="property-type" className="text-lg text-charcoal font-medium">
              Property Type *
            </Label>
            <Select value={formData.property_type} onValueChange={(value: PropertyType) => handleInputChange('property_type', value)}>
              <SelectTrigger className="border-stone-gray bg-light-concrete text-charcoal focus:border-forest-green focus:ring-forest-green data-[placeholder]:text-charcoal/60">
                <SelectValue placeholder="Select property type" />
              </SelectTrigger>
              <SelectContent>
                {propertyTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex flex-col">
                      <span className="font-medium">{option.label}</span>
                      <span className="text-sm text-charcoal/70">{option.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.property_type && (
              <p className="text-red-600 text-sm font-medium">{errors.property_type}</p>
            )}
          </div>

          <div className="grid gap-3">
            <Label htmlFor="property-access" className="text-lg text-charcoal font-medium">
              Property Access
            </Label>
            <Select value={formData.property_access} onValueChange={(value: PropertyAccess) => handleInputChange('property_access', value)}>
              <SelectTrigger className="border-stone-gray bg-light-concrete text-charcoal focus:border-forest-green focus:ring-forest-green data-[placeholder]:text-charcoal/60">
                <SelectValue placeholder="Select access type" />
              </SelectTrigger>
              <SelectContent>
                {propertyAccessOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex flex-col">
                      <span className="font-medium">{option.label}</span>
                      <span className="text-sm text-charcoal/70">{option.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.property_access && (
              <p className="text-red-600 text-sm font-medium">{errors.property_access}</p>
            )}
          </div>
        </div>
      </div>

      <Separator />

      {/* Advanced Settings - Collapsible */}
      <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
        <CollapsibleTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            className="flex items-center gap-2 p-0 h-auto text-lg font-bold text-forest-green hover:text-forest-green/90"
          >
            <ChevronDown className={`h-5 w-5 transition-transform ${isAdvancedOpen ? 'rotate-180' : ''}`} />
            Advanced Property Details
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="space-y-6 mt-4">
          {/* Property Measurements */}
          <div className="space-y-4">
            <h4 className="text-lg font-bold text-forest-green">Property Measurements</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="grid gap-3">
                <Label htmlFor="square-footage" className="text-lg text-charcoal font-medium">
                  Square Footage
                </Label>
                <Input
                  id="square-footage"
                  name="square_footage"
                  type="number"
                  step="0.01"
                  value={formData.square_footage}
                  onChange={(e) => handleInputChange('square_footage', e.target.value)}
                  className="border-stone-gray bg-light-concrete text-charcoal focus:border-forest-green focus:ring-forest-green"
                  placeholder="0.00"
                />
                {errors.square_footage && (
                  <p className="text-red-600 text-sm font-medium">{errors.square_footage}</p>
                )}
              </div>

              <div className="grid gap-3">
                <Label htmlFor="lot-size" className="text-lg text-charcoal font-medium">
                  Total Lot Size
                </Label>
                <Input
                  id="lot-size"
                  name="lot_size"
                  type="number"
                  step="0.01"
                  value={formData.lot_size}
                  onChange={(e) => handleInputChange('lot_size', e.target.value)}
                  className="border-stone-gray bg-light-concrete text-charcoal focus:border-forest-green focus:ring-forest-green"
                  placeholder="0.00"
                />
                {errors.lot_size && (
                  <p className="text-red-600 text-sm font-medium">{errors.lot_size}</p>
                )}
              </div>

              <div className="grid gap-3">
                <Label htmlFor="lawn-area" className="text-lg text-charcoal font-medium">
                  Lawn Area
                </Label>
                <Input
                  id="lawn-area"
                  name="lawn_area"
                  type="number"
                  step="0.01"
                  value={formData.lawn_area}
                  onChange={(e) => handleInputChange('lawn_area', e.target.value)}
                  className="border-stone-gray bg-light-concrete text-charcoal focus:border-forest-green focus:ring-forest-green"
                  placeholder="0.00"
                />
                {errors.lawn_area && (
                  <p className="text-red-600 text-sm font-medium">{errors.lawn_area}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-3">
                <Label htmlFor="landscape-area" className="text-lg text-charcoal font-medium">
                  Landscape Area
                </Label>
                <Input
                  id="landscape-area"
                  name="landscape_area"
                  type="number"
                  step="0.01"
                  value={formData.landscape_area}
                  onChange={(e) => handleInputChange('landscape_area', e.target.value)}
                  className="border-stone-gray bg-light-concrete text-charcoal focus:border-forest-green focus:ring-forest-green"
                  placeholder="0.00"
                />
                {errors.landscape_area && (
                  <p className="text-red-600 text-sm font-medium">{errors.landscape_area}</p>
                )}
              </div>

              <div className="grid gap-3">
                <Label htmlFor="hardscape-area" className="text-lg text-charcoal font-medium">
                  Hardscape Area
                </Label>
                <Input
                  id="hardscape-area"
                  name="hardscape_area"
                  type="number"
                  step="0.01"
                  value={formData.hardscape_area}
                  onChange={(e) => handleInputChange('hardscape_area', e.target.value)}
                  className="border-stone-gray bg-light-concrete text-charcoal focus:border-forest-green focus:ring-forest-green"
                  placeholder="0.00"
                />
                {errors.hardscape_area && (
                  <p className="text-red-600 text-sm font-medium">{errors.hardscape_area}</p>
                )}
              </div>
            </div>
          </div>

          {/* Access Information */}
          <div className="space-y-4">
            <h4 className="text-lg font-bold text-forest-green">Access Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-3">
                <Label htmlFor="gate-code" className="text-lg text-charcoal font-medium">
                  Gate Code
                </Label>
                <Input
                  id="gate-code"
                  name="gate_code"
                  value={formData.gate_code}
                  onChange={(e) => handleInputChange('gate_code', e.target.value)}
                  className="border-stone-gray bg-light-concrete text-charcoal focus:border-forest-green focus:ring-forest-green"
                  placeholder="Gate access code"
                />
              </div>

              <div className="grid gap-3">
                <Label htmlFor="parking-location" className="text-lg text-charcoal font-medium">
                  Parking Location
                </Label>
                <Input
                  id="parking-location"
                  name="parking_location"
                  value={formData.parking_location}
                  onChange={(e) => handleInputChange('parking_location', e.target.value)}
                  className="border-stone-gray bg-light-concrete text-charcoal focus:border-forest-green focus:ring-forest-green"
                  placeholder="Where to park equipment"
                />
              </div>
            </div>

            <div className="grid gap-3">
              <Label htmlFor="access-instructions" className="text-lg text-charcoal font-medium">
                Access Instructions
              </Label>
              <Textarea
                id="access-instructions"
                name="access_instructions"
                value={formData.access_instructions}
                onChange={(e) => handleInputChange('access_instructions', e.target.value)}
                className="border-stone-gray bg-light-concrete text-charcoal focus:border-forest-green focus:ring-forest-green min-h-[80px] resize-none"
                placeholder="Specific instructions for accessing the property..."
              />
            </div>
          </div>

          {/* Equipment Requirements */}
          <div className="space-y-4">
            <h4 className="text-lg font-bold text-forest-green">Equipment Requirements</h4>
            <div className="grid gap-3">
              <Label className="text-lg text-charcoal font-medium">
                Special Equipment Needed
              </Label>
              <div className="flex flex-wrap gap-2">
                {commonEquipmentOptions.map((equipment) => (
                  <Badge
                    key={equipment}
                    variant={formData.special_equipment_needed.includes(equipment) ? "default" : "outline"}
                    className={`cursor-pointer transition-colors ${
                      formData.special_equipment_needed.includes(equipment)
                        ? 'bg-forest-green text-paper-white hover:bg-forest-green/90'
                        : 'border-stone-gray text-charcoal hover:bg-stone-gray/20'
                    }`}
                    onClick={() => handleEquipmentToggle(equipment)}
                  >
                    {equipment}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Service Preferences */}
          <div className="space-y-4">
            <h4 className="text-lg font-bold text-forest-green">Service Preferences</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-3">
                <Label htmlFor="service-frequency" className="text-lg text-charcoal font-medium">
                  Service Frequency
                </Label>
                <Select value={formData.service_frequency} onValueChange={(value) => handleInputChange('service_frequency', value)}>
                  <SelectTrigger className="border-stone-gray bg-light-concrete text-charcoal focus:border-forest-green focus:ring-forest-green data-[placeholder]:text-charcoal/60">
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    {serviceFrequencyOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-3">
                <Label htmlFor="preferred-time" className="text-lg text-charcoal font-medium">
                  Preferred Service Time
                </Label>
                <Select value={formData.preferred_service_time} onValueChange={(value) => handleInputChange('preferred_service_time', value)}>
                  <SelectTrigger className="border-stone-gray bg-light-concrete text-charcoal focus:border-forest-green focus:ring-forest-green data-[placeholder]:text-charcoal/60">
                    <SelectValue placeholder="Select preferred time" />
                  </SelectTrigger>
                  <SelectContent>
                    {preferredTimeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-3">
                <Label htmlFor="season-start" className="text-lg text-charcoal font-medium">
                  Season Start Date
                </Label>
                <Input
                  id="season-start"
                  name="season_start_date"
                  type="date"
                  value={formData.season_start_date}
                  onChange={(e) => handleInputChange('season_start_date', e.target.value)}
                  className="border-stone-gray bg-light-concrete text-charcoal focus:border-forest-green focus:ring-forest-green"
                />
              </div>

              <div className="grid gap-3">
                <Label htmlFor="season-end" className="text-lg text-charcoal font-medium">
                  Season End Date
                </Label>
                <Input
                  id="season-end"
                  name="season_end_date"
                  type="date"
                  value={formData.season_end_date}
                  onChange={(e) => handleInputChange('season_end_date', e.target.value)}
                  className="border-stone-gray bg-light-concrete text-charcoal focus:border-forest-green focus:ring-forest-green"
                />
              </div>
            </div>
          </div>

          {/* Safety and Special Considerations */}
          <div className="space-y-4">
            <h4 className="text-lg font-bold text-forest-green">Safety & Special Considerations</h4>
            <div className="grid gap-3">
              <Label htmlFor="safety-considerations" className="text-lg text-charcoal font-medium">
                Safety Considerations
              </Label>
              <Textarea
                id="safety-considerations"
                name="safety_considerations"
                value={formData.safety_considerations}
                onChange={(e) => handleInputChange('safety_considerations', e.target.value)}
                className="border-stone-gray bg-light-concrete text-charcoal focus:border-forest-green focus:ring-forest-green min-h-[80px] resize-none"
                placeholder="Hazards, electrical lines, slopes, etc."
              />
            </div>

            <div className="grid gap-3">
              <Label htmlFor="pet-information" className="text-lg text-charcoal font-medium">
                Pet Information
              </Label>
              <Textarea
                id="pet-information"
                name="pet_information"
                value={formData.pet_information}
                onChange={(e) => handleInputChange('pet_information', e.target.value)}
                className="border-stone-gray bg-light-concrete text-charcoal focus:border-forest-green focus:ring-forest-green min-h-[80px] resize-none"
                placeholder="Dogs, cats, other pets, fencing information..."
              />
            </div>
          </div>

          {/* GPS Coordinates */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-forest-green" />
              <h4 className="text-lg font-bold text-forest-green">GPS Coordinates</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-3">
                <Label htmlFor="latitude" className="text-lg text-charcoal font-medium">
                  Latitude
                </Label>
                <Input
                  id="latitude"
                  name="latitude"
                  type="number"
                  step="0.000001"
                  value={formData.latitude}
                  onChange={(e) => handleInputChange('latitude', e.target.value)}
                  className="border-stone-gray bg-light-concrete text-charcoal focus:border-forest-green focus:ring-forest-green"
                  placeholder="40.712776"
                />
                {errors.latitude && (
                  <p className="text-red-600 text-sm font-medium">{errors.latitude}</p>
                )}
              </div>

              <div className="grid gap-3">
                <Label htmlFor="longitude" className="text-lg text-charcoal font-medium">
                  Longitude
                </Label>
                <Input
                  id="longitude"
                  name="longitude"
                  type="number"
                  step="0.000001"
                  value={formData.longitude}
                  onChange={(e) => handleInputChange('longitude', e.target.value)}
                  className="border-stone-gray bg-light-concrete text-charcoal focus:border-forest-green focus:ring-forest-green"
                  placeholder="-74.005974"
                />
                {errors.longitude && (
                  <p className="text-red-600 text-sm font-medium">{errors.longitude}</p>
                )}
              </div>
            </div>
          </div>

          {/* Notes and Requirements */}
          <div className="space-y-4">
            <h4 className="text-lg font-bold text-forest-green">Notes & Requirements</h4>
            <div className="grid gap-3">
              <Label htmlFor="property-notes" className="text-lg text-charcoal font-medium">
                Property Notes
              </Label>
              <Textarea
                id="property-notes"
                name="property_notes"
                value={formData.property_notes}
                onChange={(e) => handleInputChange('property_notes', e.target.value)}
                className="border-stone-gray bg-light-concrete text-charcoal focus:border-forest-green focus:ring-forest-green min-h-[100px] resize-none"
                placeholder="General notes about the property..."
              />
            </div>

            <div className="grid gap-3">
              <Label htmlFor="client-requirements" className="text-lg text-charcoal font-medium">
                Client Requirements
              </Label>
              <Textarea
                id="client-requirements"
                name="client_requirements"
                value={formData.client_requirements}
                onChange={(e) => handleInputChange('client_requirements', e.target.value)}
                className="border-stone-gray bg-light-concrete text-charcoal focus:border-forest-green focus:ring-forest-green min-h-[100px] resize-none"
                placeholder="Specific client requests and requirements..."
              />
            </div>

            <div className="grid gap-3">
              <Label htmlFor="billing-notes" className="text-lg text-charcoal font-medium">
                Billing Notes
              </Label>
              <Textarea
                id="billing-notes"
                name="billing_notes"
                value={formData.billing_notes}
                onChange={(e) => handleInputChange('billing_notes', e.target.value)}
                className="border-stone-gray bg-light-concrete text-charcoal focus:border-forest-green focus:ring-forest-green min-h-[80px] resize-none"
                placeholder="Special billing instructions or notes..."
              />
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Separator />

      {/* Form Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        {onCancel && (
          <Button
            type="button"
            onClick={onCancel}
            variant="outline"
            className="bg-paper-white text-charcoal border-2 border-stone-gray hover:bg-stone-gray/20 font-bold px-6 py-3 rounded-lg transition-all duration-200"
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={isPending || !formData.service_address.trim() || (!selectedClientId && !isEditing)}
          className="bg-forest-green text-paper-white hover:bg-forest-green/90 font-bold px-6 py-3 rounded-lg transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isEditing ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            isEditing ? 'Update Property' : 'Create Property'
          )}
        </Button>
      </div>
    </form>
  );

  if (showCard) {
    return (
      <Card className="bg-paper-white rounded-2xl border border-stone-gray/20 shadow-lg">
        <CardHeader className="p-8">
          <CardTitle className="text-2xl md:text-3xl font-bold text-forest-green">
            {isEditing ? 'Edit Property' : 'New Property'}
          </CardTitle>
          {!isEditing && (
            <p className="text-lg text-charcoal mt-2">
              Add comprehensive property information for accurate service planning
            </p>
          )}
        </CardHeader>
        <CardContent className="p-8 pt-0">
          <FormContent />
        </CardContent>
      </Card>
    );
  }

  return <FormContent />;
}