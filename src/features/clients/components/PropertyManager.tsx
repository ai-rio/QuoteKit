'use client';

import { Loader2, PlusCircle, Trash2, Upload } from 'lucide-react';
import { useEffect,useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';

import { 
  createProperty, 
  deleteProperty, 
  getPropertiesByClient, 
  updateProperty} from '../actions';
import { 
  Property, 
  PropertyFormData, 
  PropertyFormErrors} from '../types';

interface PropertyManagerProps {
  clientId: string;
}

interface PropertyTableProps {
  properties: Property[];
  onEdit: (property: Property) => void;
  onDelete: (propertyId: string) => void;
  isDeleting: boolean;
}

interface PropertyFormProps {
  property: Property | null;
  onSubmit: (propertyData: PropertyFormData) => void;
  onCancel: () => void;
  isPending: boolean;
}

export function PropertyManager({ clientId }: PropertyManagerProps) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load properties for the client
  useEffect(() => {
    const loadProperties = async () => {
      try {
        setLoading(true);
        const response = await getPropertiesByClient(clientId);
        if (response?.error) {
          setError(response.error.message || 'Failed to load properties');
        } else {
          setProperties(response?.data || []);
        }
      } catch (err) {
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (clientId) {
      loadProperties();
    }
  }, [clientId]);

  const handleAddProperty = () => {
    setEditingProperty(null);
    setShowForm(true);
  };

  const handleEditProperty = (property: Property) => {
    setEditingProperty(property);
    setShowForm(true);
  };

  const handleDeleteProperty = async (propertyId: string) => {
    if (!confirm('Are you sure you want to delete this property? This action cannot be undone.')) {
      return;
    }

    startTransition(async () => {
      try {
        const response = await deleteProperty(propertyId);
        if (response?.error) {
          setError(response.error.message || 'Failed to delete property');
        } else {
          setProperties(properties.filter((p) => p.id !== propertyId));
        }
      } catch (err) {
        setError('An unexpected error occurred while deleting the property');
      }
    });
  };

  const handleFormSubmit = async (propertyData: PropertyFormData) => {
    startTransition(async () => {
      try {
        const formData = new FormData();
        
        // Add client_id to form data
        formData.append('client_id', clientId);
        
        // Add all property fields
        Object.entries(propertyData).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            if (Array.isArray(value)) {
              formData.append(key, JSON.stringify(value));
            } else {
              formData.append(key, value.toString());
            }
          }
        });

        let response;
        if (editingProperty) {
          response = await updateProperty(editingProperty.id, formData);
        } else {
          response = await createProperty(formData);
        }

        if (response?.error) {
          setError(response.error.message || 'Failed to save property');
        } else if (response?.data) {
          if (editingProperty) {
            setProperties(properties.map((p) => 
              p.id === editingProperty.id ? response.data! : p
            ));
          } else {
            setProperties([...properties, response.data]);
          }
          setShowForm(false);
          setEditingProperty(null);
          setError(null);
        }
      } catch (err) {
        setError('An unexpected error occurred while saving the property');
      }
    });
  };

  const handleBulkImport = () => {
    // Placeholder for bulk import functionality
    alert('Bulk property import functionality will be implemented in a future update.');
  };

  if (loading) {
    return (
      <Card className="bg-paper-white rounded-2xl border border-stone-gray/20 shadow-lg">
        <CardContent className="p-8">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-forest-green" />
            <span className="ml-2 text-lg text-charcoal">Loading properties...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-paper-white rounded-2xl border border-stone-gray/20 shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between p-8">
        <CardTitle className="text-2xl md:text-3xl font-bold text-forest-green">
          Property Manager
        </CardTitle>
        <div className="flex gap-2">
          <Button 
            onClick={handleBulkImport} 
            className="bg-paper-white border-stone-gray text-charcoal hover:bg-light-concrete font-bold px-6 py-3 rounded-lg transition-all duration-200"
          >
            <Upload className="mr-2 h-4 w-4" /> Bulk Import
          </Button>
          <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogTrigger asChild>
              <Button 
                onClick={handleAddProperty}
                className="bg-forest-green text-paper-white hover:bg-forest-green/90 font-bold px-6 py-3 rounded-lg transition-all duration-200 shadow-lg"
              >
                <PlusCircle className="mr-2 h-4 w-4" /> Add Property
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-forest-green">
                  {editingProperty ? 'Edit Property' : 'Add New Property'}
                </DialogTitle>
              </DialogHeader>
              <PropertyForm
                property={editingProperty}
                onSubmit={handleFormSubmit}
                onCancel={() => setShowForm(false)}
                isPending={isPending}
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="p-8 pt-0">
        {error && (
          <div className="mb-4 p-4 bg-error-red/10 border border-error-red/20 rounded-lg">
            <p className="text-error-red font-medium">{error}</p>
          </div>
        )}
        <PropertyTable
          properties={properties}
          onEdit={handleEditProperty}
          onDelete={handleDeleteProperty}
          isDeleting={isPending}
        />
      </CardContent>
    </Card>
  );
}

