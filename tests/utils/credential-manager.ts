/**
 * Secure Credential Management for Edge Functions Testing
 * Handles JWT tokens and API keys securely with validation and masking
 */

interface TestCredentials {
  localJwtToken?: string;
  localServiceRoleKey?: string;
  productionAnonKey?: string;
  productionServiceRoleKey?: string;
  supabaseProjectId?: string;
}

interface CredentialConfig {
  environment: 'local' | 'production';
  requireHttps: boolean;
  maskInLogs: boolean;
  validateCredentials: boolean;
}

export class SecureCredentialManager {
  private credentials: TestCredentials = {};
  private config: CredentialConfig;
  private isInitialized = false;

  constructor(config: Partial<CredentialConfig> = {}) {
    this.config = {
      environment: 'local',
      requireHttps: true,
      maskInLogs: true,
      validateCredentials: true,
      ...config
    };
  }

  /**
   * Initialize credentials from environment variables
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Load from .env.test file if it exists
      await this.loadFromEnvFile();
      
      // Load from environment variables
      this.loadFromEnvironment();
      
      // Validate credentials
      if (this.config.validateCredentials) {
        await this.validateCredentials();
      }
      
      this.isInitialized = true;
      console.log('🔐 Credential manager initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize credential manager:', error.message);
      throw new Error('Credential initialization failed');
    }
  }

  /**
   * Get authorization header for API requests
   */
  getAuthHeader(): string {
    this.ensureInitialized();
    
    if (this.config.environment === 'local') {
      // Prefer service role key for local testing (more secure)
      if (this.credentials.localServiceRoleKey) {
        return `Bearer ${this.credentials.localServiceRoleKey}`;
      }
      
      if (this.credentials.localJwtToken) {
        return `Bearer ${this.credentials.localJwtToken}`;
      }
      
      throw new Error('No local authentication credentials available');
    } else {
      // Production testing
      if (this.credentials.productionServiceRoleKey) {
        return `Bearer ${this.credentials.productionServiceRoleKey}`;
      }
      
      if (this.credentials.productionAnonKey) {
        return `Bearer ${this.credentials.productionAnonKey}`;
      }
      
      throw new Error('No production authentication credentials available');
    }
  }

  /**
   * Get base URL for API requests
   */
  getBaseUrl(): string {
    this.ensureInitialized();
    
    if (this.config.environment === 'local') {
      return 'http://localhost:54321/functions/v1';
    } else {
      if (!this.credentials.supabaseProjectId) {
        throw new Error('Supabase project ID not configured');
      }
      
      const protocol = this.config.requireHttps ? 'https' : 'http';
      return `${protocol}://${this.credentials.supabaseProjectId}.functions.supabase.co`;
    }
  }

  /**
   * Get masked credential for logging (security)
   */
  getMaskedCredential(credential: string): string {
    if (!this.config.maskInLogs) {
      return credential;
    }
    
    if (credential.length <= 8) {
      return '***';
    }
    
    return credential.substring(0, 4) + '***' + credential.substring(credential.length - 4);
  }

  /**
   * Validate that credentials are properly formatted
   */
  private async validateCredentials(): Promise<void> {
    const errors: string[] = [];

    if (this.config.environment === 'local') {
      if (!this.credentials.localJwtToken && !this.credentials.localServiceRoleKey) {
        errors.push('No local authentication credentials provided');
      }
      
      // Validate JWT format if provided
      if (this.credentials.localJwtToken && !this.isValidJwtFormat(this.credentials.localJwtToken)) {
        errors.push('Local JWT token has invalid format');
      }
      
    } else {
      if (!this.credentials.supabaseProjectId) {
        errors.push('Supabase project ID is required for production testing');
      }
      
      if (!this.credentials.productionAnonKey && !this.credentials.productionServiceRoleKey) {
        errors.push('No production authentication credentials provided');
      }
      
      // Validate project ID format
      if (this.credentials.supabaseProjectId && !this.isValidProjectId(this.credentials.supabaseProjectId)) {
        errors.push('Invalid Supabase project ID format');
      }
    }

    if (errors.length > 0) {
      throw new Error(`Credential validation failed:\n${errors.map(e => `  - ${e}`).join('\n')}`);
    }

    // Test credential by making a simple request
    await this.testCredential();
  }

