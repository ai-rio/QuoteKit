# /validate-security

Comprehensive security validation for QuoteKit landscaping SaaS:

1. **Secret Scanning**: Check for exposed credentials and keys
   ```bash
   bun run security:audit
   gitleaks detect --source . --verbose
   ```

2. **Vulnerability Scanning**: Check dependencies and containers
   ```bash
   trivy fs . --severity HIGH,CRITICAL
   bunx audit
   ```

3. **Database Security**: Verify RLS policies on all tables
   ```bash
   # Test Row Level Security for quotes, assessments, clients, payments
   bun test --grep="RLS.*policy" --verbose
   ```

4. **Stripe Webhook Security**: Validate signature verification
   ```bash
   bun run stripe:check
   bun test --grep="stripe.*webhook.*signature"
   ```

5. **Authentication Flow**: Test Supabase auth with magic links
   ```bash
   bun test --grep="auth.*magic.*link" 
   bun run test:e2e -- --grep="login.*passwordless"
   ```

6. **API Route Protection**: Verify endpoint security
   ```bash
   bun test src/app/api/ --grep="auth.*protection"
   ```

7. **Input Validation**: Test Zod schema validation
   ```bash
   bun test --grep="validation.*schema.*zod"
   ```

8. **Environment Security**: Check .env configuration
   ```bash
   echo "🔒 Validating environment variable security"
   [ -f .env.local ] && echo "✅ Local env exists" || echo "⚠️ No .env.local found"
   ```