'use client';

import { PDFViewer } from '@react-pdf/renderer';
import { Download, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { CompanySettings } from '@/features/settings/types';
import { QuotePDFTemplate } from '@/libs/pdf/quote-template';

import { Quote } from '../types';

interface QuotePDFViewerProps {
  quote: Quote;
  company: CompanySettings | null;
}

export function QuotePDFViewer({ quote, company }: QuotePDFViewerProps) {
  const [showPDF, setShowPDF] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Prepare PDF data
  const pdfData = {
    quote: {
      id: quote.id,
      client_name: quote.client_name,
      client_contact: quote.client_contact,
      quote_data: quote.quote_data.map(item => ({
        id: item.id,
        name: item.name,
        unit: item.unit || '',
        cost: item.cost,
        quantity: item.quantity,
      })),
      subtotal: quote.subtotal,
      tax_rate: quote.tax_rate,
      total: quote.total,
      created_at: quote.created_at,
    },
    company: {
      company_name: company?.company_name || null,
      company_address: company?.company_address || null,
      company_phone: company?.company_phone || null,
      logo_url: company?.logo_url || null,
    },
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

  return (
    <Card className="bg-paper-white border-stone-gray">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-charcoal">Quote Preview</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => setShowPDF(!showPDF)}
              className="bg-equipment-yellow text-charcoal hover:bg-equipment-yellow/90 hover:text-charcoal active:bg-equipment-yellow/80 font-bold"
            >
              {showPDF ? (
                <>
                  <EyeOff className="w-4 h-4 mr-2" />
                  Hide PDF
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 mr-2" />
                  Show PDF
                </>
              )}
            </Button>
            <Button
              onClick={handleDownload}
              disabled={isDownloading}
              size="sm"
              className="bg-forest-green text-white hover:opacity-90"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {showPDF ? (
          <div className="w-full h-[800px] border border-stone-gray rounded-lg overflow-hidden">
            <PDFViewer
              width="100%"
              height="100%"
              style={{
                border: 'none',
              }}
            >
              <QuotePDFTemplate {...pdfData} />
            </PDFViewer>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-light-concrete rounded-full flex items-center justify-center">
              <Eye className="w-8 h-8 text-charcoal/60" />
            </div>
            <p className="text-charcoal/60">
              Click &ldquo;Show PDF&rdquo; to preview the quote in PDF format
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}