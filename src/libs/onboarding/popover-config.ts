/**
 * Enhanced Popover Configuration System
 * Provides advanced Driver.js popover features with responsive design,
 * custom button handlers, and progress indicators
 */

export interface PopoverButtonConfig {
  text: string;
  className?: string;
  disabled?: boolean;
  onClick?: (_element?: Element, _step?: any, _options?: any) => void | boolean;
}

export interface PopoverConfig {
  title: string;
  description: string;
  side?: 'top' | 'right' | 'bottom' | 'left' | 'auto';
  align?: 'start' | 'center' | 'end';
  showButtons?: string[];
  showProgress?: boolean;
  progressText?: string;
  customButtons?: PopoverButtonConfig[];
  className?: string;
  
  // Responsive configuration
  responsive?: {
    mobile?: Partial<PopoverConfig>;
    tablet?: Partial<PopoverConfig>;
    desktop?: Partial<PopoverConfig>;
  };
  
  // Validation and interaction
  onNextClick?: (_element?: Element, _step?: any, _options?: any) => void | boolean;
  onPrevClick?: (_element?: Element, _step?: any, _options?: any) => void | boolean;
  onCloseClick?: (_element?: Element, _step?: any, _options?: any) => void | boolean;
  
  // Custom content
  customContent?: string;
  showEstimatedTime?: boolean;
  estimatedTimeMinutes?: number;
}

export class PopoverConfigManager {
  private static instance: PopoverConfigManager;
  private deviceType: 'mobile' | 'tablet' | 'desktop' = 'desktop';
  private currentStepIndex: number = 0;
  private totalSteps: number = 0;

  static getInstance(): PopoverConfigManager {
    if (!PopoverConfigManager.instance) {
      PopoverConfigManager.instance = new PopoverConfigManager();
    }
    return PopoverConfigManager.instance;
  }

  constructor() {
    this.detectDeviceType();
    this.setupResizeListener();
  }

  /**
   * Detect current device type based on viewport
   */
  private detectDeviceType(): void {
    if (typeof window === 'undefined') return;
    
    const width = window.innerWidth;
    if (width < 768) {
      this.deviceType = 'mobile';
    } else if (width < 1024) {
      this.deviceType = 'tablet';
    } else {
      this.deviceType = 'desktop';
    }
  }

