'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UpgradePrompt } from '@/components/UpgradePrompt';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';

import { PDFExportButton } from './PDFExportButton';

interface PDFGeneratorProps {
  quoteId: string;
  clientName: string;
  disabled?: boolean;
}

export function PDFGenerator({ quoteId, clientName, disabled = false }: PDFGeneratorProps) {
  const { canAccess } = useFeatureAccess();
  const pdfAccess = canAccess('pdf_export');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate Quote PDF</CardTitle>
        <CardDescription>
          Create a professional PDF to share with your client
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* PDF Export Button with Feature Gating */}
        <PDFExportButton
          quoteId={quoteId}
          clientName={clientName}
          disabled={disabled}
          size="lg"
          className="w-full"
        />

        {/* Info message */}
        {pdfAccess.hasAccess && (
          <div className="text-sm text-muted-foreground">
            <p>• PDF will include your company information and client details</p>
            <p>• Tax calculations are shown (internal markup is excluded)</p>
            <p>• File will download automatically when ready</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}