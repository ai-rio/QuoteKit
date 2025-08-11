# 🎯 Common QuoteKit Development Tasks with Claude Flow

## Quick Reference Commands

### 🔧 **Immediate Tasks (Current Issues)**

Based on your current git status and project needs:

```bash
# Fix subscription database issues
npx claude-flow@alpha swarm "Debug and resolve subscription database constraint violations in upsertUserSubscription" --claude

# Clean up admin routes
npx claude-flow@alpha swarm "Optimize admin Stripe configuration and webhook debug routes" --claude

# Handle TypeScript errors
npx claude-flow@alpha swarm "Resolve TypeScript compilation errors across the codebase" --claude
```

## 📋 **Development Task Categories**

### **1. Bug Fixes & Debugging**

#### Database Issues
```bash
# Subscription sync problems
npx claude-flow@alpha swarm "Fix subscription sync database constraint violations with proper error handling" --claude

# RLS policy issues
npx claude-flow@alpha swarm "Debug and fix Supabase RLS policy conflicts in subscription management" --claude

# Foreign key constraint errors
npx claude-flow@alpha swarm "Resolve foreign key constraint violations in Stripe integration" --claude
```

#### API Route Problems
```bash
# Webhook handling
npx claude-flow@alpha swarm "Improve Stripe webhook processing and error recovery" --claude

# Admin endpoint errors
npx claude-flow@alpha swarm "Fix admin API routes returning 500 errors and improve error messages" --claude

# Authentication issues
npx claude-flow@alpha swarm "Debug session authentication problems in protected routes" --claude
```

### **2. Feature Development**

#### Quote System Enhancements
```bash
# Advanced quote features
npx claude-flow@alpha hive-mind spawn "Add quote versioning and revision history tracking" --namespace quotes --claude

# Quote templates
npx claude-flow@alpha hive-mind spawn "Implement smart quote templates with conditional fields" --namespace templates --claude

# Quote automation
npx claude-flow@alpha swarm "Add automatic quote follow-up and reminder system" --claude
```

#### Subscription Improvements
```bash
# Subscription analytics
npx claude-flow@alpha hive-mind spawn "Build comprehensive subscription analytics dashboard" --namespace subscriptions --claude

# Payment management
npx claude-flow@alpha swarm "Add advanced payment method management for customers" --claude

# Plan management
npx claude-flow@alpha swarm "Implement flexible subscription plan upgrade/downgrade flows" --claude
```

#### Admin Dashboard Features
```bash
# User management
npx claude-flow@alpha hive-mind spawn "Create advanced user management with bulk operations" --namespace admin --claude

# System monitoring
npx claude-flow@alpha swarm "Add system health monitoring and alerting to admin dashboard" --claude

# Data export
npx claude-flow@alpha swarm "Implement comprehensive data export functionality for admins" --claude
```

### **3. Performance Optimization**

#### Database Performance
```bash
# Query optimization
npx claude-flow@alpha swarm "Optimize slow database queries in dashboard and quotes" --claude

# Index optimization
npx claude-flow@alpha swarm "Add proper database indexes for better query performance" --claude

# Connection pooling
npx claude-flow@alpha swarm "Optimize Supabase connection usage and implement pooling" --claude
```

#### Frontend Performance
```bash
# Loading optimization
npx claude-flow@alpha swarm "Implement optimistic UI updates and loading states" --claude

# Bundle optimization
npx claude-flow@alpha swarm "Optimize Next.js bundle size and implement code splitting" --claude

# Mobile performance
npx claude-flow@alpha swarm "Optimize mobile performance and reduce JavaScript bundle size" --claude
```

#### PDF Generation Performance
```bash
# PDF optimization
npx claude-flow@alpha swarm "Optimize React PDF generation speed and memory usage" --claude

# Caching
npx claude-flow@alpha swarm "Implement PDF caching and background generation for quotes" --claude
```

### **4. Testing & Quality Assurance**

#### Test Coverage
```bash
# Unit tests
npx claude-flow@alpha swarm "Add comprehensive unit tests for quote calculation logic" --claude

# Integration tests
npx claude-flow@alpha swarm "Create integration tests for Stripe webhook processing" --claude

# E2E tests
npx claude-flow@alpha hive-mind spawn "Implement end-to-end test suite for complete user workflows" --namespace testing --claude
```

#### Code Quality
```bash
# TypeScript improvements
npx claude-flow@alpha swarm "Improve TypeScript types and eliminate any types" --claude

# ESLint fixes
npx claude-flow@alpha swarm "Fix ESLint warnings and improve code consistency" --claude

# Security audit
npx claude-flow@alpha swarm "Perform security audit of authentication and data handling" --claude
```

### **5. UI/UX Improvements**

