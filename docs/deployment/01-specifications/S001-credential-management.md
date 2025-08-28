# Secure Credential Management Guide
**QuoteKit Production Deployment Security**

## 🔐 **Security-First Approach**

**NEVER** put production credentials directly in your codebase. Follow this secure approach:

## **Step 1: Create Production Supabase Project**

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard
2. **Create New Project**:
   - Organization: Choose your organization
   - Project Name: `quotekit-production`
   - Database Password: Generate a strong password (save securely)
   - Region: Choose closest to your users

3. **Collect Credentials** (from Project Settings → API):
   ```
   Project URL: https://YOUR_PROJECT_REF.supabase.co
   Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   Service Role Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

## **Step 2: Secure Local Testing (Optional)**

If you want to test with production credentials locally:

```bash
# Copy the production template
cp .env.production.example .env.production

# Edit with your actual production values
nano .env.production
```

**⚠️ IMPORTANT**: 
- `.env.production` is already in `.gitignore` 
- NEVER commit this file to version control
- Only use for local testing before deployment

## **Step 3: Configure Deployment Platform**

### **For Fly.io Deployment:**

```bash
# Set production secrets (recommended approach)
fly secrets set NEXT_PUBLIC_SUPABASE_URL="https://YOUR_PROJECT_REF.supabase.co"
fly secrets set NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
fly secrets set SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
fly secrets set SUPABASE_DB_PASSWORD="your-db-password"

# Stripe production keys
fly secrets set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_your-key"
fly secrets set STRIPE_SECRET_KEY="sk_live_your-key"
fly secrets set STRIPE_WEBHOOK_SECRET="whsec_your-secret"

# Email service
fly secrets set RESEND_API_KEY="re_your-production-key"

# Application config
fly secrets set NEXT_PUBLIC_SITE_URL="https://your-domain.com"
fly secrets set NODE_ENV="production"

# Verify secrets are set
fly secrets list
```

### **For Vercel Deployment:**

```bash
# Using Vercel CLI
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
# ... add all other variables

# Or use Vercel Dashboard:
# 1. Go to your project settings
# 2. Navigate to Environment Variables
# 3. Add each variable for Production environment
```

### **For Other Platforms:**

Follow your platform's secure environment variable configuration:
- **Railway**: Use environment variables in dashboard
- **Render**: Use environment variables in service settings
- **DigitalOcean App Platform**: Use environment variables in app spec
- **AWS/Azure/GCP**: Use their respective secret management services

## **Step 4: Validate Configuration**

### **Test Database Connection:**

```bash
# Test production database connection
supabase link --project-ref YOUR_PROJECT_REF

# Verify connection
supabase status --linked
```

### **Test Environment Variables:**

Create a simple test script:

```bash
# Create test script
cat > test-env.js << 'EOF'
console.log('Testing environment variables...');
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing');
console.log('Supabase Anon Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing');
console.log('Service Role Key:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing');
console.log('Stripe Publishable:', process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? '✅ Set' : '❌ Missing');
console.log('Stripe Secret:', process.env.STRIPE_SECRET_KEY ? '✅ Set' : '❌ Missing');
console.log('Site URL:', process.env.NEXT_PUBLIC_SITE_URL || '❌ Missing');
EOF

# Run test (with production env if testing locally)
node test-env.js

# Clean up
rm test-env.js
```

## **Security Best Practices**

### **✅ DO:**
- Use your deployment platform's secure environment variable system
- Rotate credentials regularly (every 90 days)
- Use different credentials for development/staging/production
- Monitor credential usage in Supabase/Stripe dashboards
- Use strong, unique passwords for database
- Enable 2FA on all service accounts

### **❌ DON'T:**
- Commit `.env.production` to version control
- Share credentials via email/chat/documents
- Use development credentials in production
- Store credentials in plain text files
- Use the same password across services
- Leave test credentials in production

## **Credential Rotation Schedule**

### **Monthly:**
- [ ] Review access logs in Supabase dashboard
- [ ] Check Stripe webhook delivery logs
- [ ] Verify email delivery metrics

### **Quarterly:**
- [ ] Rotate Supabase service role key
- [ ] Rotate Stripe webhook secret
- [ ] Update database password
- [ ] Review and revoke unused API keys

### **Annually:**
- [ ] Full security audit of all credentials
- [ ] Update all service passwords
- [ ] Review team access permissions

## **Emergency Procedures**

### **If Credentials Are Compromised:**

1. **Immediate Actions:**
   ```bash
   # Revoke compromised keys in service dashboards
   # Generate new credentials
   # Update deployment platform secrets
   # Monitor for unauthorized usage
   ```

2. **Supabase Compromise:**
   - Reset database password immediately
   - Regenerate API keys in project settings
   - Review recent database activity
   - Update all deployment configurations

3. **Stripe Compromise:**
   - Disable compromised keys in Stripe dashboard
   - Generate new API keys
   - Update webhook secrets
   - Review recent payment activity

## **Monitoring and Alerts**

### **Set Up Monitoring:**
- Supabase: Monitor API usage and database connections
- Stripe: Set up webhook failure alerts
- Application: Monitor authentication failures
- Email: Track delivery rates and bounces

### **Alert Thresholds:**
- Unusual API usage patterns
- Failed authentication attempts
- Webhook delivery failures
- Database connection errors

## **Quick Reference**

### **Production Checklist:**
- [ ] Supabase production project created
- [ ] Production credentials generated
- [ ] Deployment platform secrets configured
- [ ] Database connection tested
- [ ] Application deployment successful
- [ ] All services responding correctly
- [ ] Monitoring and alerts configured
- [ ] Backup and recovery procedures tested

### **Emergency Contacts:**
- Supabase Support: https://supabase.com/support
- Stripe Support: https://support.stripe.com
- Deployment Platform Support: [Your platform's support]

---

**Remember**: Security is not a one-time setup. Regularly review and update your credential management practices to maintain a secure production environment.
