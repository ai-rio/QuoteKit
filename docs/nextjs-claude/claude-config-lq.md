# Comprehensive Claude Code Configuration for QuoteKit Development Stack

Claude Code can be transformed into an expert development assistant through strategic configuration that makes it aware of your entire CLI toolchain and development workflow. This research reveals practical patterns for configuring Claude Code to automatically suggest appropriate CLI commands and interventions across your NextJS + Supabase + Stripe stack.

## Core configuration strategy leverages four key mechanisms

**CLAUDE.md files serve as project memory**, providing persistent context across conversations and acting as the primary documentation layer. **Settings hierarchies control permissions and tool access** through JSON configurations at user, project, and enterprise levels. **Model Context Protocol (MCP) servers enable direct integration** with external services like Supabase and Stripe. **Custom commands and hooks automate complex workflows** into simple slash commands while providing intelligent error handling.

The most successful configurations combine hierarchical documentation, security-conscious permissions, automated CLI suggestions, and living context management that evolves with your codebase.

## CLAUDE.md configuration architecture

The foundation starts with a **hierarchical CLAUDE.md structure** that mirrors your project organization. Your root `CLAUDE.md` should document the complete QuoteKit tech stack with essential commands, while subdirectory files provide component-specific context.

**Essential root CLAUDE.md structure:**
```markdown
# QuoteKit Development Context

## Tech Stack Overview
- Frontend: Next.js 15 with App Router + React 19
- Backend: Supabase (PostgreSQL, Auth, Edge Functions, Storage)
- Payments: Stripe with webhook handling
- UI: shadcn/ui + Tailwind CSS
- Analytics: PostHog + Formbricks
- Email: React Email + Resend
- Testing: Playwright (E2E) + Jest (unit)
- Package Manager: Bun
- Deployment: Fly.io + Docker
- Security: Gitleaks + Trivy scanning

## Core Development Commands
- `bun dev` - Start development server
- `bun build` - Production build
- `bun test` - Run Jest unit tests
- `bunx playwright test` - Run E2E tests
- `supabase start` - Local Supabase instance
- `stripe listen --forward-to localhost:3000/webhook` - Webhook testing

## CLI Tool Usage Patterns
### Supabase Operations
- Database migrations: `supabase db diff`, `supabase db push`
- Edge functions: `supabase functions deploy`, `supabase functions logs`
- Auth debugging: `supabase auth users list`, `supabase logs`

### Stripe Integration
- Webhook testing: `stripe trigger payment_intent.succeeded`
- API monitoring: `stripe logs tail`
- Customer management: `stripe customers create`

### Deployment Workflow
- Container build: `docker build -t quotekit .`
- Deploy to Fly.io: `fly deploy`
- Monitor logs: `fly logs`
- Scale application: `fly scale count 3`

## Error Pattern Recognition
- Build failures → Check TypeScript errors, dependency issues
- Test failures → Run individual tests, check mock configurations  
- Webhook issues → Verify Stripe endpoint signatures, check logs
- Database errors → Review migrations, check connection strings
- Deployment problems → Validate Dockerfile, check Fly.io configuration
```

Complement this with **subdirectory CLAUDE.md files** for specific areas:
- `app/CLAUDE.md` - Next.js App Router patterns and conventions
- `supabase/CLAUDE.md` - Database schemas, RLS policies, edge function patterns
- `components/CLAUDE.md` - UI component standards and shadcn/ui usage
- `tests/CLAUDE.md` - Testing strategies and common patterns

## CLI tool integration and MCP server setup

**MCP servers provide the deepest integration** with your development tools. Configure these in your project's `.mcp.json` file:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "bunx",
      "args": ["-y", "@supabase/mcp-server-supabase@latest", "--read-only"],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "${SUPABASE_TOKEN}",
        "SUPABASE_PROJECT_ID": "${SUPABASE_PROJECT_ID}"
      }
    },
    "stripe": {
      "command": "bunx", 
      "args": ["-y", "@stripe/mcp", "--tools=all"],
      "env": {
        "STRIPE_SECRET_KEY": "${STRIPE_SECRET_KEY}"
      }
    }
  }
}
```

**For tools without MCP servers**, document comprehensive CLI patterns in CLAUDE.md that enable intelligent command suggestions. Claude Code automatically recognizes bash environment tools and can suggest appropriate commands based on error patterns and development context.

**Docker integration leverages Docker's built-in AI assistant** through commands like `docker ai "help optimize this Dockerfile for NextJS production"` while **Playwright testing benefits from AI-enhanced tools** like ZeroStep that generate tests from natural language descriptions.

## Custom commands for development workflows

**Slash commands automate complex multi-step workflows** into simple invocations. Store these in `.claude/commands/` directory:

**`/setup-feature.md` - New feature development:**
```markdown
# /setup-feature $FEATURE_NAME

