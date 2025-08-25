# Docker-Based Migration Testing Suite

## Overview

The migration testing suite has been updated to work with **Docker-based Supabase** instead of requiring direct PostgreSQL client access. This eliminates the need for local `psql` installation and works seamlessly with Supabase's containerized environment.

## What Changed

### ❌ Old Approach (No longer required)
- Required local PostgreSQL client (`psql`)
- Direct database connections using connection strings
- Manual backup/restore using `pg_dump`
- Complex database URL extraction

### ✅ New Docker Approach
- Uses Supabase CLI Docker interface
- All database operations through `supabase db` commands
- Automatic Docker container management
- Built-in backup/restore capabilities

## Prerequisites

### Required Tools
1. **Supabase CLI** - for database operations
   ```bash
   npm install -g @supabase/cli
   ```

2. **Docker** - for running Supabase containers
   ```bash
   # Verify Docker is running
   docker --version
   ```

3. **Node.js** (optional) - for security function tests
   ```bash
   node --version
   ```

### ❌ No Longer Required
- ~~PostgreSQL client (`psql`)~~
- ~~Direct database connection setup~~
- ~~Manual Docker configuration~~

## Updated Scripts

### 1. Main Test Runner
**File:** `run-migration-tests.sh`

**Changes:**
- Removed `psql` prerequisite check
- Added Docker prerequisite check  
- Integrated Docker connectivity verification
- Updated database validation to use `supabase db shell`

### 2. Migration Test Script
**File:** `local-migration-test.sh`

**Changes:**
- Replaced `pg_dump` with `supabase db dump`
- Updated all SQL queries to use `supabase db shell`
- Simplified database reset using `supabase db reset`
- Removed manual connection string handling

### 3. Security Function Tests
**File:** `security-function-tests.js`

**Changes:**
- Auto-detects Supabase configuration from CLI
- Fallback to default local configuration
- Updated to CommonJS module format for better compatibility

### 4. Database Validation
**Files:** 
- `migration-validation-tests.sql` (original)
- `migration-validation-tests-docker.sql` (new Docker-optimized)

**Changes:**
- Created Docker-compatible SQL validation script
- Removed `psql` formatting commands
- Added clearer test result indicators
- Improved error reporting

### 5. Docker Connectivity Check
**File:** `check-supabase-docker.sh` (new)

**Features:**
- Verifies Supabase CLI installation
- Checks Docker availability
- Tests database connectivity
- Validates query execution
- Reports container status

## Usage

### Quick Start
```bash
# 1. Check Docker setup
./scripts/check-supabase-docker.sh

# 2. Run complete test suite
./scripts/run-migration-tests.sh

# 3. Or run individual components
./scripts/local-migration-test.sh
node scripts/security-function-tests.js
```

### Step-by-Step Process

1. **Verify Prerequisites**
   ```bash
   # Check if everything is ready
   ./scripts/check-supabase-docker.sh
   ```

2. **Start Supabase (if not running)**
   ```bash
   supabase start
   ```

3. **Run Migration Tests**
   ```bash
   # Complete test suite
   ./scripts/run-migration-tests.sh
   
   # Individual tests
   ./scripts/local-migration-test.sh              # Migration lifecycle
   node scripts/security-function-tests.js        # Security validation
   ```

4. **Check Results**
   ```bash
   # View generated reports
   ls -la *.log *.md
   
   # Read comprehensive report
   cat comprehensive-test-report-*.md
   ```

## Key Benefits

### 🐳 Docker Integration
- No local PostgreSQL installation required
- Works with Supabase's containerized environment
- Consistent across development environments

### 🔒 Enhanced Security Testing  
- Comprehensive security function validation
- RLS policy verification
- Admin function access control testing

### 📊 Better Reporting
- Docker-compatible SQL test outputs
- Detailed connectivity diagnostics
- Comprehensive test result summaries

### 🚀 Simplified Workflow
- Single command execution
- Automatic environment verification
- Built-in cleanup and restoration

## Database Operations

### Backup & Restore
```bash
# Create backup (through Docker)
supabase db dump -f backup.sql --use-copy

# Restore database (through Docker) 
supabase db reset
supabase db shell < backup.sql
```

### Running SQL Tests
```bash
# Execute validation tests
supabase db shell < scripts/migration-validation-tests-docker.sql

# Run custom queries
echo "SELECT current_database();" | supabase db shell
```

### Migration Management
```bash
# Check migration status
supabase migration list

# Apply migrations
supabase db push

# Reset database
supabase db reset
```

## Troubleshooting

### Docker Issues
```bash
# Check Docker is running
docker ps

# Restart Docker service if needed
sudo systemctl restart docker  # Linux
# or restart Docker Desktop   # macOS/Windows
```

### Supabase Issues  
```bash
# Check Supabase status
supabase status

# Restart Supabase
supabase stop
supabase start

# Reset if corrupted
supabase db reset
```

### Connection Issues
```bash
# Test basic connectivity
./scripts/check-supabase-docker.sh

# Manual connection test
echo "SELECT 1;" | supabase db shell
```

### Common Error Solutions

**Error: "Docker not found"**
```bash
# Install Docker and ensure it's running
docker --version
```

**Error: "Supabase not running"**  
```bash
# Start Supabase
supabase start
```

**Error: "Database connection failed"**
```bash
# Check containers are running
docker ps --filter "name=supabase"

# Restart if needed
supabase stop && supabase start
```

## File Structure

```
scripts/
├── run-migration-tests.sh              # Main test runner (updated)
├── local-migration-test.sh             # Migration lifecycle tests (updated)
├── security-function-tests.js          # Security validation (updated)
├── migration-validation-tests.sql      # Original SQL tests
├── migration-validation-tests-docker.sql  # Docker-optimized SQL tests (new)
├── check-supabase-docker.sh           # Docker connectivity check (new)
└── README-docker-testing.md           # This documentation (new)
```

## Migration from Old System

If you have the old testing setup:

1. **No code changes required** - scripts automatically detect and use Docker approach
2. **Remove old dependencies** - no need to maintain `psql` installations  
3. **Update CI/CD** - replace `psql` requirements with Docker requirements
4. **Test thoroughly** - run the complete test suite to verify compatibility

## Next Steps

1. **Review test results** - check all generated log files and reports
2. **Validate in staging** - test the same process in staging environment  
3. **Update production deployment** - use Docker-based approach for production
4. **Monitor performance** - ensure Docker overhead is acceptable

---

**✅ The migration testing suite is now fully compatible with Docker-based Supabase development!**