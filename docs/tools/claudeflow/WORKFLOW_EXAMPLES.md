# 🔄 Claude Flow Workflow Examples for QuoteKit

## Development Phase Workflows

### 🚀 **Phase 1: Current Issue Resolution**

Based on the current git status and known issues:

#### Subscription System Fixes
```bash
# Priority 1: Database constraint violations
npx claude-flow@alpha swarm "Analyze and fix subscription database constraint violations in upsertUserSubscription function" --claude

# Priority 2: Stripe webhook improvements  
npx claude-flow@alpha swarm "Enhance Stripe webhook error handling and retry logic" --claude

# Priority 3: Admin route optimization
npx claude-flow@alpha swarm "Review and optimize admin Stripe configuration endpoints for better error handling" --claude
```

#### Memory Setup for Current Context
```bash
# Store current issues for context
npx claude-flow@alpha memory store "current-bugs" "Subscription sync database constraint violations, webhook debugging needs improvement"

# Store architecture context
npx claude-flow@alpha memory store "tech-stack" "Next.js 15, Supabase, Stripe, TypeScript, shadcn/ui, React PDF"
```

### 🏗️ **Phase 2: Feature Enhancement**

#### Quote System Improvements
```bash
# Advanced quote templates
npx claude-flow@alpha hive-mind spawn "Implement advanced quote template system with conditional fields" --namespace templates --claude

# Quote analytics dashboard
npx claude-flow@alpha hive-mind spawn "Build comprehensive quote analytics with conversion tracking" --namespace analytics --claude

# Bulk quote operations
npx claude-flow@alpha swarm "Add bulk quote operations for status updates and exports" --claude
```

#### Client Experience Enhancement
```bash
# Client portal development
npx claude-flow@alpha hive-mind spawn "Create client portal for quote approval and communication" --namespace client-portal --claude

# Email system improvements
npx claude-flow@alpha swarm "Enhance email templates and delivery tracking for quotes" --claude
```

### 🧪 **Phase 3: Quality & Performance**

#### Testing Infrastructure
```bash
# Comprehensive testing setup
npx claude-flow@alpha hive-mind spawn "Implement comprehensive testing strategy with unit, integration, and E2E tests" --namespace testing --claude

# Performance testing
npx claude-flow@alpha swarm "Add performance testing for quote PDF generation and database operations" --claude
```

#### Performance Optimization
```bash
# Database optimization
npx claude-flow@alpha swarm "Optimize database queries and add proper indexing for better performance" --claude

# Mobile performance
npx claude-flow@alpha swarm "Optimize mobile performance and responsiveness across all quote workflows" --claude
```

## 📋 Specific Task Examples

### **Bug Investigation Workflow**
```bash
# Step 1: Research the issue
npx claude-flow@alpha hive-mind spawn "Investigate subscription sync failures with detailed error analysis" --agents researcher,debugger --claude

# Step 2: Store findings
npx claude-flow@alpha memory store "sync-investigation" "Database constraint violations occur during concurrent user subscription updates"

# Step 3: Implement fix
npx claude-flow@alpha swarm "Implement proper locking mechanism for subscription updates to prevent constraint violations" --continue-session
```

### **Feature Development Workflow**
```bash
# Step 1: Requirements analysis
npx claude-flow@alpha hive-mind spawn "Analyze requirements for advanced quote customization features" --agents analyst,architect --claude

# Step 2: Design and plan
npx claude-flow@alpha memory store "feature-design" "Quote customization requires dynamic fields, conditional logic, and template inheritance"

# Step 3: Implementation
npx claude-flow@alpha hive-mind spawn "Implement quote customization with dynamic fields and template system" --namespace customization --claude

# Step 4: Testing
npx claude-flow@alpha swarm "Add comprehensive tests for new quote customization features" --continue-session
```

### **Code Review Workflow**
```bash
# Automated code review
npx claude-flow@alpha swarm "Review recent changes in subscription routes for security and performance issues" --claude

# Architecture review
npx claude-flow@alpha hive-mind spawn "Review overall application architecture and suggest improvements" --agents architect,security --claude
```

