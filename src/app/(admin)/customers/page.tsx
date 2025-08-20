'use client';

import { AlertTriangle, Clock,DollarSign, Filter, MoreVertical, Search, Users } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  adminCancelSubscription, 
  type AdminCustomer,
  adminReactivateSubscription,
  type CustomerFilters, 
  getAdminCustomers, 
  getFailedPayments,
  retryFailedPayment} from '@/features/admin/actions/customer-actions';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [failedPayments, setFailedPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<CustomerFilters>({
    status: 'all',
    search: '',
    page: 1,
    limit: 20
  });
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pastDue: 0,
    canceled: 0
  });

  const loadCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getAdminCustomers(filters);
      setCustomers(result.customers);
      
      // Calculate stats
      const total = result.total;
      const active = result.customers.filter(c => c.subscription?.status === 'active').length;
      const pastDue = result.customers.filter(c => c.subscription?.status === 'past_due').length;
      const canceled = result.customers.filter(c => c.subscription?.cancel_at_period_end).length;
      
      setStats({ total, active, pastDue, canceled });
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const loadFailedPayments = async () => {
    try {
      const failed = await getFailedPayments();
      setFailedPayments(failed);
    } catch (error) {
      console.error('Error loading failed payments:', error);
    }
  };

  useEffect(() => {
    loadCustomers();
    loadFailedPayments();
  }, [filters, loadCustomers]);

  const handleCancelSubscription = async (subscriptionId: string) => {
    try {
      await adminCancelSubscription(subscriptionId, 'Admin cancellation');
      loadCustomers();
    } catch (error) {
      console.error('Error canceling subscription:', error);
    }
  };

  const handleReactivateSubscription = async (subscriptionId: string) => {
    try {
      await adminReactivateSubscription(subscriptionId);
      loadCustomers();
    } catch (error) {
      console.error('Error reactivating subscription:', error);
    }
  };

  const handleRetryPayment = async (subscriptionId: string) => {
    try {
      await retryFailedPayment(subscriptionId);
      loadFailedPayments();
      loadCustomers();
    } catch (error) {
      console.error('Error retrying payment:', error);
    }
  };

  const getStatusBadge = (customer: AdminCustomer) => {
    if (!customer.subscription) {
      return <Badge className="bg-stone-gray text-charcoal">No Subscription</Badge>;
    }

    if (customer.subscription?.cancel_at_period_end) {
      return <Badge className="bg-equipment-yellow text-charcoal">Canceling</Badge>;
    }
    
    const statusColors = {
      active: 'bg-forest-green text-paper-white',
      trialing: 'bg-equipment-yellow text-charcoal',
      past_due: 'bg-red-500 text-paper-white',
      canceled: 'bg-stone-gray text-charcoal',
      unpaid: 'bg-red-600 text-paper-white',
    };

    return (
      <Badge className={statusColors[customer.subscription?.status as keyof typeof statusColors] || 'bg-stone-gray text-charcoal'}>
        {customer.subscription?.status?.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const formatCurrency = (amount: number, currency: string = 'usd') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  return (
    <div className="min-h-screen bg-light-concrete">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-charcoal">Customer Management</h1>
          <p className="text-charcoal/70 mt-2">Manage customer subscriptions and billing</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-paper-white border-stone-gray">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-charcoal/70">Total Customers</p>
                  <p className="text-2xl font-bold text-charcoal">{stats.total}</p>
                </div>
                <Users className="h-8 w-8 text-charcoal/60" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-paper-white border-stone-gray">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-charcoal/70">Active Subscriptions</p>
                  <p className="text-2xl font-bold text-forest-green">{stats.active}</p>
                </div>
                <DollarSign className="h-8 w-8 text-forest-green" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-paper-white border-stone-gray">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-charcoal/70">Past Due</p>
                  <p className="text-2xl font-bold text-red-500">{stats.pastDue}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-paper-white border-stone-gray">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-charcoal/70">Canceling</p>
                  <p className="text-2xl font-bold text-equipment-yellow">{stats.canceled}</p>
                </div>
                <Clock className="h-8 w-8 text-equipment-yellow" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Failed Payments Alert */}
        {failedPayments.length > 0 && (
          <Card className="bg-red-50 border-red-200">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <CardTitle className="text-red-800">Failed Payments Require Attention</CardTitle>
              </div>
              <CardDescription className="text-red-600">
                {failedPayments.length} subscription{failedPayments.length !== 1 ? 's' : ''} with payment issues
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {failedPayments.slice(0, 3).map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-3 bg-paper-white rounded-lg">
                    <div>
                      <p className="font-medium text-charcoal">{payment.users.email}</p>
                      <p className="text-sm text-charcoal/70">
                        {payment.prices?.products?.name} - Due: {new Date(payment.current_period_end).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleRetryPayment(payment.id)}
                      className="bg-forest-green text-paper-white hover:bg-forest-green/90 font-bold px-4 py-2 rounded-lg transition-all duration-200 shadow-lg"
                    >
                      Retry Payment
                    </Button>
                  </div>
                ))}
                {failedPayments.length > 3 && (
                  <p className="text-sm text-red-600 text-center pt-2">
                    And {failedPayments.length - 3} more...
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card className="bg-paper-white border-stone-gray">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-charcoal/60 h-4 w-4" />
                  <Input
                    placeholder="Search customers by email or name..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
                    className="pl-10 border-stone-gray focus:border-forest-green"
                  />
                </div>
              </div>
              <Select 
                value={filters.status} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, status: value as any, page: 1 }))}
              >
                <SelectTrigger className="w-[180px] border-stone-gray">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Customers</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="trialing">Trialing</SelectItem>
                  <SelectItem value="past_due">Past Due</SelectItem>
                  <SelectItem value="canceled">Canceled</SelectItem>
                  <SelectItem value="no_subscription">No Subscription</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Customers Table */}
        <Card className="bg-paper-white border-stone-gray">
          <CardHeader>
            <CardTitle className="text-xl text-charcoal">Customers</CardTitle>
            <CardDescription className="text-charcoal/70">
              Manage customer subscriptions and billing information
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <p className="text-charcoal/70">Loading customers...</p>
              </div>
            ) : customers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-charcoal/70">No customers found</p>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden lg:block">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-stone-gray">
                        <TableHead className="text-charcoal">Customer</TableHead>
                        <TableHead className="text-charcoal">Plan</TableHead>
                        <TableHead className="text-charcoal">Status</TableHead>
                        <TableHead className="text-charcoal">Next Billing</TableHead>
                        <TableHead className="text-charcoal">Revenue</TableHead>
                        <TableHead className="text-charcoal">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customers.map((customer) => (
                        <TableRow key={customer.id} className="border-stone-gray">
                          <TableCell>
                            <div>
                              <p className="font-medium text-charcoal">{customer.email}</p>
                              <p className="text-sm text-charcoal/70">
                                {customer.name || 'No name'}
                              </p>
                              <p className="text-xs text-charcoal/50">
                                Joined {new Date(customer.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {customer.subscription?.price?.product?.name ? (
                              <div>
                                <p className="font-medium text-charcoal">
                                  {customer.subscription?.price?.product?.name}
                                </p>
                                <p className="text-sm text-charcoal/70">
                                  {formatCurrency(customer.subscription?.price?.unit_amount || 0)}/
                                  {customer.subscription?.price?.interval}
                                </p>
                              </div>
                            ) : (
                              <span className="text-charcoal/70">No subscription</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(customer)}
                          </TableCell>
                          <TableCell>
                            {customer.subscription?.current_period_end ? (
                              <span className="text-charcoal">
                                {new Date(customer.subscription?.current_period_end).toLocaleDateString()}
                              </span>
                            ) : (
                              <span className="text-charcoal/70">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {customer.subscription?.price?.unit_amount ? (
                              <span className="font-medium text-charcoal">
                                {formatCurrency(customer.subscription?.price?.unit_amount)}
                              </span>
                            ) : (
                              <span className="text-charcoal/70">$0</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {customer.subscription?.id && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {customer.subscription?.cancel_at_period_end ? (
                                    <DropdownMenuItem 
                                      onClick={() => handleReactivateSubscription(customer.subscription?.id!)}
                                    >
                                      Reactivate Subscription
                                    </DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem 
                                      onClick={() => handleCancelSubscription(customer.subscription?.id!)}
                                    >
                                      Cancel Subscription
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem>View in Stripe</DropdownMenuItem>
                                  <DropdownMenuItem>Send Email</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Cards */}
                <div className="lg:hidden space-y-4">
                  {customers.map((customer) => (
                    <Card key={customer.id} className="bg-light-concrete border-stone-gray">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="font-medium text-charcoal">{customer.email}</p>
                            <p className="text-sm text-charcoal/70">{customer.name || 'No name'}</p>
                          </div>
                          {getStatusBadge(customer)}
                        </div>
                        
                        {customer.subscription?.id ? (
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-charcoal/70">Plan:</span>
                              <span className="text-sm font-medium text-charcoal">
                                {customer.subscription?.price?.product?.name}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-charcoal/70">Revenue:</span>
                              <span className="text-sm font-medium text-charcoal">
                                {formatCurrency(customer.subscription?.price?.unit_amount || 0)}/
                                {customer.subscription?.price?.interval}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-charcoal/70">Next billing:</span>
                              <span className="text-sm text-charcoal">
                                {new Date(customer.subscription?.current_period_end!).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-charcoal/70">No active subscription</p>
                        )}
                        
                        {customer.subscription?.id && (
                          <div className="flex gap-2 mt-4">
                            {customer.subscription?.cancel_at_period_end ? (
                              <Button
                                size="sm"
                                onClick={() => handleReactivateSubscription(customer.subscription?.id!)}
                                className="bg-forest-green text-paper-white hover:bg-forest-green/90 font-bold px-4 py-2 rounded-lg transition-all duration-200 shadow-lg"
                              >
                                Reactivate
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCancelSubscription(customer.subscription?.id!)}
                                className="bg-paper-white border border-stone-gray text-charcoal hover:bg-light-concrete font-bold px-4 py-2 rounded-lg transition-all duration-200"
                              >
                                Cancel
                              </Button>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}