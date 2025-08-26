#!/usr/bin/env node

/**
 * TypeScript Validation Helpers - Task M1.2
 * 
 * Comprehensive TypeScript validation utilities for Blueprint migration
 * Following proven TypeScript methodology and error reduction patterns
 * Based on the documented approach that reduced errors from 224 to 0
 */

import { createClient } from '@supabase/supabase-js';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Types for our validation system
interface ValidationResult {
  success: boolean;
  errorCount: number;
  errorsByType: Record<string, number>;
  criticalErrors: string[];
  warnings: string[];
  suggestions: string[];
}

interface TypeGenerationResult {
  success: boolean;
  typesGenerated: boolean;
  generatedFiles: string[];
  errors: string[];
}

interface RelationshipValidation {
  table: string;
  relationships: Array<{
    name: string;
    isOptional: boolean;
    targetTable: string;
    isValid: boolean;
    issues: string[];
  }>;
}

class TypeScriptValidationHelper {
  private logFile: string;
  private projectRoot: string;
  private supabaseUrl: string;
  private supabaseKey: string;

  constructor() {
    this.logFile = path.join(__dirname, `typescript-validation-${Date.now()}.log`);
    this.projectRoot = path.resolve(__dirname, '../../../');
    this.supabaseUrl = process.env.LOCAL_SUPABASE_URL || 'http://127.0.0.1:54321';
    this.supabaseKey = process.env.LOCAL_SERVICE_ROLE_KEY || 
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
  }

