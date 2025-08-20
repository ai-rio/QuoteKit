/**
 * Comprehensive Step Validation System
 * Ensures all necessary steps to operate the QuoteKit system are covered by tours
 * Provides intelligent validation, context-awareness, and business logic compliance
 */

export interface SystemOperation {
  id: string;
  name: string;
  description: string;
  category: 'essential' | 'important' | 'optional';
  requiredFor: string[]; // What this operation enables
  dependencies: string[]; // What must be completed first
  validationRules: ValidationRule[];
  tourStepId?: string; // Which tour step covers this
}

export interface ValidationRule {
  type: 'element_exists' | 'field_completed' | 'action_performed' | 'data_saved' | 'custom';
  selector?: string;
  customValidator?: () => boolean;
  errorMessage: string;
  helpText?: string;
}

export interface StepValidationResult {
  isValid: boolean;
  canProceed: boolean;
  missingOperations: SystemOperation[];
  warnings: string[];
  suggestions: string[];
  completionPercentage: number;
}

export class StepValidationSystem {
  private static instance: StepValidationSystem;
  private systemOperations: Map<string, SystemOperation> = new Map();
  private completedOperations: Set<string> = new Set();
  private tourCoverage: Map<string, string[]> = new Map(); // tourId -> operationIds

  static getInstance(): StepValidationSystem {
    if (!StepValidationSystem.instance) {
      StepValidationSystem.instance = new StepValidationSystem();
    }
    return StepValidationSystem.instance;
  }

  constructor() {
    this.initializeSystemOperations();
    this.mapTourCoverage();
  }

