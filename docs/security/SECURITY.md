# Security Guidelines for Edge Functions Testing

## 🔐 **CREDENTIAL SECURITY OVERVIEW**

This document outlines security best practices for managing credentials in Edge Functions testing.

---

## 🚨 **CRITICAL SECURITY RULES**

### **1. NEVER Commit Credentials to Git**
```bash
# ❌ NEVER DO THIS
const JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'

# ✅ DO THIS INSTEAD
const JWT_TOKEN = Deno.env.get('TEST_JWT_TOKEN')
```

### **2. Use Environment Variables**
```bash
# Create .env.test (never committed)
TEST_JWT_TOKEN=your-actual-jwt-token
LOCAL_SERVICE_ROLE_KEY=your-service-role-key
```

### **3. Mask Credentials in Logs**
```typescript
// ❌ NEVER LOG FULL CREDENTIALS
console.log('Using token:', fullToken)

// ✅ MASK CREDENTIALS
console.log('Using token:', token.substring(0, 4) + '***')
```

---

## 🛡️ **SECURE CREDENTIAL MANAGEMENT**

### **Credential Manager Usage**

```typescript
import { localCredentialManager } from './tests/utils/credential-manager.ts';

// Initialize with security settings
await localCredentialManager.initialize();

// Get masked credentials for logging
const summary = localCredentialManager.getCredentialSummary();
console.log('Credentials:', summary); // Automatically masked

// Get auth header securely
const authHeader = localCredentialManager.getAuthHeader();
```

### **Environment Configuration**

**File: `.env.test` (NEVER commit this!)**
```bash
# Local Development (Safe for testing)
TEST_JWT_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
LOCAL_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Production (Use with extreme caution)
SUPABASE_PROJECT_ID=your-project-id
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Security Settings
MASK_CREDENTIALS_IN_LOGS=true
ENABLE_CREDENTIAL_VALIDATION=true
REQUIRE_HTTPS_IN_PRODUCTION=true
```

---

## 🔑 **CREDENTIAL TYPES & SECURITY LEVELS**

### **1. Local Development JWT Token**
- **Security Level**: Low (development only)
- **Usage**: Local testing with test user account
- **Expiration**: Short-lived (hours/days)
- **Risk**: Low (local environment only)

```bash
# Get from Supabase Studio
# Authentication > Users > [Test User] > Copy JWT
TEST_JWT_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### **2. Local Service Role Key**
- **Security Level**: Medium (local admin access)
- **Usage**: Local testing with admin privileges
- **Expiration**: Long-lived
- **Risk**: Medium (bypasses RLS locally)

```bash
# Get from local Supabase status
# supabase status | grep "service_role key"
LOCAL_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### **3. Production Anon Key**
- **Security Level**: Medium (public key)
- **Usage**: Production testing with user-level access
- **Expiration**: Long-lived
- **Risk**: Medium (public key, but RLS protected)

```bash
# Get from Supabase Dashboard > Settings > API
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### **4. Production Service Role Key**
- **Security Level**: HIGH (admin access)
- **Usage**: Production admin testing ONLY
- **Expiration**: Long-lived
- **Risk**: HIGH (bypasses all RLS, full database access)

```bash
# ⚠️ EXTREME CAUTION - Admin access to production!
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🔒 **SECURITY BEST PRACTICES**

### **1. Credential Rotation**
```bash
# Rotate test credentials regularly
# 1. Generate new JWT from test user
# 2. Update .env.test
# 3. Test all functions
# 4. Revoke old credentials if possible
```

### **2. Environment Separation**
```typescript
// Different credentials for different environments
const credentialManager = environment === 'local' 
  ? localCredentialManager 
  : productionCredentialManager;
```

### **3. Validation & Testing**
```typescript
// Validate credentials before use
await credentialManager.initialize(); // Includes validation

// Test credentials with simple request
const isValid = await credentialManager.testCredential();
```