## 🎯 Project-Specific Workflows

### **Subscription Management Focus**
```bash
# Current subscription issues (based on git status)
npx claude-flow@alpha memory store "subscription-context" "Files modified: sync-subscriptions route, debug subscription-sync, webhook-debug route"

# Comprehensive subscription fix
npx claude-flow@alpha hive-mind spawn "Completely overhaul subscription management system with better error handling" --namespace subscriptions --claude

# Follow-up testing
npx claude-flow@alpha swarm "Create comprehensive test suite for subscription lifecycle management" --continue-session
```

### **Admin Dashboard Enhancement**
```bash
# Admin feature development
npx claude-flow@alpha hive-mind spawn "Enhance admin dashboard with advanced user management and analytics" --namespace admin --claude

# Admin security audit
npx claude-flow@alpha swarm "Audit admin dashboard security and implement proper role-based access control" --claude
```

### **Quote System Modernization**
```bash
# Quote workflow optimization
npx claude-flow@alpha hive-mind spawn "Modernize quote creation workflow with better UX and performance" --namespace quotes --claude

# PDF generation improvements
npx claude-flow@alpha swarm "Optimize PDF generation performance and add more customization options" --claude
```

## 🔄 Session Management Examples

### **Continuing Previous Work**
```bash
# Check what's in progress
npx claude-flow@alpha hive-mind status
npx claude-flow@alpha memory query --recent --limit 5

# Resume specific session
npx claude-flow@alpha hive-mind resume session-xxxxx-xxxxx

# Continue with related task
npx claude-flow@alpha swarm "Continue implementing user authentication improvements" --continue-session
```

### **Multi-Session Coordination**
```bash
# Session 1: Backend work
npx claude-flow@alpha hive-mind spawn "Improve backend API performance and error handling" --namespace backend --claude

# Session 2: Frontend work (parallel)
npx claude-flow@alpha hive-mind spawn "Enhance frontend user experience and mobile responsiveness" --namespace frontend --claude

# Session 3: Integration
npx claude-flow@alpha swarm "Integrate improved backend APIs with enhanced frontend components" --claude
```

## 🛠️ Maintenance Workflows

### **Regular Maintenance Tasks**
```bash
# Weekly dependency updates
npx claude-flow@alpha swarm "Update dependencies and resolve any compatibility issues" --claude

# Performance monitoring
npx claude-flow@alpha swarm "Analyze application performance and identify optimization opportunities" --claude

# Security audit
npx claude-flow@alpha swarm "Perform security audit of authentication and authorization systems" --claude
```

### **Deployment Preparation**
```bash
# Pre-deployment checklist
npx claude-flow@alpha workflow create --name "Pre-deployment Validation" --parallel

# Batch validation
npx claude-flow@alpha batch process --items "lint,typecheck,test,build,security-scan" --concurrent
```

## 🎉 Advanced Coordination Examples

### **Complex Feature Development**
```bash
# Multi-agent feature development
npx claude-flow@alpha hive-mind spawn "Implement comprehensive business analytics with dashboard, reports, and data export" \
  --agents "data-analyst,ui-designer,backend-dev,frontend-dev" \
  --namespace analytics \
  --claude

# Follow-up optimization
npx claude-flow@alpha swarm "Optimize analytics queries and add real-time updates" --continue-session
```

### **Emergency Bug Fix**
```bash
# Urgent production issue
npx claude-flow@alpha swarm "URGENT: Fix critical subscription billing issue preventing new signups" --claude

# Immediate testing
npx claude-flow@alpha swarm "Create emergency test suite to validate subscription billing fix" --continue-session

# Deployment validation
npx claude-flow@alpha swarm "Validate fix in staging environment before production deployment" --continue-session
```

---

*These workflows demonstrate how to leverage Claude Flow's capabilities for efficient QuoteKit development across different phases and scenarios.*