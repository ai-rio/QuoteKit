# 🌊 Claude Flow Development Guide for QuoteKit

## Overview

This guide demonstrates how to use Claude Flow v2.0.0 Alpha to enhance QuoteKit development workflows. Claude Flow provides AI-powered orchestration that can significantly accelerate development through hive-mind coordination and swarm intelligence.

## 🚀 Quick Setup

### Prerequisites
1. **Claude Code** must be installed and configured
2. **QuoteKit** project environment ready

### Initialize Claude Flow
```bash
# Initialize Claude Flow in QuoteKit project root
npx claude-flow@alpha init --force

# Verify installation
npx claude-flow@alpha --help
```

## 🎯 Development Workflows

### 1. **Bug Fixes & Maintenance** (Use `swarm`)
For quick fixes and isolated issues:

```bash
# Current subscription sync issues
npx claude-flow@alpha swarm "Fix subscription database constraint violations in sync routes" --claude

# TypeScript errors
npx claude-flow@alpha swarm "Resolve TypeScript errors in admin routes" --claude

# Performance optimizations
npx claude-flow@alpha swarm "Optimize slow database queries in dashboard" --claude
```

### 2. **Feature Development** (Use `hive-mind`)
For complex, multi-component features:

```bash
# Advanced quote features
npx claude-flow@alpha hive-mind spawn "Implement advanced quote analytics dashboard" --claude

# Subscription enhancements
npx claude-flow@alpha hive-mind spawn "Build comprehensive subscription management system" --namespace subscriptions --claude

# Client portal development
npx claude-flow@alpha hive-mind spawn "Create client communication portal with quote approval" --namespace client-portal --claude
```

### 3. **Testing & Quality Assurance**
```bash
# Comprehensive testing
npx claude-flow@alpha swarm "Add unit tests for quote PDF generation components" --claude
npx claude-flow@alpha swarm "Implement E2E tests for subscription workflows" --claude

# Security auditing
npx claude-flow@alpha swarm "Audit and secure admin dashboard endpoints" --claude
```

## 🧠 Memory Management for Project Context

### Store Project Knowledge
```bash
# Architecture context
npx claude-flow@alpha memory store "quotekit-architecture" "Next.js 15 + Supabase + Stripe SaaS for lawn care quote management"

# Current issues
npx claude-flow@alpha memory store "subscription-issues" "Database constraint violations in upsertUserSubscription function"

# Development patterns
npx claude-flow@alpha memory store "coding-standards" "Feature-based architecture with TypeScript strict mode and shadcn/ui components"
```

### Query Project Context
```bash
# Retrieve architecture info
npx claude-flow@alpha memory query "architecture" --namespace quotekit

# Check recent issues
npx claude-flow@alpha memory query --recent --limit 5
```

## 🔄 Workflow Automation

### Development Pipeline
```bash
# Create automated development workflow
npx claude-flow@alpha workflow create --name "QuoteKit Development Pipeline" --parallel

# Batch operations for quality checks
npx claude-flow@alpha batch process --items "lint,typecheck,test,build" --concurrent
```

## 📋 QuoteKit-Specific Use Cases

### Current Project Status Tasks
Based on your git status, here are immediate tasks:

```bash
# Address subscription sync issues
npx claude-flow@alpha swarm "Debug and fix subscription database constraint violations in route.ts files" --claude

# Clean up admin routes
npx claude-flow@alpha swarm "Review and optimize admin Stripe configuration endpoints" --claude

# Handle webhook debugging
npx claude-flow@alpha swarm "Improve webhook error handling and debugging capabilities" --claude
```

### Feature Enhancement Tasks
```bash
# Enhanced quote management
npx claude-flow@alpha hive-mind spawn "Implement quote templates with advanced customization" --namespace templates --claude

# Advanced analytics
npx claude-flow@alpha hive-mind spawn "Build comprehensive business analytics dashboard" --namespace analytics --claude

# Mobile optimization
npx claude-flow@alpha swarm "Optimize mobile responsiveness for quote creation interface" --claude
```

### Database & Performance Tasks
```bash
# Database optimization
npx claude-flow@alpha swarm "Optimize Supabase RLS policies for better performance" --claude

# Subscription system improvements
npx claude-flow@alpha hive-mind spawn "Refactor subscription management with improved error handling" --namespace subscriptions --claude
```

## 🛠️ Best Practices for QuoteKit Development

### 1. **Task Classification**
- **Simple fixes**: Use `swarm` commands
- **Complex features**: Use `hive-mind` with namespaces
- **Research tasks**: Use specialized research agents

### 2. **Memory Strategy**
- Store architectural decisions and patterns
- Document common solutions for recurring issues
- Track feature requirements and specifications

### 3. **Session Management**
```bash
# Resume previous work
npx claude-flow@alpha hive-mind status
npx claude-flow@alpha hive-mind resume <session-id>

# Check memory for context
npx claude-flow@alpha memory stats
```

### 4. **Collaboration Patterns**
```bash
# Multi-feature coordination
npx claude-flow@alpha hive-mind spawn "auth-improvements" --namespace auth --claude
npx claude-flow@alpha hive-mind spawn "quote-enhancements" --namespace quotes --claude
```

## 🎯 Common Development Scenarios

### Scenario 1: Adding New Quote Features
```bash
# Research and implement
npx claude-flow@alpha hive-mind spawn "Research and implement quote approval workflow" --agents researcher,architect,coder --claude

# Test and validate
npx claude-flow@alpha swarm "Add comprehensive tests for new quote approval features" --continue-session
```

### Scenario 2: Performance Optimization
```bash
# Analyze and optimize
npx claude-flow@alpha swarm "Profile and optimize slow dashboard loading times" --claude

# Database improvements
npx claude-flow@alpha swarm "Optimize database queries and add proper indexing" --claude
```

### Scenario 3: Bug Investigation
```bash
# Debug complex issues
npx claude-flow@alpha hive-mind spawn "Investigate and fix subscription sync intermittent failures" --agents debugger,analyst --claude
```

## 📊 Monitoring & Progress Tracking

### Check Development Status
```bash
# View active sessions
npx claude-flow@alpha hive-mind sessions

# Check memory usage
npx claude-flow@alpha memory stats

# Review recent activities
npx claude-flow@alpha memory query --recent --limit 10
```

## 🚨 Troubleshooting

### Common Issues
1. **Session Management**: Use `npx claude-flow@alpha hive-mind status` to check active sessions
2. **Memory Queries**: Use specific namespaces for better organization
3. **Task Continuation**: Use `--continue-session` for related tasks

### Reset if Needed
```bash
# Clean restart
npx claude-flow@alpha init --force
```

## 🎉 Integration with Existing QuoteKit Workflow

Claude Flow enhances but doesn't replace your existing development process:

1. **Use alongside normal git workflow**
2. **Leverage for complex problem-solving**
3. **Accelerate feature development**
4. **Improve code quality through AI coordination**

---

*This guide helps you leverage Claude Flow's AI orchestration capabilities specifically for QuoteKit development, making your workflow more efficient and your code more robust.*