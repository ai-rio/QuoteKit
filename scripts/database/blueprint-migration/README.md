# Blueprint Migration Utilities - Task M1.2

This directory contains comprehensive data migration utilities and validation scripts for the QuoteKit Blueprint implementation, following Sprint Task M1.2 requirements.

## 📁 Files Overview

### Core Utilities
- **`migration-utility.js`** - Main migration utility with data validation and integrity checks
- **`rollback-procedures.js`** - Safe rollback procedures with comprehensive verification
- **`validation-queries.sql`** - Pre/post-migration validation queries and integrity checks
- **`typescript-validation-helpers.ts`** - TypeScript validation and type generation utilities
- **`progress-tracker.js`** - Progress tracking and logging utilities

## 🚀 Quick Start

### 1. Pre-Migration Validation
```bash
# Run validation checks before migration
node migration-utility.js validate

# Check TypeScript compatibility
npm run type-check
```

### 2. Execute Migration
```bash
# Full migration with default properties creation
node migration-utility.js execute

# With progress tracking
node migration-utility.js execute --verbose
```

### 3. Post-Migration Validation
```bash
# Validate migration results
psql -d quotekit -f validation-queries.sql

# Generate and validate TypeScript types
npx ts-node typescript-validation-helpers.ts complete
```

### 4. Rollback (if needed)
```bash
# Standard rollback
node rollback-procedures.js execute

# Emergency rollback (force cleanup)
node rollback-procedures.js emergency
```

## 📊 Migration Process Flow

### Phase 1: Pre-Migration Validation
1. **Data Integrity Checks**
   - Client data validation (required fields, user relationships)
   - Quote-client relationship integrity
   - Duplicate client detection
   - Orphaned quote identification

2. **System Readiness Assessment**
   - Database connection verification
   - Schema compatibility checks
   - TypeScript compilation validation
   - Migration readiness score

### Phase 2: Data Backup & Safety
1. **Comprehensive Backup Creation**
   - Client data backup
   - Quote metadata backup
   - Relationship mappings backup
   - Rollback manifest generation

2. **Safety Procedures**
   - Backup integrity verification
   - Rollback procedure preparation
   - Recovery point establishment

### Phase 3: Migration Execution
1. **Default Property Creation**
   - Generate properties for existing clients
   - Set residential as default type
   - Mark first property as primary
   - Preserve client address as service address

2. **Quote-Property Linking**
   - Link existing quotes to primary properties
   - Update quote table with property_id
   - Maintain quote data integrity
   - Track linking success rate

### Phase 4: Post-Migration Validation
1. **Data Integrity Verification**
   - All clients have properties
   - Quotes properly linked to properties
   - Relationship consistency checks
   - Performance impact assessment

2. **TypeScript Validation**
   - Type generation and compilation
   - Interface compatibility validation
   - Relationship type verification
   - Blueprint pattern testing

## 🛠 Detailed Usage Guide

### Migration Utility (`migration-utility.js`)

```bash
# Commands
node migration-utility.js validate      # Pre-migration validation only
node migration-utility.js backup        # Create backup only
node migration-utility.js execute       # Full migration execution
node migration-utility.js rollback      # Basic rollback
```

**Features:**
- ✅ Comprehensive pre-migration validation
- ✅ Automatic data backup before changes
- ✅ Batch processing for large datasets
- ✅ Progress tracking with detailed logging
- ✅ Post-migration integrity verification
- ✅ Safe rollback procedures

**Error Handling:**
- Graceful failure recovery
- Detailed error logging with context
- Automatic rollback on critical failures
- Data integrity preservation

### Rollback Procedures (`rollback-procedures.js`)

```bash
# Commands
node rollback-procedures.js manifest    # Create rollback manifest
node rollback-procedures.js verify      # Verify rollback completion
node rollback-procedures.js execute     # Standard rollback
node rollback-procedures.js emergency   # Emergency force rollback
```

**Safety Features:**
- ✅ Pre-rollback state documentation
- ✅ Incremental rollback with verification
- ✅ Data preservation checks
- ✅ Emergency recovery procedures

### TypeScript Validation (`typescript-validation-helpers.ts`)

```bash
# Commands
npx ts-node typescript-validation-helpers.ts type-check            # Type checking only
npx ts-node typescript-validation-helpers.ts generate-types        # Generate Supabase types
npx ts-node typescript-validation-helpers.ts validate-relationships # Test relationships
npx ts-node typescript-validation-helpers.ts test-patterns         # Test Blueprint patterns
npx ts-node typescript-validation-helpers.ts complete              # Complete validation suite
```

**TypeScript Features:**
- ✅ Follows proven error reduction methodology (224 → 0 errors)
- ✅ Automatic Supabase type generation
- ✅ Blueprint interface generation
- ✅ Relationship type validation
- ✅ Discriminated union pattern testing

### Progress Tracking (`progress-tracker.js`)

```javascript
const { ProgressTracker } = require('./progress-tracker');

const tracker = new ProgressTracker({
  logLevel: 'INFO',
  enableMetrics: true,
  updateInterval: 1000
});

// Usage in migration scripts
tracker.startPhase('validation', { totalSteps: 100, estimatedDuration: 30000 });
tracker.updatePhaseProgress(50, 100, 'Validating clients');
tracker.completePhase(true, { validatedRecords: 100 });
```