  /**
   * Enhanced logging utility
   */
  private log(message: string, level: 'INFO' | 'ERROR' | 'WARNING' | 'SUCCESS' = 'INFO'): void {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level}] ${message}`;
    
    console.log(logEntry);
    fs.appendFileSync(this.logFile, logEntry + '\n');
  }

  /**
   * Run TypeScript type checking using the proven methodology
   */
  async runTypeCheck(): Promise<ValidationResult> {
    this.log('Running TypeScript type checking...', 'INFO');
    
    try {
      // Use the proven command pattern from the documentation
      const typeCheckCommand = 'npm run type-check 2>&1';
      const output = execSync(typeCheckCommand, { 
        cwd: this.projectRoot,
        encoding: 'utf-8',
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer for large outputs
      });

      // Parse TypeScript errors using the documented methodology
      const errorPattern = /error TS(\d+):/g;
      const errors = output.match(errorPattern) || [];
      
      // Count total errors
      const totalErrorsCommand = `echo "${output}" | grep -c "error TS" || echo "0"`;
      const errorCount = parseInt(execSync(totalErrorsCommand, { encoding: 'utf-8' }).trim());

      // Categorize errors by type (following documented approach)
      const errorsByType: Record<string, number> = {};
      const errorTypeCommand = `echo "${output}" | grep -E "error TS[0-9]+" | sed 's/.*error \\(TS[0-9]*\\).*/\\1/' | sort | uniq -c | sort -nr`;
      
      try {
        const errorBreakdown = execSync(errorTypeCommand, { encoding: 'utf-8', cwd: this.projectRoot });
        const lines = errorBreakdown.trim().split('\n');
        
        for (const line of lines) {
          const match = line.trim().match(/^\s*(\d+)\s+(TS\d+)$/);
          if (match) {
            const count = parseInt(match[1]);
            const errorType = match[2];
            errorsByType[errorType] = count;
          }
        }
      } catch (error) {
        this.log('Could not categorize errors by type', 'WARNING');
      }

      // Identify critical error types based on documented patterns
      const criticalErrorTypes = ['TS2339', 'TS18047', 'TS7006', 'TS2353', 'TS2323'];
      const criticalErrors = Object.keys(errorsByType)
        .filter(errorType => criticalErrorTypes.includes(errorType))
        .map(errorType => `${errorType}: ${errorsByType[errorType]} occurrences`);

      // Generate warnings and suggestions
      const warnings: string[] = [];
      const suggestions: string[] = [];

      if (errorsByType['TS2339']) {
        warnings.push(`TS2339 Property access errors detected (${errorsByType['TS2339']} occurrences)`);
        suggestions.push('Review database relationship types and optional property definitions');
      }

      if (errorsByType['TS18047']) {
        warnings.push(`TS18047 Possibly null errors detected (${errorsByType['TS18047']} occurrences)`);
        suggestions.push('Add proper null safety with assertions and optional chaining');
      }

      if (errorsByType['TS7006']) {
        warnings.push(`TS7006 Implicit any parameters detected (${errorsByType['TS7006']} occurrences)`);
        suggestions.push('Add explicit type annotations for function parameters');
      }

      if (errorCount === 0) {
        this.log('✅ TypeScript validation PASSED - Zero errors found!', 'SUCCESS');
      } else {
        this.log(`❌ TypeScript validation FAILED - ${errorCount} errors found`, 'ERROR');
      }

      return {
        success: errorCount === 0,
        errorCount,
        errorsByType,
        criticalErrors,
        warnings,
        suggestions
      };

    } catch (error) {
      this.log(`TypeScript type checking failed: ${error}`, 'ERROR');
      return {
        success: false,
        errorCount: -1,
        errorsByType: {},
        criticalErrors: ['Type checking command failed'],
        warnings: [],
        suggestions: ['Ensure npm dependencies are installed and project is properly configured']
      };
    }
  }

  /**
   * Generate Supabase types after migration
   */
  async generateSupabaseTypes(): Promise<TypeGenerationResult> {
    this.log('Generating Supabase TypeScript types...', 'INFO');
    
    try {
      const generatedFiles: string[] = [];
      
      // Generate types using Supabase CLI
      const typeGenCommand = 'npx supabase gen types typescript --local';
      const output = execSync(typeGenCommand, {
        cwd: this.projectRoot,
        encoding: 'utf-8',
        maxBuffer: 1024 * 1024 * 5 // 5MB buffer
      });

      // Save generated types to file
      const typesFile = path.join(this.projectRoot, 'src/types/supabase-generated.ts');
      fs.writeFileSync(typesFile, output);
      generatedFiles.push(typesFile);
      
      this.log(`✅ Supabase types generated successfully: ${typesFile}`, 'SUCCESS');

      // Validate the generated types compile correctly
      try {
        execSync(`npx tsc --noEmit ${typesFile}`, {
          cwd: this.projectRoot,
          encoding: 'utf-8'
        });
        
        this.log('✅ Generated types compile successfully', 'SUCCESS');
        
        return {
          success: true,
          typesGenerated: true,
          generatedFiles,
          errors: []
        };
      } catch (compileError) {
        this.log(`⚠️ Generated types have compilation issues: ${compileError}`, 'WARNING');
        
        return {
          success: false,
          typesGenerated: true,
          generatedFiles,
          errors: [`Type compilation failed: ${compileError}`]
        };
      }

    } catch (error) {
      this.log(`Failed to generate Supabase types: ${error}`, 'ERROR');
      return {
        success: false,
        typesGenerated: false,
        generatedFiles: [],
        errors: [`Type generation failed: ${error}`]
      };
    }
  }

  /**
   * Validate database relationship types
   */
  async validateRelationshipTypes(): Promise<RelationshipValidation[]> {
    this.log('Validating database relationship types...', 'INFO');
    
    const supabase = createClient(this.supabaseUrl, this.supabaseKey);
    const validations: RelationshipValidation[] = [];

    try {
      // Validate Client-Property relationship
      const clientValidation: RelationshipValidation = {
        table: 'clients',
        relationships: []
      };

      // Test client properties relationship
      try {
        const { data, error } = await supabase
          .from('clients')
          .select(`
            id,
            name,
            properties(
              id,
              service_address,
              property_type
            )
          `)
          .limit(1);

        clientValidation.relationships.push({
          name: 'properties',
          isOptional: true,
          targetTable: 'properties',
          isValid: !error,
          issues: error ? [error.message] : []
        });

        if (error) {
          this.log(`Client-Properties relationship validation failed: ${error.message}`, 'ERROR');
        } else {
          this.log('✅ Client-Properties relationship validated', 'SUCCESS');
        }
      } catch (relationshipError) {
        clientValidation.relationships.push({
          name: 'properties',
          isOptional: true,
          targetTable: 'properties',
          isValid: false,
          issues: [`Relationship query failed: ${relationshipError}`]
        });
      }

      validations.push(clientValidation);

      // Validate Property-Quote relationship
      const propertyValidation: RelationshipValidation = {
        table: 'properties',
        relationships: []
      };

      try {
        const { data, error } = await supabase
          .from('properties')
          .select(`
            id,
            service_address,
            quotes(
              id,
              client_name,
              total
            )
          `)
          .limit(1);

        propertyValidation.relationships.push({
          name: 'quotes',
          isOptional: true,
          targetTable: 'quotes',
          isValid: !error,
          issues: error ? [error.message] : []
        });

        if (error) {
          this.log(`Property-Quotes relationship validation failed: ${error.message}`, 'ERROR');
        } else {
          this.log('✅ Property-Quotes relationship validated', 'SUCCESS');
        }
      } catch (relationshipError) {
        propertyValidation.relationships.push({
          name: 'quotes',
          isOptional: true,
          targetTable: 'quotes',
          isValid: false,
          issues: [`Relationship query failed: ${relationshipError}`]
        });
      }

      validations.push(propertyValidation);

      // Validate Quote-Property relationship (reverse)
      const quoteValidation: RelationshipValidation = {
        table: 'quotes',
        relationships: []
      };

      try {
        const { data, error } = await supabase
          .from('quotes')
          .select(`
            id,
            client_name,
            properties(
              id,
              service_address,
              property_type
            )
          `)
          .not('property_id', 'is', null)
          .limit(1);

        quoteValidation.relationships.push({
          name: 'properties',
          isOptional: true,
          targetTable: 'properties',
          isValid: !error,
          issues: error ? [error.message] : []
        });

        if (error) {
          this.log(`Quote-Properties relationship validation failed: ${error.message}`, 'ERROR');
        } else {
          this.log('✅ Quote-Properties relationship validated', 'SUCCESS');
        }
      } catch (relationshipError) {
        quoteValidation.relationships.push({
          name: 'properties',
          isOptional: true,
          targetTable: 'properties',
          isValid: false,
          issues: [`Relationship query failed: ${relationshipError}`]
        });
      }

      validations.push(quoteValidation);

      return validations;

    } catch (error) {
      this.log(`Relationship type validation failed: ${error}`, 'ERROR');
      return validations;
    }
  }

  /**
   * Test specific TypeScript patterns from Blueprint implementation
   */
  async testBlueprintTypePatterns(): Promise<ValidationResult> {
    this.log('Testing Blueprint-specific TypeScript patterns...', 'INFO');
    
    try {
      // Test property interface patterns
      const testFiles = [
        'src/features/clients/components/ClientForm.tsx',
        'src/features/quotes/components/QuoteCreator.tsx',
        'src/features/clients/actions/client-actions.ts'
      ];

      const errors: string[] = [];
      const warnings: string[] = [];
      const suggestions: string[] = [];

      for (const testFile of testFiles) {
        const fullPath = path.join(this.projectRoot, testFile);
        
        if (fs.existsSync(fullPath)) {
          try {
            // Test compilation of specific Blueprint files
            execSync(`npx tsc --noEmit ${fullPath}`, {
              cwd: this.projectRoot,
              encoding: 'utf-8'
            });
            
            this.log(`✅ ${testFile} compiles successfully`, 'SUCCESS');
          } catch (compileError) {
            const errorMessage = `${testFile}: ${compileError}`;
            errors.push(errorMessage);
            this.log(`❌ ${testFile} has compilation issues`, 'ERROR');
          }
        } else {
          warnings.push(`Blueprint file not found: ${testFile}`);
        }
      }

      // Test discriminated union patterns for property types
      const discriminatedUnionTest = `
        interface PropertyCreateData {
          client_id: string;
          service_address: string;
          property_type: 'residential' | 'commercial';
        }
        
        interface PropertyWithClient {
          id: string;
          client_id: string;
          service_address: string;
          property_type: 'residential' | 'commercial';
          clients?: {
            id: string;
            name: string;
            company_name: string | null;
          };
        }
        
        const testProperty: PropertyWithClient = {
          id: '123',
          client_id: '456',
          service_address: 'Test Address',
          property_type: 'residential'
        };
      `;

      const testFile = path.join(__dirname, 'test-types.ts');
      fs.writeFileSync(testFile, discriminatedUnionTest);
      
      try {
        execSync(`npx tsc --noEmit ${testFile}`, {
          cwd: this.projectRoot,
          encoding: 'utf-8'
        });
        
        this.log('✅ Discriminated union patterns validate successfully', 'SUCCESS');
        fs.unlinkSync(testFile); // Clean up
      } catch (patternError) {
        errors.push(`Discriminated union pattern validation failed: ${patternError}`);
        suggestions.push('Review property type interface definitions');
        fs.unlinkSync(testFile); // Clean up
      }

      return {
        success: errors.length === 0,
        errorCount: errors.length,
        errorsByType: errors.length > 0 ? { 'Blueprint': errors.length } : {},
        criticalErrors: errors,
        warnings,
        suggestions
      };

    } catch (error) {
      this.log(`Blueprint type pattern testing failed: ${error}`, 'ERROR');
      return {
        success: false,
        errorCount: 1,
        errorsByType: { 'TestFailure': 1 },
        criticalErrors: [`Pattern testing failed: ${error}`],
        warnings: [],
        suggestions: ['Ensure TypeScript compiler is available and project is properly configured']
      };
    }
  }

  /**
   * Generate TypeScript interface definitions for new Blueprint tables
   */
  async generateBlueprintInterfaces(): Promise<void> {
    this.log('Generating Blueprint TypeScript interfaces...', 'INFO');
    
    const interfaceDefinitions = `