Set up new feature development:
1. Create feature branch: `git checkout -b feature/$FEATURE_NAME`
2. Generate component structure in `app/components/$FEATURE_NAME/`
3. Create Supabase migration if needed: `supabase migration new $FEATURE_NAME`
4. Set up initial tests: `touch tests/$FEATURE_NAME.test.ts`
5. Update documentation in appropriate CLAUDE.md files
```

**`/deploy-check.md` - Pre-deployment validation:**
```markdown
# /deploy-check

Run comprehensive deployment validation:
1. Security scan: `gitleaks detect --source . --verbose`
2. Vulnerability check: `trivy fs . --severity HIGH,CRITICAL`
3. Type checking: `bun run type-check`
4. Test suite: `bun test && bunx playwright test`
5. Build verification: `bun run build`
6. Database migration check: `supabase db diff`
7. Environment validation: verify all required env vars present
```

**`/debug-webhook.md` - Stripe webhook troubleshooting:**
```markdown
# /debug-webhook $EVENT_TYPE

Debug Stripe webhook issues:
1. Start webhook forwarding: `stripe listen --forward-to localhost:3000/webhook`
2. Trigger test event: `stripe trigger $EVENT_TYPE`
3. Check endpoint logs: `stripe logs tail`
4. Verify webhook signature in application logs
5. Test endpoint directly: `curl -X POST localhost:3000/webhook`
```

## Security-conscious permission configuration

**Implement a whitelist-based permission system** in `.claude/settings.json` that provides Claude with necessary access while preventing dangerous operations:

```json
{
  "permissions": {
    "allow": [
      "Read", "Grep", "Glob", "LS",
      "Bash(bun:*)", 
      "Bash(bun:*)",
      "Bash(supabase:*)",
      "Bash(stripe:*)",
      "Bash(docker build:*)",
      "Bash(fly:*)",
      "Bash(git add:*)",
      "Bash(git commit:*)",
      "Bash(gitleaks:*)",
      "Bash(trivy:*)",
      "Write(**/*.ts)",
      "Write(**/*.tsx)",
      "Write(**/*.js)",
      "Write(**/*.json)",
      "Write(**/*.md)"
    ],
    "deny": [
      "Read(./.env*)",
      "Read(./supabase/.env*)",
      "Bash(rm -rf:*)",
      "Bash(git push:*)",
      "Bash(fly destroy:*)",
      "Write(**/*secret*)",
      "Write(**/*key*)"
    ]
  }
}
```

**Environment-specific configurations** enable different permission levels. Use `.claude/settings.local.json` for personal development preferences while keeping team settings in the shared `.claude/settings.json` file.

## Error pattern recognition and automated suggestions

**Context-aware command suggestions emerge from well-documented error patterns**. In your CLAUDE.md files, create comprehensive error mapping sections:

**Common QuoteKit error patterns and CLI responses:**
- **"Module not found" errors** → `bun install`, check package.json dependencies
- **Supabase connection failures** → `supabase status`, verify environment variables, restart local instance
- **Stripe webhook signature verification** → Check endpoint secret, verify request body parsing
- **Build failures with TypeScript** → `bun run type-check`, examine specific type errors
- **E2E test timeouts** → Increase timeout values, check element selectors, verify test data setup
- **Docker build context issues** → Optimize .dockerignore, examine build layer caching
- **Fly.io deployment failures** → Check fly.toml configuration, verify secrets, examine deployment logs

**Implement automation hooks** in `.claude/hooks/` for quality assurance:

**`typescript-quality.sh` - Post-edit TypeScript validation:**
```bash
#!/bin/bash
# Runs after Claude edits TypeScript files
if [[ "$CLAUDE_EDIT_FILES" =~ \.ts$ ]] || [[ "$CLAUDE_EDIT_FILES" =~ \.tsx$ ]]; then
    echo "Running TypeScript validation..."
    bun run type-check
    if [ $? -ne 0 ]; then
        echo "⚠️ TypeScript errors detected. Review changes before proceeding."
    fi
fi
```

## Integration-specific knowledge and context

**Database schema documentation enhances Supabase operations**. Maintain current schema information in `supabase/CLAUDE.md`:

```markdown
# Supabase Database Context

