# Security Review: Payment & Subscription Implementation

## Executive Summary

This document provides a comprehensive security review of QuoteKit's payment and subscription implementation, focusing on PCI compliance, sensitive data handling, and defensive security practices. The analysis covers database schema, API endpoints, webhook processing, and data isolation mechanisms.

## Current Implementation Assessment

### ✅ Strengths Identified
- Proper use of Stripe for PCI-compliant payment processing
- Row Level Security (RLS) policies implemented
- Webhook signature verification in place
- Service role segregation for automated processes
- Proper database constraints and foreign key relationships

### ⚠️ Critical Security Gaps
- Missing comprehensive audit logging
- Insufficient rate limiting on payment endpoints
- Webhook endpoint security could be enhanced
- No encryption at rest for sensitive metadata
- Missing comprehensive input validation
- Insufficient monitoring and alerting

## 1. PCI Compliance Considerations

### Current State
- ✅ Uses Stripe for payment processing (PCI Level 1 compliant)
- ✅ No card data stored in local database
- ✅ Only payment method metadata stored locally

### Required Enhancements

#### 1.1 Secure Data Storage
```sql
-- Enhance payment_methods table with better security
ALTER TABLE payment_methods 
ADD COLUMN encrypted_metadata bytea,
ADD COLUMN data_classification text DEFAULT 'sensitive' CHECK (data_classification IN ('public', 'internal', 'confidential', 'sensitive'));

-- Add encryption trigger for sensitive metadata
CREATE OR REPLACE FUNCTION encrypt_payment_metadata()
RETURNS TRIGGER AS $$
BEGIN
  -- Encrypt sensitive metadata before storage
  IF NEW.metadata IS NOT NULL THEN
    NEW.encrypted_metadata = pgp_sym_encrypt(NEW.metadata::text, current_setting('app.encryption_key'));
    NEW.metadata = NULL; -- Clear plaintext
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_encrypt_payment_metadata
  BEFORE INSERT OR UPDATE ON payment_methods
  FOR EACH ROW EXECUTE FUNCTION encrypt_payment_metadata();
```

#### 1.2 Access Logging
```sql
-- Create comprehensive audit log table
CREATE TABLE security_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  table_name text NOT NULL,
  user_id uuid REFERENCES auth.users(id),
  record_id text NOT NULL,
  old_values jsonb,
  new_values jsonb,
  ip_address inet,
  user_agent text,
  session_id text,
  timestamp timestamptz DEFAULT now() NOT NULL,
  risk_level text DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical'))
);

-- RLS for audit log (admin only)
ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_log_admin_only" ON security_audit_log
  FOR ALL TO service_role USING (true);

-- Audit trigger for sensitive tables
CREATE OR REPLACE FUNCTION log_sensitive_operations()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO security_audit_log (
    event_type,
    table_name,
    user_id,
    record_id,
    old_values,
    new_values,
    risk_level
  ) VALUES (
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(auth.uid(), (current_setting('request.jwt.claims', true)::json->>'sub')::uuid),
    COALESCE(NEW.id, OLD.id)::text,
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN to_jsonb(NEW) ELSE NULL END,
    CASE TG_TABLE_NAME 
      WHEN 'payment_methods' THEN 'high'
      WHEN 'subscriptions' THEN 'medium'
      ELSE 'low'
    END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit triggers
CREATE TRIGGER audit_payment_methods 
  AFTER INSERT OR UPDATE OR DELETE ON payment_methods
  FOR EACH ROW EXECUTE FUNCTION log_sensitive_operations();

CREATE TRIGGER audit_subscriptions 
  AFTER INSERT OR UPDATE OR DELETE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION log_sensitive_operations();

CREATE TRIGGER audit_stripe_customers 
  AFTER INSERT OR UPDATE OR DELETE ON stripe_customers
  FOR EACH ROW EXECUTE FUNCTION log_sensitive_operations();
```

## 2. Sensitive Data Handling

### Current Implementation Issues
- Payment method metadata stored in plaintext
- No field-level encryption
- Insufficient data masking in logs

### Required Security Enhancements