## 📝 Validation Queries (`validation-queries.sql`)

The SQL file contains 16 comprehensive validation queries:

### Pre-Migration Queries (1-5)
- Client data integrity check
- Quote-client relationship validation
- User account verification
- Duplicate client detection
- Migration readiness assessment

### Post-Migration Queries (6-9)
- Property creation validation
- Quote-property linking verification
- Property data integrity check
- Relationship integrity validation

### Rollback Queries (10-11)
- Pre-rollback state documentation
- Post-rollback verification

### Performance Queries (12-13)
- Query performance validation
- Index effectiveness verification

### Data Consistency Queries (14-16)
- Cross-table consistency verification
- TypeScript type validation support
- Foreign key relationship mapping

## 🔧 Configuration & Environment

### Required Environment Variables
```bash
# Local Supabase configuration
LOCAL_SUPABASE_URL=http://127.0.0.1:54321
LOCAL_SERVICE_ROLE_KEY=your-service-role-key

# Optional configuration
LOG_LEVEL=INFO
BATCH_SIZE=50
ENABLE_PROGRESS_TRACKING=true
```

### Dependencies
```json
{
  "@supabase/supabase-js": "^2.x",
  "typescript": "^5.x"
}
```

## 📊 Migration Metrics & Reporting

### Tracked Metrics
- **Performance:** Processing time, memory usage, query performance
- **Data Quality:** Records processed, error count, success rate
- **Progress:** Phase completion, estimated time remaining
- **Integrity:** Validation results, relationship consistency

### Generated Reports
- `migration-log.txt` - Detailed execution log
- `migration-progress.json` - Real-time progress tracking
- `migration-metrics.json` - Performance and quality metrics
- `rollback-manifest.json` - Rollback procedure documentation
- `typescript-validation-report.json` - Type safety validation

## ⚠️ Important Safety Considerations

### Before Running Migration
1. ✅ **Backup Database** - Create full database backup
2. ✅ **Test Environment** - Run on staging first
3. ✅ **Dependency Check** - Ensure all dependencies installed
4. ✅ **TypeScript Validation** - Verify current code compiles
5. ✅ **Rollback Plan** - Review rollback procedures

### During Migration
1. ✅ **Monitor Progress** - Watch logs for errors/warnings
2. ✅ **Resource Usage** - Monitor memory and CPU usage
3. ✅ **Database Load** - Check database performance impact
4. ✅ **Early Intervention** - Stop if critical errors occur

### After Migration
1. ✅ **Validation Suite** - Run all post-migration validations
2. ✅ **TypeScript Check** - Ensure zero compilation errors
3. ✅ **Application Testing** - Verify core functionality
4. ✅ **Performance Check** - Validate response times
5. ✅ **Rollback Readiness** - Keep rollback procedures ready

## 🔄 Integration with Sprint Plan

This migration utility directly supports Sprint Task M1.2 requirements:

### ✅ Primary Objectives Met
- **Migration Utilities** - Complete script for default property creation ✅
- **Validation Scripts** - Comprehensive pre/post migration validation ✅  
- **Rollback Procedures** - Safe, auditable rollback with verification ✅
- **TypeScript Integration** - Type generation and validation following proven patterns ✅
- **Progress Tracking** - Detailed logging and monitoring ✅

### ✅ Quality Requirements Met
- **Existing Patterns** - Follows established migration utility patterns ✅
- **Error Handling** - Comprehensive error handling and recovery ✅
- **Logging** - Detailed progress tracking and audit trail ✅
- **Rollback Support** - Multiple rollback scenarios supported ✅
- **TypeScript Methodology** - Based on proven 224→0 error reduction process ✅

### 🔗 Sprint Integration Points
- **M1.1 Database Migration** - Validates M1.1 changes and provides rollback
- **M1.3 Client Extensions** - Prepares data for client management enhancements  
- **M1.4 Property Manager** - Creates property data for UI components
- **M1.5 Property-Quote Integration** - Establishes property-quote relationships

## 📞 Support & Troubleshooting

### Common Issues & Solutions

**Issue: Migration fails with "No clients found"**
```bash
# Solution: Check database connection and client data
node migration-utility.js validate
```

**Issue: TypeScript errors after migration**
```bash
# Solution: Regenerate types and run validation
npx ts-node typescript-validation-helpers.ts complete
```

**Issue: Rollback incomplete**
```bash
# Solution: Run emergency rollback
node rollback-procedures.js emergency
```

### Log File Locations
- Migration logs: `scripts/database/blueprint-migration/logs/`
- Progress files: `*-progress.json`
- Error reports: `*-errors.json`
- Metrics data: `*-metrics.json`

### Getting Help
1. Check log files for detailed error information
2. Run validation queries to identify specific issues
3. Use rollback procedures if data integrity compromised
4. Review TypeScript validation reports for compilation issues

---

**Last Updated:** 2025-01-26  
**Sprint:** M1.2 - Data Migration Utilities  
**Status:** ✅ Complete - Ready for M1.1 Database Migration Integration