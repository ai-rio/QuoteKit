# **Blog Migration Guide - Documentation & Rollback Plan**

## **Migration Overview**

This document provides comprehensive guidance for the blog migration from hardcoded TypeScript data to MDX-based content management, including detailed rollback procedures.

---

## **Migration Script Documentation**

### **Script Location & Usage**
```bash
# Location
scripts/migrate-blog-posts.ts

# Usage
npm run blog:migrate
# or
tsx scripts/migrate-blog-posts.ts
```

### **What the Migration Does**

1. **Data Extraction**: Reads existing blog posts from `src/app/blog/data/blog-posts.ts`
2. **Backup Creation**: Creates automatic backup of original data file
3. **Directory Structure**: Creates `content/posts/YYYY/` structure by publication year
4. **File Generation**: Converts each post to MDX format with proper frontmatter
5. **Content Templates**: Generates category-specific sample content for each post
6. **Validation**: Ensures all required metadata is preserved

### **Generated File Structure**
```
content/posts/
├── 2024/
│   ├── 12-27-client-communication-strategies.mdx
│   └── 12-31-seasonal-pricing-strategies.mdx
└── 2025/
    ├── 01-02-must-have-apps-for-landscapers.mdx
    ├── 01-04-increase-quote-value-upselling.mdx
    ├── 01-07-avoiding-scope-creep.mdx
    ├── 01-09-software-roi-vs-equipment.mdx
    ├── 01-11-build-client-trust-with-quotes.mdx
    └── 01-14-how-to-price-a-paver-patio.mdx
```

### **Frontmatter Mapping**
```yaml
# Original TypeScript → MDX Frontmatter
title: "Post Title"              # → title (preserved exactly)
slug: "post-slug"                # → slug (preserved exactly)
category: "pricing"              # → category (preserved exactly)
author: "Author Name"            # → author (preserved exactly)
publishedAt: "2025-01-15"       # → publishedAt (preserved exactly)
summary: "Post summary"          # → summary (preserved exactly)
readTime: 8                     # → readTime (preserved exactly)
image: "https://example.com"     # → image (preserved exactly)
featured: true                  # → featured (preserved if true)

# New enhancements added
draft: false                    # → Always false for migrated posts
tags: ["category", "landscaping", "business"]
seo:
  description: "Post summary"   # → Uses summary as SEO description
  keywords: ["category", "landscaping", "business", "quoting"]
imageAlt: "Category guide illustration"
```

---

## **Backup & Safety Measures**

### **Automatic Backups Created**
1. **Original Data File**: `src/app/blog/data/blog-posts.ts.backup`
2. **Migration Timestamp**: Includes date/time in backup filename
3. **File Integrity**: Backup verified before migration proceeds

### **Backup Verification**
```bash
# Check backup was created
ls -la src/app/blog/data/blog-posts.ts*

# Expected output:
# blog-posts.ts         (original)
# blog-posts.ts.backup  (backup)
```

### **Backup Validation**
```bash
# Compare file sizes (should be identical)
wc -l src/app/blog/data/blog-posts.ts*

# Compare content checksums
md5sum src/app/blog/data/blog-posts.ts*
```

---

## **Rollback Procedures**

### **Scenario 1: Immediate Rollback (Migration Just Completed)**

**If migration completed but you want to revert immediately:**

```bash
# Step 1: Stop development server
# Ctrl+C to stop npm run dev

# Step 2: Remove generated content
rm -rf content/posts/

# Step 3: Restore original blog-posts.ts (if modified)
cp src/app/blog/data/blog-posts.ts.backup src/app/blog/data/blog-posts.ts

# Step 4: Verify restoration
npm run build  # Should build successfully with original system
```

### **Scenario 2: Git-Based Rollback**

**If you've committed changes and want to rollback:**

```bash
# Step 1: Check git status
git status

# Step 2: See recent commits
git log --oneline -5

# Step 3: Rollback to specific commit (before migration)
git reset --hard <commit-hash-before-migration>

# Step 4: Force push if needed (be careful!)
git push --force-with-lease origin feature/mdx-blog-integration
```

### **Scenario 3: Selective Rollback (Keep Some Changes)**

**If you want to keep some changes but revert the blog system:**

```bash
# Step 1: Remove only blog-related changes
rm -rf content/posts/
git checkout HEAD -- src/app/blog/[slug]/page.tsx
git checkout HEAD -- src/lib/blog/
git checkout HEAD -- mdx-components.tsx

# Step 2: Restore original blog data
cp src/app/blog/data/blog-posts.ts.backup src/app/blog/data/blog-posts.ts

# Step 3: Remove MDX dependencies
npm uninstall gray-matter next-mdx-remote

# Step 4: Test functionality
npm run build
npm run dev
```