#### 2.1 Field-Level Encryption
```typescript
// src/utils/encryption.ts
import crypto from 'crypto';

export class FieldEncryption {
  private static algorithm = 'aes-256-gcm';
  private static keyLength = 32;
  
  static encrypt(data: string, key: string): { encrypted: string; iv: string; tag: string } {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.algorithm, key);
    cipher.setAAD(Buffer.from('QuoteKit-Payment-Data'));
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex')
    };
  }
  
  static decrypt(encryptedData: { encrypted: string; iv: string; tag: string }, key: string): string {
    const decipher = crypto.createDecipher(this.algorithm, key);
    decipher.setAAD(Buffer.from('QuoteKit-Payment-Data'));
    decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}

// Enhanced payment method handler with encryption
export class SecurePaymentMethodHandler {
  private static encryptionKey = process.env.PAYMENT_ENCRYPTION_KEY!;
  
  static async savePaymentMethod(paymentMethod: Stripe.PaymentMethod, userId: string) {
    // Encrypt sensitive card data
    const sensitiveData = {
      last4: paymentMethod.card?.last4,
      brand: paymentMethod.card?.brand,
      exp_month: paymentMethod.card?.exp_month,
      exp_year: paymentMethod.card?.exp_year
    };
    
    const encrypted = FieldEncryption.encrypt(
      JSON.stringify(sensitiveData), 
      this.encryptionKey
    );
    
    return supabaseAdminClient
      .from('payment_methods')
      .upsert({
        id: paymentMethod.id,
        user_id: userId,
        type: paymentMethod.type,
        encrypted_card_data: encrypted,
        // Store only non-sensitive display data in plaintext
        display_brand: paymentMethod.card?.brand,
        display_last4: paymentMethod.card?.last4,
        is_default: false
      });
  }
}
```

#### 2.2 Data Masking and Sanitization
```typescript
// src/utils/data-sanitizer.ts
export class DataSanitizer {
  static maskCreditCard(cardNumber: string): string {
    return cardNumber.replace(/\d(?=\d{4})/g, '*');
  }
  
  static maskEmail(email: string): string {
    const [user, domain] = email.split('@');
    const maskedUser = user.charAt(0) + '*'.repeat(user.length - 2) + user.charAt(user.length - 1);
    return `${maskedUser}@${domain}`;
  }
  
  static sanitizeLogData(data: any): any {
    const sensitiveFields = ['card_number', 'cvv', 'ssn', 'password', 'token'];
    
    if (typeof data === 'object' && data !== null) {
      const sanitized = { ...data };
      
      for (const field of sensitiveFields) {
        if (sanitized[field]) {
          sanitized[field] = '[REDACTED]';
        }
      }
      
      // Recursively sanitize nested objects
      for (const key in sanitized) {
        if (typeof sanitized[key] === 'object') {
          sanitized[key] = this.sanitizeLogData(sanitized[key]);
        }
      }
      
      return sanitized;
    }
    
    return data;
  }
}
```

## 3. Row Level Security (RLS) Policies Enhancement

### Current RLS Analysis
The current implementation has basic RLS policies but needs enhancement for defense in depth.

#### 3.1 Enhanced RLS Policies
```sql
-- Enhanced subscription policies with additional security checks
DROP POLICY IF EXISTS "subscriptions_own_data" ON subscriptions;

CREATE POLICY "subscriptions_user_access" ON subscriptions
  FOR ALL USING (
    auth.uid() = user_id 
    AND auth.jwt() ->> 'email_verified' = 'true'
    AND (current_setting('request.jwt.claims', true)::json ->> 'aal')::text = 'aal1'
  );

-- Time-based access restrictions
CREATE POLICY "subscriptions_business_hours" ON subscriptions
  FOR UPDATE USING (
    EXTRACT(hour FROM now() AT TIME ZONE 'UTC') BETWEEN 6 AND 22
    OR auth.role() = 'service_role'
  );

-- Geo-location based restrictions (if available)
CREATE POLICY "subscriptions_geo_restriction" ON subscriptions
  FOR ALL USING (
    current_setting('request.headers.cf-ipcountry', true) IN ('US', 'CA', 'GB', 'AU')
    OR auth.role() = 'service_role'
  );

-- Enhanced customer data policies
CREATE POLICY "customers_secure_access" ON stripe_customers
  FOR ALL USING (
    auth.uid() = user_id
    AND auth.jwt() ->> 'email_verified' = 'true'
    AND NOT EXISTS (
      SELECT 1 FROM security_audit_log 
      WHERE user_id = auth.uid() 
      AND event_type = 'SUSPICIOUS_ACTIVITY' 
      AND timestamp > now() - INTERVAL '1 hour'
    )
  );

-- Payment methods with additional validation
CREATE POLICY "payment_methods_validated_access" ON payment_methods
  FOR ALL USING (
    auth.uid() = user_id
    AND auth.jwt() ->> 'email_verified' = 'true'
    AND (
      SELECT status FROM subscriptions 
      WHERE user_id = auth.uid() 
      AND status IN ('active', 'trialing')
      LIMIT 1
    ) IS NOT NULL
  );
```

