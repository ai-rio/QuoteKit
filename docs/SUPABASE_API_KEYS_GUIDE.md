# 🔑 Supabase API Keys Configuration Guide

## 🚨 **SECURITY INCIDENT RESPONSE**
This guide was created in response to the GitGuardian security incident on August 11, 2025.
**All previous API keys have been compromised and must be rotated immediately.**

## 📖 **Understanding Supabase API Keys**

### **Key Types & Usage**

#### 1. **Anon Key (Public/Publishable)** ✅ Safe for Client-Side
```bash
# Environment Variable Names (choose based on framework):
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Usage:**
- ✅ Safe to expose in browser/client-side code
- ✅ Used for client-side Supabase initialization
- ✅ Protected by Row Level Security (RLS)
- ✅ Can be committed in example files with placeholders

#### 2. **Service Role Key** ⚠️ **SERVER-ONLY**
```bash
# Environment Variable Names:
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Usage:**
- ❌ **NEVER** expose in browser/client-side code
- ✅ Server-side operations only (API routes, Edge Functions)
- ✅ Bypasses Row Level Security (RLS)
- ✅ Full admin access to database
- ❌ **NEVER** commit to version control

#### 3. **Project URL** ✅ Safe for Client-Side
```bash
# Environment Variable Names (choose based on framework):
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
REACT_APP_SUPABASE_URL=https://your-project-ref.supabase.co
PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
```

## 🔄 **Step-by-Step Key Rotation Process**

### **Step 1: Get New Keys from Supabase Dashboard**

1. **Go to Supabase Dashboard:**
   ```
   https://supabase.com/dashboard/project/YOUR_PROJECT_ID/settings/api
   ```

2. **Copy the New Keys:**
   - **Project URL**: `https://bujajubcktlpblewxtel.supabase.co`
   - **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (new one)
   - **Service Role Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (new one)

3. **Reset Service Role Key:**
   - Click "Reset" next to Service Role Key
   - Copy the new key immediately

### **Step 2: Update Environment Files**

#### **For Next.js (QuoteKit)**
Create/Update `.env.local`:
```bash
# ==============================================
# SUPABASE CONFIGURATION (UPDATED KEYS)
# ==============================================
# Project URL (safe for client-side)
NEXT_PUBLIC_SUPABASE_URL=https://bujajubcktlpblewxtel.supabase.co

# Anon Key (safe for client-side)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.NEW_ANON_KEY_HERE

# Service Role Key (SERVER-ONLY - never expose to client)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.NEW_SERVICE_ROLE_KEY_HERE

# Database URL (SERVER-ONLY)
SUPABASE_DB_URL=postgresql://postgres.bujajubcktlpblewxtel:NEW_PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres

# Database Password (if needed separately)
SUPABASE_DB_PASSWORD=NEW_SECURE_PASSWORD
```

#### **For Production (.env.production)**
```bash
# ==============================================
# SUPABASE PRODUCTION CONFIGURATION (UPDATED)
# ==============================================
NEXT_PUBLIC_SUPABASE_URL=https://bujajubcktlpblewxtel.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.NEW_ANON_KEY_HERE
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.NEW_SERVICE_ROLE_KEY_HERE
SUPABASE_DB_PASSWORD=NEW_SECURE_PASSWORD
```

### **Step 3: Update Fly.io Secrets**

```bash
# Set the new Supabase secrets in Fly.io
fly secrets set NEXT_PUBLIC_SUPABASE_URL="https://bujajubcktlpblewxtel.supabase.co"
fly secrets set NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.NEW_ANON_KEY"
fly secrets set SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.NEW_SERVICE_ROLE_KEY"
fly secrets set SUPABASE_DB_PASSWORD="NEW_SECURE_PASSWORD"
```

### **Step 4: Update Supabase Edge Function Secrets**

```bash
# If using Supabase Edge Functions, update their secrets too
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.NEW_SERVICE_ROLE_KEY"

# Or set from .env file
supabase secrets set --env-file .env
```

