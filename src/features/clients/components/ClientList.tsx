'use client';

import { 
  DollarSign,
  Edit, 
  Eye, 
  Mail, 
  MapPin,
  Phone, 
  Plus, 
  Search, 
  Trash2, 
  TrendingUp,
  User} from 'lucide-react';
import { useCallback, useEffect, useState, useTransition } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';

import { deleteClient,getClientsWithAnalytics } from '../actions';
import { Client, ClientSearchFilters,ClientWithAnalytics } from '../types';
import { ClientForm } from './ClientForm';

interface ClientListProps {
  onClientSelect?: (client: ClientWithAnalytics) => void;
  selectable?: boolean;
}

export function ClientList({ onClientSelect, selectable = false }: ClientListProps) {
  const [clients, setClients] = useState<ClientWithAnalytics[]>([]);
  const [filteredClients, setFilteredClients] = useState<ClientWithAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  
  // Form and dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientWithAnalytics | null>(null);

  // Search and filter states
  const [filters, setFilters] = useState<ClientSearchFilters>({
    search: '',
    sortBy: 'name',
    sortOrder: 'asc',
    hasQuotes: undefined,
  });

  // Load clients data
  const loadClients = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getClientsWithAnalytics(filters);
      if (result?.data) {
        setClients(result.data);
        setFilteredClients(result.data);
      }
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  // Apply search filter
  useEffect(() => {
    if (!filters.search.trim()) {
      setFilteredClients(clients);
      return;
    }

    const searchLower = filters.search.toLowerCase();
    const filtered = clients.filter(client =>
      client.name.toLowerCase().includes(searchLower) ||
      client.email?.toLowerCase().includes(searchLower) ||
      client.phone?.toLowerCase().includes(searchLower)
    );
    setFilteredClients(filtered);
  }, [filters.search, clients]);

  const handleSearchChange = (value: string) => {
    setFilters(prev => ({ ...prev, search: value }));
  };

  const handleSortChange = (sortBy: ClientSearchFilters['sortBy']) => {
    setFilters(prev => ({
      ...prev,
      sortBy,
      sortOrder: prev.sortBy === sortBy && prev.sortOrder === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleFilterChange = (hasQuotes: boolean | undefined) => {
    setFilters(prev => ({ ...prev, hasQuotes }));
  };

  const handleCreateClient = (client: Client) => {
    // Transform Client to ClientWithAnalytics with default analytics values
    const clientWithAnalytics: ClientWithAnalytics = {
      ...client,
      total_quotes: 0,
      accepted_quotes: 0,
      declined_quotes: 0,
      total_quote_value: 0,
      accepted_value: 0,
      average_quote_value: 0,
      acceptance_rate_percent: 0,
      last_quote_date: null,
    };
    setClients(prev => [clientWithAnalytics, ...prev]);
    setShowCreateDialog(false);
  };

  const handleEditClient = (client: Client) => {
    // Transform Client to ClientWithAnalytics, preserving existing analytics data
    setClients(prev => prev.map(c => {
      if (c.id === client.id) {
        // Keep existing analytics data from the current client
        return {
          ...client,
          total_quotes: c.total_quotes,
          accepted_quotes: c.accepted_quotes,
          declined_quotes: c.declined_quotes,
          total_quote_value: c.total_quote_value,
          accepted_value: c.accepted_value,
          average_quote_value: c.average_quote_value,
          acceptance_rate_percent: c.acceptance_rate_percent,
          last_quote_date: c.last_quote_date,
        };
      }
      return c;
    }));
    setShowEditDialog(false);
    setSelectedClient(null);
  };

  const handleDeleteClient = () => {
    if (!selectedClient) return;

    startTransition(async () => {
      const result = await deleteClient(selectedClient.id);
      if (!result?.error) {
        setClients(prev => prev.filter(c => c.id !== selectedClient.id));
        setShowDeleteDialog(false);
        setSelectedClient(null);
      }
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(dateString));
  };

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl md:text-4xl font-bold text-charcoal">Client Management</h1>
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="bg-equipment-yellow text-charcoal hover:brightness-110 font-bold px-6 py-3 rounded-lg transition-all duration-200"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add New Client
        </Button>
      </div>

      {/* Filters Card */}
      <Card className="bg-paper-white border border-stone-gray shadow-sm">
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-charcoal/60 h-4 w-4" />
              <Input
                placeholder="Search clients by name, email, or phone..."
                value={filters.search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10 bg-light-concrete text-charcoal border-stone-gray focus:border-forest-green focus:ring-forest-green placeholder:text-charcoal/60"
              />
            </div>

            {/* Filter Controls */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Select value={filters.hasQuotes?.toString() || 'all'} onValueChange={(value) => 
                handleFilterChange(value === 'all' ? undefined : value === 'true')
              }>
                <SelectTrigger className="bg-light-concrete text-charcoal border-stone-gray">
                  <SelectValue placeholder="Filter by quotes" />
                </SelectTrigger>
                <SelectContent className="bg-paper-white border-stone-gray">
                  <SelectItem value="all">All Clients</SelectItem>
                  <SelectItem value="true">Has Quotes</SelectItem>
                  <SelectItem value="false">No Quotes</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.sortBy} onValueChange={(value) => 
                handleSortChange(value as ClientSearchFilters['sortBy'])
              }>
                <SelectTrigger className="bg-light-concrete text-charcoal border-stone-gray">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent className="bg-paper-white border-stone-gray">
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="created_at">Date Added</SelectItem>
                  <SelectItem value="last_quote_date">Last Quote</SelectItem>
                  <SelectItem value="total_quotes">Total Quotes</SelectItem>
                  <SelectItem value="total_quote_value">Total Value</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Desktop Table View */}
      <div className="hidden lg:block">
        <Card className="bg-paper-white border border-stone-gray shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="border-stone-gray">
                <TableHead className="text-charcoal font-semibold">Client</TableHead>
                <TableHead className="text-charcoal font-semibold">Contact</TableHead>
                <TableHead className="text-charcoal font-semibold">Quotes</TableHead>
                <TableHead className="text-charcoal font-semibold">Total Value</TableHead>
                <TableHead className="text-charcoal font-semibold">Last Quote</TableHead>
                <TableHead className="text-charcoal font-semibold w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.map((client) => (
                <TableRow 
                  key={client.id} 
                  className={`border-stone-gray hover:bg-light-concrete/50 ${
                    selectable ? 'cursor-pointer' : ''
                  }`}
                  onClick={selectable ? () => onClientSelect?.(client) : undefined}
                >
                  <TableCell>
                    <div className="flex items-center">
                      <User className="h-8 w-8 text-forest-green mr-3" />
                      <div>
                        <p className="font-semibold text-charcoal">{client.name}</p>
                        {client.email && (
                          <p className="text-sm text-charcoal/60">{client.email}</p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {client.phone && (
                        <div className="flex items-center text-sm text-charcoal/70">
                          <Phone className="w-3 h-3 mr-1" />
                          {client.phone}
                        </div>
                      )}
                      {client.email && (
                        <div className="flex items-center text-sm text-charcoal/70">
                          <Mail className="w-3 h-3 mr-1" />
                          {client.email}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <span className="font-mono text-charcoal">{client.total_quotes}</span>
                      {client.acceptance_rate_percent > 0 && (
                        <Badge className="ml-2 bg-success-green text-paper-white">
                          {client.acceptance_rate_percent}% win rate
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-charcoal">
                      {formatCurrency(client.total_quote_value)}
                    </span>
                  </TableCell>
                  <TableCell className="text-charcoal">
                    {formatDate(client.last_quote_date)}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedClient(client);
                          setShowEditDialog(true);
                        }}
                        className="w-8 h-8 bg-light-concrete text-charcoal rounded-lg inline-flex items-center justify-center hover:bg-stone-gray/20"
                        title="Edit client"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedClient(client);
                          setShowDeleteDialog(true);
                        }}
                        className="w-8 h-8 bg-error-red text-paper-white rounded-lg inline-flex items-center justify-center hover:opacity-90"
                        title="Delete client"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-3">
        {filteredClients.map((client) => (
          <Card 
            key={client.id} 
            className={`bg-paper-white border border-stone-gray shadow-sm ${
              selectable ? 'cursor-pointer hover:bg-light-concrete/50' : ''
            }`}
            onClick={selectable ? () => onClientSelect?.(client) : undefined}
          >
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-charcoal">{client.name}</h3>
                  {client.email && (
                    <p className="text-sm text-charcoal/60">{client.email}</p>
                  )}
                </div>
                <div className="flex space-x-2 ml-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedClient(client);
                      setShowEditDialog(true);
                    }}
                    className="w-10 h-10 bg-light-concrete text-charcoal rounded-lg inline-flex items-center justify-center hover:bg-stone-gray/20"
                    title="Edit client"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedClient(client);
                      setShowDeleteDialog(true);
                    }}
                    className="w-10 h-10 bg-error-red text-paper-white rounded-lg inline-flex items-center justify-center hover:opacity-90"
                    title="Delete client"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-charcoal/60">Quotes:</span>
                  <div className="flex items-center mt-1">
                    <span className="font-mono text-charcoal font-medium">{client.total_quotes}</span>
                    {client.acceptance_rate_percent > 0 && (
                      <Badge className="ml-2 bg-success-green text-paper-white text-xs">
                        {client.acceptance_rate_percent}%
                      </Badge>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-charcoal/60">Total Value:</span>
                  <p className="font-mono text-charcoal font-medium mt-1">
                    {formatCurrency(client.total_quote_value)}
                  </p>
                </div>
                {client.phone && (
                  <div>
                    <span className="text-charcoal/60">Phone:</span>
                    <p className="text-charcoal font-medium mt-1">{client.phone}</p>
                  </div>
                )}
                <div>
                  <span className="text-charcoal/60">Last Quote:</span>
                  <p className="text-charcoal font-medium mt-1">{formatDate(client.last_quote_date)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredClients.length === 0 && !loading && (
        <Card className="bg-paper-white border border-stone-gray shadow-sm">
          <CardContent className="p-12 text-center">
            <User className="w-12 h-12 text-charcoal/40 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-charcoal mb-2">No clients found</h3>
            <p className="text-charcoal/60 mb-6">
              {filters.search ? 'Try adjusting your search criteria.' : 'Get started by adding your first client.'}
            </p>
            {!filters.search && (
              <Button
                onClick={() => setShowCreateDialog(true)}
                className="bg-equipment-yellow text-charcoal hover:brightness-110 font-bold px-6 py-3 rounded-lg"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add First Client
              </Button>
            )}
          </CardContent>
        </Card>
      )}

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

      {/* Edit Client Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-paper-white border-stone-gray max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-charcoal text-section-title">Edit Client</DialogTitle>
          </DialogHeader>
          {selectedClient && (
            <ClientForm
              client={selectedClient}
              onSuccess={handleEditClient}
              onCancel={() => {
                setShowEditDialog(false);
                setSelectedClient(null);
              }}
              showCard={false}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-paper-white border-stone-gray">
          <DialogHeader>
            <DialogTitle className="text-charcoal text-section-title">Delete Client</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-charcoal">
              Are you sure you want to delete <strong>{selectedClient?.name}</strong>? 
              This action cannot be undone.
            </p>
            {selectedClient && selectedClient.total_quotes > 0 && (
              <p className="text-error-red text-sm mt-2 font-medium">
                Warning: This client has {selectedClient.total_quotes} quote(s). 
                You may need to reassign or delete those quotes first.
              </p>
            )}
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              onClick={() => {
                setShowDeleteDialog(false);
                setSelectedClient(null);
              }}
              className="bg-paper-white text-charcoal border-2 border-stone-gray hover:bg-stone-gray/20 font-bold px-6 py-3 rounded-lg"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteClient}
              disabled={isPending}
              className="bg-error-red text-paper-white hover:opacity-90 font-bold px-6 py-3 rounded-lg"
            >
              {isPending ? 'Deleting...' : 'Delete Client'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}