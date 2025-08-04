# **MDX Blog System - Deployment & Rollback Guide**

## **Overview**

This guide provides comprehensive deployment procedures and emergency rollback plans for the LawnQuote MDX Blog System. All procedures are designed for zero-downtime deployment with full rollback capabilities.

## **Pre-Deployment Checklist**

### **Content Validation**
```bash
# Validate all content structure and schemas
npm run blog:validate

# Verify SEO/GEO optimization
npm run blog:validate-seo

# Run essential tests
npm run blog:test-essential

# Performance benchmark
npm run blog:perf-test -- --baseline
```

### **Code Quality Checks**
```bash
# TypeScript compilation
npm run build

# Linting
npm run lint

# Test suite (if available)
npm test
```

### **Content Backup**
```bash
# Create backup of current content
cp -r content/posts content/posts.backup.$(date +%Y%m%d-%H%M%S)

# Git commit current state
git add -A
git commit -m "Pre-deployment backup - $(date)"
git push origin main
```

## **Deployment Environments**

### **Development Environment**
- **URL**: `http://localhost:3000`
- **Purpose**: Local development and testing
- **Cache TTL**: 5 seconds (for rapid iteration)
- **Validation**: Real-time content validation

### **Staging Environment**
- **URL**: `https://staging-yourapp.vercel.app`
- **Purpose**: Pre-production testing
- **Cache TTL**: 5 minutes
- **Validation**: Full SEO and performance testing

### **Production Environment**
- **URL**: `https://yourapp.com`
- **Purpose**: Live user traffic
- **Cache TTL**: 5 minutes
- **Validation**: Monitoring and analytics

## **Deployment Procedures**

### **Standard Deployment (Vercel)**

#### **1. Pre-Deployment Validation**
```bash
# Run complete validation suite
npm run blog:validate && npm run blog:validate-seo && npm run blog:test-essential

# Expected output:
# ✅ Content validation: 9/9 posts passed
# ✅ SEO validation: 100/100 score
# ✅ Essential tests: 5/5 passed
```

#### **2. Build Verification**
```bash
# Local build test
npm run build

# Check for any build errors or warnings
# Verify bundle size hasn't increased significantly
npm run analyze  # Optional: analyze bundle if needed
```

#### **3. Git Workflow**
```bash
# Ensure clean working directory
git status

# Create deployment branch (optional for complex changes)
git checkout -b deploy/blog-update-$(date +%Y%m%d)

# Commit changes
git add -A
git commit -m "feat(blog): deploy MDX updates - $(date +%Y-%m-%d)"

# Push to main branch
git checkout main
git merge deploy/blog-update-$(date +%Y%m%d)
git push origin main
```

#### **4. Vercel Deployment**
Vercel automatically deploys on push to main branch.

**Monitor deployment:**
- Check Vercel dashboard for build status
- Verify deployment URL
- Monitor build logs for any warnings

#### **5. Post-Deployment Verification**
```bash
# Test key URLs (replace with your domain)
curl -I https://yourapp.com/blog
curl -I https://yourapp.com/blog/how-to-price-paver-patio
curl -I https://yourapp.com/blog/build-client-trust

# Expected: 200 OK responses
```

### **Manual Deployment Steps**

#### **If Using Custom Server**
```bash
# Build the application
npm run build

# Start production server
npm start

# Or with PM2 for process management
pm2 start npm --name "lawnquote-blog" -- start
pm2 save
```

#### **Environment Variables**
Ensure these are set in production:
```bash
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=https://yourapp.com
# Add any other environment variables needed
```

## **Database Considerations**

### **No Database Changes Required**
The MDX blog system is file-based and doesn't require database migrations. However:

#### **Content Synchronization**
- **Development**: Content stored in `content/posts/`
- **Production**: Same content deployed via Git
- **No runtime database**: All content is static and built at deploy time

#### **Cache Considerations**
- **Build Cache**: Next.js automatically handles build cache
- **Runtime Cache**: In-memory cache with TTL, no persistence needed
- **CDN Cache**: Vercel handles static asset caching

## **Rollback Procedures**

### **Emergency Rollback (Immediate)**

