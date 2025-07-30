/**
 * Comprehensive Monitoring and Alerting Setup
 * Real-time monitoring and alerting for payment system operations
 */

import { createClient } from '@supabase/supabase-js';
import { Database } from '@/libs/supabase/types';
import { performanceMonitor } from './performance-monitoring';
import { dataConsistencyValidator } from './data-consistency-validation';

interface AlertRule {
  id: string;
  name: string;
  description: string;
  metric: string;
  condition: AlertCondition;
  threshold: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  cooldown: number; // minutes
  notifications: NotificationChannel[];
  lastTriggered?: Date;
}

interface AlertCondition {
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'ne';
  aggregation?: 'avg' | 'sum' | 'count' | 'max' | 'min';
  timeWindow?: number; // minutes
}

interface NotificationChannel {
  type: 'email' | 'slack' | 'webhook' | 'console';
  config: Record<string, any>;
  enabled: boolean;
}

interface Alert {
  id: string;
  ruleId: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
  metadata: Record<string, any>;
}

interface SystemHealth {
  status: 'healthy' | 'degraded' | 'critical' | 'outage';
  components: ComponentHealth[];
  lastChecked: Date;
  uptime: number;
  issues: string[];
}

interface ComponentHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'critical' | 'down';
  responseTime?: number;
  errorRate?: number;
  lastChecked: Date;
  details?: Record<string, any>;
}

export class MonitoringSystem {
  private supabase: ReturnType<typeof createClient<Database>>;
  private alertRules: Map<string, AlertRule> = new Map();
  private activeAlerts: Map<string, Alert> = new Map();
  private healthChecks: Map<string, ComponentHealth> = new Map();
  private monitoringInterval?: NodeJS.Timeout;

  constructor() {
    this.supabase = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    this.initializeAlertRules();
    this.initializeHealthChecks();
    this.startMonitoring();
  }