## Core Tables
- `users` - Authentication and profile data with RLS policies
- `quotes` - Main business entities with price calculations
- `payments` - Stripe payment tracking with status management
- `analytics_events` - PostHog event tracking

## Row Level Security Patterns
- User data: `auth.uid() = user_id` filter on all operations
- Public content: specific `public` boolean column checks
- Admin operations: role-based access via `user_roles` table

## Edge Function Deployment
- Payment webhook: `supabase functions deploy stripe-webhook`
- Email notifications: `supabase functions deploy send-notifications`
- Analytics processing: `supabase functions deploy process-analytics`

## Migration Best Practices
- Always test migrations locally first: `supabase db reset`
- Document breaking changes in migration comments
- Use transactions for multi-table operations
```

**Payment flow documentation enables intelligent Stripe debugging**:

```markdown
# Stripe Payment Integration Context

## Payment Flow Architecture
1. Frontend creates Payment Intent via API route
2. Customer completes payment on Stripe Checkout
3. Webhook confirms payment and updates database
4. Success page displays confirmation

## Webhook Event Handling
- `payment_intent.succeeded` - Mark payment as complete
- `payment_intent.payment_failed` - Handle failures gracefully
- `customer.subscription.updated` - Update subscription status

## Testing Workflows
- Local development: Use Stripe test mode + webhook forwarding
- E2E testing: Mock Stripe responses in test environment
- Production validation: Monitor webhook delivery in Stripe dashboard

## Common Debugging Scenarios
- Webhook signature failures: Verify endpoint secret configuration
- Payment Intent creation errors: Check API key permissions
- Checkout session issues: Validate success/cancel URL configurations
```

## Advanced configuration for complex development environments

**Monorepo and multi-service support** requires hierarchical configuration. For projects with multiple services, implement service-specific CLAUDE.md files:

```
quotekit/
├── CLAUDE.md                    # Project overview
├── .claude/
│   ├── commands/               # Global commands
│   └── settings.json          # Project permissions
├── apps/
│   ├── web/
│   │   └── CLAUDE.md          # NextJS app context
│   ├── api/
│   │   └── CLAUDE.md          # Backend API context
│   └── admin/
│       └── CLAUDE.md          # Admin dashboard context
├── packages/
│   ├── ui/
│   │   └── CLAUDE.md          # Shared UI components
│   └── utils/
│       └── CLAUDE.md          # Utility functions
└── supabase/
    └── CLAUDE.md              # Database and edge functions
```

**Cross-service communication patterns** should be documented to enable intelligent debugging suggestions when integration issues arise.

## Maintaining living documentation

**Context freshness requires systematic maintenance**. Implement these practices to keep your configuration effective:

**Automated updates through git hooks**:
- Pre-commit: Validate CLAUDE.md syntax and check for outdated examples
- Post-merge: Update context files when major dependencies change
- Release: Archive outdated patterns and promote new best practices

**Regular review cycles ensure continued relevance**:
- **Weekly**: Update active development areas and current command patterns
- **Monthly**: Review and prune outdated context, update tool versions
- **Quarterly**: Major documentation refactoring and architecture updates

**Version control integration** keeps team configurations synchronized while allowing personal customization through `.claude/settings.local.json` for individual preferences.

## Implementation roadmap

**Phase 1 - Foundation (Week 1)**:
1. Initialize basic CLAUDE.md with tech stack overview
2. Configure essential permissions in settings.json
3. Set up Supabase and Stripe MCP servers
4. Document core development commands

**Phase 2 - Integration (Week 2-3)**:
1. Create custom commands for deployment and testing workflows
2. Implement error pattern documentation
3. Set up automation hooks for code quality
4. Configure subdirectory-specific context files

**Phase 3 - Optimization (Week 4+)**:
1. Monitor CLI command suggestion accuracy
2. Refine permission configurations based on usage patterns
3. Develop team-specific conventions and standards
4. Implement advanced MCP integrations for additional tools

**Success metrics to track**:
- **Development velocity**: Teams report 5-10x productivity improvements
- **Error resolution time**: Automated CLI suggestions reduce debugging cycles
- **Onboarding efficiency**: New developers understand codebase through AI Q&A
- **Code quality**: TDD workflows with AI assistance catch issues earlier

This comprehensive configuration framework transforms Claude Code into an expert development assistant that understands your entire QuoteKit stack, automatically suggests appropriate CLI interventions, and maintains current context as your project evolves. The key is implementing these patterns systematically while maintaining security boundaries and team collaboration standards.