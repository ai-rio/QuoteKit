# Story 1.5: Generate and Download Quote PDF

As a logged-in user,  
I want to generate a professional PDF of my completed quote,  
so that I can download it and send it to my client.  

## Acceptance Criteria

1. On the "Create Quote" page, there is a clear and prominent button labeled "Generate PDF" or similar.  
2. Clicking the button triggers the generation of a PDF document.  
3. The generated PDF must be professionally formatted and include:  
   * The user's company name, logo, and contact information (from Story 1.2).  
   * The client's name and contact information (from Story 1.4).  
   * An itemized list of all services/materials with quantities, unit prices, and line totals.  
   * A clear breakdown of the subtotal, tax amount, and the final total.  
4. The system should not include the user's internal profit markup on the client-facing PDF.  
5. Upon successful generation, the user's browser prompts them to download the PDF file.  
6. The downloaded file is a valid, non-corrupted PDF that can be opened by standard PDF readers.

## Component Implementation

### Required Shadcn/UI Components:
- ✅ `button` - Generate PDF button with loading states (already installed)
- ✅ `progress` - PDF generation progress indicator
- ✅ `alert` - Success/error messages for PDF operations
- ✅ `toast` - Real-time feedback during PDF generation (already installed)
- ✅ `dialog` - Optional PDF preview modal before download

### Implementation Pattern:
```tsx
// PDF generation section in quote page
<Card>
  <CardHeader>
    <CardTitle>Generate Quote PDF</CardTitle>
    <CardDescription>
      Create a professional PDF to share with your client
    </CardDescription>
  </CardHeader>
  <CardContent className="space-y-4">
    {/* PDF Generation Progress */}
    {isGenerating && (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span>Generating PDF...</span>
          <span>{progress}%</span>
        </div>
        <Progress value={progress} className="w-full" />
      </div>
    )}
    
    {/* Generation Button */}
    <Button 
      onClick={generatePDF}
      disabled={isGenerating}
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
    
    {/* Success/Error Messages */}
    {pdfError && (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>PDF Generation Failed</AlertTitle>
        <AlertDescription>{pdfError}</AlertDescription>
      </Alert>
    )}
    
    {pdfSuccess && (
      <Alert>
        <CheckCircle className="h-4 w-4" />
        <AlertTitle>PDF Generated Successfully</AlertTitle>
        <AlertDescription>
          Your quote PDF has been generated and should download automatically.
        </AlertDescription>
      </Alert>
    )}
  </CardContent>
</Card>
```

### PDF Template Structure:
```tsx
// PDF layout using React-PDF or similar
<Document>
  <Page>
    {/* Header with Company Info */}
    <View style={styles.header}>
      <Image src={companyLogo} style={styles.logo} />
      <View style={styles.companyInfo}>
        <Text>{companyName}</Text>
        <Text>{companyAddress}</Text>
        <Text>{companyPhone}</Text>
      </View>
    </View>
    
    {/* Client Information */}
    <View style={styles.clientSection}>
      <Text style={styles.sectionTitle}>Quote For:</Text>
      <Text>{clientName}</Text>
      <Text>{clientContact}</Text>
    </View>
    
    {/* Line Items Table */}
    <View style={styles.itemsTable}>
      <View style={styles.tableHeader}>
        <Text>Description</Text>
        <Text>Quantity</Text>
        <Text>Unit Price</Text>
        <Text>Total</Text>
      </View>
      {lineItems.map(item => (
        <View key={item.id} style={styles.tableRow}>
          <Text>{item.name}</Text>
          <Text>{item.quantity} {item.unit}</Text>
          <Text>${item.unitPrice}</Text>
          <Text>${item.total}</Text>
        </View>
      ))}
    </View>
    
    {/* Totals Section - NO MARKUP SHOWN */}
    <View style={styles.totals}>
      <View style={styles.totalRow}>
        <Text>Subtotal:</Text>
        <Text>${subtotal}</Text>
      </View>
      <View style={styles.totalRow}>
        <Text>Tax ({taxRate}%):</Text>
        <Text>${taxAmount}</Text>
      </View>
      <View style={styles.finalTotal}>
        <Text>Total:</Text>
        <Text>${finalTotal}</Text>
      </View>
    </View>
  </Page>
</Document>
```

### Key Features:
1. **Progress Feedback**: Show PDF generation progress with Progress component
2. **Error Handling**: Clear error messages with Alert components
3. **Professional Layout**: Clean PDF template with company branding
4. **Client-Focused**: Exclude internal markup from client-facing PDF
5. **Automatic Download**: Browser download prompt on completion
6. **Loading States**: Disabled button during generation

### Technical Implementation:
- Use `@react-pdf/renderer` for PDF generation
- Server-side PDF creation via API endpoint
- File download handling with proper MIME types
- Progress tracking via WebSocket or polling

### File Locations:
- `components/quotes/pdf-generator.tsx` - PDF generation UI component
- `libs/pdf/quote-template.tsx` - PDF document template
- `app/api/quotes/[id]/pdf/route.ts` - PDF generation API endpoint
- `utils/pdf-utils.ts` - PDF formatting and download utilities