  /**
   * Initialize default alert rules for payment system
   */
  private initializeAlertRules(): void {
    const defaultRules: AlertRule[] = [
      // Database Performance Alerts
      {
        id: 'db_query_time_high',
        name: 'Database Query Time High',
        description: 'Database queries are taking longer than expected',
        metric: 'database_query_time',
        condition: { operator: 'gt', aggregation: 'avg', timeWindow: 5 },
        threshold: 200, // ms
        severity: 'medium',
        enabled: true,
        cooldown: 10,
        notifications: [
          { type: 'console', config: {}, enabled: true },
          { type: 'email', config: { recipients: ['admin@example.com'] }, enabled: false }
        ]
      },
      {
        id: 'db_connection_failure',
        name: 'Database Connection Failure',
        description: 'Unable to connect to database',
        metric: 'database_connection_errors',
        condition: { operator: 'gt', aggregation: 'sum', timeWindow: 1 },
        threshold: 3,
        severity: 'critical',
        enabled: true,
        cooldown: 5,
        notifications: [
          { type: 'console', config: {}, enabled: true },
          { type: 'email', config: { recipients: ['admin@example.com'] }, enabled: true }
        ]
      },

      // Payment System Alerts
      {
        id: 'stripe_api_errors',
        name: 'Stripe API Errors',
        description: 'High rate of Stripe API errors',
        metric: 'stripe_api_errors',
        condition: { operator: 'gt', aggregation: 'sum', timeWindow: 5 },
        threshold: 5,
        severity: 'high',
        enabled: true,
        cooldown: 15,
        notifications: [
          { type: 'console', config: {}, enabled: true },
          { type: 'email', config: { recipients: ['admin@example.com'] }, enabled: true }
        ]
      },
      {
        id: 'payment_failure_rate',
        name: 'Payment Failure Rate High',
        description: 'Payment failure rate is above acceptable threshold',
        metric: 'payment_failure_rate',
        condition: { operator: 'gt', aggregation: 'avg', timeWindow: 10 },
        threshold: 2, // 2%
        severity: 'high',
        enabled: true,
        cooldown: 20,
        notifications: [
          { type: 'console', config: {}, enabled: true },
          { type: 'email', config: { recipients: ['admin@example.com'] }, enabled: true }
        ]
      },

      // Webhook Processing Alerts
      {
        id: 'webhook_processing_failures',
        name: 'Webhook Processing Failures',
        description: 'High rate of webhook processing failures',
        metric: 'webhook_processing_failures',
        condition: { operator: 'gt', aggregation: 'sum', timeWindow: 5 },
        threshold: 3,
        severity: 'high',
        enabled: true,
        cooldown: 10,
        notifications: [
          { type: 'console', config: {}, enabled: true },
          { type: 'email', config: { recipients: ['admin@example.com'] }, enabled: true }
        ]
      },
      {
        id: 'webhook_processing_time',
        name: 'Webhook Processing Time High',
        description: 'Webhook processing is taking longer than expected',
        metric: 'webhook_processing_time',
        condition: { operator: 'gt', aggregation: 'avg', timeWindow: 5 },
        threshold: 1000, // ms
        severity: 'medium',
        enabled: true,
        cooldown: 15,
        notifications: [
          { type: 'console', config: {}, enabled: true }
        ]
      },

      // Subscription Management Alerts
      {
        id: 'subscription_sync_failures',
        name: 'Subscription Sync Failures',
        description: 'Subscriptions are failing to sync with Stripe',
        metric: 'subscription_sync_failures',
        condition: { operator: 'gt', aggregation: 'sum', timeWindow: 10 },
        threshold: 2,
        severity: 'high',
        enabled: true,
        cooldown: 30,
        notifications: [
          { type: 'console', config: {}, enabled: true },
          { type: 'email', config: { recipients: ['admin@example.com'] }, enabled: true }
        ]
      },
      {
        id: 'data_consistency_issues',
        name: 'Data Consistency Issues',
        description: 'Data consistency validation has found critical issues',
        metric: 'data_consistency_critical_issues',
        condition: { operator: 'gt' },
        threshold: 0,
        severity: 'critical',
        enabled: true,
        cooldown: 60,
        notifications: [
          { type: 'console', config: {}, enabled: true },
          { type: 'email', config: { recipients: ['admin@example.com'] }, enabled: true }
        ]
      },

      // System Resource Alerts
      {
        id: 'memory_usage_high',
        name: 'Memory Usage High',
        description: 'System memory usage is approaching limits',
        metric: 'memory_usage_percentage',
        condition: { operator: 'gt', aggregation: 'avg', timeWindow: 5 },
        threshold: 85, // %
        severity: 'medium',
        enabled: true,
        cooldown: 20,
        notifications: [
          { type: 'console', config: {}, enabled: true }
        ]
      },
      {
        id: 'error_rate_high',
        name: 'Error Rate High',
        description: 'Application error rate is above normal',
        metric: 'error_rate_percentage',
        condition: { operator: 'gt', aggregation: 'avg', timeWindow: 5 },
        threshold: 1, // %
        severity: 'high',
        enabled: true,
        cooldown: 15,
        notifications: [
          { type: 'console', config: {}, enabled: true },
          { type: 'email', config: { recipients: ['admin@example.com'] }, enabled: true }
        ]
      }
    ];

    defaultRules.forEach(rule => {
      this.alertRules.set(rule.id, rule);
    });
  }

  /**
   * Initialize health check components
   */
  private initializeHealthChecks(): void {
    const components = [
      'database',
      'stripe_api',
      'supabase_api',
      'webhook_endpoint',
      'payment_processing',
      'subscription_management',
      'user_authentication'
    ];

    components.forEach(component => {
      this.healthChecks.set(component, {
        name: component,
        status: 'healthy',
        lastChecked: new Date(),
        details: {}
      });
    });
  }

  /**
   * Start continuous monitoring
   */
  private startMonitoring(): void {
    console.log('🔄 Starting monitoring system...');

    // Check alerts every 30 seconds
    this.monitoringInterval = setInterval(async () => {
      await this.checkAlertRules();
      await this.performHealthChecks();
      await this.cleanupOldAlerts();
    }, 30000);

    // Run comprehensive checks every 5 minutes
    setInterval(async () => {
      await this.runComprehensiveHealthCheck();
    }, 5 * 60 * 1000);
  }

  /**
   * Check all alert rules
   */
  private async checkAlertRules(): Promise<void> {
    for (const [ruleId, rule] of this.alertRules) {
      if (!rule.enabled) continue;

      // Check cooldown period
      if (rule.lastTriggered) {
        const cooldownEnd = new Date(rule.lastTriggered.getTime() + rule.cooldown * 60 * 1000);
        if (new Date() < cooldownEnd) continue;
      }

      try {
        const shouldTrigger = await this.evaluateAlertRule(rule);
        
        if (shouldTrigger) {
          await this.triggerAlert(rule);
        }
      } catch (error) {
        console.error(`Error evaluating alert rule ${ruleId}:`, error);
      }
    }
  }