  /**
   * Initialize all system operations required for QuoteKit
   */
  private initializeSystemOperations(): void {
    const operations: SystemOperation[] = [
      // ESSENTIAL OPERATIONS - Must be completed for basic functionality
      {
        id: 'client_selection',
        name: 'Client Selection',
        description: 'Select or create a client for the quote',
        category: 'essential',
        requiredFor: ['quote_creation', 'pdf_generation'],
        dependencies: [],
        tourStepId: 'client-selector-interaction',
        validationRules: [
          {
            type: 'element_exists',
            selector: '[data-testid="client-selector"]',
            errorMessage: 'Client selector not found'
          },
          {
            type: 'custom',
            customValidator: () => {
              const selector = document.querySelector('[data-testid="client-selector"]') as HTMLInputElement;
              return !!(selector?.value?.trim() || document.querySelector('[data-client-selected="true"]'));
            },
            errorMessage: 'Please select or add a client before proceeding',
            helpText: 'A client is required to create a professional quote'
          }
        ]
      },
      {
        id: 'line_items_addition',
        name: 'Add Line Items',
        description: 'Add services and materials to the quote',
        category: 'essential',
        requiredFor: ['quote_calculation', 'pdf_generation'],
        dependencies: ['client_selection'],
        tourStepId: 'add-items-process',
        validationRules: [
          {
            type: 'element_exists',
            selector: '[data-testid="line-items-card"]',
            errorMessage: 'Line items section not found'
          },
          {
            type: 'custom',
            customValidator: () => {
              return document.querySelectorAll('[data-testid="line-item-row"]').length > 0;
            },
            errorMessage: 'Please add at least one service or material to your quote',
            helpText: 'Line items are the core of your quote - add services, materials, or labor'
          }
        ]
      },
      {
        id: 'quote_calculation',
        name: 'Quote Calculations',
        description: 'Ensure quote totals are calculated correctly',
        category: 'essential',
        requiredFor: ['quote_finalization', 'pdf_generation'],
        dependencies: ['line_items_addition'],
        tourStepId: 'quote-calculations',
        validationRules: [
          {
            type: 'element_exists',
            selector: '[data-testid="quote-total"]',
            errorMessage: 'Quote total not calculated'
          },
          {
            type: 'custom',
            customValidator: () => {
              const total = document.querySelector('[data-testid="quote-total"]')?.textContent;
              return !!(total && parseFloat(total.replace(/[^0-9.]/g, '')) > 0);
            },
            errorMessage: 'Quote total must be greater than $0',
            helpText: 'Verify your line items have quantities and prices'
          }
        ]
      },

      // IMPORTANT OPERATIONS - Highly recommended for professional quotes
      {
        id: 'tax_configuration',
        name: 'Tax Rate Setup',
        description: 'Configure appropriate tax rates',
        category: 'important',
        requiredFor: ['accurate_pricing', 'compliance'],
        dependencies: ['line_items_addition'],
        tourStepId: 'tax-rate-setup',
        validationRules: [
          {
            type: 'element_exists',
            selector: '[data-testid="tax-rate-input"]',
            errorMessage: 'Tax rate configuration not found'
          },
          {
            type: 'custom',
            customValidator: () => {
              const taxInput = document.querySelector('[data-testid="tax-rate-input"]') as HTMLInputElement;
              return taxInput?.value !== undefined && taxInput.value !== '';
            },
            errorMessage: 'Consider setting a tax rate for accurate pricing',
            helpText: 'Tax rates ensure compliance and accurate customer billing'
          }
        ]
      },
      {
        id: 'markup_strategy',
        name: 'Markup Configuration',
        description: 'Set profit margins and markup strategy',
        category: 'important',
        requiredFor: ['profitable_pricing', 'business_sustainability'],
        dependencies: ['line_items_addition'],
        tourStepId: 'markup-strategy',
        validationRules: [
          {
            type: 'element_exists',
            selector: '[data-testid="markup-input"]',
            errorMessage: 'Markup configuration not found'
          },
          {
            type: 'custom',
            customValidator: () => {
              const markupInput = document.querySelector('[data-testid="markup-input"]') as HTMLInputElement;
              return markupInput?.value !== undefined && parseFloat(markupInput.value) > 0;
            },
            errorMessage: 'Consider adding markup to ensure profitability',
            helpText: 'Markup helps cover overhead costs and generate profit'
          }
        ]
      },
      {
        id: 'company_branding',
        name: 'Company Information',
        description: 'Set up company profile and branding',
        category: 'important',
        requiredFor: ['professional_quotes', 'brand_consistency'],
        dependencies: [],
        tourStepId: 'company-profile',
        validationRules: [
          {
            type: 'custom',
            customValidator: () => {
              // Check if company name is set in settings or quote
              const companyName = document.querySelector('[data-testid="company-name"]') as HTMLInputElement;
              return !!(companyName?.value?.trim());
            },
            errorMessage: 'Add your company information for professional quotes',
            helpText: 'Company branding makes quotes look more professional'
          }
        ]
      },

      // OPTIONAL OPERATIONS - Nice to have but not required
      {
        id: 'quote_terms',
        name: 'Terms and Conditions',
        description: 'Add custom terms and conditions',
        category: 'optional',
        requiredFor: ['legal_protection', 'clear_expectations'],
        dependencies: ['quote_calculation'],
        tourStepId: 'quote-terms',
        validationRules: [
          {
            type: 'custom',
            customValidator: () => {
              const terms = document.querySelector('[data-testid="quote-terms"]') as HTMLTextAreaElement;
              return !!(terms?.value?.trim());
            },
            errorMessage: 'Consider adding terms and conditions',
            helpText: 'Terms help set clear expectations with clients'
          }
        ]
      },
      {
        id: 'logo_upload',
        name: 'Company Logo',
        description: 'Upload company logo for branding',
        category: 'optional',
        requiredFor: ['brand_recognition', 'professional_appearance'],
        dependencies: ['company_branding'],
        tourStepId: 'logo-upload',
        validationRules: [
          {
            type: 'element_exists',
            selector: '[data-testid="company-logo"]',
            errorMessage: 'Logo upload not available'
          }
        ]
      },
      {
        id: 'item_categorization',
        name: 'Item Library Organization',
        description: 'Organize items by categories',
        category: 'optional',
        requiredFor: ['efficient_workflow', 'scalability'],
        dependencies: ['line_items_addition'],
        tourStepId: 'item-categories',
        validationRules: [
          {
            type: 'custom',
            customValidator: () => {
              // Check if items have categories
              const items = document.querySelectorAll('[data-testid="line-item-row"]');
              return items.length === 0 || Array.from(items).some(item => 
                item.querySelector('[data-category]')
              );
            },
            errorMessage: 'Consider organizing items by category',
            helpText: 'Categories help you find items faster as your library grows'
          }
        ]
      }
    ];

    operations.forEach(op => this.systemOperations.set(op.id, op));
  }