### **4. Logging Security**
```typescript
// ✅ SECURE LOGGING
console.log('Auth type:', credentialManager.getAuthType());
console.log('Credential:', credentialManager.getMaskedCredential());

// ❌ INSECURE LOGGING
console.log('Full token:', rawToken); // NEVER DO THIS
```

---

## 🚨 **INCIDENT RESPONSE**

### **If Credentials Are Exposed:**

1. **Immediate Actions:**
   ```bash
   # 1. Revoke exposed credentials immediately
   # 2. Generate new credentials
   # 3. Update .env.test with new credentials
   # 4. Test all functions with new credentials
   ```

2. **Git History Cleanup:**
   ```bash
   # If credentials were committed to git
   git filter-branch --force --index-filter \
     'git rm --cached --ignore-unmatch .env.test' \
     --prune-empty --tag-name-filter cat -- --all
   
   # Force push to remove from remote
   git push origin --force --all
   ```

3. **Audit & Review:**
   - Check access logs for unauthorized usage
   - Review all recent database changes
   - Update security procedures

---

## 📋 **SECURITY CHECKLIST**

### **Before Testing:**
- [ ] ✅ .env.test file created and configured
- [ ] ✅ .env.test is in .gitignore
- [ ] ✅ Credentials are environment-appropriate (dev/prod)
- [ ] ✅ Credential masking is enabled
- [ ] ✅ HTTPS required for production testing

### **During Testing:**
- [ ] ✅ Monitor logs for credential exposure
- [ ] ✅ Use least-privilege credentials
- [ ] ✅ Test with realistic but safe data
- [ ] ✅ Validate credential functionality

### **After Testing:**
- [ ] ✅ No credentials in test output/logs
- [ ] ✅ No credentials committed to git
- [ ] ✅ Test credentials rotated if needed
- [ ] ✅ Production credentials secured

---

## 🛠️ **SECURE SETUP COMMANDS**

### **Quick Secure Setup:**
```bash
# Run secure setup script
./scripts/setup-secure-testing.sh

# This will:
# 1. Create .env.test with secure defaults
# 2. Extract local Supabase credentials
# 3. Validate credential manager
# 4. Test secure credential loading
```

### **Manual Secure Setup:**
```bash
# 1. Copy example environment file
cp .env.test.example .env.test

# 2. Get local credentials
supabase status | grep "service_role key"

# 3. Update .env.test with actual credentials
# 4. Test credential loading
deno run --allow-all tests/realistic-local-tests.ts --health-check
```

---

## 🔍 **SECURITY MONITORING**

### **Credential Usage Monitoring:**
```typescript
// Monitor credential usage in tests
const credentialManager = getCredentialManager('local');
await credentialManager.initialize();

// Log credential summary (masked)
console.log('Credential summary:', credentialManager.getCredentialSummary());
```

### **Security Validation:**
```typescript
// Validate security settings
const securityCheck = {
  credentialsMasked: credentialManager.config.maskInLogs,
  httpsRequired: credentialManager.config.requireHttps,
  validationEnabled: credentialManager.config.validateCredentials
};

console.log('Security settings:', securityCheck);
```

---

## 📚 **RELATED DOCUMENTATION**

- [Testing Strategy](./edge-functions/testing-strategy.md) - Complete testing approach
- [Implementation Guide](./edge-functions/implementation-guide.md) - Technical implementation
- [.env.test.example](./.env.test.example) - Secure environment template

---

## 🎯 **SECURITY SUMMARY**

**✅ SECURE PRACTICES:**
- Environment-based credential management
- Automatic credential masking in logs
- Validation and testing of credentials
- Separation of dev/prod credentials
- Git protection with .gitignore

**❌ AVOID:**
- Hardcoded credentials in source code
- Committing .env.test to git
- Using production service role keys unnecessarily
- Logging full credentials
- Sharing credentials in plain text

**🔐 Remember: Security is not optional - protect your credentials like your production data depends on it (because it does)!**