function PropertyTable({ properties, onEdit, onDelete, isDeleting }: PropertyTableProps) {
  if (properties.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-24 h-24 bg-light-concrete rounded-full flex items-center justify-center mb-4">
          <PlusCircle className="h-12 w-12 text-stone-gray" />
        </div>
        <h3 className="text-xl font-bold text-charcoal mb-2">No Properties Found</h3>
        <p className="text-lg text-charcoal/70 mb-6">
          This client doesn&apos;t have any properties yet. Add a property to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-stone-gray/20">
            <TableHead className="text-lg font-bold text-forest-green">Property Name</TableHead>
            <TableHead className="text-lg font-bold text-forest-green">Service Address</TableHead>
            <TableHead className="text-lg font-bold text-forest-green">Type</TableHead>
            <TableHead className="text-lg font-bold text-forest-green">Status</TableHead>
            <TableHead className="text-lg font-bold text-forest-green">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {properties.map((property) => (
            <TableRow key={property.id} className="border-stone-gray/20">
              <TableCell className="text-lg text-charcoal font-medium">
                {property.property_name || 'Unnamed Property'}
              </TableCell>
              <TableCell className="text-lg text-charcoal">
                {property.service_address}
              </TableCell>
              <TableCell className="text-lg text-charcoal capitalize">
                {property.property_type}
              </TableCell>
              <TableCell>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  property.is_active 
                    ? 'bg-forest-green/10 text-forest-green border border-forest-green/20' 
                    : 'bg-stone-gray/10 text-stone-gray border border-stone-gray/20'
                }`}>
                  {property.is_active ? 'Active' : 'Inactive'}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => onEdit(property)}
                    className="bg-paper-white border-stone-gray text-charcoal hover:bg-light-concrete font-bold px-4 py-2 rounded-lg transition-all duration-200"
                  >
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => onDelete(property.id)}
                    disabled={isDeleting}
                    className="bg-error-red text-paper-white hover:bg-error-red/90 font-bold px-4 py-2 rounded-lg transition-all duration-200 disabled:opacity-50"
                  >
                    {isDeleting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function PropertyForm({ property, onSubmit, onCancel, isPending }: PropertyFormProps) {
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

  const [errors, setErrors] = useState<PropertyFormErrors>({});

  const validateForm = (): boolean => {
    const newErrors: PropertyFormErrors = {};

    if (!formData.service_address.trim()) {
      newErrors.service_address = 'Service address is required';
    }

    // Validate numeric fields
    if (formData.square_footage && isNaN(Number(formData.square_footage))) {
      newErrors.square_footage = 'Square footage must be a valid number';
    }
    if (formData.lot_size && isNaN(Number(formData.lot_size))) {
      newErrors.lot_size = 'Lot size must be a valid number';
    }
    if (formData.lawn_area && isNaN(Number(formData.lawn_area))) {
      newErrors.lawn_area = 'Lawn area must be a valid number';
    }
    if (formData.landscape_area && isNaN(Number(formData.landscape_area))) {
      newErrors.landscape_area = 'Landscape area must be a valid number';
    }
    if (formData.hardscape_area && isNaN(Number(formData.hardscape_area))) {
      newErrors.hardscape_area = 'Hardscape area must be a valid number';
    }

    // Validate coordinates if provided
    if (formData.latitude && (isNaN(Number(formData.latitude)) || Math.abs(Number(formData.latitude)) > 90)) {
      newErrors.latitude = 'Latitude must be a valid number between -90 and 90';
    }
    if (formData.longitude && (isNaN(Number(formData.longitude)) || Math.abs(Number(formData.longitude)) > 180)) {
      newErrors.longitude = 'Longitude must be a valid number between -180 and 180';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    onSubmit(formData);
  };

  const handleInputChange = (field: keyof PropertyFormData, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Property Information */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-forest-green">Basic Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid gap-3">
            <Label htmlFor="property-name" className="text-lg text-charcoal font-medium">
              Property Name
            </Label>
            <Input
              id="property-name"
              value={formData.property_name}
              onChange={(e) => handleInputChange('property_name', e.target.value)}
              className="border-stone-gray bg-light-concrete text-charcoal focus:border-forest-green focus:ring-forest-green placeholder:text-charcoal/60"
              placeholder="e.g., Main Office, Residential Property"
            />
            {errors.property_name && (
              <p className="text-error-red text-sm font-medium">{errors.property_name}</p>
            )}
          </div>

          <div className="grid gap-3">
            <Label htmlFor="property-type" className="text-lg text-charcoal font-medium">
              Property Type
            </Label>
            <select
              id="property-type"
              value={formData.property_type}
              onChange={(e) => handleInputChange('property_type', e.target.value)}
              className="border-stone-gray bg-light-concrete text-charcoal focus:border-forest-green focus:ring-forest-green rounded-md px-3 py-2"
            >
              <option value="residential">Residential</option>
              <option value="commercial">Commercial</option>
              <option value="municipal">Municipal</option>
              <option value="industrial">Industrial</option>
            </select>
            {errors.property_type && (
              <p className="text-error-red text-sm font-medium">{errors.property_type}</p>
            )}
          </div>
        </div>

        <div className="grid gap-3">
          <Label htmlFor="service-address" className="text-lg text-charcoal font-medium">
            Service Address *
          </Label>
          <Textarea
            id="service-address"
            value={formData.service_address}
            onChange={(e) => handleInputChange('service_address', e.target.value)}
            className="border-stone-gray bg-light-concrete text-charcoal focus:border-forest-green focus:ring-forest-green placeholder:text-charcoal/60 min-h-[80px] resize-none"
            placeholder="Enter the complete service address"
            required
          />
          {errors.service_address && (
            <p className="text-error-red text-sm font-medium">{errors.service_address}</p>
          )}
        </div>
      </div>

      {/* Property Measurements */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-forest-green">Property Measurements</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="grid gap-3">
            <Label htmlFor="square-footage" className="text-lg text-charcoal font-medium">
              Square Footage
            </Label>
            <Input
              id="square-footage"
              type="number"
              min="0"
              step="0.01"
              value={formData.square_footage}
              onChange={(e) => handleInputChange('square_footage', e.target.value)}
              className="border-stone-gray bg-light-concrete text-charcoal focus:border-forest-green focus:ring-forest-green placeholder:text-charcoal/60"
              placeholder="0.00"
            />
            {errors.square_footage && (
              <p className="text-error-red text-sm font-medium">{errors.square_footage}</p>
            )}
          </div>

          <div className="grid gap-3">
            <Label htmlFor="lot-size" className="text-lg text-charcoal font-medium">
              Lot Size (sq ft)
            </Label>
            <Input
              id="lot-size"
              type="number"
              min="0"
              step="0.01"
              value={formData.lot_size}
              onChange={(e) => handleInputChange('lot_size', e.target.value)}
              className="border-stone-gray bg-light-concrete text-charcoal focus:border-forest-green focus:ring-forest-green placeholder:text-charcoal/60"
              placeholder="0.00"
            />
            {errors.lot_size && (
              <p className="text-error-red text-sm font-medium">{errors.lot_size}</p>
            )}
          </div>

          <div className="grid gap-3">
            <Label htmlFor="lawn-area" className="text-lg text-charcoal font-medium">
              Lawn Area (sq ft)
            </Label>
            <Input
              id="lawn-area"
              type="number"
              min="0"
              step="0.01"
              value={formData.lawn_area}
              onChange={(e) => handleInputChange('lawn_area', e.target.value)}
              className="border-stone-gray bg-light-concrete text-charcoal focus:border-forest-green focus:ring-forest-green placeholder:text-charcoal/60"
              placeholder="0.00"
            />
            {errors.lawn_area && (
              <p className="text-error-red text-sm font-medium">{errors.lawn_area}</p>
            )}
          </div>
        </div>
      </div>

      {/* Access Information */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-forest-green">Access Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid gap-3">
            <Label htmlFor="property-access" className="text-lg text-charcoal font-medium">
              Property Access
            </Label>
            <select
              id="property-access"
              value={formData.property_access}
              onChange={(e) => handleInputChange('property_access', e.target.value)}
              className="border-stone-gray bg-light-concrete text-charcoal focus:border-forest-green focus:ring-forest-green rounded-md px-3 py-2"
            >
              <option value="easy">Easy Access</option>
              <option value="moderate">Moderate Access</option>
              <option value="difficult">Difficult Access</option>
              <option value="gate_required">Gate Required</option>
            </select>
            {errors.property_access && (
              <p className="text-error-red text-sm font-medium">{errors.property_access}</p>
            )}
          </div>

          <div className="grid gap-3">
            <Label htmlFor="gate-code" className="text-lg text-charcoal font-medium">
              Gate Code
            </Label>
            <Input
              id="gate-code"
              value={formData.gate_code}
              onChange={(e) => handleInputChange('gate_code', e.target.value)}
              className="border-stone-gray bg-light-concrete text-charcoal focus:border-forest-green focus:ring-forest-green placeholder:text-charcoal/60"
              placeholder="Enter gate code if applicable"
            />
            {errors.gate_code && (
              <p className="text-error-red text-sm font-medium">{errors.gate_code}</p>
            )}
          </div>
        </div>

        <div className="grid gap-3">
          <Label htmlFor="access-instructions" className="text-lg text-charcoal font-medium">
            Access Instructions
          </Label>
          <Textarea
            id="access-instructions"
            value={formData.access_instructions}
            onChange={(e) => handleInputChange('access_instructions', e.target.value)}
            className="border-stone-gray bg-light-concrete text-charcoal focus:border-forest-green focus:ring-forest-green placeholder:text-charcoal/60 min-h-[80px] resize-none"
            placeholder="Special instructions for accessing the property"
          />
          {errors.access_instructions && (
            <p className="text-error-red text-sm font-medium">{errors.access_instructions}</p>
          )}
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-forest-green">Additional Notes</h3>
        
        <div className="grid gap-3">
          <Label htmlFor="property-notes" className="text-lg text-charcoal font-medium">
            Property Notes
          </Label>
          <Textarea
            id="property-notes"
            value={formData.property_notes}
            onChange={(e) => handleInputChange('property_notes', e.target.value)}
            className="border-stone-gray bg-light-concrete text-charcoal focus:border-forest-green focus:ring-forest-green placeholder:text-charcoal/60 min-h-[100px] resize-none"
            placeholder="General notes about the property"
          />
          {errors.property_notes && (
            <p className="text-error-red text-sm font-medium">{errors.property_notes}</p>
          )}
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex flex-col sm:flex-row gap-2 pt-6 border-t border-stone-gray/20">
        <Button
          type="button"
          onClick={onCancel}
          className="bg-paper-white text-charcoal border-2 border-stone-gray hover:bg-stone-gray/20 font-bold px-6 py-3 rounded-lg transition-all duration-200"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isPending || !formData.service_address.trim()}
          className="bg-forest-green text-paper-white hover:opacity-90 active:opacity-80 font-bold px-6 py-3 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {property ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            property ? 'Update Property' : 'Create Property'
          )}
        </Button>
      </div>
    </form>
  );
}
