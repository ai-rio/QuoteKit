/**
 * Survey configurations for each user segment
 * FB-019: Segment-specific surveys for QuoteKit Formbricks integration
 */

import { SegmentSurveyConfig, SurveyFrequency,TriggerCondition, UserSegment } from './types';

/**
 * Base frequency settings that can be customized per segment
 */
const DEFAULT_FREQUENCY: SurveyFrequency = {
  maxPerDay: 1,
  maxPerWeek: 2,
  cooldownDays: 7,
  respectGlobalLimits: true
};

/**
 * Survey configurations for Free Tier Users
 * Focus: Feature discovery and upgrade barriers
 */
const FREE_TIER_CONFIGS: SegmentSurveyConfig[] = [
  {
    segment: 'free',
    surveyIds: [
      'free-tier-feature-discovery',
      'upgrade-decision-factors',
      'feature-limitation-feedback'
    ],
    triggerConditions: [
      {
        type: 'activity',
        operator: 'greater_than',
        value: 5,
        field: 'quotesCreated'
      },
      {
        type: 'activity',
        operator: 'greater_than',
        value: 7,
        field: 'accountAge'
      }
    ],
    frequency: {
      ...DEFAULT_FREQUENCY,
      maxPerWeek: 3 // More opportunities for free users to provide feedback
    },
    priority: 6,
    enabled: true
  },
  {
    segment: 'free',
    surveyIds: [
      'workflow-pain-points',
      'competitive-analysis',
      'value-proposition-clarity'
    ],
    triggerConditions: [
      {
        type: 'activity',
        operator: 'greater_than',
        value: 15,
        field: 'quotesCreated'
      },
      {
        type: 'activity',
        operator: 'equals',
        value: 'weekly',
        field: 'loginFrequency'
      }
    ],
    frequency: DEFAULT_FREQUENCY,
    priority: 7,
    enabled: true
  }
];

/**
 * Survey configurations for Pro Users
 * Focus: Feature usage and satisfaction
 */
const PRO_TIER_CONFIGS: SegmentSurveyConfig[] = [
  {
    segment: 'pro',
    surveyIds: [
      'pro-feature-satisfaction',
      'workflow-efficiency',
      'feature-request-priorities'
    ],
    triggerConditions: [
      {
        type: 'activity',
        operator: 'greater_than',
        value: 10,
        field: 'quotesCreated'
      }
    ],
    frequency: {
      ...DEFAULT_FREQUENCY,
      maxPerWeek: 3,
      cooldownDays: 5 // Shorter cooldown for paid users
    },
    priority: 8,
    enabled: true
  },
  {
    segment: 'pro',
    surveyIds: [
      'advanced-features-usage',
      'customer-success-feedback',
      'renewal-likelihood'
    ],
    triggerConditions: [
      {
        type: 'activity',
        operator: 'greater_than',
        value: 30,
        field: 'accountAge'
      },
      {
        type: 'activity',
        operator: 'greater_than',
        value: 1000,
        field: 'averageQuoteValue'
      }
    ],
    frequency: DEFAULT_FREQUENCY,
    priority: 9,
    enabled: true
  }
];

/**
 * Survey configurations for Enterprise Users
 * Focus: Advanced features and scalability
 */
const ENTERPRISE_TIER_CONFIGS: SegmentSurveyConfig[] = [
  {
    segment: 'enterprise',
    surveyIds: [
      'enterprise-scalability-needs',
      'team-collaboration-feedback',
      'advanced-reporting-requirements'
    ],
    triggerConditions: [
      {
        type: 'activity',
        operator: 'greater_than',
        value: 5,
        field: 'quotesCreated'
      }
    ],
    frequency: {
      ...DEFAULT_FREQUENCY,
      maxPerWeek: 4,
      cooldownDays: 3 // Most frequent for highest tier
    },
    priority: 10,
    enabled: true
  },
  {
    segment: 'enterprise',
    surveyIds: [
      'integration-requirements',
      'compliance-security-feedback',
      'enterprise-roadmap-input'
    ],
    triggerConditions: [
      {
        type: 'activity',
        operator: 'greater_than',
        value: 60,
        field: 'accountAge'
      },
      {
        type: 'activity',
        operator: 'greater_than',
        value: 50,
        field: 'quotesCreated'
      }
    ],
    frequency: DEFAULT_FREQUENCY,
    priority: 10,
    enabled: true
  }
];

/**
 * Survey configurations for Heavy Users
 * Focus: Workflow optimization and power features
 */