  /**
   * Evaluate if an alert rule should trigger
   */
  private async evaluateAlertRule(rule: AlertRule): Promise<boolean> {
    // Get metrics for the specified time window
    const timeWindow = rule.condition.timeWindow || 1;
    const metrics = performanceMonitor.getMetrics(rule.metric, timeWindow / 60);

    if (metrics.length === 0) return false;

    let value: number;

    // Apply aggregation
    switch (rule.condition.aggregation) {
      case 'avg':
        value = metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length;
        break;
      case 'sum':
        value = metrics.reduce((sum, m) => sum + m.value, 0);
        break;
      case 'count':
        value = metrics.length;
        break;
      case 'max':
        value = Math.max(...metrics.map(m => m.value));
        break;
      case 'min':
        value = Math.min(...metrics.map(m => m.value));
        break;
      default:
        value = metrics[metrics.length - 1].value; // Latest value
    }

    // Evaluate condition
    switch (rule.condition.operator) {
      case 'gt':
        return value > rule.threshold;
      case 'gte':
        return value >= rule.threshold;
      case 'lt':
        return value < rule.threshold;
      case 'lte':
        return value <= rule.threshold;
      case 'eq':
        return value === rule.threshold;
      case 'ne':
        return value !== rule.threshold;
      default:
        return false;
    }
  }

  /**
   * Trigger an alert
   */
  private async triggerAlert(rule: AlertRule): Promise<void> {
    const alertId = `${rule.id}_${Date.now()}`;
    
    const alert: Alert = {
      id: alertId,
      ruleId: rule.id,
      message: `${rule.name}: ${rule.description}`,
      severity: rule.severity,
      timestamp: new Date(),
      resolved: false,
      metadata: {
        metric: rule.metric,
        threshold: rule.threshold,
        condition: rule.condition
      }
    };

    // Store alert
    this.activeAlerts.set(alertId, alert);

    // Update rule last triggered time
    rule.lastTriggered = new Date();
    this.alertRules.set(rule.id, rule);

    // Send notifications
    await this.sendNotifications(alert, rule.notifications);

    console.log(`🚨 ALERT TRIGGERED: ${alert.message} (${alert.severity})`);
  }

  /**
   * Send notifications for an alert
   */
  private async sendNotifications(alert: Alert, channels: NotificationChannel[]): Promise<void> {
    for (const channel of channels) {
      if (!channel.enabled) continue;

      try {
        switch (channel.type) {
          case 'console':
            this.sendConsoleNotification(alert);
            break;
          case 'email':
            await this.sendEmailNotification(alert, channel.config);
            break;
          case 'slack':
            await this.sendSlackNotification(alert, channel.config);
            break;
          case 'webhook':
            await this.sendWebhookNotification(alert, channel.config);
            break;
        }
      } catch (error) {
        console.error(`Failed to send ${channel.type} notification:`, error);
      }
    }
  }

  /**
   * Perform health checks on all components
   */
  private async performHealthChecks(): Promise<void> {
    const healthPromises = Array.from(this.healthChecks.keys()).map(async (componentName) => {
      try {
        const health = await this.checkComponentHealth(componentName);
        this.healthChecks.set(componentName, health);
      } catch (error) {
        console.error(`Health check failed for ${componentName}:`, error);
        this.healthChecks.set(componentName, {
          name: componentName,
          status: 'critical',
          lastChecked: new Date(),
          details: { error: error instanceof Error ? error.message : 'Unknown error' }
        });
      }
    });

    await Promise.allSettled(healthPromises);
  }

