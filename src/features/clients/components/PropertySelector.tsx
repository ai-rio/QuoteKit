'use client';

import { ChevronDown, Home, MapPin, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';

import { getPropertiesByClient } from '../actions';
import { Property } from '../types';

interface PropertyOption {
  id: string;
  property_name?: string | null;
  service_address: string;
  property_type: string;
  is_active: boolean;
}

interface PropertySelectorProps {
  clientId: string | null;
  selectedProperty: Property | null;
  onPropertySelect: (property: Property | null) => void;
  onCreateProperty?: () => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function PropertySelector({
  clientId,
  selectedProperty,
  onPropertySelect,
  onCreateProperty,
  placeholder = "Select a property...",
  className = "",
  disabled = false,
}: PropertySelectorProps) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load properties when client changes
  useEffect(() => {
    const loadProperties = async () => {
      if (!clientId) {
        setProperties([]);
        setError(null);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await getPropertiesByClient(clientId);
        
        if (response?.error) {
          setError(response.error.message || 'Failed to load properties');
          setProperties([]);
        } else {
          setProperties(response?.data || []);
        }
      } catch (err) {
        setError('An unexpected error occurred');
        setProperties([]);
      } finally {
        setLoading(false);
      }
    };

    loadProperties();
  }, [clientId]);

  // Reset selected property if it's no longer in the list
  useEffect(() => {
    if (selectedProperty && properties.length > 0) {
      const stillExists = properties.find(p => p.id === selectedProperty.id);
      if (!stillExists) {
        onPropertySelect(null);
      }
    }
  }, [properties, selectedProperty, onPropertySelect]);

  const handlePropertySelect = (property: Property | null) => {
    onPropertySelect(property);
  };

  const activeProperties = properties.filter(p => p.is_active);
  const hasProperties = activeProperties.length > 0;

  if (!clientId) {
    return (
      <div className={`relative ${className}`}>
        <Button
          variant="outline"
          disabled={true}
          className="w-full justify-between bg-stone-gray/10 text-stone-gray/60 cursor-not-allowed"
        >
          <span className="flex items-center">
            <Home className="mr-2 h-4 w-4" />
            Select a client first
          </span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <Select
        value={selectedProperty?.id || ""}
        onValueChange={(value) => {
          if (value === "") {
            handlePropertySelect(null);
          } else {
            const property = activeProperties.find(p => p.id === value);
            if (property) {
              handlePropertySelect(property);
            }
          }
        }}
        disabled={disabled || loading || !clientId}
      >
        <SelectTrigger className="w-full border-stone-gray bg-light-concrete text-charcoal focus:border-forest-green focus:ring-forest-green hover:bg-light-concrete/80">
          <div className="flex items-center truncate">
            <Home className="mr-2 h-4 w-4 flex-shrink-0" />
            {loading ? (
              <span className="text-stone-gray/60">Loading properties...</span>
            ) : error ? (
              <span className="text-error-red text-sm">{error}</span>
            ) : selectedProperty ? (
              <div className="flex items-center gap-2 truncate">
                <span className="truncate">
                  {selectedProperty.property_name || 'Unnamed Property'} - {selectedProperty.service_address}
                </span>
                <Badge 
                  variant="secondary" 
                  className="bg-forest-green/10 text-forest-green border-forest-green/20 text-xs flex-shrink-0"
                >
                  {selectedProperty.property_type}
                </Badge>
              </div>
            ) : !clientId ? (
              <span className="text-stone-gray/60">Select a client first</span>
            ) : (
              <span className="text-stone-gray/60">{placeholder}</span>
            )}
          </div>
        </SelectTrigger>
        <SelectContent>
          {!hasProperties ? (
            <div className="p-4 text-center">
              <div className="mb-2">
                <MapPin className="h-8 w-8 mx-auto text-stone-gray/60" />
              </div>
              <p className="text-sm text-stone-gray/80 mb-3">
                No active properties found for this client.
              </p>
              {onCreateProperty && (
                <Button
                  onClick={() => {
                    onCreateProperty();
                  }}
                  size="sm"
                  className="bg-forest-green text-white hover:bg-forest-green/90"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Property
                </Button>
              )}
            </div>
          ) : (
            <>
              <SelectItem value="">
                <span className="text-stone-gray/60">No property selected</span>
              </SelectItem>
              {activeProperties.map((property) => (
                <SelectItem key={property.id} value={property.id}>
                  <div className="flex items-center gap-2 w-full">
                    <MapPin className="h-4 w-4 text-stone-gray/60 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-charcoal truncate">
                        {property.property_name || 'Unnamed Property'}
                      </div>
                      <div className="text-sm text-stone-gray/80 truncate">
                        {property.service_address}
                      </div>
                    </div>
                    <Badge 
                      variant="secondary"
                      className="bg-forest-green/10 text-forest-green border-forest-green/20 text-xs flex-shrink-0"
                    >
                      {property.property_type}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}