#### 3.2 Company-Level Data Isolation
```sql
-- Add company context to user data
ALTER TABLE users ADD COLUMN company_id uuid REFERENCES companies(id);
ALTER TABLE subscriptions ADD COLUMN company_id uuid REFERENCES companies(id);

-- Company-level RLS
CREATE POLICY "company_data_isolation" ON subscriptions
  FOR ALL USING (
    company_id = (auth.jwt() ->> 'company_id')::uuid
    OR auth.uid() = user_id  -- Individual users can still see their own
  );

-- Cross-company data access prevention
CREATE OR REPLACE FUNCTION prevent_cross_company_access()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.company_id != (auth.jwt() ->> 'company_id')::uuid 
     AND auth.role() != 'service_role' THEN
    RAISE EXCEPTION 'Cross-company data access denied';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## 4. Webhook Security Enhancement

### Current Issues
- Basic signature verification
- No rate limiting
- Insufficient error handling
- Missing replay attack protection

#### 4.1 Enhanced Webhook Security
```typescript
// src/app/api/webhooks/stripe/enhanced-route.ts
import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

// Rate limiting store (use Redis in production)
const webhookRateLimit = new Map<string, { count: number; resetTime: number }>();

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();
  
  try {
    // Enhanced security headers validation
    const securityHeaders = await validateSecurityHeaders(request);
    if (!securityHeaders.valid) {
      return NextResponse.json(
        { error: 'Security validation failed', requestId },
        { status: 403 }
      );
    }
    
    // Rate limiting
    const rateLimitResult = await checkRateLimit(request);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', requestId },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }
    
    // Enhanced signature verification
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');
    
    if (!signature) {
      await logSecurityEvent('MISSING_WEBHOOK_SIGNATURE', { requestId });
      return NextResponse.json(
        { error: 'Missing signature', requestId },
        { status: 400 }
      );
    }
    
    // Multiple signature verification methods
    const verificationResult = await verifyWebhookSignature(body, signature);
    if (!verificationResult.valid) {
      await logSecurityEvent('INVALID_WEBHOOK_SIGNATURE', {
        requestId,
        error: verificationResult.error,
        ip: request.ip
      });
      return NextResponse.json(
        { error: 'Invalid signature', requestId },
        { status: 400 }
      );
    }
    
    const event = verificationResult.event;
    
    // Replay attack protection
    const replayCheck = await checkReplayAttack(event);
    if (!replayCheck.valid) {
      await logSecurityEvent('WEBHOOK_REPLAY_ATTACK', {
        eventId: event.id,
        requestId
      });
      return NextResponse.json(
        { error: 'Replay attack detected', requestId },
        { status: 400 }
      );
    }
    
    // Enhanced event processing with circuit breaker
    const processingResult = await processWebhookWithCircuitBreaker(event, requestId);
    
    // Security monitoring
    await logWebhookProcessing({
      eventId: event.id,
      eventType: event.type,
      requestId,
      processingTime: Date.now() - startTime,
      success: processingResult.success,
      ip: request.ip,
      userAgent: request.headers.get('user-agent')
    });
    
    return NextResponse.json({
      received: true,
      eventId: event.id,
      requestId,
      processingTime: Date.now() - startTime
    });
    
  } catch (error) {
    await logSecurityEvent('WEBHOOK_PROCESSING_ERROR', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json(
      { error: 'Processing failed', requestId },
      { status: 500 }
    );
  }
}