  /**
   * Map which tours cover which system operations
   */
  private mapTourCoverage(): void {
    this.tourCoverage.set('quote-creation', [
      'client_selection',
      'line_items_addition', 
      'quote_calculation',
      'tax_configuration',
      'markup_strategy'
    ]);

    this.tourCoverage.set('settings', [
      'company_branding',
      'logo_upload',
      'quote_terms'
    ]);

    this.tourCoverage.set('item-library', [
      'item_categorization'
    ]);
  }

  /**
   * Validate if a specific step can be completed
   */
  validateStep(stepId: string): StepValidationResult {
    const operation = this.findOperationByStepId(stepId);
    
    if (!operation) {
      return {
        isValid: true,
        canProceed: true,
        missingOperations: [],
        warnings: [`Step ${stepId} not mapped to system operation`],
        suggestions: [],
        completionPercentage: 100
      };
    }

    return this.validateOperation(operation);
  }

  /**
   * Validate a specific system operation
   */
  validateOperation(operation: SystemOperation): StepValidationResult {
    const result: StepValidationResult = {
      isValid: true,
      canProceed: true,
      missingOperations: [],
      warnings: [],
      suggestions: [],
      completionPercentage: 0
    };

    // Check dependencies first
    const missingDependencies = operation.dependencies.filter(depId => 
      !this.completedOperations.has(depId)
    );

    if (missingDependencies.length > 0) {
      result.isValid = false;
      result.canProceed = false;
      result.missingOperations = missingDependencies
        .map(depId => this.systemOperations.get(depId))
        .filter(Boolean) as SystemOperation[];
      result.suggestions.push(
        `Complete these steps first: ${missingDependencies.map(id => 
          this.systemOperations.get(id)?.name
        ).join(', ')}`
      );
    }

    // Validate current operation rules
    let passedRules = 0;
    for (const rule of operation.validationRules) {
      const ruleResult = this.validateRule(rule);
      if (ruleResult.isValid) {
        passedRules++;
      } else {
        if (operation.category === 'essential') {
          result.isValid = false;
          result.canProceed = false;
        } else {
          result.warnings.push(ruleResult.message);
        }
        
        if (ruleResult.helpText) {
          result.suggestions.push(ruleResult.helpText);
        }
      }
    }

    result.completionPercentage = (passedRules / operation.validationRules.length) * 100;

    // For essential operations, must be 100% complete
    if (operation.category === 'essential' && result.completionPercentage < 100) {
      result.canProceed = false;
    }

    return result;
  }

  /**
   * Validate a specific rule
   */
  private validateRule(rule: ValidationRule): { isValid: boolean; message: string; helpText?: string } {
    try {
      let isValid = false;

      switch (rule.type) {
        case 'element_exists':
          isValid = !!(rule.selector && document.querySelector(rule.selector));
          break;
        case 'field_completed':
          const field = rule.selector ? document.querySelector(rule.selector) as HTMLInputElement : null;
          isValid = !!(field?.value?.trim());
          break;
        case 'custom':
          isValid = rule.customValidator ? rule.customValidator() : false;
          break;
        default:
          isValid = true;
      }

      return {
        isValid,
        message: isValid ? 'Valid' : rule.errorMessage,
        helpText: rule.helpText
      };

    } catch (error) {
      console.error('Error validating rule:', error);
      return {
        isValid: false,
        message: 'Validation error occurred',
        helpText: rule.helpText
      };
    }
  }

  /**
   * Get comprehensive system coverage analysis
   */
  getSystemCoverage(): {
    totalOperations: number;
    essentialOperations: number;
    importantOperations: number;
    optionalOperations: number;
    coveredByTours: number;
    uncoveredOperations: SystemOperation[];
    tourCoverageMap: Map<string, string[]>;
  } {
    const operations = Array.from(this.systemOperations.values());
    const coveredOperationIds = new Set<string>();
    
    // Collect all operations covered by tours
    this.tourCoverage.forEach(operationIds => {
      operationIds.forEach(id => coveredOperationIds.add(id));
    });

    const uncoveredOperations = operations.filter(op => !coveredOperationIds.has(op.id));

    return {
      totalOperations: operations.length,
      essentialOperations: operations.filter(op => op.category === 'essential').length,
      importantOperations: operations.filter(op => op.category === 'important').length,
      optionalOperations: operations.filter(op => op.category === 'optional').length,
      coveredByTours: coveredOperationIds.size,
      uncoveredOperations,
      tourCoverageMap: this.tourCoverage
    };
  }

