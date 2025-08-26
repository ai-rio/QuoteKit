#!/usr/bin/env node

/**
 * Blueprint Migration Rollback Procedures - Task M1.2
 * 
 * Comprehensive rollback utilities for QuoteKit Blueprint migration
 * Provides safe, auditable rollback procedures with data integrity checks
 * Following proven error handling and logging patterns
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuration
const SUPABASE_URL = process.env.LOCAL_SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_SERVICE_ROLE_KEY = process.env.LOCAL_SERVICE_ROLE_KEY || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

class BlueprintRollbackManager {
  constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    this.rollbackLog = path.join(__dirname, `rollback-log-${Date.now()}.txt`);
    this.rollbackManifest = path.join(__dirname, `rollback-manifest-${Date.now()}.json`);
  }

  /**
   * Enhanced logging with severity levels and file output
   */
  log(message, level = 'INFO', writeToFile = true) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level}] ${message}`;
    
    console.log(logEntry);
    
    if (writeToFile) {
      fs.appendFileSync(this.rollbackLog, logEntry + '\n');
    }
  }

  /**
   * Create rollback manifest with current state
   */
  async createRollbackManifest() {
    this.log('Creating rollback manifest...', 'MANIFEST');
    
    try {
      const manifest = {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        migration_type: 'blueprint_properties',
        pre_rollback_state: {},
        rollback_plan: [],
        safety_checks: []
      };

      // Document current properties state
      const { data: properties, error: propsError } = await this.supabase
        .from('properties')
        .select('id, client_id, service_address, is_primary, created_at')
        .order('created_at', { ascending: false });

      if (propsError) {
        throw new Error(`Failed to fetch properties: ${propsError.message}`);
      }

      manifest.pre_rollback_state.properties = {
        count: properties.length,
        sample: properties.slice(0, 5),
        created_today: properties.filter(p => 
          new Date(p.created_at).toDateString() === new Date().toDateString()
        ).length
      };

      // Document quotes with property links
      const { data: linkedQuotes, error: quotesError } = await this.supabase
        .from('quotes')
        .select('id, client_id, property_id, client_name, created_at')
        .not('property_id', 'is', null);

      if (quotesError) {
        throw new Error(`Failed to fetch linked quotes: ${quotesError.message}`);
      }

      manifest.pre_rollback_state.linked_quotes = {
        count: linkedQuotes.length,
        sample: linkedQuotes.slice(0, 5)
      };

      // Define rollback plan
      manifest.rollback_plan = [
        {
          step: 1,
          action: 'backup_current_state',
          description: 'Create backup of current data before rollback',
          estimated_time: '30 seconds'
        },
        {
          step: 2,
          action: 'remove_quote_property_links',
          description: 'Set property_id to NULL in quotes table',
          estimated_time: '15 seconds',
          affected_records: linkedQuotes.length
        },
        {
          step: 3,
          action: 'delete_created_properties',
          description: 'Delete properties created during migration',
          estimated_time: '30 seconds',
          affected_records: properties.length
        },
        {
          step: 4,
          action: 'verify_rollback_completion',
          description: 'Validate rollback was successful',
          estimated_time: '15 seconds'
        }
      ];

      // Define safety checks
      manifest.safety_checks = [
        'Verify no properties exist after rollback',
        'Verify no quotes have property_id set',
        'Verify client data remains intact',
        'Verify quote data remains intact (except property_id)'
      ];

      // Save manifest
      fs.writeFileSync(this.rollbackManifest, JSON.stringify(manifest, null, 2));
      this.log(`Rollback manifest created: ${this.rollbackManifest}`, 'MANIFEST');

      return manifest;

    } catch (error) {
      this.log(`Failed to create rollback manifest: ${error.message}`, 'ERROR');
      throw error;
    }
  }

  /**
   * Backup current state before rollback
   */
  async backupCurrentState() {
    this.log('Backing up current state before rollback...', 'BACKUP');
    
    try {
      const backup = {
        timestamp: new Date().toISOString(),
        backup_type: 'pre_rollback',
        tables: {}
      };

      // Backup properties
      const { data: properties, error: propsError } = await this.supabase
        .from('properties')
        .select('*');

      if (propsError) {
        throw new Error(`Failed to backup properties: ${propsError.message}`);
      }

      backup.tables.properties = properties;
      this.log(`Backed up ${properties.length} properties`, 'BACKUP');

      // Backup quote-property links
      const { data: quoteLinks, error: linksError } = await this.supabase
        .from('quotes')
        .select('id, client_id, property_id, client_name')
        .not('property_id', 'is', null);

      if (linksError) {
        throw new Error(`Failed to backup quote links: ${linksError.message}`);
      }

      backup.tables.quote_property_links = quoteLinks;
      this.log(`Backed up ${quoteLinks.length} quote-property links`, 'BACKUP');

      // Save backup to file
      const backupFile = path.join(__dirname, `rollback-backup-${Date.now()}.json`);
      fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));
      this.log(`Pre-rollback backup saved: ${backupFile}`, 'BACKUP');

      return { backup, backupFile };

    } catch (error) {
      this.log(`Failed to backup current state: ${error.message}`, 'ERROR');
      throw error;
    }
  }

  /**
   * Remove property links from quotes
   */
  async removeQuotePropertyLinks() {
    this.log('Removing property links from quotes...', 'ROLLBACK');
    
    try {
      // First, count affected quotes
      const { data: affectedQuotes, error: countError } = await this.supabase
        .from('quotes')
        .select('id, client_name, property_id')
        .not('property_id', 'is', null);

      if (countError) {
        throw new Error(`Failed to count affected quotes: ${countError.message}`);
      }

      this.log(`Found ${affectedQuotes.length} quotes with property links`, 'ROLLBACK');

      if (affectedQuotes.length === 0) {
        this.log('No quotes with property links found, skipping this step', 'INFO');
        return { updated: 0, skipped: 0 };
      }

      // Update quotes in batches to avoid timeout
      const batchSize = 100;
      let totalUpdated = 0;
      let failures = 0;

      for (let i = 0; i < affectedQuotes.length; i += batchSize) {
        const batch = affectedQuotes.slice(i, i + batchSize);
        const batchIds = batch.map(q => q.id);

        this.log(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(affectedQuotes.length/batchSize)} (${batch.length} quotes)`, 'ROLLBACK');

        const { data, error } = await this.supabase
          .from('quotes')
          .update({ property_id: null })
          .in('id', batchIds)
          .select('id');

        if (error) {
          this.log(`Failed to update batch: ${error.message}`, 'WARNING');
          failures += batch.length;
          continue;
        }

        const updated = data ? data.length : 0;
        totalUpdated += updated;
        this.log(`Batch completed: ${updated}/${batch.length} quotes updated`, 'ROLLBACK');
      }

      this.log(`Quote property links removal completed: ${totalUpdated} updated, ${failures} failures`, 
        failures > 0 ? 'WARNING' : 'SUCCESS');

      return { updated: totalUpdated, failures };

    } catch (error) {
      this.log(`Failed to remove quote property links: ${error.message}`, 'ERROR');
      throw error;
    }
  }

  /**
   * Delete created properties
   */
  async deleteCreatedProperties() {
    this.log('Deleting created properties...', 'ROLLBACK');
    
    try {
      // Get all properties (they should all be created during migration)
      const { data: properties, error: fetchError } = await this.supabase
        .from('properties')
        .select('id, client_id, service_address, created_at');

      if (fetchError) {
        throw new Error(`Failed to fetch properties: ${fetchError.message}`);
      }

      this.log(`Found ${properties.length} properties to delete`, 'ROLLBACK');

      if (properties.length === 0) {
        this.log('No properties found, skipping deletion', 'INFO');
        return { deleted: 0 };
      }

      // Delete properties in batches
      const batchSize = 50;
      let totalDeleted = 0;
      let failures = 0;

      for (let i = 0; i < properties.length; i += batchSize) {
        const batch = properties.slice(i, i + batchSize);
        const batchIds = batch.map(p => p.id);

        this.log(`Deleting batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(properties.length/batchSize)} (${batch.length} properties)`, 'ROLLBACK');

        const { data, error } = await this.supabase
          .from('properties')
          .delete()
          .in('id', batchIds)
          .select('id');

        if (error) {
          this.log(`Failed to delete batch: ${error.message}`, 'WARNING');
          failures += batch.length;
          continue;
        }

        const deleted = data ? data.length : 0;
        totalDeleted += deleted;
        this.log(`Batch completed: ${deleted}/${batch.length} properties deleted`, 'ROLLBACK');
      }

      this.log(`Property deletion completed: ${totalDeleted} deleted, ${failures} failures`, 
        failures > 0 ? 'WARNING' : 'SUCCESS');

      return { deleted: totalDeleted, failures };

    } catch (error) {
      this.log(`Failed to delete properties: ${error.message}`, 'ERROR');
      throw error;
    }
  }

  /**
   * Verify rollback completion
   */
  async verifyRollbackCompletion() {
    this.log('Verifying rollback completion...', 'VERIFICATION');
    
    try {
      const verification = {
        timestamp: new Date().toISOString(),
        checks: [],
        overall_success: true
      };

      // Check 1: No properties should exist
      const { data: remainingProperties, error: propsError } = await this.supabase
        .from('properties')
        .select('id')
        .limit(1);

      if (propsError) {
        throw new Error(`Failed to verify properties: ${propsError.message}`);
      }

      const propertiesCheck = {
        check: 'no_properties_exist',
        passed: remainingProperties.length === 0,
        details: `Found ${remainingProperties.length} remaining properties`
      };
      verification.checks.push(propertiesCheck);
      
      if (!propertiesCheck.passed) {
        verification.overall_success = false;
        this.log(`FAILED: ${remainingProperties.length} properties still exist`, 'ERROR');
      } else {
        this.log('PASSED: No properties exist', 'VERIFICATION');
      }

      // Check 2: No quotes should have property_id
      const { data: linkedQuotes, error: quotesError } = await this.supabase
        .from('quotes')
        .select('id')
        .not('property_id', 'is', null)
        .limit(1);

      if (quotesError) {
        throw new Error(`Failed to verify quote links: ${quotesError.message}`);
      }

      const quotesCheck = {
        check: 'no_quote_property_links',
        passed: linkedQuotes.length === 0,
        details: `Found ${linkedQuotes.length} quotes still linked to properties`
      };
      verification.checks.push(quotesCheck);
      
      if (!quotesCheck.passed) {
        verification.overall_success = false;
        this.log(`FAILED: ${linkedQuotes.length} quotes still have property links`, 'ERROR');
      } else {
        this.log('PASSED: No quotes have property links', 'VERIFICATION');
      }

      // Check 3: Client data integrity
      const { data: clients, error: clientsError } = await this.supabase
        .from('clients')
        .select('id, name, user_id')
        .or('name.is.null,user_id.is.null')
        .limit(1);

      if (clientsError) {
        throw new Error(`Failed to verify clients: ${clientsError.message}`);
      }

      const clientsCheck = {
        check: 'client_data_integrity',
        passed: clients.length === 0,
        details: `Found ${clients.length} clients with integrity issues`
      };
      verification.checks.push(clientsCheck);
      
      if (!clientsCheck.passed) {
        verification.overall_success = false;
        this.log(`FAILED: ${clients.length} clients have data integrity issues`, 'ERROR');
      } else {
        this.log('PASSED: Client data integrity maintained', 'VERIFICATION');
      }

      // Check 4: Quote data integrity (excluding property_id)
      const { data: invalidQuotes, error: quoteIntegrityError } = await this.supabase
        .from('quotes')
        .select('id, client_name, user_id')
        .or('client_name.is.null,user_id.is.null')
        .limit(1);

      if (quoteIntegrityError) {
        throw new Error(`Failed to verify quote integrity: ${quoteIntegrityError.message}`);
      }

      const quoteIntegrityCheck = {
        check: 'quote_data_integrity',
        passed: invalidQuotes.length === 0,
        details: `Found ${invalidQuotes.length} quotes with integrity issues`
      };
      verification.checks.push(quoteIntegrityCheck);
      
      if (!quoteIntegrityCheck.passed) {
        verification.overall_success = false;
        this.log(`FAILED: ${invalidQuotes.length} quotes have data integrity issues`, 'ERROR');
      } else {
        this.log('PASSED: Quote data integrity maintained', 'VERIFICATION');
      }

      // Save verification results
      const verificationFile = path.join(__dirname, `rollback-verification-${Date.now()}.json`);
      fs.writeFileSync(verificationFile, JSON.stringify(verification, null, 2));
      
      this.log(`Rollback verification ${verification.overall_success ? 'PASSED' : 'FAILED'}`, 
        verification.overall_success ? 'SUCCESS' : 'ERROR');
      this.log(`Verification report saved: ${verificationFile}`, 'VERIFICATION');

      return verification;

    } catch (error) {
      this.log(`Failed to verify rollback completion: ${error.message}`, 'ERROR');
      throw error;
    }
  }

  /**
   * Emergency rollback - Aggressive cleanup for critical situations
   */
  async emergencyRollback() {
    this.log('='.repeat(60), 'EMERGENCY');
    this.log('EMERGENCY ROLLBACK INITIATED', 'EMERGENCY');
    this.log('This will forcefully remove all Blueprint migration changes', 'EMERGENCY');
    this.log('='.repeat(60), 'EMERGENCY');

    try {
      // Emergency backup
      await this.backupCurrentState();

      // Force delete all properties
      this.log('EMERGENCY: Force deleting all properties...', 'EMERGENCY');
      const { error: deletePropsError } = await this.supabase
        .from('properties')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (deletePropsError) {
        this.log(`EMERGENCY: Properties deletion failed: ${deletePropsError.message}`, 'EMERGENCY');
      } else {
        this.log('EMERGENCY: All properties deleted', 'EMERGENCY');
      }

      // Force update all quotes to remove property_id
      this.log('EMERGENCY: Force removing all quote property links...', 'EMERGENCY');
      const { error: updateQuotesError } = await this.supabase
        .from('quotes')
        .update({ property_id: null })
        .not('property_id', 'is', null);

      if (updateQuotesError) {
        this.log(`EMERGENCY: Quote links removal failed: ${updateQuotesError.message}`, 'EMERGENCY');
      } else {
        this.log('EMERGENCY: All quote property links removed', 'EMERGENCY');
      }

      // Verify emergency rollback
      const verification = await this.verifyRollbackCompletion();
      
      this.log('='.repeat(60), 'EMERGENCY');
      this.log(`EMERGENCY ROLLBACK ${verification.overall_success ? 'COMPLETED' : 'INCOMPLETE'}`, 'EMERGENCY');
      this.log('='.repeat(60), 'EMERGENCY');

      return verification;

    } catch (error) {
      this.log(`EMERGENCY ROLLBACK FAILED: ${error.message}`, 'EMERGENCY');
      throw error;
    }
  }

  /**
   * Complete rollback procedure
   */
  async executeRollback(options = {}) {
    const startTime = Date.now();
    this.log('='.repeat(60), 'ROLLBACK');
    this.log('Blueprint Migration Rollback Started', 'ROLLBACK');
    this.log('='.repeat(60), 'ROLLBACK');

    try {
      // Step 1: Create rollback manifest
      const manifest = await this.createRollbackManifest();

      // Step 2: Backup current state
      const { backupFile } = await this.backupCurrentState();

      // Step 3: Remove quote property links
      const quoteLinkResults = await this.removeQuotePropertyLinks();

      // Step 4: Delete created properties
      const propertyDeleteResults = await this.deleteCreatedProperties();

      // Step 5: Verify rollback completion
      const verification = await this.verifyRollbackCompletion();

      // Generate rollback report
      const duration = (Date.now() - startTime) / 1000;
      const report = {
        success: verification.overall_success,
        duration_seconds: duration,
        manifest_file: this.rollbackManifest,
        backup_file: backupFile,
        log_file: this.rollbackLog,
        results: {
          quotes_updated: quoteLinkResults.updated || 0,
          quote_failures: quoteLinkResults.failures || 0,
          properties_deleted: propertyDeleteResults.deleted || 0,
          property_failures: propertyDeleteResults.failures || 0
        },
        verification
      };

      this.log('='.repeat(60), 'SUCCESS');
      this.log(`Rollback ${verification.overall_success ? 'COMPLETED SUCCESSFULLY' : 'COMPLETED WITH ISSUES'}`, 'SUCCESS');
      this.log(`Duration: ${duration} seconds`, 'SUCCESS');
      this.log(`Quotes updated: ${quoteLinkResults.updated || 0}`, 'SUCCESS');
      this.log(`Properties deleted: ${propertyDeleteResults.deleted || 0}`, 'SUCCESS');
      this.log(`Backup saved: ${backupFile}`, 'SUCCESS');
      this.log('='.repeat(60), 'SUCCESS');

      return report;

    } catch (error) {
      this.log('='.repeat(60), 'ERROR');
      this.log('Rollback Failed!', 'ERROR');
      this.log(`Error: ${error.message}`, 'ERROR');
      this.log('Consider running emergency rollback if needed', 'ERROR');
      this.log('='.repeat(60), 'ERROR');

      return {
        success: false,
        error: error.message,
        log_file: this.rollbackLog
      };
    }
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  const rollbackManager = new BlueprintRollbackManager();

  switch (command) {
    case 'manifest':
      console.log('Creating rollback manifest only...');
      await rollbackManager.createRollbackManifest();
      break;
    
    case 'verify':
      console.log('Running rollback verification only...');
      await rollbackManager.verifyRollbackCompletion();
      break;
    
    case 'emergency':
      console.log('Running EMERGENCY rollback...');
      await rollbackManager.emergencyRollback();
      break;
    
    case 'execute':
    default:
      console.log('Executing complete rollback procedure...');
      await rollbackManager.executeRollback();
      break;
  }
}

// Export for use as module
module.exports = { BlueprintRollbackManager };

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}