# Development Commands

## Package Management
- `bun install` - Install dependencies (using Bun package manager)
- `npm install` - Alternative package installation

## Development
- `npm run dev` - Start development server with Turbopack (http://localhost:3000)
- `npm run build` - Build production bundle
- `npm run start` - Start production server

## Code Quality
- `npm run lint` - Run ESLint for code linting
- **No explicit format command** - Use Prettier extension in editor or `prettier --write .`

## Database (Supabase)
- `supabase start` - Start local Supabase development environment
- `supabase migration up` - Apply database migrations
- `npm run migration:new <name>` - Create new migration
- `npm run migration:up` - Apply migrations and generate types
- `npm run migration:squash` - Squash migrations
- `npm run generate-types` - Generate TypeScript types from Supabase schema
- `npm run supabase:link` - Link to Supabase project

## Email Development
- `npm run email:dev` - Start email development server (port 3001)
- `npm run email:build` - Build email templates
- `npm run email:export` - Export email templates

## External Services
- `npm run stripe:listen` - Listen to Stripe webhooks (requires Stripe CLI)

## Local Development URLs
- **Application**: http://localhost:3000
- **Database Admin**: http://127.0.0.1:54323 (Supabase Studio)
- **Email Testing**: http://127.0.0.1:54324 (Inbucket)
- **Email Dev Server**: http://localhost:3001 (React Email)

## Testing
**No explicit test commands found** - Tests may need to be set up or check for hidden test scripts

## Git Operations
Standard git commands apply for version control.