'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Download, Edit, FileText, Mail, MoreHorizontal } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { Quote } from '../types';
import { duplicateQuote } from '../actions';

import { QuotePDFViewer } from './QuotePDFViewer';

interface QuoteViewerProps {
  quote: Quote;
  company: {
    company_name: string | null;
    company_address: string | null;
    company_phone: string | null;
    logo_url: string | null;
  } | null;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'draft':
      return 'bg-light-concrete text-charcoal border-stone-gray';
    case 'sent':
      return 'bg-equipment-yellow/20 text-charcoal border-equipment-yellow';
    case 'accepted':
      return 'bg-forest-green/20 text-forest-green border-forest-green';
    case 'declined':
      return 'bg-stone-gray text-charcoal border-stone-gray';
    case 'expired':
      return 'bg-stone-gray/50 text-charcoal/70 border-stone-gray';
    default:
      return 'bg-light-concrete text-charcoal border-stone-gray';
  }
};

export function QuoteViewer({ quote, company }: QuoteViewerProps) {
  const router = useRouter();
  const [isDownloading, setIsDownloading] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch(`/api/quotes/${quote.id}/pdf`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `quote-${quote.client_name.replace(/[^a-zA-Z0-9]/g, '-')}-${quote.id.slice(0, 8)}.pdf`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to download PDF. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleEdit = () => {
    router.push(`/quotes/${quote.id}/edit`);
  };

  const handleDuplicate = async () => {
    try {
      const response = await duplicateQuote(quote.id);
      
      if (response.error) {
        toast({
          title: 'Failed to duplicate quote',
          description: response.error.message,
          variant: 'destructive',
        });
        return;
      }

      if (response.data) {
        toast({
          title: 'Quote duplicated successfully',
          description: 'Redirecting to edit the new quote...',
        });
        
        // Navigate to the new quote edit page
        router.push(`/quotes/${response.data.id}/edit`);
      }
    } catch (error) {
      console.error('Error duplicating quote:', error);
      toast({
        title: 'Failed to duplicate quote',
        description: 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleSendEmail = () => {
    // TODO: Implement email sending
    alert('Email sending functionality will be implemented.');
  };

  // Calculate tax amount
  const taxAmount = quote.subtotal * (quote.tax_rate / 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="text-charcoal hover:bg-stone-gray/20"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Quotes
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-charcoal">
              {quote.quote_number || `Quote #${quote.id.slice(0, 8)}`}
            </h1>
            <p className="text-charcoal/60 mt-1">
              Created on {formatDate(quote.created_at)}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge className={getStatusColor(quote.status || 'draft')}>
            {(quote.status || 'draft').charAt(0).toUpperCase() + (quote.status || 'draft').slice(1)}
          </Badge>
          
          <Button
            onClick={handleDownload}
            disabled={isDownloading}
            className="bg-forest-green text-white hover:opacity-90"
          >
            <Download className="w-4 h-4 mr-2" />
            {isDownloading ? 'Generating...' : 'Download PDF'}
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" className="bg-equipment-yellow text-charcoal hover:bg-equipment-yellow/90 hover:text-charcoal active:bg-equipment-yellow/80 font-bold">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={handleEdit}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Quote
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDuplicate}>
                <FileText className="w-4 h-4 mr-2" />
                Duplicate Quote
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSendEmail}>
                <Mail className="w-4 h-4 mr-2" />
                Send via Email
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Quote Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Company Information */}
        <Card className="bg-paper-white border-stone-gray">
          <CardHeader>
            <CardTitle className="text-charcoal">From</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="font-semibold text-charcoal">
              {company?.company_name || 'Your Company Name'}
            </div>
            {company?.company_address && (
              <div className="text-charcoal/70">{company.company_address}</div>
            )}
            {company?.company_phone && (
              <div className="text-charcoal/70">{company.company_phone}</div>
            )}
            {!company && (
              <div className="text-charcoal/50 text-sm">
                <Link href="/settings" className="text-forest-green hover:underline">
                  Set up company information
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Client Information */}
        <Card className="bg-paper-white border-stone-gray">
          <CardHeader>
            <CardTitle className="text-charcoal">To</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="font-semibold text-charcoal">{quote.client_name}</div>
            {quote.client_contact && (
              <div className="text-charcoal/70">{quote.client_contact}</div>
            )}
          </CardContent>
        </Card>

        {/* Quote Summary */}
        <Card className="bg-paper-white border-stone-gray">
          <CardHeader>
            <CardTitle className="text-charcoal">Quote Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-charcoal/70">Subtotal:</span>
              <span className="font-medium text-charcoal">{formatCurrency(quote.subtotal)}</span>
            </div>
            {quote.tax_rate > 0 && (
              <div className="flex justify-between">
                <span className="text-charcoal/70">Tax ({quote.tax_rate}%):</span>
                <span className="font-medium text-charcoal">{formatCurrency(taxAmount)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span className="text-charcoal">Total:</span>
              <span className="text-forest-green">{formatCurrency(quote.total)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Line Items */}
      <Card className="bg-paper-white border-stone-gray">
        <CardHeader>
          <CardTitle className="text-charcoal">Line Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-stone-gray">
                <TableHead className="text-charcoal font-bold">Description</TableHead>
                <TableHead className="text-charcoal font-bold text-center">Quantity</TableHead>
                <TableHead className="text-charcoal font-bold text-right">Unit Price</TableHead>
                <TableHead className="text-charcoal font-bold text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quote.quote_data.map((item, index) => (
                <TableRow key={index} className="border-stone-gray">
                  <TableCell className="text-charcoal">
                    <div className="font-medium">{item.name}</div>
                    {item.unit && (
                      <div className="text-sm text-charcoal/60">Unit: {item.unit}</div>
                    )}
                  </TableCell>
                  <TableCell className="text-center text-charcoal">
                    {item.quantity}
                  </TableCell>
                  <TableCell className="text-right text-charcoal">
                    {formatCurrency(item.cost)}
                  </TableCell>
                  <TableCell className="text-right font-medium text-charcoal">
                    {formatCurrency(item.cost * item.quantity)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Additional Information */}
      {(quote.notes || quote.expires_at || quote.follow_up_date) && (
        <Card className="bg-paper-white border-stone-gray">
          <CardHeader>
            <CardTitle className="text-charcoal">Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {quote.expires_at && (
              <div>
                <h4 className="font-medium text-charcoal mb-1">Expires On</h4>
                <p className="text-charcoal/70">{formatDate(quote.expires_at)}</p>
              </div>
            )}
            {quote.follow_up_date && (
              <div>
                <h4 className="font-medium text-charcoal mb-1">Follow-up Date</h4>
                <p className="text-charcoal/70">{formatDate(quote.follow_up_date)}</p>
              </div>
            )}
            {quote.notes && (
              <div>
                <h4 className="font-medium text-charcoal mb-1">Notes</h4>
                <p className="text-charcoal/70 whitespace-pre-wrap">{quote.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* PDF Viewer */}
      <QuotePDFViewer quote={quote} company={company as any} />

      {/* Quick Actions */}
      <Card className="bg-paper-white border-stone-gray">
        <CardHeader>
          <CardTitle className="text-charcoal">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handleEdit}
              className="bg-equipment-yellow text-charcoal hover:bg-equipment-yellow/90 hover:text-charcoal active:bg-equipment-yellow/80 font-bold"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Quote
            </Button>
            <Button
              onClick={handleDuplicate}
              className="bg-equipment-yellow text-charcoal hover:bg-equipment-yellow/90 hover:text-charcoal active:bg-equipment-yellow/80 font-bold"
            >
              <FileText className="w-4 h-4 mr-2" />
              Duplicate Quote
            </Button>
            <Button
              onClick={handleSendEmail}
              className="bg-equipment-yellow text-charcoal hover:bg-equipment-yellow/90 hover:text-charcoal active:bg-equipment-yellow/80 font-bold"
            >
              <Mail className="w-4 h-4 mr-2" />
              Send via Email
            </Button>
            <Link href="/quotes">
              <Button
                className="bg-equipment-yellow text-charcoal hover:bg-equipment-yellow/90 hover:text-charcoal active:bg-equipment-yellow/80 font-bold"
              >
                Back to All Quotes
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}