#### Design System
```bash
# Component consistency
npx claude-flow@alpha swarm "Standardize component usage and improve design consistency" --claude

# Accessibility
npx claude-flow@alpha swarm "Improve accessibility across all components and pages" --claude

# Mobile UX
npx claude-flow@alpha swarm "Enhance mobile user experience and touch interactions" --claude
```

#### User Experience
```bash
# Onboarding
npx claude-flow@alpha hive-mind spawn "Create comprehensive user onboarding flow" --namespace onboarding --claude

# Error handling
npx claude-flow@alpha swarm "Improve error messages and user feedback throughout the app" --claude

# Navigation
npx claude-flow@alpha swarm "Optimize navigation structure and add breadcrumbs" --claude
```

## 🛠️ **Maintenance Tasks**

### **Regular Maintenance**
```bash
# Dependency updates
npx claude-flow@alpha swarm "Update all dependencies and resolve breaking changes" --claude

# Security patches
npx claude-flow@alpha swarm "Apply security patches and audit for vulnerabilities" --claude

# Performance monitoring
npx claude-flow@alpha swarm "Set up performance monitoring and alerting" --claude
```

### **Database Maintenance**
```bash
# Migration cleanup
npx claude-flow@alpha swarm "Review and optimize database migrations for performance" --claude

# Data cleanup
npx claude-flow@alpha swarm "Implement data archival and cleanup procedures" --claude

# Backup verification
npx claude-flow@alpha swarm "Verify database backups and recovery procedures" --claude
```

## 🚀 **Development Workflow Tasks**

### **Setup & Configuration**
```bash
# Environment setup
npx claude-flow@alpha swarm "Improve development environment setup and documentation" --claude

# CI/CD pipeline
npx claude-flow@alpha hive-mind spawn "Set up comprehensive CI/CD pipeline with testing and deployment" --namespace devops --claude

# Monitoring setup
npx claude-flow@alpha swarm "Configure application monitoring and error tracking" --claude
```

### **Documentation**
```bash
# API documentation
npx claude-flow@alpha swarm "Create comprehensive API documentation with examples" --claude

# Component documentation
npx claude-flow@alpha swarm "Document all React components with Storybook" --claude

# User documentation
npx claude-flow@alpha swarm "Create user guides and help documentation" --claude
```

## 🎯 **Priority-Based Task Examples**

### **High Priority (Production Issues)**
```bash
# Critical bug fixes
npx claude-flow@alpha swarm "URGENT: Fix subscription billing failure preventing new customer signups" --claude

# Security issues
npx claude-flow@alpha swarm "URGENT: Fix authentication bypass vulnerability in admin routes" --claude

# Data integrity
npx claude-flow@alpha swarm "URGENT: Fix data corruption in quote calculations" --claude
```

### **Medium Priority (Feature Improvements)**
```bash
# User experience
npx claude-flow@alpha hive-mind spawn "Improve quote creation workflow with better UX" --namespace quotes --claude

# Performance
npx claude-flow@alpha swarm "Optimize dashboard loading times" --claude

# Integration
npx claude-flow@alpha swarm "Improve Stripe integration error handling" --claude
```

### **Low Priority (Enhancement)**
```bash
# Analytics
npx claude-flow@alpha swarm "Add business intelligence dashboard for quote trends" --claude

# Automation
npx claude-flow@alpha swarm "Implement automated quote follow-up emails" --claude

# Customization
npx claude-flow@alpha swarm "Add theme customization options for businesses" --claude
```

## 🔄 **Task Sequencing Examples**

### **Feature Development Sequence**
```bash
# Step 1: Research and design
npx claude-flow@alpha hive-mind spawn "Research and design advanced quote analytics system" --agents researcher,designer --claude

# Step 2: Backend implementation
npx claude-flow@alpha swarm "Implement analytics data collection and API endpoints" --continue-session

# Step 3: Frontend implementation
npx claude-flow@alpha swarm "Build analytics dashboard components and visualizations" --continue-session

# Step 4: Testing and optimization
npx claude-flow@alpha swarm "Add tests and optimize analytics performance" --continue-session
```

### **Bug Fix Sequence**
```bash
# Step 1: Investigation
npx claude-flow@alpha swarm "Investigate root cause of subscription sync failures" --claude

# Step 2: Fix implementation
npx claude-flow@alpha swarm "Implement fix for subscription database constraint violations" --continue-session

# Step 3: Testing
npx claude-flow@alpha swarm "Create test cases to prevent regression of subscription issues" --continue-session

# Step 4: Deployment validation
npx claude-flow@alpha swarm "Validate fix in staging environment" --continue-session
```

---

*Use these task examples as templates for your specific QuoteKit development needs. Adjust the scope and complexity based on your current priorities and available time.*