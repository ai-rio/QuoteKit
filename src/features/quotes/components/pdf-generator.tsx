'use client';

import { useState } from 'react';
import { FileText, Loader2 } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/components/ui/use-toast';

interface PDFGeneratorProps {
  quoteId: string;
  clientName: string;
  disabled?: boolean;
}

export function PDFGenerator({ quoteId, clientName, disabled = false }: PDFGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function generatePDF() {
    setIsGenerating(true);
    setError(null);
    setProgress(0);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      // Call the PDF generation API
      const response = await fetch(`/api/quotes/${quoteId}/pdf`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate PDF');
      }

      // Complete progress
      setProgress(100);

      // Get the PDF blob
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `quote-${clientName.replace(/[^a-zA-Z0-9]/g, '-')}-${quoteId.slice(0, 8)}.pdf`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      window.URL.revokeObjectURL(url);

      toast({
        description: 'PDF generated and downloaded successfully',
      });

    } catch (error) {
      console.error('Error generating PDF:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate PDF';
      setError(errorMessage);
      
      toast({
        variant: 'destructive',
        description: errorMessage,
      });
    } finally {
      setIsGenerating(false);
      setProgress(0);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate Quote PDF</CardTitle>
        <CardDescription>
          Create a professional PDF to share with your client
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress indicator */}
        {isGenerating && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Generating PDF...</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        )}

        {/* Generation button */}
        <Button
          onClick={generatePDF}
          disabled={disabled || isGenerating}
          className="w-full"
          size="lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating PDF...
            </>
          ) : (
            <>
              <FileText className="mr-2 h-4 w-4" />
              Generate & Download PDF
            </>
          )}
        </Button>

        {/* Error message */}
        {error && (
          <Alert variant="destructive">
            <AlertTitle>PDF Generation Failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Info message */}
        <div className="text-sm text-muted-foreground">
          <p>• PDF will include your company information and client details</p>
          <p>• Tax calculations are shown (internal markup is excluded)</p>
          <p>• File will download automatically when ready</p>
        </div>
      </CardContent>
    </Card>
  );
}