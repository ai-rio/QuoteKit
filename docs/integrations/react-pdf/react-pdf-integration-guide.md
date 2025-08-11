# React-PDF Integration Guide for QuoteKit

## Overview

QuoteKit uses `@react-pdf/renderer` to generate professional PDF quotes that can be downloaded directly from the quotes table. This integration provides a complete PDF generation and download system with the following features:

- **Professional PDF Templates**: Clean, branded quote documents
- **Direct Download**: One-click PDF download from quotes table actions menu
- **Bulk Export**: Download multiple quote PDFs at once
- **Server-side Generation**: Secure PDF creation via API endpoints
- **Real-time Data**: PDFs include current quote data and company settings

## Architecture

### Core Components

1. **PDF Template** (`/src/libs/pdf/quote-template.tsx`)
   - React-PDF document structure
   - Professional styling and layout
   - Dynamic data rendering

2. **API Endpoint** (`/src/app/api/quotes/[id]/pdf/route.ts`)
   - Server-side PDF generation
   - Authentication and authorization
   - Data fetching and validation

3. **UI Integration** (`/src/features/quotes/components/QuotesTable.tsx`)
   - Download action in table dropdown menu
   - Bulk export functionality
   - Error handling and user feedback

4. **PDF Generator Component** (`/src/features/quotes/components/pdf-generator.tsx`)
   - Standalone PDF generation UI
   - Progress tracking
   - Success/error states

## Implementation Details

### 1. PDF Template Structure

The PDF template includes:

```tsx
<Document>
  <Page>
    {/* Company Header */}
    <View style={styles.header}>
      <View style={styles.companyInfo}>
        <Text style={styles.companyName}>{company.company_name}</Text>
        <Text style={styles.companyDetails}>{company.company_address}</Text>
        <Text style={styles.companyDetails}>{company.company_phone}</Text>
      </View>
      <View>
        <Text style={styles.quoteTitle}>QUOTE</Text>
        <Text style={styles.quoteDate}>Date: {formatDate(quote.created_at)}</Text>
      </View>
    </View>

    {/* Client Information */}
    <View style={styles.clientSection}>
      <Text style={styles.sectionTitle}>Quote For:</Text>
      <Text style={styles.clientInfo}>{quote.client_name}</Text>
      <Text style={styles.clientInfo}>{quote.client_contact}</Text>
    </View>

    {/* Line Items Table */}
    <View style={styles.table}>
      {/* Table headers and rows */}
    </View>

    {/* Totals Section */}
    <View style={styles.totalsSection}>
      {/* Subtotal, tax, and total calculations */}
    </View>
  </Page>
</Document>
```

### 2. API Endpoint Flow

```typescript
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // 1. Authenticate user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  // 2. Fetch quote data
  const { data: quote } = await supabase
    .from('quotes')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();
  
  // 3. Fetch company settings
  const { data: company } = await supabase
    .from('company_settings')
    .select('*')
    .eq('id', user.id)
    .single();
  
  // 4. Generate PDF
  const pdfBuffer = await renderToBuffer(QuotePDFTemplate({ quote, company }));
  
  // 5. Return PDF with proper headers
  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`
    }
  });
}
```

### 3. Table Integration

The quotes table includes PDF download in the actions menu:

```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="sm">
      <MoreHorizontal className="h-4 w-4" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem onClick={() => onView(quote)}>
      <Eye className="w-4 h-4 mr-2" />View
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => onEdit(quote)}>
      <Edit className="w-4 h-4 mr-2" />Edit
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => onDuplicate(quote)}>
      <Copy className="w-4 h-4 mr-2" />Duplicate
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => onDownload(quote)}>
      <Download className="w-4 h-4 mr-2" />Download PDF
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

### 4. Download Handler Implementation

```typescript
const handleDownload = async (quote: Quote) => {
  try {
    // Call PDF generation API
    const response = await fetch(`/api/quotes/${quote.id}/pdf`, {
      method: 'GET',
      headers: { 'Cache-Control': 'no-cache' }
    });

    if (!response.ok) {
      throw new Error('Failed to generate PDF');
    }

    // Create and trigger download
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
    alert(`Error: ${error.message}`);
  }
};
```

## Features

### ✅ Implemented Features

1. **Single Quote PDF Download**
   - Click "Download PDF" in quotes table actions menu
   - Generates professional PDF with company branding
   - Automatic browser download with formatted filename

2. **Bulk PDF Export**
   - Select multiple quotes using checkboxes
   - Click "Export" in bulk actions toolbar
   - Downloads all selected quotes as individual PDFs

3. **Professional PDF Template**
   - Company header with name, address, phone
   - Client information section
   - Itemized line items table
   - Tax calculations and totals
   - Professional typography and spacing

4. **Security & Authentication**
   - User authentication required
   - Users can only download their own quotes
   - Server-side data validation

5. **Error Handling**
   - Network error handling
   - User-friendly error messages
   - Graceful fallbacks

### 🚀 Usage Examples

#### Single Quote Download
```typescript
// From quotes table actions menu
<DropdownMenuItem onClick={() => onDownload(quote)}>
  <Download className="w-4 h-4 mr-2" />Download PDF
</DropdownMenuItem>
```

#### Bulk Export
```typescript
// Select quotes and use bulk actions
const selectedQuotes = ['quote-id-1', 'quote-id-2', 'quote-id-3'];
await bulkActions.export(selectedQuotes);
```

#### Standalone PDF Generator
```tsx
// Use the PDFGenerator component directly
<PDFGenerator 
  quoteId={quote.id}
  clientName={quote.client_name}
  disabled={false}
/>
```

## Dependencies

### Required Packages

```json
{
  "@react-pdf/renderer": "^4.3.0"
}
```

### Related Files

- `/src/libs/pdf/quote-template.tsx` - PDF document template
- `/src/libs/pdf/types.ts` - TypeScript interfaces
- `/src/app/api/quotes/[id]/pdf/route.ts` - PDF generation API
- `/src/features/quotes/components/pdf-generator.tsx` - Standalone PDF UI
- `/src/features/quotes/components/QuotesTable.tsx` - Table with download actions
- `/src/features/quotes/components/QuotesManager.tsx` - Download handlers

## Best Practices

1. **Error Handling**: Always wrap PDF operations in try-catch blocks
2. **User Feedback**: Provide clear success/error messages
3. **File Naming**: Use descriptive, sanitized filenames
4. **Memory Management**: Clean up blob URLs after download
5. **Rate Limiting**: Add delays between bulk downloads
6. **Security**: Validate user permissions before PDF generation

## Future Enhancements

- **PDF Preview**: Modal preview before download
- **Custom Templates**: User-configurable PDF layouts
- **Email Integration**: Send PDFs directly via email
- **Batch ZIP**: Download multiple PDFs as ZIP file
- **Print Optimization**: Print-friendly PDF variants
- **Digital Signatures**: Add digital signature support

## Troubleshooting

### Common Issues

1. **PDF Generation Fails**
   - Check user authentication
   - Verify quote exists and belongs to user
   - Check company settings data

2. **Download Not Starting**
   - Ensure browser allows downloads
   - Check for popup blockers
   - Verify blob URL creation

3. **Styling Issues**
   - Review React-PDF style limitations
   - Use supported CSS properties only
   - Test with different PDF viewers

### Debug Tips

```typescript
// Enable debug logging
console.log('PDF generation request:', { quoteId, userId });
console.log('PDF data:', { quote, company });
console.log('PDF buffer size:', pdfBuffer.length);
```

This integration provides a complete, production-ready PDF generation system that enhances the QuoteKit user experience with professional document creation capabilities.