  /**
   * Validate entire quote creation workflow
   */
  validateQuoteWorkflow(): {
    canCreateQuote: boolean;
    missingEssentials: SystemOperation[];
    missingImportant: SystemOperation[];
    recommendations: string[];
    overallCompletion: number;
  } {
    const essentialOps = Array.from(this.systemOperations.values())
      .filter(op => op.category === 'essential');
    
    const importantOps = Array.from(this.systemOperations.values())
      .filter(op => op.category === 'important');

    const missingEssentials: SystemOperation[] = [];
    const missingImportant: SystemOperation[] = [];
    const recommendations: string[] = [];

    let totalCompletion = 0;
    let validatedOps = 0;

    // Check essential operations
    for (const op of essentialOps) {
      const result = this.validateOperation(op);
      totalCompletion += result.completionPercentage;
      validatedOps++;
      
      if (!result.isValid) {
        missingEssentials.push(op);
      }
    }

    // Check important operations
    for (const op of importantOps) {
      const result = this.validateOperation(op);
      totalCompletion += result.completionPercentage;
      validatedOps++;
      
      if (!result.isValid) {
        missingImportant.push(op);
      }
      
      if (result.suggestions.length > 0) {
        recommendations.push(...result.suggestions);
      }
    }

    const overallCompletion = validatedOps > 0 ? totalCompletion / validatedOps : 0;

    return {
      canCreateQuote: missingEssentials.length === 0,
      missingEssentials,
      missingImportant,
      recommendations: [...new Set(recommendations)], // Remove duplicates
      overallCompletion
    };
  }

  /**
   * Mark an operation as completed
   */
  markOperationCompleted(operationId: string): void {
    this.completedOperations.add(operationId);
    console.log(`Operation completed: ${operationId}`);
  }

  /**
   * Find operation by tour step ID
   */
  private findOperationByStepId(stepId: string): SystemOperation | undefined {
    return Array.from(this.systemOperations.values())
      .find(op => op.tourStepId === stepId);
  }

  /**
   * Get operations for a specific tour
   */
  getOperationsForTour(tourId: string): SystemOperation[] {
    const operationIds = this.tourCoverage.get(tourId) || [];
    return operationIds
      .map(id => this.systemOperations.get(id))
      .filter(Boolean) as SystemOperation[];
  }

  /**
   * Generate coverage report
   */
  generateCoverageReport(): string {
    const coverage = this.getSystemCoverage();
    const workflow = this.validateQuoteWorkflow();
    
    return `
# QuoteKit System Coverage Report

## Overall Coverage
- **Total Operations**: ${coverage.totalOperations}
- **Covered by Tours**: ${coverage.coveredByTours}/${coverage.totalOperations} (${Math.round((coverage.coveredByTours / coverage.totalOperations) * 100)}%)

## Operation Categories
- **Essential**: ${coverage.essentialOperations} (required for basic functionality)
- **Important**: ${coverage.importantOperations} (recommended for professional use)
- **Optional**: ${coverage.optionalOperations} (nice to have)

## Current Workflow Status
- **Can Create Quote**: ${workflow.canCreateQuote ? '✅ Yes' : '❌ No'}
- **Overall Completion**: ${Math.round(workflow.overallCompletion)}%
- **Missing Essentials**: ${workflow.missingEssentials.length}
- **Missing Important**: ${workflow.missingImportant.length}

## Tour Coverage
${Array.from(coverage.tourCoverageMap.entries()).map(([tourId, ops]) => 
  `- **${tourId}**: ${ops.length} operations`
).join('\n')}

## Uncovered Operations
${coverage.uncoveredOperations.map(op => 
  `- **${op.name}** (${op.category}): ${op.description}`
).join('\n')}
    `.trim();
  }
}

// Export singleton instance
export const stepValidationSystem = StepValidationSystem.getInstance();

// Export utility functions
export const validateStep = (stepId: string) => 
  stepValidationSystem.validateStep(stepId);

export const validateQuoteWorkflow = () => 
  stepValidationSystem.validateQuoteWorkflow();

export const getSystemCoverage = () => 
  stepValidationSystem.getSystemCoverage();

export const markOperationCompleted = (operationId: string) => 
  stepValidationSystem.markOperationCompleted(operationId);

export const generateCoverageReport = () => 
  stepValidationSystem.generateCoverageReport();