#### **Level 1: Vercel Dashboard Rollback**
1. **Access Vercel Dashboard**
   - Go to your project dashboard
   - Navigate to "Deployments" tab
   - Find the previous working deployment
   - Click "Promote to Production"

2. **Verification**
   ```bash
   # Test rollback success
   curl -I https://yourapp.com/blog
   # Should return 200 OK with previous content
   ```

#### **Level 2: Git Revert**
```bash
# Find the problematic commit
git log --oneline -n 10

# Revert the commit (creates new commit)
git revert <commit-hash>

# Push revert
git push origin main

# Vercel will automatically redeploy
```

#### **Level 3: Branch Rollback**
```bash
# Reset to previous working state
git reset --hard <previous-working-commit>

# Force push (use with caution)
git push --force-with-lease origin main

# Vercel will redeploy the reverted state
```

### **Content-Only Rollback**

#### **Restore Content from Backup**
```bash
# Restore from timestamped backup
rm -rf content/posts
cp -r content/posts.backup.YYYYMMDD-HHMMSS content/posts

# Commit restored content
git add content/posts
git commit -m "rollback: restore content from backup $(date)"
git push origin main
```

#### **Selective Content Rollback**
```bash
# Restore specific post
git checkout HEAD~1 -- content/posts/2025/problematic-post.mdx

# Or restore entire content directory from specific commit
git checkout <commit-hash> -- content/posts/

git add content/posts
git commit -m "rollback: restore specific content"
git push origin main
```

### **Configuration Rollback**

#### **Revert Configuration Changes**
```bash
# Rollback package.json changes
git checkout HEAD~1 -- package.json

# Rollback Next.js config
git checkout HEAD~1 -- next.config.js

# Rollback MDX components
git checkout HEAD~1 -- mdx-components.tsx

# Commit configuration rollback
git add -A
git commit -m "rollback: restore configuration"
git push origin main
```

## **Monitoring & Validation**

### **Post-Deployment Monitoring**

#### **Automated Checks**
```bash
# Health check script (create as needed)
#!/bin/bash
echo "Checking blog system health..."

# Test main blog page
curl -f https://yourapp.com/blog || echo "❌ Blog index failed"

# Test sample posts
curl -f https://yourapp.com/blog/how-to-price-paver-patio || echo "❌ Sample post failed"

# Test RSS feed (if implemented)
curl -f https://yourapp.com/blog/rss.xml || echo "❌ RSS feed failed"

echo "✅ Health check complete"
```

#### **Performance Monitoring**
```bash
# Run performance benchmark after deployment
npm run blog:perf-test -- --compare

# Expected output should show no significant performance regression
```

#### **SEO Validation**
```bash
# Validate SEO implementation
npm run blog:validate-seo

# Should maintain 100/100 score
```

### **Error Detection**

#### **Common Issues to Monitor**
1. **404 Errors**: Broken internal links or missing posts
2. **Build Failures**: Content validation errors
3. **Performance Degradation**: Slow page loads
4. **SEO Issues**: Missing metadata or structured data

#### **Monitoring Tools**
- **Vercel Analytics**: Built-in performance monitoring
- **Google Search Console**: SEO and indexing status
- **Core Web Vitals**: Performance metrics
- **Custom Health Checks**: Automated endpoint testing

## **Environment-Specific Procedures**

### **Development Deployment**
```bash
# Simple local deployment
npm run dev

# Content validation is automatic with 5-second cache TTL
# Changes are reflected immediately
```

### **Staging Deployment**
```bash
# Deploy to staging branch
git checkout staging
git merge main
git push origin staging

# Staging environment auto-deploys
# Run full test suite on staging
npm run blog:validate
npm run blog:validate-seo
npm run blog:test-essential
```

### **Production Deployment**
```bash
# Final pre-production checks
npm run build
npm run blog:perf-test -- --baseline

# Deploy to main
git checkout main
git push origin main

# Monitor deployment
# Run post-deployment validation
```

## **Disaster Recovery**

### **Complete System Failure**

#### **Recovery Procedure**
1. **Assess Scope**
   - Identify what's broken (content, configuration, dependencies)
   - Determine rollback strategy

2. **Immediate Response**
   ```bash
   # Emergency rollback to last known good state
   git reset --hard <last-working-commit>
   git push --force-with-lease origin main
   ```

