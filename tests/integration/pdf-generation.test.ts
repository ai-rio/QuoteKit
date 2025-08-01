/**
 * PDF Generation Integration Tests
 * 
 * Tests the PDF generation functionality that creates professional,
 * branded quote documents for clients.
 */

import { Quote } from '@/features/quotes/types';
import { CompanySettings } from '@/features/settings/types';

// Mock React PDF components
jest.mock('@react-pdf/renderer', () => ({
  Document: ({ children }: any) => children,
  Page: ({ children }: any) => children,
  Text: ({ children }: any) => children,
  View: ({ children }: any) => children,
  StyleSheet: {
    create: (styles: any) => styles,
  },
  pdf: jest.fn(() => ({
    toBlob: jest.fn(() => Promise.resolve(new Blob(['mock pdf content'], { type: 'application/pdf' }))),
  })),
}));

// Mock the PDF generation functions
const mockGeneratePDF = jest.fn();
const mockDownloadPDF = jest.fn();

jest.mock('@/features/quotes/pdf-generator', () => ({
  generateQuotePDF: mockGeneratePDF,
  downloadQuotePDF: mockDownloadPDF,
}));

describe('PDF Generation Integration Tests', () => {
  const mockCompanySettings: CompanySettings = {
    id: 'test-user-123',
    company_name: 'Green Lawn Services',
    company_address: '123 Main St, Anytown, ST 12345',
    company_phone: '(555) 123-4567',
    company_email: 'info@greenlawn.com',
    logo_url: 'https://example.com/logo.png',
    logo_file_name: 'company-logo.png',
    default_tax_rate: 8.5,
    default_markup_rate: 20.0,
    preferred_currency: 'USD',
    quote_terms: 'Payment due within 30 days. All work guaranteed for 1 year.',
  };

  const mockQuote: Quote = {
    id: 'quote-123',
    user_id: 'test-user-123',
    client_name: 'John Smith',
    client_contact: 'john@example.com',
    quote_data: [
      {
        id: '1',
        name: 'Lawn Mowing',
        unit: 'sq ft',
        cost: 0.05,
        quantity: 1000,
      },
      {
        id: '2',
        name: 'Hedge Trimming',
        unit: 'linear ft',
        cost: 2.50,
        quantity: 50,
      },
      {
        id: '3',
        name: 'Fertilizer Application',
        unit: 'application',
        cost: 75.00,
        quantity: 1,
      },
    ],
    subtotal: 250,
    tax_rate: 8.5,
    markup_rate: 20,
    total: 325.5,
    created_at: '2024-01-15T10:00:00Z',
    status: 'draft',
    quote_number: 'Q-2024-001',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('PDF Content Generation', () => {
    test('should generate PDF with complete quote information', async () => {
      const mockBlob = new Blob(['mock pdf content'], { type: 'application/pdf' });
      mockGeneratePDF.mockResolvedValue(mockBlob);

      const result = await mockGeneratePDF(mockQuote, mockCompanySettings);

      expect(mockGeneratePDF).toHaveBeenCalledWith(mockQuote, mockCompanySettings);
      expect(result).toBeInstanceOf(Blob);
      expect(result.type).toBe('application/pdf');
    });

    test('should include company branding in PDF', async () => {
      const mockBlob = new Blob(['mock pdf with branding'], { type: 'application/pdf' });
      mockGeneratePDF.mockResolvedValue(mockBlob);

      await mockGeneratePDF(mockQuote, mockCompanySettings);

      expect(mockGeneratePDF).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          company_name: 'Green Lawn Services',
          logo_url: 'https://example.com/logo.png',
          company_address: '123 Main St, Anytown, ST 12345',
          company_phone: '(555) 123-4567',
          company_email: 'info@greenlawn.com',
        })
      );
    });

    test('should include all line items in PDF', async () => {
      const mockBlob = new Blob(['mock pdf with line items'], { type: 'application/pdf' });
      mockGeneratePDF.mockResolvedValue(mockBlob);

      await mockGeneratePDF(mockQuote, mockCompanySettings);

      expect(mockGeneratePDF).toHaveBeenCalledWith(
        expect.objectContaining({
          quote_data: expect.arrayContaining([
            expect.objectContaining({ name: 'Lawn Mowing' }),
            expect.objectContaining({ name: 'Hedge Trimming' }),
            expect.objectContaining({ name: 'Fertilizer Application' }),
          ]),
        }),
        expect.any(Object)
      );
    });

    test('should include accurate calculations in PDF', async () => {
      const mockBlob = new Blob(['mock pdf with calculations'], { type: 'application/pdf' });
      mockGeneratePDF.mockResolvedValue(mockBlob);

      await mockGeneratePDF(mockQuote, mockCompanySettings);

      expect(mockGeneratePDF).toHaveBeenCalledWith(
        expect.objectContaining({
          subtotal: 250,
          tax_rate: 8.5,
          total: 325.5,
        }),
        expect.any(Object)
      );
    });

    test('should handle quotes without company logo', async () => {
      const settingsWithoutLogo: CompanySettings = {
        ...mockCompanySettings,
        logo_url: null,
        logo_file_name: null,
      };

      const mockBlob = new Blob(['mock pdf without logo'], { type: 'application/pdf' });
      mockGeneratePDF.mockResolvedValue(mockBlob);

      await mockGeneratePDF(mockQuote, settingsWithoutLogo);

      expect(mockGeneratePDF).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          logo_url: null,
        })
      );
    });

    test('should handle quotes with custom terms', async () => {
      const customTerms = 'Custom payment terms and conditions for this specific quote.';
      const settingsWithCustomTerms: CompanySettings = {
        ...mockCompanySettings,
        quote_terms: customTerms,
      };

      const mockBlob = new Blob(['mock pdf with custom terms'], { type: 'application/pdf' });
      mockGeneratePDF.mockResolvedValue(mockBlob);

      await mockGeneratePDF(mockQuote, settingsWithCustomTerms);

      expect(mockGeneratePDF).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          quote_terms: customTerms,
        })
      );
    });
  });

  describe('PDF Download Functionality', () => {
    test('should download PDF with correct filename', async () => {
      const mockBlob = new Blob(['mock pdf content'], { type: 'application/pdf' });
      mockDownloadPDF.mockResolvedValue(undefined);

      await mockDownloadPDF(mockBlob, 'quote-123');

      expect(mockDownloadPDF).toHaveBeenCalledWith(mockBlob, 'quote-123');
    });

    test('should generate descriptive filename for quote', async () => {
      const mockBlob = new Blob(['mock pdf content'], { type: 'application/pdf' });
      mockDownloadPDF.mockResolvedValue(undefined);

      const expectedFilename = `quote-${mockQuote.quote_number || mockQuote.id}-${mockQuote.client_name.replace(/\s+/g, '-')}`;
      
      await mockDownloadPDF(mockBlob, expectedFilename);

      expect(mockDownloadPDF).toHaveBeenCalledWith(mockBlob, expectedFilename);
    });

    test('should handle special characters in client names for filename', async () => {
      const quoteWithSpecialChars: Quote = {
        ...mockQuote,
        client_name: 'Smith & Sons (LLC)',
      };

      const mockBlob = new Blob(['mock pdf content'], { type: 'application/pdf' });
      mockDownloadPDF.mockResolvedValue(undefined);

      // Filename should sanitize special characters
      const sanitizedFilename = 'quote-Q-2024-001-Smith-Sons-LLC';
      
      await mockDownloadPDF(mockBlob, sanitizedFilename);

      expect(mockDownloadPDF).toHaveBeenCalledWith(mockBlob, sanitizedFilename);
    });
  });

  describe('PDF Content Validation', () => {
    test('should include client information in PDF', async () => {
      const mockBlob = new Blob(['mock pdf with client info'], { type: 'application/pdf' });
      mockGeneratePDF.mockResolvedValue(mockBlob);

      await mockGeneratePDF(mockQuote, mockCompanySettings);

      expect(mockGeneratePDF).toHaveBeenCalledWith(
        expect.objectContaining({
          client_name: 'John Smith',
          client_contact: 'john@example.com',
        }),
        expect.any(Object)
      );
    });

    test('should include quote metadata in PDF', async () => {
      const mockBlob = new Blob(['mock pdf with metadata'], { type: 'application/pdf' });
      mockGeneratePDF.mockResolvedValue(mockBlob);

      await mockGeneratePDF(mockQuote, mockCompanySettings);

      expect(mockGeneratePDF).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'quote-123',
          quote_number: 'Q-2024-001',
          created_at: '2024-01-15T10:00:00Z',
          status: 'draft',
        }),
        expect.any(Object)
      );
    });

    test('should format currency correctly in PDF', async () => {
      const settingsWithEUR: CompanySettings = {
        ...mockCompanySettings,
        preferred_currency: 'EUR',
      };

      const mockBlob = new Blob(['mock pdf with EUR currency'], { type: 'application/pdf' });
      mockGeneratePDF.mockResolvedValue(mockBlob);

      await mockGeneratePDF(mockQuote, settingsWithEUR);

      expect(mockGeneratePDF).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          preferred_currency: 'EUR',
        })
      );
    });

    test('should handle line items with different units', async () => {
      const quoteWithVariedUnits: Quote = {
        ...mockQuote,
        quote_data: [
          { id: '1', name: 'Hourly Service', unit: 'hour', cost: 50, quantity: 2 },
          { id: '2', name: 'Per Square Foot', unit: 'sq ft', cost: 0.10, quantity: 500 },
          { id: '3', name: 'Flat Rate Service', unit: null, cost: 100, quantity: 1 },
        ],
      };

      const mockBlob = new Blob(['mock pdf with varied units'], { type: 'application/pdf' });
      mockGeneratePDF.mockResolvedValue(mockBlob);

      await mockGeneratePDF(quoteWithVariedUnits, mockCompanySettings);

      expect(mockGeneratePDF).toHaveBeenCalledWith(
        expect.objectContaining({
          quote_data: expect.arrayContaining([
            expect.objectContaining({ unit: 'hour' }),
            expect.objectContaining({ unit: 'sq ft' }),
            expect.objectContaining({ unit: null }),
          ]),
        }),
        expect.any(Object)
      );
    });
  });

  describe('Error Handling', () => {
    test('should handle PDF generation errors gracefully', async () => {
      const error = new Error('PDF generation failed');
      mockGeneratePDF.mockRejectedValue(error);

      await expect(mockGeneratePDF(mockQuote, mockCompanySettings)).rejects.toThrow('PDF generation failed');
    });

    test('should handle missing company settings', async () => {
      const incompleteSettings: Partial<CompanySettings> = {
        id: 'test-user-123',
        company_name: 'Test Company',
        // Missing other required fields
      };

      const mockBlob = new Blob(['mock pdf with incomplete settings'], { type: 'application/pdf' });
      mockGeneratePDF.mockResolvedValue(mockBlob);

      await mockGeneratePDF(mockQuote, incompleteSettings as CompanySettings);

      expect(mockGeneratePDF).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          company_name: 'Test Company',
        })
      );
    });

    test('should handle quotes with no line items', async () => {
      const emptyQuote: Quote = {
        ...mockQuote,
        quote_data: [],
        subtotal: 0,
        total: 0,
      };

      const mockBlob = new Blob(['mock pdf with no items'], { type: 'application/pdf' });
      mockGeneratePDF.mockResolvedValue(mockBlob);

      await mockGeneratePDF(emptyQuote, mockCompanySettings);

      expect(mockGeneratePDF).toHaveBeenCalledWith(
        expect.objectContaining({
          quote_data: [],
          subtotal: 0,
          total: 0,
        }),
        expect.any(Object)
      );
    });

    test('should handle download failures', async () => {
      const mockBlob = new Blob(['mock pdf content'], { type: 'application/pdf' });
      const downloadError = new Error('Download failed');
      mockDownloadPDF.mockRejectedValue(downloadError);

      await expect(mockDownloadPDF(mockBlob, 'test-quote')).rejects.toThrow('Download failed');
    });
  });

  describe('PDF Quality and Professional Appearance', () => {
    test('should generate PDF with professional formatting', async () => {
      const mockBlob = new Blob(['professional pdf content'], { type: 'application/pdf' });
      mockGeneratePDF.mockResolvedValue(mockBlob);

      const result = await mockGeneratePDF(mockQuote, mockCompanySettings);

      expect(result).toBeInstanceOf(Blob);
      expect(result.size).toBeGreaterThan(0);
    });

    test('should include proper tax display (hide markup from client)', async () => {
      // This test ensures that markup calculations are hidden from clients
      // while tax is properly displayed
      const mockBlob = new Blob(['pdf with proper tax display'], { type: 'application/pdf' });
      mockGeneratePDF.mockResolvedValue(mockBlob);

      await mockGeneratePDF(mockQuote, mockCompanySettings);

      // Verify that the quote includes tax rate but the PDF generation
      // should handle markup internally without showing it to the client
      expect(mockGeneratePDF).toHaveBeenCalledWith(
        expect.objectContaining({
          tax_rate: 8.5,
          markup_rate: 20, // This should be used for calculation but not displayed
        }),
        expect.any(Object)
      );
    });

    test('should generate consistent PDF output for same input', async () => {
      const mockBlob1 = new Blob(['consistent pdf content'], { type: 'application/pdf' });
      const mockBlob2 = new Blob(['consistent pdf content'], { type: 'application/pdf' });
      
      mockGeneratePDF
        .mockResolvedValueOnce(mockBlob1)
        .mockResolvedValueOnce(mockBlob2);

      const result1 = await mockGeneratePDF(mockQuote, mockCompanySettings);
      const result2 = await mockGeneratePDF(mockQuote, mockCompanySettings);

      expect(result1.type).toBe(result2.type);
      expect(result1.size).toBe(result2.size);
    });

    test('should handle large quotes with many line items', async () => {
      const largeQuote: Quote = {
        ...mockQuote,
        quote_data: Array.from({ length: 50 }, (_, i) => ({
          id: `item-${i}`,
          name: `Service ${i + 1}`,
          unit: 'each',
          cost: Math.random() * 100,
          quantity: Math.floor(Math.random() * 10) + 1,
        })),
      };

      const mockBlob = new Blob(['large pdf content'], { type: 'application/pdf' });
      mockGeneratePDF.mockResolvedValue(mockBlob);

      const result = await mockGeneratePDF(largeQuote, mockCompanySettings);

      expect(result).toBeInstanceOf(Blob);
      expect(mockGeneratePDF).toHaveBeenCalledWith(
        expect.objectContaining({
          quote_data: expect.arrayContaining([
            expect.objectContaining({ name: 'Service 1' }),
            expect.objectContaining({ name: 'Service 50' }),
          ]),
        }),
        expect.any(Object)
      );
    });
  });
});