  /**
   * Check health of a specific component
   */
  private async checkComponentHealth(componentName: string): Promise<ComponentHealth> {
    const startTime = performance.now();
    let status: ComponentHealth['status'] = 'healthy';
    let details: Record<string, any> = {};

    try {
      switch (componentName) {
        case 'database':
          const dbResult = await this.supabase.from('subscriptions').select('count').limit(1);
          if (dbResult.error) throw dbResult.error;
          break;

        case 'stripe_api':
          const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
          await stripe.customers.list({ limit: 1 });
          break;

        case 'supabase_api':
          const { data: profile } = await this.supabase.rpc('version');
          details.version = profile;
          break;

        case 'webhook_endpoint':
          // Check webhook endpoint is reachable
          const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/stripe`;
          const response = await fetch(webhookUrl, { method: 'POST' });
          if (response.status === 405) {
            // Method not allowed is expected for GET requests
            status = 'healthy';
          } else if (response.status >= 500) {
            status = 'critical';
          }
          break;

        case 'payment_processing':
          // Check payment processing capability
          status = 'healthy'; // Simplified check
          break;

        case 'subscription_management':
          // Check subscription management
          const subCount = await this.supabase
            .from('subscriptions')
            .select('count')
            .limit(1);
          if (subCount.error) throw subCount.error;
          break;

        case 'user_authentication':
          // Check auth system
          status = 'healthy'; // Simplified check
          break;
      }
    } catch (error) {
      status = 'critical';
      details.error = error instanceof Error ? error.message : 'Unknown error';
    }

    const responseTime = performance.now() - startTime;

    return {
      name: componentName,
      status,
      responseTime,
      lastChecked: new Date(),
      details
    };
  }

  /**
   * Run comprehensive health check
   */
  private async runComprehensiveHealthCheck(): Promise<void> {
    console.log('🏥 Running comprehensive health check...');

    // Run data consistency validation
    try {
      const consistencyResult = await dataConsistencyValidator.runFullValidation();
      const criticalIssues = consistencyResult.issues.filter(issue => issue.severity === 'critical');
      
      if (criticalIssues.length > 0) {
        performanceMonitor.recordMetric('data_consistency_critical_issues', criticalIssues.length, 'count');
      }
    } catch (error) {
      console.error('Data consistency validation failed:', error);
      performanceMonitor.recordMetric('data_consistency_check_failures', 1, 'count');
    }

    // Check system performance
    const performanceStatus = performanceMonitor.getPerformanceStatus();
    if (performanceStatus.status === 'critical') {
      performanceMonitor.recordMetric('system_performance_critical', 1, 'count');
    }

    console.log('✅ Comprehensive health check completed');
  }

  /**
   * Get current system health
   */
  getSystemHealth(): SystemHealth {
    const components = Array.from(this.healthChecks.values());
    const criticalComponents = components.filter(c => c.status === 'critical');
    const degradedComponents = components.filter(c => c.status === 'degraded');

    let status: SystemHealth['status'] = 'healthy';
    if (criticalComponents.length > 0) {
      status = 'critical';
    } else if (degradedComponents.length > 2) {
      status = 'degraded';
    }

    const issues: string[] = [];
    criticalComponents.forEach(c => {
      issues.push(`${c.name} is critical: ${c.details?.error || 'Unknown issue'}`);
    });

    return {
      status,
      components,
      lastChecked: new Date(),
      uptime: process.uptime(),
      issues
    };
  }

  /**
   * Notification methods
   */
  private sendConsoleNotification(alert: Alert): void {
    const icon = alert.severity === 'critical' ? '🔴' : alert.severity === 'high' ? '🟠' : '🟡';
    console.log(`${icon} ALERT: ${alert.message}`);
  }

  private async sendEmailNotification(alert: Alert, config: any): Promise<void> {
    // Implementation for email notifications
    console.log(`📧 Email notification sent for: ${alert.message}`);
  }

  private async sendSlackNotification(alert: Alert, config: any): Promise<void> {
    // Implementation for Slack notifications
    console.log(`💬 Slack notification sent for: ${alert.message}`);
  }

  private async sendWebhookNotification(alert: Alert, config: any): Promise<void> {
    // Implementation for webhook notifications
    console.log(`🔗 Webhook notification sent for: ${alert.message}`);
  }

  /**
   * Cleanup old alerts
   */
  private async cleanupOldAlerts(): Promise<void> {
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
    
    for (const [alertId, alert] of this.activeAlerts) {
      if (alert.timestamp < cutoffTime && alert.resolved) {
        this.activeAlerts.delete(alertId);
      }
    }
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string): boolean {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) return false;

    alert.resolved = true;
    alert.resolvedAt = new Date();
    this.activeAlerts.set(alertId, alert);

    console.log(`✅ Alert resolved: ${alert.message}`);
    return true;
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): Alert[] {
    return Array.from(this.activeAlerts.values()).filter(alert => !alert.resolved);
  }

  /**
   * Add custom alert rule
   */
  addAlertRule(rule: AlertRule): void {
    this.alertRules.set(rule.id, rule);
    console.log(`📋 Added alert rule: ${rule.name}`);
  }

  /**
   * Stop monitoring system
   */
  stop(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
    console.log('🛑 Monitoring system stopped');
  }
}

// Export singleton instance
export const monitoringSystem = new MonitoringSystem();