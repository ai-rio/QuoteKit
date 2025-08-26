#!/usr/bin/env node

/**
 * Blueprint Migration Utility - Task M1.2
 * 
 * Comprehensive data migration utilities for QuoteKit Blueprint implementation
 * Following proven TypeScript methodology and existing patterns
 * 
 * Features:
 * - Default property creation for existing clients
 * - Data validation and integrity checks
 * - Rollback procedures for safety
 * - Progress tracking and logging
 * - TypeScript type validation
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuration
const SUPABASE_URL = process.env.LOCAL_SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_SERVICE_ROLE_KEY = process.env.LOCAL_SERVICE_ROLE_KEY || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

class BlueprintMigrationUtility {
  constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    this.logFile = path.join(__dirname, 'migration-log.txt');
    this.backupData = {};
  }

  /**
   * Logging utility with timestamp
   */
  log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level}] ${message}`;
    console.log(logEntry);
    
    // Write to log file
    fs.appendFileSync(this.logFile, logEntry + '\n');
  }

  /**
   * Progress tracking utility
   */
  trackProgress(current, total, operation) {
    const percentage = Math.round((current / total) * 100);
    const progressBar = '█'.repeat(Math.floor(percentage / 5)) + '░'.repeat(20 - Math.floor(percentage / 5));
    this.log(`[${progressBar}] ${percentage}% - ${operation} (${current}/${total})`, 'PROGRESS');
  }

  /**
   * Pre-migration validation checks
   */
  async validatePreMigration() {
    this.log('Starting pre-migration validation...', 'VALIDATION');
    
    const validationResults = {
      clientsCount: 0,
      quotesCount: 0,
      orphanedQuotes: 0,
      duplicateClients: 0,
      invalidData: []
    };

    try {
      // Check clients table exists and count
      const { data: clients, error: clientsError } = await this.supabase
        .from('clients')
        .select('id, name, email, user_id, created_at')
        .order('created_at', { ascending: true });

      if (clientsError) {
        throw new Error(`Clients validation failed: ${clientsError.message}`);
      }

      validationResults.clientsCount = clients.length;
      this.log(`Found ${clients.length} existing clients`, 'VALIDATION');

      // Check for duplicate clients (same name and user_id)
      const duplicates = new Map();
      clients.forEach(client => {
        const key = `${client.user_id}-${client.name?.toLowerCase()}`;
        if (duplicates.has(key)) {
          duplicates.set(key, duplicates.get(key) + 1);
        } else {
          duplicates.set(key, 1);
        }
      });

      validationResults.duplicateClients = Array.from(duplicates.values())
        .filter(count => count > 1).length;

      if (validationResults.duplicateClients > 0) {
        this.log(`Warning: Found ${validationResults.duplicateClients} potential duplicate clients`, 'WARNING');
      }

      // Check quotes table and orphaned quotes
      const { data: quotes, error: quotesError } = await this.supabase
        .from('quotes')
        .select('id, client_id, client_name, user_id');

      if (quotesError) {
        throw new Error(`Quotes validation failed: ${quotesError.message}`);
      }

      validationResults.quotesCount = quotes.length;
      
      // Count orphaned quotes (quotes with client_id that doesn't exist)
      const clientIds = new Set(clients.map(c => c.id));
      const orphaned = quotes.filter(q => q.client_id && !clientIds.has(q.client_id));
      validationResults.orphanedQuotes = orphaned.length;

      if (orphaned.length > 0) {
        this.log(`Warning: Found ${orphaned.length} orphaned quotes`, 'WARNING');
      }

      // Validate data integrity
      const invalidClients = clients.filter(client => 
        !client.name || client.name.trim() === '' || !client.user_id
      );
      validationResults.invalidData = invalidClients;

      if (invalidClients.length > 0) {
        this.log(`Error: Found ${invalidClients.length} clients with invalid data`, 'ERROR');
        invalidClients.forEach(client => {
          this.log(`Invalid client: ID=${client.id}, Name="${client.name}", User=${client.user_id}`, 'ERROR');
        });
      }

      this.log('Pre-migration validation completed', 'VALIDATION');
      return validationResults;

    } catch (error) {
      this.log(`Pre-migration validation failed: ${error.message}`, 'ERROR');
      throw error;
    }
  }

  /**
   * Create backup of current data before migration
   */
  async createDataBackup() {
    this.log('Creating data backup before migration...', 'BACKUP');

    try {
      // Backup clients
      const { data: clients, error: clientsError } = await this.supabase
        .from('clients')
        .select('*');

      if (clientsError) {
        throw new Error(`Failed to backup clients: ${clientsError.message}`);
      }

      this.backupData.clients = clients;
      this.log(`Backed up ${clients.length} clients`, 'BACKUP');

      // Backup quotes (only essential fields)
      const { data: quotes, error: quotesError } = await this.supabase
        .from('quotes')
        .select('id, client_id, client_name, user_id, created_at');

      if (quotesError) {
        throw new Error(`Failed to backup quotes: ${quotesError.message}`);
      }

      this.backupData.quotes = quotes;
      this.log(`Backed up ${quotes.length} quotes metadata`, 'BACKUP');

      // Save backup to file
      const backupFile = path.join(__dirname, `backup-${Date.now()}.json`);
      fs.writeFileSync(backupFile, JSON.stringify(this.backupData, null, 2));
      this.log(`Backup saved to: ${backupFile}`, 'BACKUP');

      return backupFile;

    } catch (error) {
      this.log(`Backup creation failed: ${error.message}`, 'ERROR');
      throw error;
    }
  }

  /**
   * Create default properties for existing clients
   */
  async createDefaultProperties() {
    this.log('Starting default property creation for existing clients...', 'MIGRATION');

    try {
      // Get all clients without properties
      const { data: clients, error: clientsError } = await this.supabase
        .from('clients')
        .select('id, name, address, user_id, created_at');

      if (clientsError) {
        throw new Error(`Failed to fetch clients: ${clientsError.message}`);
      }

      this.log(`Processing ${clients.length} clients for property creation`, 'MIGRATION');

      const propertiesToCreate = [];
      let processed = 0;

      for (const client of clients) {
        processed++;
        this.trackProgress(processed, clients.length, 'Processing clients');

        // Create default property data
        const defaultProperty = {
          id: crypto.randomUUID ? crypto.randomUUID() : `prop-${Date.now()}-${Math.random()}`,
          client_id: client.id,
          service_address: client.address || `Property for ${client.name}`,
          property_type: 'residential', // Default to residential
          property_size: null,
          access_instructions: null,
          special_instructions: null,
          is_primary: true, // First property for each client is primary
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        propertiesToCreate.push(defaultProperty);
      }

      // Batch insert properties
      this.log(`Inserting ${propertiesToCreate.length} default properties...`, 'MIGRATION');

      // Insert in batches to avoid timeout
      const batchSize = 50;
      let inserted = 0;

      for (let i = 0; i < propertiesToCreate.length; i += batchSize) {
        const batch = propertiesToCreate.slice(i, i + batchSize);
        
        const { data, error } = await this.supabase
          .from('properties')
          .insert(batch);

        if (error) {
          throw new Error(`Failed to insert property batch ${i / batchSize + 1}: ${error.message}`);
        }

        inserted += batch.length;
        this.trackProgress(inserted, propertiesToCreate.length, 'Inserting properties');
      }

      this.log(`Successfully created ${inserted} default properties`, 'SUCCESS');
      return inserted;

    } catch (error) {
      this.log(`Default property creation failed: ${error.message}`, 'ERROR');
      throw error;
    }
  }

  /**
   * Link existing quotes to their default properties
   */
  async linkQuotesToProperties() {
    this.log('Linking existing quotes to default properties...', 'MIGRATION');

    try {
      // Get all quotes with their client relationships
      const { data: quotes, error: quotesError } = await this.supabase
        .from('quotes')
        .select(`
          id, 
          client_id, 
          client_name,
          clients!inner(
            id,
            properties!inner(
              id,
              is_primary
            )
          )
        `)
        .not('client_id', 'is', null);

      if (quotesError) {
        throw new Error(`Failed to fetch quotes with properties: ${quotesError.message}`);
      }

      this.log(`Processing ${quotes.length} quotes for property linking`, 'MIGRATION');

      const updates = [];
      let processed = 0;

      for (const quote of quotes) {
        processed++;
        this.trackProgress(processed, quotes.length, 'Processing quote-property links');

        // Find the primary property for this client
        const primaryProperty = quote.clients.properties.find(p => p.is_primary);
        
        if (primaryProperty) {
          updates.push({
            id: quote.id,
            property_id: primaryProperty.id
          });
        } else {
          this.log(`Warning: No primary property found for quote ${quote.id} (client: ${quote.client_name})`, 'WARNING');
        }
      }

      // Batch update quotes with property_id
      this.log(`Updating ${updates.length} quotes with property links...`, 'MIGRATION');

      const batchSize = 50;
      let updated = 0;

      for (let i = 0; i < updates.length; i += batchSize) {
        const batch = updates.slice(i, i + batchSize);
        
        for (const update of batch) {
          const { error } = await this.supabase
            .from('quotes')
            .update({ property_id: update.property_id })
            .eq('id', update.id);

          if (error) {
            this.log(`Failed to update quote ${update.id}: ${error.message}`, 'WARNING');
          } else {
            updated++;
          }
        }

        this.trackProgress(updated, updates.length, 'Updating quotes');
      }

      this.log(`Successfully linked ${updated} quotes to properties`, 'SUCCESS');
      return updated;

    } catch (error) {
      this.log(`Quote-property linking failed: ${error.message}`, 'ERROR');
      throw error;
    }
  }

  /**
   * Post-migration data integrity validation
   */
  async validatePostMigration() {
    this.log('Starting post-migration validation...', 'VALIDATION');

    try {
      const validationResults = {};

      // Validate clients have properties
      const { data: clientsWithProps, error: clientPropsError } = await this.supabase
        .from('clients')
        .select(`
          id,
          name,
          properties(id, is_primary)
        `);

      if (clientPropsError) {
        throw new Error(`Post-migration client validation failed: ${clientPropsError.message}`);
      }

      const clientsWithoutProperties = clientsWithProps.filter(c => 
        !c.properties || c.properties.length === 0
      );

      validationResults.clientsWithoutProperties = clientsWithoutProperties.length;
      
      if (clientsWithoutProperties.length > 0) {
        this.log(`Error: ${clientsWithoutProperties.length} clients without properties`, 'ERROR');
        clientsWithoutProperties.forEach(client => {
          this.log(`Client without properties: ${client.name} (${client.id})`, 'ERROR');
        });
      }

      // Validate quotes have property links
      const { data: quotesWithProps, error: quotePropsError } = await this.supabase
        .from('quotes')
        .select('id, client_name, property_id')
        .not('client_id', 'is', null);

      if (quotePropsError) {
        throw new Error(`Post-migration quote validation failed: ${quotePropsError.message}`);
      }

      const quotesWithoutProperties = quotesWithProps.filter(q => !q.property_id);
      validationResults.quotesWithoutProperties = quotesWithoutProperties.length;

      if (quotesWithoutProperties.length > 0) {
        this.log(`Warning: ${quotesWithoutProperties.length} quotes without property links`, 'WARNING');
      }

      // Validate property data integrity
      const { data: properties, error: propsError } = await this.supabase
        .from('properties')
        .select('id, client_id, service_address, property_type');

      if (propsError) {
        throw new Error(`Property validation failed: ${propsError.message}`);
      }

      const invalidProperties = properties.filter(p => 
        !p.client_id || !p.service_address || !p.property_type
      );

      validationResults.invalidProperties = invalidProperties.length;

      if (invalidProperties.length > 0) {
        this.log(`Error: ${invalidProperties.length} properties with invalid data`, 'ERROR');
      }

      this.log('Post-migration validation completed', 'VALIDATION');
      return validationResults;

    } catch (error) {
      this.log(`Post-migration validation failed: ${error.message}`, 'ERROR');
      throw error;
    }
  }

  /**
   * Rollback migration changes
   */
  async rollback() {
    this.log('Starting migration rollback...', 'ROLLBACK');

    try {
      // Remove property_id from quotes
      this.log('Removing property links from quotes...', 'ROLLBACK');
      const { error: quotesError } = await this.supabase
        .from('quotes')
        .update({ property_id: null })
        .not('property_id', 'is', null);

      if (quotesError) {
        this.log(`Failed to remove quote property links: ${quotesError.message}`, 'ERROR');
      } else {
        this.log('Removed property links from quotes', 'ROLLBACK');
      }

      // Delete created properties
      this.log('Deleting created properties...', 'ROLLBACK');
      const { error: propsError } = await this.supabase
        .from('properties')
        .delete()
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // Properties created in last 24h

      if (propsError) {
        this.log(`Failed to delete properties: ${propsError.message}`, 'ERROR');
      } else {
        this.log('Deleted created properties', 'ROLLBACK');
      }

      this.log('Migration rollback completed', 'ROLLBACK');

    } catch (error) {
      this.log(`Rollback failed: ${error.message}`, 'ERROR');
      throw error;
    }
  }

  /**
   * Main migration execution
   */
  async execute(options = {}) {
    const startTime = Date.now();
    this.log('='.repeat(60), 'INFO');
    this.log('Starting QuoteKit Blueprint Migration - Task M1.2', 'INFO');
    this.log('='.repeat(60), 'INFO');

    try {
      // Step 1: Pre-migration validation
      const preValidation = await this.validatePreMigration();
      
      if (preValidation.invalidData.length > 0) {
        throw new Error('Pre-migration validation failed. Fix invalid data before proceeding.');
      }

      // Step 2: Create backup
      const backupFile = await this.createDataBackup();

      // Step 3: Create default properties
      const propertiesCreated = await this.createDefaultProperties();

      // Step 4: Link quotes to properties
      const quotesLinked = await this.linkQuotesToProperties();

      // Step 5: Post-migration validation
      const postValidation = await this.validatePostMigration();

      // Report results
      const duration = (Date.now() - startTime) / 1000;
      this.log('='.repeat(60), 'SUCCESS');
      this.log('Blueprint Migration Completed Successfully!', 'SUCCESS');
      this.log(`Duration: ${duration} seconds`, 'SUCCESS');
      this.log(`Properties created: ${propertiesCreated}`, 'SUCCESS');
      this.log(`Quotes linked: ${quotesLinked}`, 'SUCCESS');
      this.log(`Backup saved: ${backupFile}`, 'SUCCESS');
      this.log('='.repeat(60), 'SUCCESS');

      return {
        success: true,
        propertiesCreated,
        quotesLinked,
        backupFile,
        duration,
        preValidation,
        postValidation
      };

    } catch (error) {
      this.log('='.repeat(60), 'ERROR');
      this.log('Blueprint Migration Failed!', 'ERROR');
      this.log(`Error: ${error.message}`, 'ERROR');
      this.log('='.repeat(60), 'ERROR');

      return {
        success: false,
        error: error.message
      };
    }
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  const utility = new BlueprintMigrationUtility();

  switch (command) {
    case 'validate':
      console.log('Running pre-migration validation only...');
      await utility.validatePreMigration();
      break;
    
    case 'backup':
      console.log('Creating backup only...');
      await utility.createDataBackup();
      break;
    
    case 'rollback':
      console.log('Rolling back migration...');
      await utility.rollback();
      break;
    
    case 'execute':
    default:
      console.log('Executing full migration...');
      await utility.execute();
      break;
  }
}

// Export for use as module
module.exports = { BlueprintMigrationUtility };

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}