3. **Content Recovery**
   ```bash
   # Restore from backup if content is corrupted
   cp -r content/posts.backup.LATEST content/posts
   git add content/posts
   git commit -m "disaster recovery: restore content"
   git push origin main
   ```

4. **System Rebuild**
   ```bash
   # If dependencies are corrupted
   rm -rf node_modules package-lock.json
   npm install
   npm run build
   ```

### **Data Loss Prevention**

#### **Backup Strategy**
```bash
# Automated backup script (run before each deployment)
#!/bin/bash
BACKUP_DIR="backups/$(date +%Y%m%d-%H%M%S)"
mkdir -p $BACKUP_DIR

# Backup content
cp -r content/posts $BACKUP_DIR/
cp -r src/lib/blog $BACKUP_DIR/
cp package.json $BACKUP_DIR/
cp next.config.js $BACKUP_DIR/
cp mdx-components.tsx $BACKUP_DIR/

echo "Backup created: $BACKUP_DIR"
```

#### **Version Control Best Practices**
- **Commit frequently**: Every significant change
- **Tag releases**: Mark stable deployments
- **Branching strategy**: Use feature branches for major changes
- **Protected main**: Require reviews for main branch

## **Performance Considerations**

### **Build Performance**
- **Expected build time**: < 2 minutes for standard deployment
- **Bundle size impact**: < 50KB increase from MDX dependencies
- **Cache efficiency**: 99.6% cache hit rate in production

### **Runtime Performance**
- **Page load times**: Should maintain current Core Web Vitals
- **Cache performance**: 5-minute TTL with intelligent invalidation
- **Memory usage**: Stable memory profile with TTL-based cleanup

## **Security Considerations**

### **Content Security**
- **Input validation**: All content validated via Zod schemas
- **XSS prevention**: MDX components are sanitized
- **File access**: Content directory is read-only in production

### **Deployment Security**
- **Environment variables**: Secure storage of sensitive data
- **Build process**: Runs in isolated environment
- **Static assets**: Served via CDN with proper headers

## **Troubleshooting Common Deployment Issues**

### **Build Failures**
```bash
# Issue: Content validation errors
# Solution:
npm run blog:validate
# Fix reported issues and redeploy

# Issue: TypeScript compilation errors
# Solution:
npm run build
# Fix TypeScript errors and redeploy

# Issue: Missing dependencies
# Solution:
npm install
npm run build
```

### **Runtime Issues**
```bash
# Issue: Posts not appearing
# Check: draft status and publication dates
grep -r "draft: true" content/posts/
grep -r "publishedAt:" content/posts/

# Issue: Performance degradation
# Check: cache performance
npm run blog:perf-test -- --compare

# Issue: SEO problems
# Check: structured data and metadata
npm run blog:validate-seo
```

### **Rollback Issues**
```bash
# Issue: Rollback doesn't work
# Check: Git history and deployment status
git log --oneline -n 10
# Verify which commit should be restored

# Issue: Content corruption after rollback
# Solution: Restore from timestamped backup
ls content/posts.backup.*
cp -r content/posts.backup.LATEST content/posts
```

## **Deployment Checklist**

### **Pre-Deployment** ✅
- [ ] All content validated (`npm run blog:validate`)
- [ ] SEO optimization confirmed (`npm run blog:validate-seo`)
- [ ] Essential tests passing (`npm run blog:test-essential`)
- [ ] Performance baseline established (`npm run blog:perf-test`)
- [ ] Content backed up
- [ ] Git repository clean and committed

### **During Deployment** ✅
- [ ] Build completes successfully
- [ ] No TypeScript errors
- [ ] Bundle size within acceptable limits
- [ ] Deployment URL accessible

### **Post-Deployment** ✅
- [ ] All blog URLs return 200 OK
- [ ] Sample posts render correctly
- [ ] SEO metadata preserved
- [ ] Performance metrics maintained
- [ ] No console errors in browser
- [ ] Analytics tracking functional

### **Emergency Procedures** ✅
- [ ] Rollback plan tested and ready
- [ ] Backup restoration procedures verified
- [ ] Emergency contact information available
- [ ] Monitoring alerts configured

This deployment guide ensures reliable, zero-downtime deployments with comprehensive rollback capabilities for the MDX blog system.