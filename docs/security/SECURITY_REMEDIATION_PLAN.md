# QuoteKit Security Remediation Plan - CRITICAL ISSUES

## 🎯 **GOAL:** Fix critical security vulnerabilities without breaking the application

---

## **PHASE 1: Safe Credential Rotation (24-48 hours)**

### **1.1 Pre-Remediation Backup**

**BEFORE MAKING ANY CHANGES:**

```bash
# 1. Create security-fixes branch
git checkout -b security/critical-fixes-phase1

# 2. Backup current fly.toml
cp fly.toml fly.toml.backup.$(date +%Y%m%d_%H%M%S)

# 3. Document current environment variables
fly secrets list > current-secrets-backup.txt

# 4. Create rollback script
cat > rollback-phase1.sh << 'EOF'
#!/bin/bash
echo "🚨 EMERGENCY ROLLBACK - PHASE 1"
git checkout formbricks/implementation
fly deploy --config fly.toml.backup.*
echo "✅ Rollback complete"
EOF
chmod +x rollback-phase1.sh
```

### **1.2 Safe Credential Rotation Steps**

**Step 1: Prepare New Secrets (NO DOWNTIME)**
```bash
# Generate new secrets (don't deploy yet)
# 1. Create new Supabase service role key in dashboard
# 2. Create new Stripe webhook secret in dashboard  
# 3. Create new Google OAuth credentials
# 4. Generate new strong database password
```

**Step 2: Gradual Secret Migration (ZERO DOWNTIME)**
```bash
# Add NEW secrets alongside existing ones (dual mode)
fly secrets set STRIPE_WEBHOOK_SECRET_NEW="whsec_NEW_SECRET"
fly secrets set SUPABASE_SERVICE_ROLE_KEY_NEW="NEW_KEY" 
fly secrets set GOOGLE_CLIENT_SECRET_NEW="NEW_SECRET"

# Deploy with fallback logic (keep old secrets working)
# Update code to try NEW secrets first, fallback to OLD
```

**Step 3: Update fly.toml Safely**
```bash
# Remove ONLY hardcoded secrets from fly.toml
# Keep all other environment variables
sed -i '/STRIPE_SECRET_KEY.*sk_test/d' fly.toml
sed -i '/STRIPE_WEBHOOK_SECRET.*whsec_/d' fly.toml
sed -i '/SUPABASE_SERVICE_ROLE_KEY.*eyJ/d' fly.toml
sed -i '/SUPABASE_DB_PASSWORD.*Luliflora/d' fly.toml
sed -i '/GOOGLE_CLIENT_SECRET.*GOCSPX/d' fly.toml

# Add placeholder comments for documentation
echo "# Secrets managed via 'fly secrets set' for security" >> fly.toml
```

**Step 4: Deploy and Validate**
```bash
# Deploy with monitoring
fly deploy --strategy=rolling

# Test all functionality immediately after deploy
./test-critical-functionality.sh

# If issues detected, rollback immediately
# ./rollback-phase1.sh
```

**Step 5: Remove Old Secrets (Only after validation)**
```bash
# ONLY after confirming new secrets work
fly secrets unset STRIPE_WEBHOOK_SECRET_OLD
fly secrets unset SUPABASE_SERVICE_ROLE_KEY_OLD
# ... etc
```

---

## **PHASE 2: Admin Security Enhancement (48-72 hours)**

### **2.1 Enhanced Admin Authorization (Safe Implementation)**

**Current State Analysis:**
- Admin check via `is_admin()` database function
- No MFA or additional security layers
- Missing audit logging

**Safe Implementation Plan:**

**Step 1: Add MFA Support (Non-Breaking)**
```typescript
// Create new optional MFA system alongside existing auth
// Users can enable MFA voluntarily first
// No forced MFA until after testing period
```

**Step 2: Enhanced Authorization Middleware**
```typescript
// Add additional admin verification layers
// Keep existing is_admin() as primary check
// Add secondary verification for critical operations
```

**Step 3: Comprehensive Audit Logging**
```sql
-- Create audit logging table (non-breaking)
CREATE TABLE admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  ip_address INET,
  user_agent TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  success BOOLEAN DEFAULT true,
  error_message TEXT
);
```

### **2.2 Regression Prevention for Admin Changes**