const HEAVY_USER_CONFIGS: SegmentSurveyConfig[] = [
  {
    segment: 'heavy_user',
    surveyIds: [
      'power-user-workflows',
      'automation-opportunities',
      'efficiency-improvements'
    ],
    triggerConditions: [
      {
        type: 'activity',
        operator: 'greater_than',
        value: 50,
        field: 'quotesCreated'
      },
      {
        type: 'activity',
        operator: 'equals',
        value: 'daily',
        field: 'loginFrequency'
      }
    ],
    frequency: {
      ...DEFAULT_FREQUENCY,
      maxPerWeek: 3,
      cooldownDays: 4
    },
    priority: 9,
    enabled: true
  },
  {
    segment: 'heavy_user',
    surveyIds: [
      'advanced-feature-requests',
      'bulk-operations-feedback',
      'keyboard-shortcuts-usage'
    ],
    triggerConditions: [
      {
        type: 'activity',
        operator: 'greater_than',
        value: 100,
        field: 'quotesCreated'
      }
    ],
    frequency: DEFAULT_FREQUENCY,
    priority: 8,
    enabled: true
  }
];

/**
 * Survey configurations for New Users
 * Focus: Onboarding experience and first impressions
 */
const NEW_USER_CONFIGS: SegmentSurveyConfig[] = [
  {
    segment: 'new_user',
    surveyIds: [
      'onboarding-experience',
      'first-quote-creation',
      'initial-value-perception'
    ],
    triggerConditions: [
      {
        type: 'activity',
        operator: 'less_than',
        value: 14,
        field: 'accountAge'
      },
      {
        type: 'activity',
        operator: 'greater_than',
        value: 1,
        field: 'quotesCreated'
      }
    ],
    frequency: {
      ...DEFAULT_FREQUENCY,
      maxPerDay: 2, // More frequent for new users
      maxPerWeek: 4,
      cooldownDays: 2
    },
    priority: 8,
    enabled: true
  },
  {
    segment: 'new_user',
    surveyIds: [
      'feature-discovery-journey',
      'learning-curve-feedback',
      'support-resource-effectiveness'
    ],
    triggerConditions: [
      {
        type: 'activity',
        operator: 'less_than',
        value: 7,
        field: 'accountAge'
      },
      {
        type: 'activity',
        operator: 'greater_than',
        value: 3,
        field: 'quotesCreated'
      }
    ],
    frequency: DEFAULT_FREQUENCY,
    priority: 7,
    enabled: true
  }
];

/**
 * Survey configurations for Light Users
 * Focus: Engagement barriers and simple workflows
 */
const LIGHT_USER_CONFIGS: SegmentSurveyConfig[] = [
  {
    segment: 'light_user',
    surveyIds: [
      'engagement-barriers',
      'simplification-needs',
      'occasional-use-cases'
    ],
    triggerConditions: [
      {
        type: 'activity',
        operator: 'less_than',
        value: 10,
        field: 'quotesCreated'
      },
      {
        type: 'activity',
        operator: 'greater_than',
        value: 30,
        field: 'accountAge'
      }
    ],
    frequency: {
      ...DEFAULT_FREQUENCY,
      maxPerWeek: 1, // Less frequent for light users
      cooldownDays: 14
    },
    priority: 5,
    enabled: true
  },
  {
    segment: 'light_user',
    surveyIds: [
      'ease-of-use-feedback',
      're-engagement-triggers',
      'minimal-feature-set'
    ],
    triggerConditions: [
      {
        type: 'activity',
        operator: 'equals',
        value: 'rarely',
        field: 'loginFrequency'
      }
    ],
    frequency: {
      ...DEFAULT_FREQUENCY,
      maxPerWeek: 1,
      cooldownDays: 21 // Longer cooldown for rarely active users
    },
    priority: 4,
    enabled: true
  }
];

/**
 * Master configuration mapping
 */
export const SEGMENT_SURVEY_CONFIGS: Record<UserSegment, SegmentSurveyConfig[]> = {
  free: FREE_TIER_CONFIGS,
  pro: PRO_TIER_CONFIGS,
  enterprise: ENTERPRISE_TIER_CONFIGS,
  heavy_user: HEAVY_USER_CONFIGS,
  new_user: NEW_USER_CONFIGS,
  light_user: LIGHT_USER_CONFIGS
};

/**
 * Get survey configurations for a specific segment
 */
