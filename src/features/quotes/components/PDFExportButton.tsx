'use client'

import { useState } from 'react'
import { FileText, Loader2, Crown, Lock } from 'lucide-react'

import { Button } from '@/components/ui/button'
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

  // Check PDF export access
  const pdfAccess = canAccess('pdf_export')
  const hasAccess = pdfAccess.hasAccess

  const handlePDFExport = async () => {
    // Check feature access first
    if (!hasAccess) {
      alert('PDF export is a premium feature. Please upgrade to access this functionality.')
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
          {iconOnly ? '' : 'PDF Export'}
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
    <Button
      onClick={handlePDFExport}
      variant={hasAccess ? variant : 'outline'}
      size={size}
      className={`${className} ${
        hasAccess 
          ? 'bg-forest-green text-white hover:opacity-90 font-bold'
          : 'bg-charcoal/10 text-charcoal/60 border-charcoal/20 hover:bg-charcoal/20'
      }`}
      disabled={disabled || isGenerating}
      title={hasAccess ? 'Export PDF' : 'PDF export requires Premium plan'}
    >
      {getButtonContent()}
    </Button>
  )
}

export function CompactPDFExportButton({
  quoteId,
  clientName,
  className = ''
}: {
  quoteId: string
  clientName: string
  className?: string
}) {
  return (
    <PDFExportButton
      quoteId={quoteId}
      clientName={clientName}
      variant="outline"
      size="sm"
      iconOnly={true}
      className={className}
    />
  )
}