## 🛠️ **Framework-Specific Configuration**

### **Next.js (Current Setup)**
```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// For server-side operations
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey)
```

### **React/Vite**
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### **SvelteKit**
```bash
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### **Angular**
```typescript
// environment.ts
export const environment = {
  production: false,
  supabaseUrl: 'https://your-project.supabase.co',
  supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
}
```

## 🔒 **Security Best Practices**

### **✅ DO:**
- Use `NEXT_PUBLIC_` prefix for client-side variables in Next.js
- Use `VITE_` prefix for client-side variables in Vite
- Use `PUBLIC_` prefix for client-side variables in SvelteKit
- Store Service Role Key only in server environment variables
- Use environment variable substitution in config files: `env(VARIABLE_NAME)`
- Rotate keys every 90 days
- Monitor API usage for anomalies

### **❌ DON'T:**
- Never commit Service Role Keys to version control
- Never expose Service Role Keys to client-side code
- Never hardcode keys in source code
- Never share keys in chat/email
- Never use production keys in development

## 🧪 **Testing Your Configuration**

### **Test Client-Side Connection**
```typescript
// Test in browser console or component
import { supabase } from './lib/supabase'

const testConnection = async () => {
  const { data, error } = await supabase.from('profiles').select('count')
  console.log('Connection test:', { data, error })
}
```

### **Test Server-Side Connection**
```typescript
// Test in API route or server component
import { supabaseAdmin } from './lib/supabase'

const testAdminConnection = async () => {
  const { data, error } = await supabaseAdmin.from('profiles').select('*')
  console.log('Admin connection test:', { data, error })
}
```

## 🚨 **Emergency Procedures**

### **If Keys Are Compromised Again:**
1. **Immediately rotate all keys** in Supabase Dashboard
2. **Update all environment variables** in all environments
3. **Redeploy applications** to pick up new keys
4. **Monitor logs** for unauthorized access
5. **Document the incident** for security audit

### **Monitoring Commands**
```bash
# Check current Supabase project API keys
supabase projects api-keys

# List current secrets in Fly.io
fly secrets list

# Check Supabase Edge Function secrets
supabase secrets list
```

## 📋 **Verification Checklist**

After updating keys, verify:

- [ ] **Local Development**: App connects to Supabase successfully
- [ ] **Production**: Deployed app connects to Supabase successfully
- [ ] **Authentication**: User login/signup works
- [ ] **Database Operations**: CRUD operations work
- [ ] **Real-time**: Subscriptions work (if used)
- [ ] **Storage**: File uploads work (if used)
- [ ] **Edge Functions**: Functions execute successfully (if used)
- [ ] **No Console Errors**: No authentication errors in browser/server logs

## 🔗 **Useful Commands**

```bash
# Get API keys via CLI
supabase projects api-keys

# Set secrets in Supabase
supabase secrets set KEY_NAME="value"

# Set secrets from file
supabase secrets set --env-file .env

# List all secrets
supabase secrets list

# Set Fly.io secrets
fly secrets set KEY_NAME="value"

# List Fly.io secrets
fly secrets list
```

---

## ⚠️ **CRITICAL REMINDER**

**The old keys exposed in the security incident:**
- `SUPABASE_SERVICE_ROLE_KEY`: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1amFqdWJja3RscGJsZXd4dGVsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDg0MzM1NCwiZXhwIjoyMDcwNDE5MzU0fQ.pIsMT2ohSRtkLDWS57GGpQYQOL5SVtUd8gDyNtdKjS8`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1amFqdWJja3RscGJsZXd4dGVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4NDMzNTQsImV4cCI6MjA3MDQxOTM1NH0.oLzfozz8_bYJrarlZyHJG3IM54AKLoIWI5D97TFwjH0`

**These keys MUST be rotated immediately and never used again.**