**Testing Strategy:**
```bash
# 1. Test existing admin functionality
npm run test:admin-integration

# 2. Test admin access with new security layers
npm run test:admin-security

# 3. Performance test with logging enabled
npm run test:admin-performance
```

**Rollback Strategy:**
```bash
# Immediate rollback if admin functionality breaks
git checkout formbricks/implementation -- src/app/\(admin\)/
fly deploy --strategy=immediate
```

---

## **PHASE 3: Replace Insecure Webhook Handler (Already Done!)**

### **✅ COMPLETED - Secure Webhook Implementation**

You've already implemented excellent webhook security in `route-secure.ts`:
- ✅ Early signature verification
- ✅ Rate limiting and timeout protection  
- ✅ Enhanced idempotency
- ✅ Security logging
- ✅ Input validation

**Next Step:** Replace the insecure handler
```bash
# Rename files safely
mv src/app/api/webhooks/stripe/route.ts src/app/api/webhooks/stripe/route-insecure.ts.backup
mv src/app/api/webhooks/stripe/route-secure.ts src/app/api/webhooks/stripe/route.ts

# Test webhook functionality
curl -X POST https://your-domain.com/api/webhooks/stripe \
  -H "stripe-signature: test" \
  -d '{"test": true}'
```

---

## **TESTING AND VALIDATION STRATEGY**

### **Critical Functionality Test Script**

```bash
#!/bin/bash
# test-critical-functionality.sh

echo "🧪 Testing critical functionality after security fixes..."

# Test 1: Authentication
echo "Testing authentication..."
curl -f "https://your-domain.com/api/auth/test" || exit 1

# Test 2: Subscription endpoints  
echo "Testing subscription endpoints..."
curl -f "https://your-domain.com/api/stripe/customer" || exit 1

# Test 3: Webhook endpoint
echo "Testing webhook security..."
curl -f "https://your-domain.com/api/webhooks/stripe" || exit 1

# Test 4: Admin access
echo "Testing admin functionality..."
curl -f "https://your-domain.com/admin/api/test" || exit 1

echo "✅ All critical tests passed!"
```

### **Monitoring and Alerting**

```bash
# Set up monitoring for security fixes
fly logs -a quotekit-app | grep "SECURITY\|ERROR\|CRITICAL" &

# Watch for error rate increases
fly metrics -a quotekit-app
```

---

## **EMERGENCY PROCEDURES**

### **If Something Breaks:**

1. **Immediate Assessment (< 2 minutes)**
   ```bash
   # Check application status
   curl -I https://your-domain.com/
   fly status
   ```

2. **Quick Rollback (< 5 minutes)**
   ```bash
   # Rollback to last working state
   git checkout formbricks/implementation
   fly deploy --strategy=immediate
   ```

3. **Communication**
   ```bash
   # Notify stakeholders
   echo "Security fix rollback initiated due to issues" | mail -s "QuoteKit Alert" team@company.com
   ```

### **Success Validation Checklist**

- [ ] Authentication works correctly
- [ ] Stripe webhooks process successfully  
- [ ] Admin functions operate normally
- [ ] No error rate increases in monitoring
- [ ] All secrets properly rotated
- [ ] No hardcoded credentials in codebase
- [ ] Security logging functioning
- [ ] Performance remains stable

---

## **POST-REMEDIATION VALIDATION**

### **Security Verification**
```bash
# Verify no secrets in codebase
grep -r "sk_test\|whsec_\|eyJ\|GOCSPX" . --exclude-dir=node_modules

# Test webhook security
# (Use Stripe CLI to send test webhooks)

# Verify admin security enhancements
# (Test admin access with new controls)
```

### **Performance Monitoring**
```bash
# Monitor for performance impacts
fly metrics --time=1h
# Watch error rates, response times, resource usage
```

---

## **TIMELINE**

- **Phase 1 (0-48h):** Credential rotation ⚠️ **CRITICAL**
- **Phase 2 (48-72h):** Admin security enhancement  
- **Phase 3 (✅ Done):** Secure webhook implementation
- **Ongoing:** Monitoring and validation

---

## **SUCCESS METRICS**

- ✅ Zero downtime during fixes
- ✅ All functionality preserved
- ✅ No performance degradation  
- ✅ Security vulnerabilities resolved
- ✅ Comprehensive audit trail
- ✅ Team confidence in security posture

---

**REMEMBER:** 
- One change at a time
- Test after each change  
- Keep rollback ready
- Monitor continuously
- Document everything