/**
 * Blueprint Migration TypeScript Interfaces
 * Generated for QuoteKit Blueprint implementation
 * Following proven discriminated union patterns
 */

// Property Types
export type PropertyType = 'residential' | 'commercial';
export type PropertyStatus = 'active' | 'inactive';

// Base Property Interface
export interface Property {
  id: string;
  client_id: string;
  service_address: string;
  property_type: PropertyType;
  property_size?: number | null;
  access_instructions?: string | null;
  special_instructions?: string | null;
  is_primary: boolean;
  status: PropertyStatus;
  created_at: string;
  updated_at: string;
}

// Property with Client Relationship (for joins)
export interface PropertyWithClient extends Property {
  clients?: {
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
    company_name?: string | null;
    client_status?: 'lead' | 'active' | 'inactive';
  };
}

// Property Creation Data
export interface PropertyCreateData {
  client_id: string;
  service_address: string;
  property_type: PropertyType;
  property_size?: number | null;
  access_instructions?: string | null;
  special_instructions?: string | null;
  is_primary?: boolean;
  status?: PropertyStatus;
}

// Property Update Data
export interface PropertyUpdateData {
  service_address?: string;
  property_type?: PropertyType;
  property_size?: number | null;
  access_instructions?: string | null;
  special_instructions?: string | null;
  is_primary?: boolean;
  status?: PropertyStatus;
}

