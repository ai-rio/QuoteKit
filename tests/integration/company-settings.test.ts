/**
 * Company Settings Integration Tests
 * 
 * Tests the company settings functionality that allows users to configure
 * their business information, branding, and default quote parameters.
 */

import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { 
  getCompanySettings, 
  updateCompanySettings, 
  uploadLogo 
} from '@/features/settings/actions';
import { CompanySettings, SettingsFormData } from '@/features/settings/types';

// Mock Supabase client
jest.mock('@/libs/supabase/supabase-server-client');

const mockSupabase = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(),
        maybeSingle: jest.fn(),
      })),
    })),
    insert: jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn(),
      })),
    })),
    update: jest.fn(() => ({
      eq: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
    })),
    upsert: jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn(),
      })),
    })),
  })),
  storage: {
    from: jest.fn(() => ({
      upload: jest.fn(),
      getPublicUrl: jest.fn(),
    })),
  },
};

(createSupabaseServerClient as jest.Mock).mockResolvedValue(mockSupabase);

describe('Company Settings Integration Tests', () => {
  const mockUser = {
    id: 'test-user-123',
    email: 'test@example.com',
  };

  const sampleSettings: CompanySettings = {
    id: mockUser.id,
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

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
  });

  describe('Settings Retrieval', () => {
    test('should retrieve company settings for authenticated user', async () => {
      mockSupabase.from().select().eq().maybeSingle.mockResolvedValue({
        data: sampleSettings,
        error: null,
      });

      const result = await getCompanySettings();

      expect(result.error).toBeNull();
      expect(result.data).toEqual(sampleSettings);
      expect(mockSupabase.from).toHaveBeenCalledWith('company_settings');
    });

    test('should return null when no settings exist for user', async () => {
      mockSupabase.from().select().eq().maybeSingle.mockResolvedValue({
        data: null,
        error: null,
      });

      const result = await getCompanySettings();

      expect(result.error).toBeNull();
      expect(result.data).toBeNull();
    });

    test('should handle authentication failure', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      });

      const result = await getCompanySettings();

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toBe('User not authenticated');
      expect(result.data).toBeNull();
    });

    test('should handle database errors', async () => {
      mockSupabase.from().select().eq().maybeSingle.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed', code: 'DB_ERROR' },
      });

      const result = await getCompanySettings();

      expect(result.error).not.toBeNull();
      expect(result.data).toBeNull();
    });
  });

  describe('Settings Updates', () => {
    test('should update company settings successfully', async () => {
      const updatedSettings: CompanySettings = {
        ...sampleSettings,
        company_name: 'Premium Lawn Services',
        default_tax_rate: 9.0,
      };

      mockSupabase.from().upsert().select().single.mockResolvedValue({
        data: updatedSettings,
        error: null,
      });

      const formData: SettingsFormData = {
        company_name: 'Premium Lawn Services',
        company_address: sampleSettings.company_address || '',
        company_phone: sampleSettings.company_phone || '',
        company_email: sampleSettings.company_email || '',
        default_tax_rate: 9.0,
        default_markup_rate: sampleSettings.default_markup_rate || 0,
        preferred_currency: sampleSettings.preferred_currency || 'USD',
        quote_terms: sampleSettings.quote_terms || '',
      };

      const result = await updateCompanySettings(formData);

      expect(result.error).toBeNull();
      expect(result.data?.company_name).toBe('Premium Lawn Services');
      expect(result.data?.default_tax_rate).toBe(9.0);
    });

    test('should validate required company name', async () => {
      const invalidFormData: SettingsFormData = {
        company_name: '', // Empty company name
        company_address: sampleSettings.company_address || '',
        company_phone: sampleSettings.company_phone || '',
        company_email: sampleSettings.company_email || '',
        default_tax_rate: 8.5,
        default_markup_rate: 20.0,
        preferred_currency: 'USD',
        quote_terms: '',
      };

      const result = await updateCompanySettings(invalidFormData);

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain('Company name is required');
      expect(result.data).toBeNull();
    });

    test('should validate email format', async () => {
      const invalidFormData: SettingsFormData = {
        company_name: 'Test Company',
        company_address: '',
        company_phone: '',
        company_email: 'invalid-email', // Invalid email format
        default_tax_rate: 8.5,
        default_markup_rate: 20.0,
        preferred_currency: 'USD',
        quote_terms: '',
      };

      const result = await updateCompanySettings(invalidFormData);

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain('Invalid email format');
      expect(result.data).toBeNull();
    });

    test('should validate tax rate range', async () => {
      const invalidFormData: SettingsFormData = {
        company_name: 'Test Company',
        company_address: '',
        company_phone: '',
        company_email: 'test@example.com',
        default_tax_rate: -5, // Invalid negative tax rate
        default_markup_rate: 20.0,
        preferred_currency: 'USD',
        quote_terms: '',
      };

      const result = await updateCompanySettings(invalidFormData);

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain('Tax rate must be between 0 and 100');
      expect(result.data).toBeNull();
    });

    test('should validate markup rate range', async () => {
      const invalidFormData: SettingsFormData = {
        company_name: 'Test Company',
        company_address: '',
        company_phone: '',
        company_email: 'test@example.com',
        default_tax_rate: 8.5,
        default_markup_rate: 1500, // Invalid high markup rate
        preferred_currency: 'USD',
        quote_terms: '',
      };

      const result = await updateCompanySettings(invalidFormData);

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain('Markup rate must be between 0 and 1000');
      expect(result.data).toBeNull();
    });

    test('should handle partial updates correctly', async () => {
      const partialUpdate: Partial<SettingsFormData> = {
        company_name: 'Updated Company Name',
        default_tax_rate: 7.5,
      };

      const updatedSettings: CompanySettings = {
        ...sampleSettings,
        company_name: 'Updated Company Name',
        default_tax_rate: 7.5,
      };

      mockSupabase.from().upsert().select().single.mockResolvedValue({
        data: updatedSettings,
        error: null,
      });

      const fullFormData: SettingsFormData = {
        company_name: partialUpdate.company_name || '',
        company_address: sampleSettings.company_address || '',
        company_phone: sampleSettings.company_phone || '',
        company_email: sampleSettings.company_email || '',
        default_tax_rate: partialUpdate.default_tax_rate || 0,
        default_markup_rate: sampleSettings.default_markup_rate || 0,
        preferred_currency: sampleSettings.preferred_currency || 'USD',
        quote_terms: sampleSettings.quote_terms || '',
      };

      const result = await updateCompanySettings(fullFormData);

      expect(result.error).toBeNull();
      expect(result.data?.company_name).toBe('Updated Company Name');
      expect(result.data?.default_tax_rate).toBe(7.5);
    });
  });

  describe('Logo Management', () => {
    test('should upload logo successfully', async () => {
      const mockFile = new File(['logo content'], 'logo.png', { type: 'image/png' });
      const logoUrl = 'https://example.com/storage/logos/logo.png';

      mockSupabase.storage.from().upload.mockResolvedValue({
        data: { path: 'logos/logo.png' },
        error: null,
      });

      mockSupabase.storage.from().getPublicUrl.mockReturnValue({
        data: { publicUrl: logoUrl },
      });

      mockSupabase.from().update().eq().select().single.mockResolvedValue({
        data: { ...sampleSettings, logo_url: logoUrl, logo_file_name: 'logo.png' },
        error: null,
      });

      const result = await uploadLogo(mockFile);

      expect(result.error).toBeNull();
      expect(result.data?.logo_url).toBe(logoUrl);
      expect(result.data?.logo_file_name).toBe('logo.png');
    });

    test('should validate file type for logo upload', async () => {
      const invalidFile = new File(['content'], 'document.pdf', { type: 'application/pdf' });

      const result = await uploadLogo(invalidFile);

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain('Only image files are allowed');
      expect(result.data).toBeNull();
    });

    test('should validate file size for logo upload', async () => {
      // Create a mock file that's too large (> 5MB)
      const largeContent = 'x'.repeat(6 * 1024 * 1024); // 6MB
      const largeFile = new File([largeContent], 'large-logo.png', { type: 'image/png' });

      const result = await uploadLogo(largeFile);

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain('File size must be less than 5MB');
      expect(result.data).toBeNull();
    });

    test('should handle storage upload errors', async () => {
      const mockFile = new File(['logo content'], 'logo.png', { type: 'image/png' });

      mockSupabase.storage.from().upload.mockResolvedValue({
        data: null,
        error: { message: 'Storage upload failed', code: 'STORAGE_ERROR' },
      });

      const result = await uploadLogo(mockFile);

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toBe('Storage upload failed');
      expect(result.data).toBeNull();
    });
  });

  describe('Default Values and Business Logic', () => {
    test('should apply default settings to new quotes', async () => {
      // This test verifies that company settings are properly used as defaults
      const settingsWithDefaults: CompanySettings = {
        ...sampleSettings,
        default_tax_rate: 8.25,
        default_markup_rate: 25.0,
      };

      mockSupabase.from().select().eq().maybeSingle.mockResolvedValue({
        data: settingsWithDefaults,
        error: null,
      });

      const result = await getCompanySettings();

      expect(result.error).toBeNull();
      expect(result.data?.default_tax_rate).toBe(8.25);
      expect(result.data?.default_markup_rate).toBe(25.0);
    });

    test('should handle currency formatting correctly', async () => {
      const settingsWithCurrency: CompanySettings = {
        ...sampleSettings,
        preferred_currency: 'EUR',
      };

      mockSupabase.from().select().eq().maybeSingle.mockResolvedValue({
        data: settingsWithCurrency,
        error: null,
      });

      const result = await getCompanySettings();

      expect(result.error).toBeNull();
      expect(result.data?.preferred_currency).toBe('EUR');
    });

    test('should preserve quote terms formatting', async () => {
      const longTerms = `
        Payment Terms:
        - Net 30 days
        - 2% discount for early payment
        
        Warranty:
        - All work guaranteed for 1 year
        - Materials warranty as per manufacturer
        
        Additional Notes:
        - Weather dependent services may be rescheduled
        - Customer must provide access to property
      `.trim();

      const settingsWithTerms: CompanySettings = {
        ...sampleSettings,
        quote_terms: longTerms,
      };

      mockSupabase.from().upsert().select().single.mockResolvedValue({
        data: settingsWithTerms,
        error: null,
      });

      const formData: SettingsFormData = {
        company_name: sampleSettings.company_name || '',
        company_address: sampleSettings.company_address || '',
        company_phone: sampleSettings.company_phone || '',
        company_email: sampleSettings.company_email || '',
        default_tax_rate: sampleSettings.default_tax_rate || 0,
        default_markup_rate: sampleSettings.default_markup_rate || 0,
        preferred_currency: sampleSettings.preferred_currency || 'USD',
        quote_terms: longTerms,
      };

      const result = await updateCompanySettings(formData);

      expect(result.error).toBeNull();
      expect(result.data?.quote_terms).toBe(longTerms);
    });
  });

  describe('Data Validation and Edge Cases', () => {
    test('should handle very long company names', async () => {
      const longName = 'A'.repeat(255);
      const settingsWithLongName: CompanySettings = {
        ...sampleSettings,
        company_name: longName,
      };

      mockSupabase.from().upsert().select().single.mockResolvedValue({
        data: settingsWithLongName,
        error: null,
      });

      const formData: SettingsFormData = {
        company_name: longName,
        company_address: sampleSettings.company_address || '',
        company_phone: sampleSettings.company_phone || '',
        company_email: sampleSettings.company_email || '',
        default_tax_rate: sampleSettings.default_tax_rate || 0,
        default_markup_rate: sampleSettings.default_markup_rate || 0,
        preferred_currency: sampleSettings.preferred_currency || 'USD',
        quote_terms: sampleSettings.quote_terms || '',
      };

      const result = await updateCompanySettings(formData);

      expect(result.error).toBeNull();
      expect(result.data?.company_name).toBe(longName);
    });

    test('should handle special characters in company information', async () => {
      const specialSettings: CompanySettings = {
        ...sampleSettings,
        company_name: 'Smith & Sons Landscaping (LLC)',
        company_address: '123 Main St., Suite #456, Anytown, ST 12345-6789',
        company_phone: '+1 (555) 123-4567 ext. 890',
      };

      mockSupabase.from().upsert().select().single.mockResolvedValue({
        data: specialSettings,
        error: null,
      });

      const formData: SettingsFormData = {
        company_name: specialSettings.company_name,
        company_address: specialSettings.company_address || '',
        company_phone: specialSettings.company_phone || '',
        company_email: specialSettings.company_email || '',
        default_tax_rate: specialSettings.default_tax_rate || 0,
        default_markup_rate: specialSettings.default_markup_rate || 0,
        preferred_currency: specialSettings.preferred_currency || 'USD',
        quote_terms: specialSettings.quote_terms || '',
      };

      const result = await updateCompanySettings(formData);

      expect(result.error).toBeNull();
      expect(result.data?.company_name).toBe('Smith & Sons Landscaping (LLC)');
      expect(result.data?.company_address).toContain('Suite #456');
      expect(result.data?.company_phone).toContain('ext. 890');
    });

    test('should handle decimal precision in rates', async () => {
      const precisionSettings: CompanySettings = {
        ...sampleSettings,
        default_tax_rate: 8.375, // High precision tax rate
        default_markup_rate: 22.5, // Decimal markup rate
      };

      mockSupabase.from().upsert().select().single.mockResolvedValue({
        data: precisionSettings,
        error: null,
      });

      const formData: SettingsFormData = {
        company_name: sampleSettings.company_name || '',
        company_address: sampleSettings.company_address || '',
        company_phone: sampleSettings.company_phone || '',
        company_email: sampleSettings.company_email || '',
        default_tax_rate: 8.375,
        default_markup_rate: 22.5,
        preferred_currency: sampleSettings.preferred_currency || 'USD',
        quote_terms: sampleSettings.quote_terms || '',
      };

      const result = await updateCompanySettings(formData);

      expect(result.error).toBeNull();
      expect(result.data?.default_tax_rate).toBe(8.375);
      expect(result.data?.default_markup_rate).toBe(22.5);
    });
  });
});
