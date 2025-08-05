'use client';

import { AlertCircle,Calendar, Download, FileText, Filter, RefreshCw, Search } from 'lucide-react';
import { useEffect, useMemo,useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useBillingHistory } from '@/features/account/hooks/useBillingHistory';
import { formatDate } from '@/utils/to-date-time';

interface BillingHistoryItem {
  id: string;
  date: string;
  amount: number;
  status: string;
  invoice_url: string;
  description: string;
  type?: 'stripe_invoice' | 'subscription_change' | 'billing_record';
}

interface BillingHistoryTableProps {
  initialData?: BillingHistoryItem[];
  className?: string;
  metadata?: {
    hasStripeInvoices?: boolean;
    hasSubscriptionHistory?: boolean;
    hasBillingRecords?: boolean;
    isProductionMode?: boolean;
    message?: string;
  };
}

type StatusFilter = 'all' | 'paid' | 'pending' | 'failed' | 'draft';
type SortField = 'date' | 'amount' | 'status' | 'description';
type SortDirection = 'asc' | 'desc';

export function BillingHistoryTable({ initialData = [], className, metadata }: BillingHistoryTableProps) {
  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Custom hook for billing history data with real-time updates
  const { 
    data: billingHistory, 
    isLoading, 
    error, 
    refetch,
    isRefetching 
  } = useBillingHistory(initialData);

  // Filtered and sorted data
  const filteredAndSortedData = useMemo(() => {
    let filtered = billingHistory;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === statusFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortField) {
        case 'date':
          aValue = new Date(a.date).getTime();
          bValue = new Date(b.date).getTime();
          break;
        case 'amount':
          aValue = a.amount;
          bValue = b.amount;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'description':
          aValue = a.description;
          bValue = b.description;
          break;
        default:
          aValue = a.date;
          bValue = b.date;
      }

      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [billingHistory, searchTerm, statusFilter, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage);
  const paginatedData = filteredAndSortedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, sortField, sortDirection]);

  // Handle sort change
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Handle invoice download
  const handleDownloadInvoice = async (invoiceUrl: string, invoiceId: string) => {
    try {
      // Check if we have a valid Stripe invoice ID (starts with 'in_')
      if (invoiceId.startsWith('in_')) {
        // Use our API route for proper Stripe invoice download
        const downloadUrl = `/api/billing-history/${invoiceId}/invoice`;
        window.open(downloadUrl, '_blank', 'noopener,noreferrer');
      } else if (invoiceUrl && invoiceUrl !== '#') {
        // Fallback to direct URL for non-Stripe invoices
        window.open(invoiceUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (error) {
      console.error('Failed to download invoice:', error);
      // Fallback to direct URL if API route fails
      if (invoiceUrl && invoiceUrl !== '#') {
        window.open(invoiceUrl, '_blank', 'noopener,noreferrer');
      }
    }
  };

  // Check if a record has a downloadable invoice
  const hasDownloadableInvoice = (item: BillingHistoryItem) => {
    // Only show download for actual Stripe invoices or records with valid URLs
    return (item.id.startsWith('in_') || (item.invoice_url && item.invoice_url !== '#'));
  };

  // Status badge styling
  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'bg-forest-green text-paper-white hover:bg-forest-green/90';
      case 'pending':
        return 'bg-equipment-yellow text-charcoal hover:bg-equipment-yellow/90';
      case 'failed':
        return 'bg-red-500 text-paper-white hover:bg-red-500/90';
      case 'draft':
        return 'bg-stone-gray text-charcoal hover:bg-stone-gray/90';
      default:
        return 'bg-stone-gray text-charcoal hover:bg-stone-gray/90';
    }
  };

  // Type badge styling for billing record source
  const getTypeBadgeClass = (type?: string) => {
    switch (type) {
      case 'stripe_invoice':
        return 'bg-blue-500 text-paper-white hover:bg-blue-500/90';
      case 'subscription_change':
        return 'bg-purple-500 text-paper-white hover:bg-purple-500/90';
      case 'billing_record':
        return 'bg-green-500 text-paper-white hover:bg-green-500/90';
      default:
        return 'bg-stone-gray text-charcoal hover:bg-stone-gray/90';
    }
  };

  // Get display text for type
  const getTypeDisplayText = (type?: string) => {
    switch (type) {
      case 'stripe_invoice':
        return 'Invoice';
      case 'subscription_change':
        return 'Subscription';
      case 'billing_record':
        return 'Billing';
      default:
        return 'Unknown';
    }
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <Card className={`bg-paper-white border-stone-gray ${className}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-6 w-6" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-24" />
            </div>
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className={`bg-paper-white border-stone-gray ${className}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl text-charcoal flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                Billing History
              </CardTitle>
              <CardDescription className="text-charcoal/70">
                Failed to load billing history
              </CardDescription>
            </div>
            <Calendar className="h-6 w-6 text-charcoal/60" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-charcoal/70 mb-4">
              {error instanceof Error ? error.message : 'An error occurred while loading billing history'}
            </p>
            <Button 
              onClick={() => refetch()} 
              variant="outline"
              className="border-stone-gray text-charcoal hover:bg-light-concrete"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`bg-paper-white border-stone-gray ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl text-charcoal">Billing History</CardTitle>
            <CardDescription className="text-charcoal/70">
              Download your invoices and receipts
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => refetch()}
              variant="ghost"
              size="sm"
              disabled={isRefetching}
              className="text-charcoal hover:bg-light-concrete"
            >
              <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
            </Button>
            <Calendar className="h-6 w-6 text-charcoal/60" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Enhanced Status Message */}
        {metadata?.message && (
          <div className={`mb-4 p-3 rounded-lg border ${
            metadata.hasStripeInvoices 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : metadata.hasBillingRecords
              ? 'bg-blue-50 border-blue-200 text-blue-800'
              : metadata.hasSubscriptionHistory
              ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
              : 'bg-light-concrete border-stone-gray text-charcoal/60'
          }`}>
            <div className="flex items-start gap-2">
              <div className="flex-shrink-0 mt-0.5">
                {metadata.hasStripeInvoices ? (
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                ) : metadata.hasBillingRecords ? (
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                ) : metadata.hasSubscriptionHistory ? (
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                ) : (
                  <div className="w-2 h-2 bg-stone-gray rounded-full"></div>
                )}
              </div>
              <p className="text-sm font-medium">{metadata.message}</p>
            </div>
          </div>
        )}
        
        {billingHistory.length > 0 ? (
          <>
            {/* Filters and Search */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-charcoal/60" />
                <Input
                  placeholder="Search invoices..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-stone-gray focus:border-forest-green"
                />
              </div>
              <Select value={statusFilter} onValueChange={(value: StatusFilter) => setStatusFilter(value)}>
                <SelectTrigger className="w-full sm:w-32 border-stone-gray">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Results Summary */}
            <div className="flex justify-between items-center mb-4 text-sm text-charcoal/70">
              <span>
                Showing {paginatedData.length} of {filteredAndSortedData.length} invoices
              </span>
              {filteredAndSortedData.length !== billingHistory.length && (
                <span>
                  (filtered from {billingHistory.length} total)
                </span>
              )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block">
              <Table>
                <TableHeader>
                  <TableRow className="border-stone-gray">
                    <TableHead 
                      className="text-charcoal cursor-pointer hover:text-forest-green"
                      onClick={() => handleSort('date')}
                    >
                      Date
                      {sortField === 'date' && (
                        <span className="ml-1">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </TableHead>
                    <TableHead 
                      className="text-charcoal cursor-pointer hover:text-forest-green"
                      onClick={() => handleSort('description')}
                    >
                      Description
                      {sortField === 'description' && (
                        <span className="ml-1">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </TableHead>
                    <TableHead 
                      className="text-charcoal cursor-pointer hover:text-forest-green"
                      onClick={() => handleSort('amount')}
                    >
                      Amount
                      {sortField === 'amount' && (
                        <span className="ml-1">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </TableHead>
                    <TableHead 
                      className="text-charcoal cursor-pointer hover:text-forest-green"
                      onClick={() => handleSort('status')}
                    >
                      Status
                      {sortField === 'status' && (
                        <span className="ml-1">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </TableHead>
                    <TableHead className="text-charcoal">Source</TableHead>
                    <TableHead className="text-charcoal">Invoice</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map((item) => (
                    <TableRow key={item.id} className="border-stone-gray">
                      <TableCell className="text-charcoal">
                        {formatDate(item.date)}
                      </TableCell>
                      <TableCell className="text-charcoal max-w-xs truncate">
                        {item.description}
                      </TableCell>
                      <TableCell className="text-charcoal font-medium">
                        ${(item.amount / 100).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeClass(item.status)}>
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getTypeBadgeClass(item.type)}>
                          {getTypeDisplayText(item.type)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {hasDownloadableInvoice(item) ? (
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="border-stone-gray text-charcoal hover:bg-light-concrete w-10 h-10"
                            onClick={() => handleDownloadInvoice(item.invoice_url, item.id)}
                            title="Download Invoice"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        ) : (
                          <span className="text-charcoal/40 text-sm">No invoice</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-4">
              {paginatedData.map((item) => (
                <Card key={item.id} className="bg-light-concrete border-stone-gray">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <p className="font-medium text-charcoal mb-1">
                          {item.description}
                        </p>
                        <p className="text-sm text-charcoal/70">
                          {formatDate(item.date)}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Badge className={getStatusBadgeClass(item.status)}>
                          {item.status}
                        </Badge>
                        <Badge className={getTypeBadgeClass(item.type)}>
                          {getTypeDisplayText(item.type)}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-charcoal text-lg">
                        ${(item.amount / 100).toFixed(2)}
                      </span>
                      {hasDownloadableInvoice(item) ? (
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="border-stone-gray text-charcoal hover:bg-paper-white"
                          onClick={() => handleDownloadInvoice(item.invoice_url, item.id)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      ) : (
                        <span className="text-charcoal/40 text-sm">No invoice available</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="border-stone-gray text-charcoal hover:bg-light-concrete"
                >
                  Previous
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className={
                          currentPage === pageNum
                            ? "bg-forest-green text-paper-white hover:bg-forest-green/90"
                            : "border-stone-gray text-charcoal hover:bg-light-concrete"
                        }
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="border-stone-gray text-charcoal hover:bg-light-concrete"
                >
                  Next
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-charcoal/30 mx-auto mb-4" />
            <p className="text-charcoal/70 text-lg mb-2">No billing history available</p>
            <p className="text-charcoal/50 text-sm">
              Your invoices and receipts will appear here once you have billing activity.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