// Extended Client with Properties
export interface ClientWithProperties {
  id: string;
  user_id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  notes?: string | null;
  company_name?: string | null;
  client_status?: 'lead' | 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  // Relationship
  properties?: Property[];
}

// Extended Quote with Property
export interface QuoteWithProperty {
  id: string;
  user_id: string;
  client_id?: string | null;
  property_id?: string | null;
  client_name: string;
  client_contact?: string | null;
  quote_number?: string | null;
  quote_data: any; // JSONB
  subtotal: number;
  tax_rate: number;
  markup_rate: number;
  total: number;
  status: 'draft' | 'sent' | 'accepted' | 'declined' | 'expired' | 'converted';
  sent_at?: string | null;
  expires_at?: string | null;
  follow_up_date?: string | null;
  notes?: string | null;
  is_template: boolean;
  template_name?: string | null;
  created_at: string;
  updated_at: string;
  // Relationships
  clients?: ClientWithProperties;
  properties?: Property;
}

// Property Manager Component Props
export interface PropertyManagerProps {
  mode: 'create' | 'edit' | 'view';
  clientId?: string;
  property?: Property;
  onSubmit?: (data: PropertyCreateData | PropertyUpdateData) => Promise<ActionResponse<Property>>;
  onCancel?: () => void;
  readonly?: boolean;
}

// Property Selector Component Props  
export interface PropertySelectorProps {
  clientId: string;
  selectedPropertyId?: string | null;
  onPropertySelect: (propertyId: string) => void;
  onCreateProperty?: () => void;
  showCreateOption?: boolean;
}

// Action Response Pattern (consistent with existing codebase)
export interface ActionResponse<T = any> {
  data: T | null;
  error: any;
  success?: boolean;
}

// Property Service Actions
export interface PropertyActions {
  createProperty: (data: PropertyCreateData) => Promise<ActionResponse<Property>>;
  updateProperty: (id: string, data: PropertyUpdateData) => Promise<ActionResponse<Property>>;
  deleteProperty: (id: string) => Promise<ActionResponse<void>>;
  getPropertiesByClient: (clientId: string) => Promise<ActionResponse<Property[]>>;
  getPropertyWithClient: (id: string) => Promise<ActionResponse<PropertyWithClient>>;
}

// Migration Utility Types
export interface MigrationValidationResult {
  success: boolean;
  clientsProcessed: number;
  propertiesCreated: number;
  quotesLinked: number;
  errors: string[];
  warnings: string[];
}

