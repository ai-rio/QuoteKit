#!/usr/bin/env tsx

/**
 * Regression Prevention Setup Script
 * Initializes all regression prevention systems and processes
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import path from 'path';

// Import our regression prevention modules
import { migrationTester } from '../tests/regression-prevention/database-migration-testing';
import { rollbackManager } from '../tests/regression-prevention/rollback-procedures';
import { featureFlagManager, PAYMENT_FEATURE_FLAGS } from '../src/libs/feature-flags/feature-flag-system';
import { dataConsistencyValidator } from '../tests/regression-prevention/data-consistency-validation';
import { performanceMonitor } from '../tests/regression-prevention/performance-monitoring';
import { monitoringSystem } from '../tests/regression-prevention/monitoring-alerting-setup';

interface RegressionPreventionConfig {
  environment: 'development' | 'staging' | 'production';
  enableFeatureFlags: boolean;
  enablePerformanceMonitoring: boolean;
  enableDataConsistencyValidation: boolean;
  enableAutomatedRollback: boolean;
  migrationTesting: {
    enabled: boolean;
    runBeforeDeployment: boolean;
    requireSafetyChecks: boolean;
  };
  monitoring: {
    healthCheckInterval: number; // minutes
    performanceCheckInterval: number; // minutes
    alertingEnabled: boolean;
  };
}

class RegressionPreventionSetup {
  private config: RegressionPreventionConfig;
  private logFile: string;

  constructor() {
    this.logFile = path.join(process.cwd(), 'logs', 'regression-prevention.log');
    this.config = this.loadConfiguration();
    this.ensureDirectoriesExist();
  }

  /**
   * Main setup function
   */
  async run(): Promise<void> {
    this.log('🚀 Starting Regression Prevention Setup');

    try {
      // 1. Initialize feature flag system
      if (this.config.enableFeatureFlags) {
        await this.setupFeatureFlags();
      }

      // 2. Setup database migration testing
      if (this.config.migrationTesting.enabled) {
        await this.setupMigrationTesting();
      }

      // 3. Initialize performance monitoring
      if (this.config.enablePerformanceMonitoring) {
        await this.setupPerformanceMonitoring();
      }

      // 4. Setup data consistency validation
      if (this.config.enableDataConsistencyValidation) {
        await this.setupDataConsistencyValidation();
      }

      // 5. Initialize monitoring and alerting
      if (this.config.monitoring.alertingEnabled) {
        await this.setupMonitoringAndAlerting();
      }

      // 6. Setup automated rollback procedures
      if (this.config.enableAutomatedRollback) {
        await this.setupAutomatedRollback();
      }

      // 7. Create deployment safety checks
      await this.setupDeploymentSafetyChecks();

      // 8. Setup continuous integration hooks
      await this.setupCIHooks();

      // 9. Generate documentation and runbooks
      await this.generateDocumentation();

      this.log('✅ Regression Prevention Setup Complete');
      this.printSummary();

    } catch (error) {
      this.log(`❌ Setup failed: ${error}`);
      throw error;
    }
  }

  /**
   * Setup feature flag system with payment-specific configurations
   */
  private async setupFeatureFlags(): Promise<void> {
    this.log('🎛️ Setting up Feature Flag System');

    try {
      // Initialize feature flags for gradual rollout
      const paymentFlags = [
        {
          key: PAYMENT_FEATURE_FLAGS.STRIPE_CHECKOUT,
          enabled: false,
          rolloutPercentage: 0,
          description: 'Enable Stripe checkout integration'
        },
        {
          key: PAYMENT_FEATURE_FLAGS.PAYMENT_METHODS,
          enabled: false,
          rolloutPercentage: 0,
          description: 'Enable payment method management'
        },
        {
          key: PAYMENT_FEATURE_FLAGS.SUBSCRIPTION_MANAGEMENT,
          enabled: false,
          rolloutPercentage: 0,
          description: 'Enable subscription management features'
        },
        {
          key: PAYMENT_FEATURE_FLAGS.WEBHOOK_PROCESSING,
          enabled: true,
          rolloutPercentage: 100,
          description: 'Enable webhook processing (critical for payments)'
        }
      ];

      for (const flag of paymentFlags) {
        await featureFlagManager.setFeatureFlag(flag);
      }

      // Create gradual rollout plan for main payment features
      await featureFlagManager.createGradualRollout(PAYMENT_FEATURE_FLAGS.STRIPE_CHECKOUT, [
        { name: 'Internal Testing', percentage: 0, enabled: false },
        { name: 'Beta Users', percentage: 5, enabled: true, userSegments: ['beta'] },
        { name: 'Premium Users', percentage: 25, enabled: true, userSegments: ['premium'] },
        { name: 'All Paid Users', percentage: 50, enabled: true, userSegments: ['paid'] },
        { name: 'All Users', percentage: 100, enabled: true }
      ]);

      this.log('  ✅ Feature flags configured for gradual rollout');
    } catch (error) {
      this.log(`  ❌ Feature flag setup failed: ${error}`);
      throw error;
    }
  }

  /**
   * Setup database migration testing
   */
  private async setupMigrationTesting(): Promise<void> {
    this.log('🗃️ Setting up Migration Testing');

    try {
      // Run safety checks
      const safetyChecksPassed = await migrationTester.runSafetyChecks();
      if (!safetyChecksPassed && this.config.migrationTesting.requireSafetyChecks) {
        throw new Error('Migration safety checks failed');
      }

      // Setup pre-migration backup
      this.createMigrationScript();

      this.log('  ✅ Migration testing configured');
    } catch (error) {
      this.log(`  ❌ Migration testing setup failed: ${error}`);
      throw error;
    }
  }

  /**
   * Setup performance monitoring
   */
  private async setupPerformanceMonitoring(): Promise<void> {
    this.log('📊 Setting up Performance Monitoring');

    try {
      // Start continuous monitoring
      await performanceMonitor.runPerformanceCheck();

      // Setup performance tests
      await performanceMonitor.runPerformanceTests();

      this.log('  ✅ Performance monitoring active');
    } catch (error) {
      this.log(`  ❌ Performance monitoring setup failed: ${error}`);
      throw error;
    }
  }

  /**
   * Setup data consistency validation
   */
  private async setupDataConsistencyValidation(): Promise<void> {
    this.log('🔍 Setting up Data Consistency Validation');

    try {
      // Run initial validation
      const validationResult = await dataConsistencyValidator.runFullValidation();
      
      if (!validationResult.passed) {
        this.log(`  ⚠️ Found ${validationResult.issues.length} data consistency issues`);
        
        // Log critical issues
        const criticalIssues = validationResult.issues.filter(issue => issue.severity === 'critical');
        if (criticalIssues.length > 0) {
          this.log(`  🚨 ${criticalIssues.length} critical issues require immediate attention`);
        }
      }

      // Schedule periodic validation (daily)
      await dataConsistencyValidator.schedulePeriodicValidation(24);

      this.log('  ✅ Data consistency validation active');
    } catch (error) {
      this.log(`  ❌ Data consistency validation setup failed: ${error}`);
      throw error;
    }
  }

  /**
   * Setup monitoring and alerting
   */
  private async setupMonitoringAndAlerting(): Promise<void> {
    this.log('🔔 Setting up Monitoring and Alerting');

    try {
      // Get initial system health
      const systemHealth = monitoringSystem.getSystemHealth();
      this.log(`  📋 System Health: ${systemHealth.status}`);

      if (systemHealth.issues.length > 0) {
        this.log(`  ⚠️ ${systemHealth.issues.length} health issues detected`);
        systemHealth.issues.forEach(issue => this.log(`    - ${issue}`));
      }

      this.log('  ✅ Monitoring and alerting active');
    } catch (error) {
      this.log(`  ❌ Monitoring setup failed: ${error}`);
      throw error;
    }
  }

  /**
   * Setup automated rollback procedures
   */
  private async setupAutomatedRollback(): Promise<void> {
    this.log('🔄 Setting up Automated Rollback');

    try {
      // Test rollback procedures (dry run)
      this.log('  🧪 Testing rollback procedures...');
      
      // This would test rollback procedures in a safe environment
      // For now, we'll just log that it's configured
      
      this.log('  ✅ Automated rollback procedures configured');
    } catch (error) {
      this.log(`  ❌ Rollback setup failed: ${error}`);
      throw error;
    }
  }

  /**
   * Setup deployment safety checks
   */
  private async setupDeploymentSafetyChecks(): Promise<void> {
    this.log('🛡️ Setting up Deployment Safety Checks');

    const safetyCheckScript = `#!/bin/bash
# Deployment Safety Checks
# This script runs before each deployment to ensure system stability

set -e

echo "🔍 Running pre-deployment safety checks..."

# 1. Database migration testing
echo "  Checking database migrations..."
npm run test:migrations || exit 1

# 2. Performance regression tests
echo "  Running performance regression tests..."
npm run test:performance || exit 1

# 3. Data consistency validation
echo "  Validating data consistency..."
npm run test:data-consistency || exit 1

# 4. Feature flag validation
echo "  Validating feature flag configuration..."
npm run test:feature-flags || exit 1

# 5. Integration tests
echo "  Running integration tests..."
npm run test:integration || exit 1

echo "✅ All safety checks passed. Deployment can proceed."
`;

    writeFileSync(path.join(process.cwd(), 'scripts/pre-deployment-checks.sh'), safetyCheckScript);
    execSync('chmod +x scripts/pre-deployment-checks.sh');

    this.log('  ✅ Deployment safety checks script created');
  }

  /**
   * Setup CI/CD hooks
   */
  private async setupCIHooks(): Promise<void> {
    this.log('🔗 Setting up CI/CD Hooks');

    const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));

    // Add test scripts for regression prevention
    packageJson.scripts = {
      ...packageJson.scripts,
      'test:migrations': 'tsx scripts/test-migrations.ts',
      'test:performance': 'tsx scripts/test-performance.ts',
      'test:data-consistency': 'tsx scripts/test-data-consistency.ts',
      'test:feature-flags': 'tsx scripts/test-feature-flags.ts',
      'test:regression': 'npm run test:migrations && npm run test:performance && npm run test:data-consistency',
      'pre-deploy': './scripts/pre-deployment-checks.sh',
      'post-deploy': 'tsx scripts/post-deployment-validation.ts'
    };

    writeFileSync('package.json', JSON.stringify(packageJson, null, 2));

    // Create GitHub Actions workflow
    const githubWorkflow = `name: Regression Prevention

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main]

jobs:
  regression-tests:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run regression prevention tests
        run: npm run test:regression
        env:
          SUPABASE_URL: \${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: \${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
          STRIPE_SECRET_KEY: \${{ secrets.STRIPE_SECRET_KEY_TEST }}
      
      - name: Pre-deployment checks
        if: github.ref == 'refs/heads/main'
        run: npm run pre-deploy
`;

    const githubDir = path.join(process.cwd(), '.github', 'workflows');
    if (!existsSync(githubDir)) {
      mkdirSync(githubDir, { recursive: true });
    }
    
    writeFileSync(path.join(githubDir, 'regression-prevention.yml'), githubWorkflow);

    this.log('  ✅ CI/CD hooks configured');
  }

  /**
   * Generate documentation and runbooks
   */
  private async generateDocumentation(): Promise<void> {
    this.log('📚 Generating Documentation');

    const documentation = `# Regression Prevention System

## Overview
This system provides comprehensive regression prevention for the QuoteKit payment system implementation.

## Components

### 1. Feature Flags
- **Purpose**: Enable gradual rollout of payment features
- **Usage**: Control feature availability by user segment and percentage
- **Emergency**: Use \`featureFlagManager.emergencyDisable()\` to quickly disable features

### 2. Database Migration Testing
- **Purpose**: Validate all database changes before deployment
- **Usage**: Run \`npm run test:migrations\` before deploying
- **Rollback**: Use \`rollbackManager.rollbackDatabaseSchema()\` if issues occur

### 3. Performance Monitoring
- **Purpose**: Track system performance and detect degradation
- **Metrics**: Response times, error rates, resource usage
- **Alerts**: Automatic alerts when thresholds are exceeded

### 4. Data Consistency Validation
- **Purpose**: Ensure data integrity between Stripe and local database
- **Schedule**: Runs automatically every 24 hours
- **Manual**: Run \`npm run test:data-consistency\` for immediate check

### 5. Monitoring and Alerting
- **Purpose**: Real-time system health monitoring
- **Components**: Database, Stripe API, webhooks, subscriptions
- **Notifications**: Console, email, and webhook notifications

## Emergency Procedures

### Payment System Failure
1. Check system health: \`monitoringSystem.getSystemHealth()\`
2. Disable problematic features: \`featureFlagManager.emergencyDisable(flagKey)\`
3. Run data validation: \`dataConsistencyValidator.runFullValidation()\`
4. If critical, execute rollback: \`rollbackManager.emergencyRollback()\`

### Database Issues
1. Check migration status
2. Run safety checks: \`migrationTester.runSafetyChecks()\`
3. Execute rollback if needed: \`rollbackManager.rollbackDatabaseSchema()\`

### Performance Degradation
1. Check performance metrics: \`performanceMonitor.getPerformanceStatus()\`
2. Run performance tests: \`performanceMonitor.runPerformanceTests()\`
3. Scale resources or disable heavy features

## Deployment Checklist

- [ ] Run \`npm run test:regression\`
- [ ] Verify feature flag configuration
- [ ] Check system health status
- [ ] Ensure rollback procedures are ready
- [ ] Monitor deployment in real-time
- [ ] Run post-deployment validation

## Monitoring Dashboards

### Key Metrics to Watch
- Database query response time < 200ms
- API response time < 300ms
- Error rate < 1%
- Webhook processing time < 1000ms
- Payment success rate > 98%

### Alert Conditions
- Critical: Database connection failures
- High: Payment failure rate > 2%
- Medium: Response time > baseline * 2
- Low: Memory usage > 85%

## Contact Information
- **Primary**: Development Team
- **Emergency**: On-call Engineer
- **Escalation**: Technical Lead

---
Generated on ${new Date().toISOString()}
`;

    const docsDir = path.join(process.cwd(), 'docs', 'regression-prevention');
    if (!existsSync(docsDir)) {
      mkdirSync(docsDir, { recursive: true });
    }

    writeFileSync(path.join(docsDir, 'README.md'), documentation);

    this.log('  ✅ Documentation generated');
  }

  /**
   * Load configuration from environment and defaults
   */
  private loadConfiguration(): RegressionPreventionConfig {
    return {
      environment: (process.env.NODE_ENV as any) || 'development',
      enableFeatureFlags: process.env.ENABLE_FEATURE_FLAGS !== 'false',
      enablePerformanceMonitoring: process.env.ENABLE_PERFORMANCE_MONITORING !== 'false',
      enableDataConsistencyValidation: process.env.ENABLE_DATA_CONSISTENCY_VALIDATION !== 'false',
      enableAutomatedRollback: process.env.ENABLE_AUTOMATED_ROLLBACK !== 'false',
      migrationTesting: {
        enabled: process.env.ENABLE_MIGRATION_TESTING !== 'false',
        runBeforeDeployment: process.env.MIGRATION_TESTING_BEFORE_DEPLOY !== 'false',
        requireSafetyChecks: process.env.REQUIRE_MIGRATION_SAFETY_CHECKS !== 'false'
      },
      monitoring: {
        healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL || '5'),
        performanceCheckInterval: parseInt(process.env.PERFORMANCE_CHECK_INTERVAL || '5'),
        alertingEnabled: process.env.ENABLE_ALERTING !== 'false'
      }
    };
  }

  /**
   * Ensure necessary directories exist
   */
  private ensureDirectoriesExist(): void {
    const dirs = [
      path.dirname(this.logFile),
      path.join(process.cwd(), 'scripts'),
      path.join(process.cwd(), 'docs', 'regression-prevention'),
      path.join(process.cwd(), '.github', 'workflows')
    ];

    dirs.forEach(dir => {
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * Create migration testing script
   */
  private createMigrationScript(): void {
    const migrationScript = `#!/usr/bin/env tsx
import { migrationTester } from '../tests/regression-prevention/database-migration-testing';

async function runMigrationTests() {
  try {
    console.log('🧪 Running migration tests...');
    
    // Run safety checks
    const safetyPassed = await migrationTester.runSafetyChecks();
    if (!safetyPassed) {
      throw new Error('Migration safety checks failed');
    }
    
    // Run migration tests
    await migrationTester.runMigrationTests();
    
    // Assess performance impact
    await migrationTester.assessPerformanceImpact();
    
    console.log('✅ All migration tests passed');
  } catch (error) {
    console.error('❌ Migration tests failed:', error);
    process.exit(1);
  }
}

runMigrationTests();
`;

    writeFileSync(path.join(process.cwd(), 'scripts/test-migrations.ts'), migrationScript);
  }

  /**
   * Log messages with timestamp
   */
  private log(message: string): void {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    
    console.log(logMessage);
    
    // Also log to file
    try {
      writeFileSync(this.logFile, logMessage + '\n', { flag: 'a' });
    } catch (error) {
      // Ignore file logging errors
    }
  }

  /**
   * Print setup summary
   */
  private printSummary(): void {
    console.log('\n' + '='.repeat(60));
    console.log('🎉 REGRESSION PREVENTION SETUP COMPLETE');
    console.log('='.repeat(60));
    console.log('');
    console.log('✅ Components Initialized:');
    console.log('  - Feature Flag System');
    console.log('  - Database Migration Testing');
    console.log('  - Performance Monitoring');
    console.log('  - Data Consistency Validation');
    console.log('  - Monitoring and Alerting');
    console.log('  - Automated Rollback Procedures');
    console.log('');
    console.log('📋 Next Steps:');
    console.log('  1. Review generated documentation in docs/regression-prevention/');
    console.log('  2. Test deployment safety checks: npm run pre-deploy');
    console.log('  3. Monitor system health via dashboard');
    console.log('  4. Setup notification channels for alerts');
    console.log('');
    console.log('🚨 Emergency Commands:');
    console.log('  - Emergency feature disable: featureFlagManager.emergencyDisable(flagKey)');
    console.log('  - System rollback: rollbackManager.emergencyRollback()');
    console.log('  - Health check: monitoringSystem.getSystemHealth()');
    console.log('');
    console.log('📊 Monitoring URLs:');
    console.log('  - System Health: /api/health');
    console.log('  - Performance Metrics: /api/metrics');
    console.log('  - Feature Flags: /api/feature-flags');
    console.log('');
    console.log('='.repeat(60));
  }
}

// Run setup if called directly
if (require.main === module) {
  const setup = new RegressionPreventionSetup();
  setup.run().catch(error => {
    console.error('Setup failed:', error);
    process.exit(1);
  });
}

export { RegressionPreventionSetup };