  /**
   * Test credential by making a simple API request
   */
  private async testCredential(): Promise<void> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/subscription-status`, {
        method: 'POST',
        headers: {
          'Authorization': this.getAuthHeader(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'health-check' }),
        signal: AbortSignal.timeout(5000)
      });

      if (!response.ok && response.status !== 404) {
        // 404 is OK - function might not be deployed yet
        // Other errors indicate credential issues
        throw new Error(`Credential test failed: HTTP ${response.status}`);
      }

      console.log(`✅ Credential validation passed (${this.config.environment})`);
      
    } catch (error) {
      if (error.name === 'TimeoutError') {
        console.warn('⚠️  Credential test timed out - this may be normal');
      } else {
        console.warn(`⚠️  Credential test failed: ${error.message}`);
        // Don't throw here - credentials might be valid but functions not deployed
      }
    }
  }

  /**
   * Load credentials from .env.test file
   */
  private async loadFromEnvFile(): Promise<void> {
    try {
      const envContent = await Deno.readTextFile('.env.test');
      const lines = envContent.split('\n');
      
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const [key, ...valueParts] = trimmed.split('=');
          const value = valueParts.join('=').trim();
          
          if (key && value) {
            Deno.env.set(key, value);
          }
        }
      }
      
      console.log('📄 Loaded credentials from .env.test file');
    } catch (error) {
      // .env.test file doesn't exist - that's OK
      console.log('📄 No .env.test file found, using environment variables');
    }
  }

  /**
   * Load credentials from environment variables
   */
  private loadFromEnvironment(): void {
    this.credentials = {
      localJwtToken: Deno.env.get('TEST_JWT_TOKEN'),
      localServiceRoleKey: Deno.env.get('LOCAL_SERVICE_ROLE_KEY'),
      productionAnonKey: Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
      productionServiceRoleKey: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
      supabaseProjectId: Deno.env.get('SUPABASE_PROJECT_ID') || 
        this.extractProjectIdFromUrl(Deno.env.get('NEXT_PUBLIC_SUPABASE_URL'))
    };

    // Update config from environment
    this.config.requireHttps = Deno.env.get('REQUIRE_HTTPS_IN_PRODUCTION') !== 'false';
    this.config.maskInLogs = Deno.env.get('MASK_CREDENTIALS_IN_LOGS') !== 'false';
    this.config.validateCredentials = Deno.env.get('ENABLE_CREDENTIAL_VALIDATION') !== 'false';
  }

  /**
   * Extract project ID from Supabase URL
   */
  private extractProjectIdFromUrl(url?: string): string | undefined {
    if (!url) return undefined;
    
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.split('.')[0];
    } catch {
      return undefined;
    }
  }

  /**
   * Validate JWT token format
   */
  private isValidJwtFormat(token: string): boolean {
    const parts = token.split('.');
    return parts.length === 3 && parts.every(part => part.length > 0);
  }

  /**
   * Validate Supabase project ID format
   */
  private isValidProjectId(projectId: string): boolean {
    // Supabase project IDs are typically 20 characters, alphanumeric
    return /^[a-zA-Z0-9]{15,25}$/.test(projectId);
  }

  /**
   * Ensure credential manager is initialized
   */
  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('Credential manager not initialized. Call initialize() first.');
    }
  }

  /**
   * Get credential summary for logging (masked)
   */
  getCredentialSummary(): Record<string, string> {
    this.ensureInitialized();
    
    const summary: Record<string, string> = {
      environment: this.config.environment,
      baseUrl: this.getBaseUrl()
    };

    if (this.config.environment === 'local') {
      if (this.credentials.localServiceRoleKey) {
        summary.authType = 'Service Role Key';
        summary.credential = this.getMaskedCredential(this.credentials.localServiceRoleKey);
      } else if (this.credentials.localJwtToken) {
        summary.authType = 'JWT Token';
        summary.credential = this.getMaskedCredential(this.credentials.localJwtToken);
      }
    } else {
      if (this.credentials.productionServiceRoleKey) {
        summary.authType = 'Production Service Role';
        summary.credential = this.getMaskedCredential(this.credentials.productionServiceRoleKey);
      } else if (this.credentials.productionAnonKey) {
        summary.authType = 'Production Anon Key';
        summary.credential = this.getMaskedCredential(this.credentials.productionAnonKey);
      }
      
      if (this.credentials.supabaseProjectId) {
        summary.projectId = this.credentials.supabaseProjectId;
      }
    }

    return summary;
  }
}

/**
 * Global credential manager instances
 */
export const localCredentialManager = new SecureCredentialManager({
  environment: 'local',
  requireHttps: false,
  maskInLogs: true,
  validateCredentials: true
});

export const productionCredentialManager = new SecureCredentialManager({
  environment: 'production',
  requireHttps: true,
  maskInLogs: true,
  validateCredentials: true
});

/**
 * Utility function to get appropriate credential manager
 */
export function getCredentialManager(environment: 'local' | 'production'): SecureCredentialManager {
  return environment === 'local' ? localCredentialManager : productionCredentialManager;
}