async function validateSecurityHeaders(request: NextRequest): Promise<{ valid: boolean; reason?: string }> {
  const userAgent = request.headers.get('user-agent');
  const contentType = request.headers.get('content-type');
  
  // Validate User-Agent (Stripe webhooks have specific patterns)
  if (!userAgent || !userAgent.includes('Stripe/')) {
    return { valid: false, reason: 'Invalid User-Agent' };
  }
  
  // Validate Content-Type
  if (contentType !== 'application/json') {
    return { valid: false, reason: 'Invalid Content-Type' };
  }
  
  // Check for suspicious headers
  const suspiciousHeaders = ['x-forwarded-for', 'x-real-ip'];
  for (const header of suspiciousHeaders) {
    const value = request.headers.get(header);
    if (value && !isAllowedIP(value)) {
      return { valid: false, reason: `Suspicious ${header}: ${value}` };
    }
  }
  
  return { valid: true };
}

async function checkRateLimit(request: NextRequest): Promise<{ allowed: boolean; resetTime?: number }> {
  const ip = request.ip || 'unknown';
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 100; // Max 100 requests per minute per IP
  
  const current = webhookRateLimit.get(ip);
  
  if (!current || now > current.resetTime) {
    webhookRateLimit.set(ip, { count: 1, resetTime: now + windowMs });
    return { allowed: true };
  }
  
  if (current.count >= maxRequests) {
    return { allowed: false, resetTime: current.resetTime };
  }
  
  current.count++;
  return { allowed: true };
}

async function verifyWebhookSignature(body: string, signature: string) {
  try {
    // Get webhook secret from secure storage
    const { data: configData } = await supabaseAdminClient
      .from('admin_settings')
      .select('value')
      .eq('key', 'stripe_config')
      .single();
    
    const config = configData?.value as any;
    if (!config?.webhook_secret) {
      return { valid: false, error: 'Webhook secret not configured' };
    }
    
    // Verify with multiple tolerance levels for clock skew
    const stripe = createStripeAdminClient(config);
    const tolerances = [300, 600, 900]; // 5, 10, 15 minutes
    
    for (const tolerance of tolerances) {
      try {
        const event = stripe.webhooks.constructEvent(body, signature, config.webhook_secret, tolerance);
        return { valid: true, event };
      } catch (error) {
        continue; // Try next tolerance level
      }
    }
    
    return { valid: false, error: 'Signature verification failed with all tolerance levels' };
    
  } catch (error) {
    return { valid: false, error: error instanceof Error ? error.message : 'Unknown verification error' };
  }
}

async function checkReplayAttack(event: Stripe.Event): Promise<{ valid: boolean; reason?: string }> {
  const eventAge = Date.now() - event.created * 1000;
  const maxAgeMs = 10 * 60 * 1000; // 10 minutes
  
  // Check if event is too old
  if (eventAge > maxAgeMs) {
    return { valid: false, reason: `Event too old: ${eventAge}ms` };
  }
  
  // Check if event was already processed recently
  const { data: recentEvent } = await supabaseAdminClient
    .from('webhook_events')
    .select('processed_at')
    .eq('stripe_event_id', event.id)
    .gte('created_at', new Date(Date.now() - maxAgeMs).toISOString())
    .single();
  
  if (recentEvent?.processed_at) {
    return { valid: false, reason: 'Event already processed recently' };
  }
  
  return { valid: true };
}
```

## 5. API Endpoint Protection

### Current Gaps
- Missing comprehensive input validation
- No API rate limiting
- Insufficient error handling
- Missing request size limits

#### 5.1 Enhanced API Security Middleware
```typescript
// src/middleware/security.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export class APISecurityMiddleware {
  static async validateRequest(
    request: NextRequest,
    schema: z.ZodSchema,
    options: {
      maxBodySize?: number;
      requiredHeaders?: string[];
      rateLimitKey?: string;
    } = {}
  ) {
    try {
      // Check request size
      const maxSize = options.maxBodySize || 1024 * 1024; // 1MB default
      const contentLength = request.headers.get('content-length');
      if (contentLength && parseInt(contentLength) > maxSize) {
        return NextResponse.json(
          { error: 'Request too large' },
          { status: 413 }
        );
      }
      
      // Check required headers
      if (options.requiredHeaders) {
        for (const header of options.requiredHeaders) {
          if (!request.headers.get(header)) {
            return NextResponse.json(
              { error: `Missing required header: ${header}` },
              { status: 400 }
            );
          }
        }
      }
      
      // Rate limiting
      if (options.rateLimitKey) {
        const rateLimitResult = await this.checkAPIRateLimit(
          request,
          options.rateLimitKey
        );
        if (!rateLimitResult.allowed) {
          return NextResponse.json(
            { error: 'Rate limit exceeded' },
            { status: 429, headers: { 'Retry-After': '60' } }
          );
        }
      }
      
      // Validate request body
      const body = await request.json();
      const validatedData = schema.parse(body);
      
      return { valid: true, data: validatedData };
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { 
            error: 'Validation failed',
            details: error.errors
          },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { error: 'Invalid request' },
        { status: 400 }
      );
    }
  }
  
  private static async checkAPIRateLimit(
    request: NextRequest,
    key: string
  ): Promise<{ allowed: boolean }> {
    // Implement API rate limiting logic
    // This would typically use Redis in production
    const userId = request.headers.get('user-id');
    const ip = request.ip || 'unknown';
    const rateLimitKey = `api:${key}:${userId || ip}`;
    
    // Simple in-memory rate limiting (use Redis in production)
    // Implementation details...
    
    return { allowed: true };
  }
}

