'use client'

import { Crown, FileText, Loader2, Lock } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { UpgradePrompt } from '@/components/UpgradePrompt'
import { useFeatureAccess } from '@/hooks/useFeatureAccess'

interface PDFExportButtonProps {
  quoteId: string
  clientName: string
  variant?: 'default' | 'outline' | 'secondary'
  size?: 'default' | 'sm' | 'lg'
  iconOnly?: boolean
  className?: string
  disabled?: boolean
}

export function PDFExportButton({
  quoteId,
  clientName,
  variant = 'default',
  size = 'default',
  iconOnly = false,
  className = '',
  disabled = false
}: PDFExportButtonProps) {
  const { canAccess } = useFeatureAccess()
  const [isGenerating, setIsGenerating] = useState(false)
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false)

  // Check PDF export access
  const pdfAccess = canAccess('pdf_export')
  const hasAccess = pdfAccess.hasAccess

  const handlePDFExport = async () => {
    // Check feature access first
    if (!hasAccess) {
      setShowUpgradePrompt(true)
      return
    }

    setIsGenerating(true)

    try {
      // Call the PDF generation API
      const response = await fetch(`/api/quotes/${quoteId}/pdf`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        
        // Handle feature access errors
        if (response.status === 403 && errorData.upgradeRequired) {
          setShowUpgradePrompt(true)
          return
        }
        
        throw new Error(errorData.error || 'Failed to generate PDF')
      }

      // Get the PDF blob
      const blob = await response.blob()
      
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `quote-${clientName.replace(/[^a-zA-Z0-9]/g, '-')}-${quoteId.slice(0, 8)}.pdf`
      
      // Trigger download
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // Clean up
      window.URL.revokeObjectURL(url)

    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Failed to generate PDF. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  // Button content based on access state
  const getButtonContent = () => {
    if (isGenerating) {
      return (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          {iconOnly ? '' : 'Generating...'}
        </>
      )
    }

    if (!hasAccess) {
      return (
        <>
          <Lock className="w-4 h-4 mr-2" />
          {iconOnly ? '' : 'Upgrade for PDF'}
          <Crown className="w-3 h-3 ml-2 text-equipment-yellow" />
        </>
      )
    }

    return (
      <>
        <FileText className="w-4 h-4 mr-2" />
        {iconOnly ? '' : 'Export PDF'}
      </>
    )
  }

  return (
    <>
      <Button
        onClick={handlePDFExport}
        variant={hasAccess ? variant : 'outline'}
        size={size}
        className={`${className} ${
          hasAccess 
            ? 'bg-forest-green text-white hover:opacity-90 font-bold'
            : 'bg-amber-600 hover:bg-amber-700 text-white font-bold'
        }`}
        disabled={disabled || isGenerating}
        title={hasAccess ? 'Export PDF' : 'PDF export requires Premium plan'}
      >
        {getButtonContent()}
      </Button>

      {/* Upgrade Prompt Modal */}
      {showUpgradePrompt && (
        <UpgradePrompt
          feature="PDF Export"
          title="PDF Export Requires Premium"
          description="Export professional PDFs with your custom branding and logo. Free users see a QuoteKit watermark."
          modal={true}
          open={showUpgradePrompt}
          onClose={() => setShowUpgradePrompt(false)}
          benefits={[
            'Professional PDF exports',
            'Custom branding and logos',
            'No watermarks',
            'Unlimited quotes',
            'Advanced analytics'
          ]}
        />
      )}
    </>
  )
}
