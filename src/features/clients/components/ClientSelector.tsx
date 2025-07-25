'use client';

import { useEffect, useRef,useState } from 'react';
import { 
  Check,
  ChevronDown,
  Mail, 
  Phone, 
  Plus, 
  Search, 
  User} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { getClientOptions } from '../actions';
import { Client,ClientOption } from '../types';

import { ClientForm } from './ClientForm';

interface ClientSelectorProps {
  selectedClient?: ClientOption | null;
  onClientSelect: (client: ClientOption) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function ClientSelector({ 
  selectedClient, 
  onClientSelect, 
  placeholder = "Select or search for a client...",
  className = "",
  disabled = false
}: ClientSelectorProps) {
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [filteredClients, setFilteredClients] = useState<ClientOption[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load client options
  const loadClients = async () => {
    setLoading(true);
    try {
      const result = await getClientOptions();
      if (result?.data) {
        setClients(result.data);
        setFilteredClients(result.data);
      }
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  // Filter clients based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredClients(clients);
      return;
    }

    const searchLower = searchTerm.toLowerCase();
    const filtered = clients.filter(client =>
      client.name.toLowerCase().includes(searchLower) ||
      client.email?.toLowerCase().includes(searchLower) ||
      client.phone?.toLowerCase().includes(searchLower)
    );
    setFilteredClients(filtered);
  }, [searchTerm, clients]);

  // Handle input focus
  const handleInputFocus = () => {
    if (!disabled) {
      setIsOpen(true);
    }
  };

  // Handle input blur with delay to allow dropdown clicks
  const handleInputBlur = () => {
    setTimeout(() => {
      setIsOpen(false);
    }, 200);
  };

  // Handle client selection
  const handleClientSelect = (client: ClientOption) => {
    onClientSelect(client);
    setSearchTerm('');
    setIsOpen(false);
  };

  // Handle new client creation
  const handleCreateClient = (client: Client) => {
    const newClientOption: ClientOption = {
      id: client.id,
      name: client.name,
      email: client.email,
      phone: client.phone,
    };
    
    // Add to clients list
    setClients(prev => [newClientOption, ...prev]);
    
    // Select the new client
    onClientSelect(newClientOption);
    
    setShowCreateDialog(false);
  };

  // Handle search input change
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    if (!isOpen) {
      setIsOpen(true);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const displayValue = selectedClient ? selectedClient.name : searchTerm;

  return (
    <div className="relative">
      <div className="grid gap-3">
        <Label className="text-label text-charcoal font-medium">
          Client *
        </Label>
        
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-charcoal/60 h-4 w-4 z-10" />
            <Input
              ref={inputRef}
              type="text"
              value={displayValue}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              className={`pl-10 pr-10 bg-light-concrete text-charcoal border-stone-gray focus:border-forest-green focus:ring-forest-green placeholder:text-charcoal/60 ${className}`}
              autoComplete="off"
            />
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-charcoal/60 h-4 w-4" />
          </div>

          {/* Dropdown */}
          {isOpen && (
            <div 
              ref={dropdownRef}
              className="absolute top-full left-0 right-0 z-50 mt-1 bg-paper-white border border-stone-gray rounded-lg shadow-lg max-h-64 overflow-y-auto"
            >
              {/* Create new client option */}
              <div
                onClick={() => {
                  setShowCreateDialog(true);
                  setIsOpen(false);
                }}
                className="px-4 py-3 cursor-pointer text-sm transition-colors hover:bg-light-concrete border-b border-stone-gray"
              >
                <div className="flex items-center text-equipment-yellow font-medium">
                  <Plus className="h-4 w-4 mr-2" />
                  <span>Add New Client</span>
                </div>
              </div>

              {/* Client list */}
              {loading ? (
                <div className="px-4 py-3 text-sm text-charcoal/60">
                  Loading clients...
                </div>
              ) : filteredClients.length > 0 ? (
                filteredClients.map((client) => (
                  <div
                    key={client.id}
                    onClick={() => handleClientSelect(client)}
                    className="px-4 py-3 cursor-pointer text-sm transition-colors hover:bg-light-concrete border-b border-stone-gray last:border-b-0"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <User className="h-4 w-4 text-forest-green mr-2" />
                          <span className="font-medium text-charcoal">{client.name}</span>
                          {selectedClient?.id === client.id && (
                            <Check className="h-4 w-4 text-forest-green ml-2" />
                          )}
                        </div>
                        <div className="ml-6 mt-1 space-y-1">
                          {client.email && (
                            <div className="flex items-center text-charcoal/60">
                              <Mail className="h-3 w-3 mr-1" />
                              <span className="text-xs">{client.email}</span>
                            </div>
                          )}
                          {client.phone && (
                            <div className="flex items-center text-charcoal/60">
                              <Phone className="h-3 w-3 mr-1" />
                              <span className="text-xs">{client.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-4 py-3 text-sm text-charcoal/60">
                  {searchTerm ? 'No clients found.' : 'No clients available.'}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Selected client display */}
        {selectedClient && !isOpen && (
          <div className="bg-light-concrete/50 rounded-lg p-3 border border-stone-gray">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center">
                  <User className="h-4 w-4 text-forest-green mr-2" />
                  <span className="font-medium text-charcoal">{selectedClient.name}</span>
                </div>
                <div className="ml-6 mt-2 space-y-1">
                  {selectedClient.email && (
                    <div className="flex items-center text-sm text-charcoal/70">
                      <Mail className="h-3 w-3 mr-1" />
                      <span>{selectedClient.email}</span>
                    </div>
                  )}
                  {selectedClient.phone && (
                    <div className="flex items-center text-sm text-charcoal/70">
                      <Phone className="h-3 w-3 mr-1" />
                      <span>{selectedClient.phone}</span>
                    </div>
                  )}
                </div>
              </div>
              <Button
                type="button"
                onClick={() => {
                  onClientSelect(null as any);
                  setSearchTerm('');
                }}
                className="bg-paper-white text-charcoal border border-stone-gray hover:bg-stone-gray/20 text-sm px-3 py-1 h-auto"
              >
                Change
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Create Client Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-paper-white border-stone-gray max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-charcoal text-section-title">Add New Client</DialogTitle>
          </DialogHeader>
          <ClientForm
            onSuccess={handleCreateClient}
            onCancel={() => setShowCreateDialog(false)}
            showCard={false}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}