// Enhanced subscription API endpoint
export async function POST(request: NextRequest) {
  const subscriptionSchema = z.object({
    priceId: z.string().min(1).max(255),
    paymentMethodId: z.string().optional(),
    couponId: z.string().optional()
  });
  
  const validation = await APISecurityMiddleware.validateRequest(
    request,
    subscriptionSchema,
    {
      maxBodySize: 1024 * 10, // 10KB
      requiredHeaders: ['authorization', 'content-type'],
      rateLimitKey: 'subscription_create'
    }
  );
  
  if (!validation.valid) {
    return validation; // Return the error response
  }
  
  // Process validated request...
}
```

## 6. Data Isolation Between Users/Companies

### Enhanced Multi-Tenancy Security
```sql
-- Company-based data isolation with RLS
CREATE TABLE companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  domain text UNIQUE NOT NULL,
  subscription_plan text DEFAULT 'free',
  security_settings jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Enhanced user table with company context  
ALTER TABLE users ADD COLUMN company_id uuid REFERENCES companies(id);
ALTER TABLE users ADD COLUMN role text DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member'));
ALTER TABLE users ADD COLUMN permissions jsonb DEFAULT '{}';

-- Company-level RLS policies
CREATE POLICY "company_isolation_subscriptions" ON subscriptions
  FOR ALL USING (
    -- Users can only access their company's subscriptions
    company_id = (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
    -- Or service role for system operations
    OR auth.role() = 'service_role'
  );

CREATE POLICY "company_isolation_payment_methods" ON payment_methods
  FOR ALL USING (
    user_id IN (
      SELECT id FROM users 
      WHERE company_id = (
        SELECT company_id FROM users WHERE id = auth.uid()
      )
    )
    OR auth.role() = 'service_role'
  );

-- Prevent data leakage between companies
CREATE OR REPLACE FUNCTION enforce_company_boundary()
RETURNS TRIGGER AS $$
DECLARE
  user_company_id uuid;
  target_company_id uuid;
BEGIN
  -- Get user's company
  SELECT company_id INTO user_company_id 
  FROM users WHERE id = auth.uid();
  
  -- Get target record's company
  SELECT company_id INTO target_company_id
  FROM companies c
  JOIN users u ON c.id = u.company_id
  WHERE u.id = COALESCE(NEW.user_id, OLD.user_id);
  
  -- Enforce boundary
  IF user_company_id != target_company_id AND auth.role() != 'service_role' THEN
    RAISE EXCEPTION 'Company boundary violation detected';
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## 7. Audit Logging for Financial Operations

### Comprehensive Audit System
```sql
-- Enhanced audit logging with financial focus
CREATE TYPE audit_category AS ENUM (
  'authentication',
  'payment',
  'subscription',
  'billing',
  'security',
  'admin'
);

CREATE TABLE financial_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category audit_category NOT NULL,
  event_type text NOT NULL,
  user_id uuid REFERENCES auth.users(id),
  company_id uuid REFERENCES companies(id),
  resource_type text NOT NULL,
  resource_id text NOT NULL,
  amount_cents integer,
  currency text,
  old_values jsonb,
  new_values jsonb,
  metadata jsonb DEFAULT '{}',
  ip_address inet,
  user_agent text,
  session_id text,
  request_id text,
  risk_score integer DEFAULT 0 CHECK (risk_score BETWEEN 0 AND 100),
  created_at timestamptz DEFAULT now(),
  
  -- Indexes for performance
  INDEX idx_financial_audit_user_time (user_id, created_at),
  INDEX idx_financial_audit_category_time (category, created_at),
  INDEX idx_financial_audit_risk (risk_score, created_at),
  INDEX idx_financial_audit_resource (resource_type, resource_id)
);

-- Immutable audit log (prevent tampering)
ALTER TABLE financial_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_log_insert_only" ON financial_audit_log
  FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "audit_log_read_admin" ON financial_audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('owner', 'admin')
      AND company_id = financial_audit_log.company_id
    )
  );

-- Audit trigger function
CREATE OR REPLACE FUNCTION log_financial_operation()
RETURNS TRIGGER AS $$
DECLARE
  user_company_id uuid;
  amount_value integer;
  risk_score_value integer := 0;
BEGIN
  -- Get user's company
  SELECT company_id INTO user_company_id 
  FROM users WHERE id = auth.uid();
  
  -- Calculate risk score based on operation
  IF TG_TABLE_NAME = 'payment_methods' THEN
    risk_score_value := 30;
  ELSIF TG_TABLE_NAME = 'subscriptions' THEN
    risk_score_value := 50;
    -- Extract amount from subscription data
    amount_value := (NEW.metadata->>'amount_cents')::integer;
  END IF;
  
  -- Log the operation
  INSERT INTO financial_audit_log (
    category,
    event_type,
    user_id,
    company_id,
    resource_type,
    resource_id,
    amount_cents,
    old_values,
    new_values,
    risk_score,
    ip_address,
    user_agent,
    request_id
  ) VALUES (
    CASE TG_TABLE_NAME
      WHEN 'payment_methods' THEN 'payment'
      WHEN 'subscriptions' THEN 'subscription'
      ELSE 'billing'
    END,
    TG_OP,
    auth.uid(),
    user_company_id,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id)::text,
    amount_value,
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN to_jsonb(NEW) ELSE NULL END,
    risk_score_value,
    inet_client_addr(),
    current_setting('request.headers.user-agent', true),
    current_setting('request.id', true)
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply financial audit triggers
CREATE TRIGGER audit_payment_methods_financial
  AFTER INSERT OR UPDATE OR DELETE ON payment_methods
  FOR EACH ROW EXECUTE FUNCTION log_financial_operation();

CREATE TRIGGER audit_subscriptions_financial
  AFTER INSERT OR UPDATE OR DELETE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION log_financial_operation();
```

## 8. Monitoring and Alerting

### Security Monitoring System
```typescript
// src/utils/security-monitor.ts
export class SecurityMonitor {
  static async detectAnomalies(userId: string, operation: string, metadata: any) {
    const anomalies = [];
    
    // Check for unusual payment patterns
    if (operation === 'payment_method_create') {
      const recentPaymentMethods = await this.getRecentPaymentMethods(userId, '1 hour');
      if (recentPaymentMethods.length > 5) {
        anomalies.push({
          type: 'EXCESSIVE_PAYMENT_METHOD_CREATION',
          severity: 'HIGH',
          details: { count: recentPaymentMethods.length, timeframe: '1 hour' }
        });
      }
    }
    
    // Check for subscription changes from unusual locations
    if (operation === 'subscription_update') {
      const userLocation = await this.getUserLocation(userId);
      const requestLocation = metadata.ip_address;
      
      if (this.calculateDistance(userLocation, requestLocation) > 1000) {
        anomalies.push({
          type: 'UNUSUAL_LOCATION_SUBSCRIPTION_CHANGE',
          severity: 'MEDIUM',
          details: { userLocation, requestLocation }
        });
      }
    }
    
    // Alert on anomalies
    for (const anomaly of anomalies) {
      await this.sendSecurityAlert(userId, anomaly);
    }
    
    return anomalies;
  }
  
  private static async sendSecurityAlert(userId: string, anomaly: any) {
    // Implementation for sending alerts (email, Slack, etc.)
    console.log(`Security Alert for user ${userId}:`, anomaly);
    
    // Store alert in database
    await supabaseAdminClient
      .from('security_alerts')
      .insert({
        user_id: userId,
        alert_type: anomaly.type,
        severity: anomaly.severity,
        details: anomaly.details,
        created_at: new Date().toISOString()
      });
  }
}
```

## 9. Environment Security

### Secure Configuration Management
```typescript
// src/config/security-config.ts
export class SecurityConfig {
  private static requiredEnvVars = [
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'SUPABASE_SERVICE_ROLE_KEY',
    'PAYMENT_ENCRYPTION_KEY',
    'JWT_SECRET'
  ];
  
  static validateEnvironment() {
    const missing = this.requiredEnvVars.filter(
      variable => !process.env[variable]
    );
    
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
    
    // Validate key strengths
    this.validateKeyStrength('PAYMENT_ENCRYPTION_KEY', 32);
    this.validateKeyStrength('JWT_SECRET', 32);
  }
  
  private static validateKeyStrength(keyName: string, minLength: number) {
    const key = process.env[keyName]!;
    if (key.length < minLength) {
      throw new Error(`${keyName} must be at least ${minLength} characters long`);
    }
  }
  
  static getSecureConfig() {
    this.validateEnvironment();
    
    return {
      stripe: {
        secretKey: process.env.STRIPE_SECRET_KEY!,
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
        publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
      },
      encryption: {
        paymentKey: process.env.PAYMENT_ENCRYPTION_KEY!
      },
      security: {
        jwtSecret: process.env.JWT_SECRET!,
        bcryptRounds: 12
      }
    };
  }
}
```

## 10. Implementation Checklist

### Immediate Actions (Week 1)
- [ ] Implement comprehensive audit logging
- [ ] Add field-level encryption for payment metadata
- [ ] Enhance webhook signature verification
- [ ] Add rate limiting to payment endpoints
- [ ] Implement data sanitization in logs

### Short Term (Weeks 2-4)
- [ ] Deploy enhanced RLS policies
- [ ] Implement company-level data isolation
- [ ] Add security monitoring and alerting
- [ ] Enhance input validation across all endpoints
- [ ] Implement replay attack protection

### Medium Term (Months 2-3)
- [ ] Complete PCI compliance assessment
- [ ] Implement comprehensive security testing
- [ ] Add fraud detection algorithms
- [ ] Deploy advanced monitoring and analytics
- [ ] Conduct security penetration testing

### Ongoing
- [ ] Regular security audits (monthly)
- [ ] Compliance monitoring and reporting
- [ ] Security training for development team
- [ ] Incident response plan testing
- [ ] Continuous security monitoring

## 11. Compliance Requirements

### PCI DSS Requirements Met
- ✅ Use approved payment processor (Stripe)
- ✅ No card data storage
- ✅ Secure transmission of payment data
- ⚠️ Need to complete: Regular security testing
- ⚠️ Need to complete: Comprehensive logging and monitoring

### GDPR/Privacy Requirements
- ✅ Data minimization (only store necessary payment metadata)
- ✅ Right to erasure (delete payment methods)
- ⚠️ Need to complete: Data protection impact assessment
- ⚠️ Need to complete: Privacy policy updates

## Conclusion

The current payment and subscription implementation has a solid foundation but requires significant security enhancements to meet enterprise security standards. The recommendations provided focus on defense in depth, with multiple layers of security controls to protect sensitive financial data.

Priority should be given to implementing comprehensive audit logging, enhancing webhook security, and adding proper data encryption before moving to production with real financial transactions.

Regular security assessments and compliance monitoring should be implemented to ensure ongoing security posture maintenance.