export interface RollbackResult {
  success: boolean;
  propertiesDeleted: number;
  quotesUnlinked: number;
  errors: string[];
}
`;

    const interfacesFile = path.join(this.projectRoot, 'src/types/blueprint-generated.ts');
    fs.writeFileSync(interfacesFile, interfaceDefinitions);
    
    this.log(`✅ Blueprint interfaces generated: ${interfacesFile}`, 'SUCCESS');

    // Test that the generated interfaces compile
    try {
      execSync(`npx tsc --noEmit ${interfacesFile}`, {
        cwd: this.projectRoot,
        encoding: 'utf-8'
      });
      
      this.log('✅ Generated Blueprint interfaces compile successfully', 'SUCCESS');
    } catch (compileError) {
      this.log(`⚠️ Generated interfaces have compilation issues: ${compileError}`, 'WARNING');
    }
  }

  /**
   * Complete TypeScript validation suite
   */
  async runCompleteValidation(): Promise<{
    typeCheck: ValidationResult;
    typeGeneration: TypeGenerationResult;
    relationshipValidation: RelationshipValidation[];
    blueprintPatterns: ValidationResult;
    overallSuccess: boolean;
  }> {
    const startTime = Date.now();
    this.log('='.repeat(60), 'INFO');
    this.log('Starting Complete TypeScript Validation Suite', 'INFO');
    this.log('='.repeat(60), 'INFO');

    try {
      // Step 1: Generate Supabase types
      const typeGeneration = await this.generateSupabaseTypes();

      // Step 2: Generate Blueprint interfaces
      await this.generateBlueprintInterfaces();

      // Step 3: Run TypeScript type checking
      const typeCheck = await this.runTypeCheck();

      // Step 4: Validate relationship types
      const relationshipValidation = await this.validateRelationshipTypes();

      // Step 5: Test Blueprint-specific patterns
      const blueprintPatterns = await this.testBlueprintTypePatterns();

      // Calculate overall success
      const overallSuccess = typeCheck.success && 
                            typeGeneration.success && 
                            blueprintPatterns.success &&
                            relationshipValidation.every(rv => 
                              rv.relationships.every(r => r.isValid)
                            );

      const duration = (Date.now() - startTime) / 1000;

      this.log('='.repeat(60), overallSuccess ? 'SUCCESS' : 'ERROR');
      this.log(`TypeScript Validation ${overallSuccess ? 'COMPLETED SUCCESSFULLY' : 'COMPLETED WITH ISSUES'}`, 
        overallSuccess ? 'SUCCESS' : 'ERROR');
      this.log(`Duration: ${duration} seconds`, 'INFO');
      this.log(`Total TypeScript errors: ${typeCheck.errorCount}`, 
        typeCheck.errorCount === 0 ? 'SUCCESS' : 'ERROR');
      this.log(`Types generated: ${typeGeneration.typesGenerated ? 'Yes' : 'No'}`, 
        typeGeneration.typesGenerated ? 'SUCCESS' : 'ERROR');
      this.log('='.repeat(60), overallSuccess ? 'SUCCESS' : 'ERROR');

      // Save comprehensive validation report
      const report = {
        timestamp: new Date().toISOString(),
        duration_seconds: duration,
        overall_success: overallSuccess,
        type_check: typeCheck,
        type_generation: typeGeneration,
        relationship_validation: relationshipValidation,
        blueprint_patterns: blueprintPatterns
      };

      const reportFile = path.join(__dirname, `typescript-validation-report-${Date.now()}.json`);
      fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
      this.log(`Validation report saved: ${reportFile}`, 'INFO');

      return {
        typeCheck,
        typeGeneration,
        relationshipValidation,
        blueprintPatterns,
        overallSuccess
      };

    } catch (error) {
      this.log(`Complete validation failed: ${error}`, 'ERROR');
      throw error;
    }
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  const validator = new TypeScriptValidationHelper();

  switch (command) {
    case 'type-check':
      console.log('Running TypeScript type checking only...');
      await validator.runTypeCheck();
      break;
    
    case 'generate-types':
      console.log('Generating Supabase types only...');
      await validator.generateSupabaseTypes();
      break;
    
    case 'validate-relationships':
      console.log('Validating database relationship types only...');
      await validator.validateRelationshipTypes();
      break;
    
    case 'test-patterns':
      console.log('Testing Blueprint TypeScript patterns only...');
      await validator.testBlueprintTypePatterns();
      break;

    case 'generate-interfaces':
      console.log('Generating Blueprint interfaces only...');
      await validator.generateBlueprintInterfaces();
      break;
    
    case 'complete':
    default:
      console.log('Running complete TypeScript validation suite...');
      await validator.runCompleteValidation();
      break;
  }
}

// Export for use as module
export { TypeScriptValidationHelper };

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}