export function getSegmentConfigs(segment: UserSegment): SegmentSurveyConfig[] {
  return SEGMENT_SURVEY_CONFIGS[segment] || [];
}

/**
 * Get all enabled survey configurations for a segment
 */
export function getEnabledSegmentConfigs(segment: UserSegment): SegmentSurveyConfig[] {
  return getSegmentConfigs(segment).filter(config => config.enabled);
}

/**
 * Get survey configurations by priority (highest first)
 */
export function getSegmentConfigsByPriority(segment: UserSegment): SegmentSurveyConfig[] {
  return getSegmentConfigs(segment)
    .filter(config => config.enabled)
    .sort((a, b) => b.priority - a.priority);
}

/**
 * Get all survey IDs for a segment
 */
export function getSegmentSurveyIds(segment: UserSegment): string[] {
  const configs = getEnabledSegmentConfigs(segment);
  return configs.flatMap(config => config.surveyIds);
}

/**
 * Check if a segment has any enabled surveys
 */
export function hasEnabledSurveys(segment: UserSegment): boolean {
  return getEnabledSegmentConfigs(segment).length > 0;
}

/**
 * Get configuration for a specific survey ID
 */
export function getConfigForSurvey(segment: UserSegment, surveyId: string): SegmentSurveyConfig | null {
  const configs = getSegmentConfigs(segment);
  return configs.find(config => config.surveyIds.includes(surveyId)) || null;
}

/**
 * Formbricks Survey ID mappings for each segment
 * These should match the actual survey IDs created in Formbricks Cloud
 */
export const FORMBRICKS_SURVEY_IDS = {
  // Free Tier Surveys
  'free-tier-feature-discovery': 'clxxxx1-free-feature-discovery',
  'upgrade-decision-factors': 'clxxxx2-upgrade-barriers',
  'feature-limitation-feedback': 'clxxxx3-feature-limits',
  'workflow-pain-points': 'clxxxx4-workflow-pain',
  'competitive-analysis': 'clxxxx5-competition',
  'value-proposition-clarity': 'clxxxx6-value-prop',

  // Pro Tier Surveys
  'pro-feature-satisfaction': 'clxxxx7-pro-satisfaction',
  'workflow-efficiency': 'clxxxx8-workflow-efficiency',
  'feature-request-priorities': 'clxxxx9-feature-requests',
  'advanced-features-usage': 'clxxxx10-advanced-usage',
  'customer-success-feedback': 'clxxxx11-customer-success',
  'renewal-likelihood': 'clxxxx12-renewal',

  // Enterprise Tier Surveys
  'enterprise-scalability-needs': 'clxxxx13-enterprise-scale',
  'team-collaboration-feedback': 'clxxxx14-team-collab',
  'advanced-reporting-requirements': 'clxxxx15-reporting',
  'integration-requirements': 'clxxxx16-integrations',
  'compliance-security-feedback': 'clxxxx17-compliance',
  'enterprise-roadmap-input': 'clxxxx18-roadmap',

  // Heavy User Surveys
  'power-user-workflows': 'clxxxx19-power-workflows',
  'automation-opportunities': 'clxxxx20-automation',
  'efficiency-improvements': 'clxxxx21-efficiency',
  'advanced-feature-requests': 'clxxxx22-advanced-requests',
  'bulk-operations-feedback': 'clxxxx23-bulk-ops',
  'keyboard-shortcuts-usage': 'clxxxx24-shortcuts',

  // New User Surveys
  'onboarding-experience': 'clxxxx25-onboarding',
  'first-quote-creation': 'clxxxx26-first-quote',
  'initial-value-perception': 'clxxxx27-initial-value',
  'feature-discovery-journey': 'clxxxx28-discovery',
  'learning-curve-feedback': 'clxxxx29-learning',
  'support-resource-effectiveness': 'clxxxx30-support',

  // Light User Surveys
  'engagement-barriers': 'clxxxx31-barriers',
  'simplification-needs': 'clxxxx32-simplify',
  'occasional-use-cases': 'clxxxx33-occasional',
  'ease-of-use-feedback': 'clxxxx34-ease-of-use',
  're-engagement-triggers': 'clxxxx35-re-engage',
  'minimal-feature-set': 'clxxxx36-minimal'
} as const;

/**
 * Get the actual Formbricks survey ID for a logical survey name
 */
export function getFormbricksSurveyId(logicalId: string): string {
  return FORMBRICKS_SURVEY_IDS[logicalId as keyof typeof FORMBRICKS_SURVEY_IDS] || logicalId;
}