### **Scenario 4: Partial Migration Issues**

**If some posts migrated incorrectly:**

```bash
# Step 1: Check migration logs
cat migration.log  # (if created)

# Step 2: Remove problematic posts
rm content/posts/YYYY/problematic-post.mdx

# Step 3: Re-run migration for specific posts
# (requires manual script modification or selective migration)

# Step 4: Validate specific posts
npm run blog:validate
```

---

## **Rollback Validation Checklist**

### **Post-Rollback Verification**

- [ ] **Blog Index Page**: `/blog` loads correctly
- [ ] **Individual Posts**: All `/blog/[slug]` pages work
- [ ] **Navigation**: Previous/Next post navigation functional
- [ ] **Related Posts**: Related posts display correctly
- [ ] **Search & Filtering**: Category filtering works
- [ ] **SEO**: All metadata preserved (title, description, OG tags)
- [ ] **Performance**: Page load times unchanged
- [ ] **Build Process**: `npm run build` completes without errors

### **Data Integrity Verification**
```bash
# Count posts before/after
echo "Original posts:" && grep -c "id:" src/app/blog/data/blog-posts.ts.backup
echo "Current posts:" && grep -c "id:" src/app/blog/data/blog-posts.ts

# Check all slugs preserved
grep "slug:" src/app/blog/data/blog-posts.ts.backup | sort > original-slugs.txt
grep "slug:" src/app/blog/data/blog-posts.ts | sort > current-slugs.txt
diff original-slugs.txt current-slugs.txt
```

---

## **Emergency Contacts & Escalation**

### **If Rollback Fails**

1. **Immediate Action**: Stop all deployments
2. **Backup Recovery**: Locate and verify backup files
3. **Git History**: Use `git reflog` to find safe commit points
4. **Database Check**: Ensure no database migrations were affected
5. **Documentation**: Document the failure for future prevention

### **Recovery Commands**
```bash
# Nuclear option - reset to last known good state
git reflog  # Find commit hash
git reset --hard <safe-commit-hash>

# Verify clean state
npm run build
npm run test  # if tests exist
npm run dev   # manual verification
```

---

## **Post-Migration Monitoring**

### **Critical Metrics to Monitor**

1. **Build Performance**
   - Build time before: `[record baseline]`
   - Build time after: `[monitor change]`
   - Target: < 20% increase

2. **Runtime Performance**
   - Page load times for `/blog` routes
   - Core Web Vitals scores
   - Bundle size impact

3. **SEO Preservation**
   - Google Search Console monitoring
   - Meta tag validation
   - Structured data testing

### **Monitoring Commands**
```bash
# Build time monitoring
time npm run build

# Bundle analysis
npm run analyze  # if configured

# SEO testing
curl -s https://yoursite.com/blog/post-slug | grep -E '<title>|<meta.*description'
```

---

## **Prevention & Best Practices**

### **Before Future Migrations**

1. **Full Backup Strategy**
   ```bash
   # Create complete project backup
   tar -czf project-backup-$(date +%Y%m%d).tar.gz . --exclude=node_modules
   ```

2. **Testing Environment**
   - Always test on development/staging first
   - Use feature branches for major changes
   - Document all changes thoroughly

3. **Rollback Planning**
   - Document rollback steps before starting
   - Test rollback procedures in development
   - Have emergency contacts ready

### **Migration Safety Checklist**

- [ ] **Backup Created**: All data backed up safely
- [ ] **Testing Environment**: Migration tested in dev/staging
- [ ] **Rollback Plan**: Clear rollback procedures documented
- [ ] **Team Communication**: All stakeholders informed
- [ ] **Monitoring Setup**: Performance monitoring ready
- [ ] **Emergency Contacts**: Support team on standby

---

## **Troubleshooting Common Issues**

### **Migration Script Fails**
```bash
# Check file permissions
ls -la src/app/blog/data/blog-posts.ts

# Verify file structure
head -20 src/app/blog/data/blog-posts.ts

# Run with debug output
DEBUG=1 tsx scripts/migrate-blog-posts.ts
```

### **Generated MDX Files Invalid**
```bash
# Validate MDX syntax
npm run blog:validate

# Check frontmatter format
head -20 content/posts/2025/01-14-how-to-price-a-paver-patio.mdx
```

### **Build Failures After Migration**
```bash
# Check TypeScript errors
npm run type-check

# Verify imports
grep -r "blog-posts" src/

# Clear caches
rm -rf .next/ node_modules/.cache/
npm install
```

---

This migration guide provides comprehensive documentation and rollback procedures to ensure safe migration with minimal risk and quick recovery options if needed.