  /**
   * Setup resize listener for responsive updates
   */
  private setupResizeListener(): void {
    if (typeof window === 'undefined') return;
    
    let resizeTimeout: NodeJS.Timeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        this.detectDeviceType();
      }, 150);
    });
  }

  /**
   * Generate responsive popover configuration
   */
  generatePopoverConfig(
    baseConfig: PopoverConfig,
    stepIndex: number,
    totalSteps: number
  ): any {
    this.currentStepIndex = stepIndex;
    this.totalSteps = totalSteps;

    // Start with base configuration
    let config = { ...baseConfig };

    // Apply responsive overrides
    if (baseConfig.responsive) {
      const deviceConfig = baseConfig.responsive[this.deviceType];
      if (deviceConfig) {
        config = { ...config, ...deviceConfig };
      }
    }

    // Generate progress text
    if (config.showProgress) {
      config.progressText = this.generateProgressText(config.progressText);
    }

    // Add estimated time if enabled
    if (config.showEstimatedTime && config.estimatedTimeMinutes) {
      const timeText = this.generateEstimatedTimeText(config.estimatedTimeMinutes);
      config.description = `${config.description}\n\n${timeText}`;
    }

    // Setup button handlers
    const driverConfig = this.setupButtonHandlers(config);

    // Add custom CSS classes
    driverConfig.popoverClass = this.generatePopoverClasses(config);

    return driverConfig;
  }

  /**
   * Generate progress text with customization
   */
  private generateProgressText(customTemplate?: string): string {
    const current = this.currentStepIndex + 1;
    const total = this.totalSteps;
    const percent = Math.round((current / total) * 100);

    if (customTemplate) {
      return customTemplate
        .replace('{{current}}', current.toString())
        .replace('{{total}}', total.toString())
        .replace('{{percent}}', percent.toString());
    }

    // Default responsive progress text
    if (this.deviceType === 'mobile') {
      return `${current}/${total} (${percent}%)`;
    } else {
      return `Step ${current} of ${total} • ${percent}% complete`;
    }
  }

  /**
   * Generate estimated time text
   */
  private generateEstimatedTimeText(minutes: number): string {
    const remainingSteps = this.totalSteps - this.currentStepIndex;
    const estimatedRemaining = Math.ceil((remainingSteps / this.totalSteps) * minutes);
    
    if (estimatedRemaining <= 1) {
      return "⏱️ Almost done!";
    } else if (estimatedRemaining <= 2) {
      return "⏱️ About 2 minutes remaining";
    } else {
      return `⏱️ About ${estimatedRemaining} minutes remaining`;
    }
  }

  /**
   * Setup custom button handlers
   */
  private setupButtonHandlers(config: PopoverConfig): any {
    const driverConfig: any = {
      title: config.title,
      description: config.description,
      side: config.side || (this.deviceType === 'mobile' ? 'bottom' : 'right'),
      align: config.align || 'start'
    };

    // Custom button configuration
    if (config.customButtons && config.customButtons.length > 0) {
      driverConfig.showButtons = config.customButtons.map(btn => btn.text.toLowerCase());
      
      // Add custom button handlers
      config.customButtons.forEach(button => {
        const handlerName = `on${button.text.charAt(0).toUpperCase() + button.text.slice(1)}Click`;
        if (button.onClick) {
          driverConfig[handlerName] = button.onClick;
        }
      });
    } else {
      // Standard button configuration
      driverConfig.showButtons = config.showButtons || ['next', 'previous', 'close'];
      
      // Add standard button handlers
      if (config.onNextClick) {
        driverConfig.onNextClick = (element?: Element, step?: any, options?: any) => {
          const result = config.onNextClick!(element, step, options);
          if (result !== false && options?.driver) {
            options.driver.moveNext();
          }
        };
      }
      
      if (config.onPrevClick) {
        driverConfig.onPrevClick = (element?: Element, step?: any, options?: any) => {
          const result = config.onPrevClick!(element, step, options);
          if (result !== false && options?.driver) {
            options.driver.movePrevious();
          }
        };
      }
      
      if (config.onCloseClick) {
        driverConfig.onCloseClick = config.onCloseClick;
      }
    }

    return driverConfig;
  }

  /**
   * Generate CSS classes for popover styling
   */
  private generatePopoverClasses(config: PopoverConfig): string {
    const classes = ['enhanced-tour-popover'];
    
    // Device-specific classes
    classes.push(`tour-popover-${this.deviceType}`);
    
    // Progress indicator class
    if (config.showProgress) {
      classes.push('tour-popover-with-progress');
    }
    
    // Custom classes
    if (config.className) {
      classes.push(config.className);
    }
    
    return classes.join(' ');
  }

  /**
   * Validate step completion before proceeding
   */
  validateStepCompletion(
    stepId: string,
    validationRules?: {
      requiredFields?: string[];
      customValidation?: () => boolean;
      errorMessage?: string;
    }
  ): { isValid: boolean; message?: string } {
    try {
      // Check required fields
      if (validationRules?.requiredFields) {
        for (const fieldSelector of validationRules.requiredFields) {
          const field = document.querySelector(fieldSelector) as HTMLInputElement;
          if (!field || !field.value?.trim()) {
            return {
              isValid: false,
              message: validationRules.errorMessage || `Please complete the required field: ${fieldSelector}`
            };
          }
        }
      }

      // Run custom validation
      if (validationRules?.customValidation) {
        const isValid = validationRules.customValidation();
        if (!isValid) {
          return {
            isValid: false,
            message: validationRules.errorMessage || 'Please complete this step before continuing'
          };
        }
      }

      return { isValid: true };

    } catch (error) {
      console.error('Error validating step completion:', error);
      return {
        isValid: false,
        message: 'There was an error validating this step'
      };
    }
  }

  /**
   * Show validation message to user
   */
  showValidationMessage(message: string, type: 'error' | 'warning' | 'info' = 'warning'): void {
    // Create validation message element
    const messageEl = document.createElement('div');
    messageEl.className = `tour-validation-message tour-validation-${type}`;
    messageEl.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: ${type === 'error' ? '#fee2e2' : type === 'warning' ? '#fef3c7' : '#dbeafe'};
      border: 2px solid ${type === 'error' ? '#fca5a5' : type === 'warning' ? '#fcd34d' : '#93c5fd'};
      color: ${type === 'error' ? '#991b1b' : type === 'warning' ? '#92400e' : '#1e40af'};
      padding: 16px 20px;
      border-radius: 12px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
      z-index: 10001;
      max-width: 90vw;
      text-align: center;
      font-size: 14px;
      font-weight: 500;
      animation: tourValidationFadeIn 0.3s ease;
    `;

    messageEl.textContent = message;

    // Add animation styles
    if (!document.querySelector('#tour-validation-styles')) {
      const styles = document.createElement('style');
      styles.id = 'tour-validation-styles';
      styles.textContent = `
        @keyframes tourValidationFadeIn {
          from { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
          to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        @keyframes tourValidationFadeOut {
          from { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          to { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
        }
      `;
      document.head.appendChild(styles);
    }

    document.body.appendChild(messageEl);

    // Remove after delay
    setTimeout(() => {
      messageEl.style.animation = 'tourValidationFadeOut 0.3s ease';
      setTimeout(() => {
        if (messageEl.parentNode) {
          messageEl.parentNode.removeChild(messageEl);
        }
      }, 300);
    }, 3000);
  }

  /**
   * Get current device type
   */
  getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    return this.deviceType;
  }

  /**
   * Update step progress
   */
  updateProgress(stepIndex: number, totalSteps: number): void {
    this.currentStepIndex = stepIndex;
    this.totalSteps = totalSteps;
  }
}

// Export singleton instance
export const popoverConfigManager = PopoverConfigManager.getInstance();

// Export utility functions
export const generatePopoverConfig = (
  baseConfig: PopoverConfig,
  stepIndex: number,
  totalSteps: number
) => popoverConfigManager.generatePopoverConfig(baseConfig, stepIndex, totalSteps);

export const validateStepCompletion = (
  stepId: string,
  validationRules?: {
    requiredFields?: string[];
    customValidation?: () => boolean;
    errorMessage?: string;
  }
) => popoverConfigManager.validateStepCompletion(stepId, validationRules);

export const showValidationMessage = (
  message: string,
  type?: 'error' | 'warning' | 'info'
) => popoverConfigManager.showValidationMessage(message, type);
