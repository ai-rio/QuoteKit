# MoSCoW Implementation Plan: Driver.js User Onboarding

## Executive Summary

This document provides a detailed MoSCoW (Must have, Should have, Could have, Won't have) prioritization for implementing driver.js user onboarding in LawnQuote. The plan is structured across 4 development sprints with clear deliverables and success criteria.

## Sprint Overview

| Sprint | Duration | Focus | Priority | Deliverables |
|--------|----------|-------|----------|--------------|
| Sprint 1 | 2 weeks | Foundation & Core Tours | Must Have | Basic onboarding infrastructure |
| Sprint 2 | 2 weeks | Enhanced User Journeys | Must Have + Should Have | Complete user flows |
| Sprint 3 | 2 weeks | Advanced Features | Should Have + Could Have | Premium features |
| Sprint 4 | 1 week | Polish & Analytics | Could Have | Analytics & optimization |

---

## MUST HAVE (M) - Sprint 1 & 2

### M1: Foundation Infrastructure (Sprint 1)

#### M1.1: Driver.js Integration Setup
**Priority**: Critical  
**Effort**: 3 days  
**Dependencies**: None

**Requirements:**
- Install and configure driver.js library
- Create TypeScript type definitions for tour configurations
- Set up CSS customization system
- Implement basic error handling

**Acceptance Criteria:**
- [ ] Driver.js successfully imported and initialized
- [ ] Custom CSS theme matches LawnQuote design system
- [ ] TypeScript types provide full IntelliSense support
- [ ] Error boundaries handle tour failures gracefully

**Technical Implementation:**
```typescript
// src/libs/onboarding/driver-config.ts
import { driver, Config } from "driver.js";
import "driver.js/dist/driver.css";

export const createTour = (config: Config) => {
  return driver({
    popoverClass: 'lawnquote-tour-popover',
    stagePadding: 8,
    stageRadius: 6,
    ...config
  });
};
```

#### M1.2: Onboarding Context System
**Priority**: Critical  
**Effort**: 2 days  
**Dependencies**: M1.1

**Requirements:**
- React Context for managing onboarding state
- User progress tracking in Supabase
- Tour completion persistence
- Session-based tour management

**Acceptance Criteria:**
- [ ] OnboardingProvider wraps application
- [ ] User onboarding progress stored in database
- [ ] Tours don't repeat for completed users
- [ ] Context provides tour control methods

**Database Schema:**
```sql
-- Add to existing user_profiles table
ALTER TABLE user_profiles ADD COLUMN onboarding_progress JSONB DEFAULT '{}';
ALTER TABLE user_profiles ADD COLUMN onboarding_completed_at TIMESTAMP;
```

#### M1.3: Welcome Tour Implementation
**Priority**: Critical  
**Effort**: 4 days  
**Dependencies**: M1.1, M1.2

**Requirements:**
- First-time user welcome sequence
- Dashboard overview tour
- Navigation introduction
- Account setup guidance

**Acceptance Criteria:**
- [ ] Welcome tour triggers on first login
- [ ] Tour covers main navigation elements
- [ ] User can skip or complete tour
- [ ] Progress saved between sessions

**Tour Steps:**
1. Welcome message and overview
2. Main navigation sidebar
3. Dashboard statistics cards
4. Quick actions panel
5. Account menu introduction
6. Settings access point

### M2: Core User Journeys (Sprint 2)

#### M2.1: Quote Creation Walkthrough
**Priority**: Critical  
**Effort**: 5 days  
**Dependencies**: M1.3

**Requirements:**
- Step-by-step quote creation guide
- Client information setup
- Line items addition process
- Quote finalization steps

**Acceptance Criteria:**
- [ ] Tour guides through complete quote creation
- [ ] Interactive elements highlighted appropriately
- [ ] User can create actual quote during tour
- [ ] Tour adapts to user's tier (Free vs Pro)

**Tour Flow:**
1. Navigate to "New Quote" button
2. Client selection/creation
3. Quote details form
4. Adding line items from library
5. Pricing calculations
6. Quote preview and finalization
7. Save and next steps

#### M2.2: Item Library Introduction
**Priority**: Critical  
**Effort**: 3 days  
**Dependencies**: M2.1

**Requirements:**
- Item library navigation
- Category system explanation
- Adding custom items
- Favorites functionality

**Acceptance Criteria:**
- [ ] User understands item organization
- [ ] Can add items to library during tour
- [ ] Category system clearly explained
- [ ] Favorites feature demonstrated

#### M2.3: Settings Configuration Guide
**Priority**: Critical  
**Effort**: 3 days  
**Dependencies**: M2.2

**Requirements:**
- Company profile setup
- Branding configuration
- Financial defaults
- Quote terms customization

**Acceptance Criteria:**
- [ ] Essential settings configured during tour
- [ ] User understands customization options
- [ ] Branding elements properly set up
- [ ] Default values established

---

## SHOULD HAVE (S) - Sprint 2 & 3

### S1: Enhanced User Experience (Sprint 2)

#### S1.1: Contextual Help System
**Priority**: High  
**Effort**: 4 days  
**Dependencies**: M2.3

**Requirements:**
- On-demand help tooltips
- Feature-specific mini-tours
- Help button integration
- Context-aware assistance

**Acceptance Criteria:**
- [ ] Help buttons trigger relevant tours
- [ ] Contextual tooltips for complex features
- [ ] Mini-tours for specific workflows
- [ ] Help system integrates with main navigation

#### S1.2: Progressive Onboarding
**Priority**: High  
**Effort**: 3 days  
**Dependencies**: S1.1

**Requirements:**
- Multi-session onboarding flow
- Feature introduction over time
- Achievement-based unlocking
- Progress indicators

**Acceptance Criteria:**
- [ ] Onboarding spans multiple sessions
- [ ] New features introduced progressively
- [ ] User sees clear progress indicators
- [ ] Can resume onboarding anytime

### S2: Tier-Specific Features (Sprint 3)

#### S2.1: Freemium Feature Highlights
**Priority**: High  
**Effort**: 3 days  
**Dependencies**: S1.2

**Requirements:**
- Free tier limitation explanations
- Upgrade prompts integration
- Pro feature previews
- Value proposition communication

**Acceptance Criteria:**
- [ ] Free users understand limitations
- [ ] Upgrade paths clearly presented
- [ ] Pro features demonstrated (locked)
- [ ] Value proposition communicated effectively

#### S2.2: Mobile-Optimized Tours
**Priority**: High  
**Effort**: 4 days  
**Dependencies**: S2.1

**Requirements:**
- Responsive tour layouts
- Touch-friendly interactions
- Mobile-specific tour flows
- Gesture support

**Acceptance Criteria:**
- [ ] Tours work seamlessly on mobile
- [ ] Touch interactions properly handled
- [ ] Mobile-specific tour variations
- [ ] Responsive popover positioning

---

## COULD HAVE (C) - Sprint 3 & 4

### C1: Advanced Interactions (Sprint 3)

#### C1.1: Interactive Tutorials
**Priority**: Medium  
**Effort**: 5 days  
**Dependencies**: S2.2

**Requirements:**
- Real data manipulation during tours
- Sandbox mode for safe exploration
- Undo functionality for tour actions
- Practice scenarios

**Acceptance Criteria:**
- [ ] Users can interact with real features
- [ ] Tour actions can be undone
- [ ] Safe practice environment
- [ ] Realistic data scenarios

#### C1.2: Personalized Onboarding
**Priority**: Medium  
**Effort**: 4 days  
**Dependencies**: C1.1

**Requirements:**
- User role-based tour customization
- Business type specific flows
- Usage pattern adaptation
- Preference-based recommendations

**Acceptance Criteria:**
- [ ] Tours adapt to user business type
- [ ] Role-specific feature emphasis
- [ ] Personalized recommendations
- [ ] Adaptive tour sequences

### C2: Analytics & Optimization (Sprint 4)

#### C2.1: Onboarding Analytics Dashboard
**Priority**: Medium  
**Effort**: 3 days  
**Dependencies**: C1.2

**Requirements:**
- Tour completion tracking
- Drop-off point analysis
- User engagement metrics
- A/B testing framework

**Acceptance Criteria:**
- [ ] Comprehensive analytics dashboard
- [ ] Drop-off points identified
- [ ] Engagement metrics tracked
- [ ] A/B testing capabilities

#### C2.2: Gamification Elements
**Priority**: Medium  
**Effort**: 4 days  
**Dependencies**: C2.1

**Requirements:**
- Progress badges and achievements
- Completion rewards
- Milestone celebrations
- Social sharing features

**Acceptance Criteria:**
- [ ] Achievement system implemented
- [ ] Progress visually rewarded
- [ ] Milestone celebrations
- [ ] Optional social sharing

---

## WON'T HAVE (W) - Future Releases

### W1: Advanced AI Features
- AI-powered tour customization based on user behavior
- Natural language tour generation
- Intelligent feature recommendations
- Predictive onboarding paths

### W2: Multi-Language Support
- Internationalization of tour content
- RTL language support
- Cultural adaptation of tour flows
- Localized business scenarios

### W3: Video Integration
- Embedded video tutorials
- Screen recording capabilities
- Video-based feature explanations
- Interactive video tours

### W4: Third-Party Integrations
- CRM system onboarding
- Accounting software tours
- Marketing tool integrations
- External service walkthroughs

---

## Implementation Timeline

### Sprint 1: Foundation (Weeks 1-2)
- **Week 1**: M1.1, M1.2 (Infrastructure)
- **Week 2**: M1.3 (Welcome Tour)

### Sprint 2: Core Features (Weeks 3-4)
- **Week 3**: M2.1 (Quote Creation), S1.1 (Contextual Help)
- **Week 4**: M2.2, M2.3 (Item Library & Settings), S1.2 (Progressive)

### Sprint 3: Enhancement (Weeks 5-6)
- **Week 5**: S2.1, S2.2 (Tier Features & Mobile)
- **Week 6**: C1.1, C1.2 (Interactive & Personalized)

### Sprint 4: Polish (Week 7)
- **Week 7**: C2.1, C2.2 (Analytics & Gamification)

## Success Metrics by Sprint

### Sprint 1 Targets
- [ ] 100% of new users see welcome tour
- [ ] 70% complete welcome tour
- [ ] 0 critical tour-related bugs

### Sprint 2 Targets
- [ ] 80% complete quote creation tour
- [ ] 60% complete settings configuration
- [ ] 50% reduction in support tickets for basic features

### Sprint 3 Targets
- [ ] 90% mobile tour compatibility
- [ ] 40% increase in Pro feature awareness
- [ ] 25% improvement in feature adoption

### Sprint 4 Targets
- [ ] Complete analytics dashboard
- [ ] 85% overall onboarding completion
- [ ] 30% increase in user retention

## Risk Mitigation

### Technical Risks
- **Driver.js compatibility**: Test thoroughly with Next.js 15
- **Performance impact**: Monitor bundle size and loading times
- **Mobile responsiveness**: Extensive mobile testing required

### User Experience Risks
- **Tour fatigue**: Keep tours concise and skippable
- **Information overload**: Progressive disclosure strategy
- **Accessibility**: Ensure tours work with screen readers

### Business Risks
- **Development timeline**: Buffer time for unexpected issues
- **User adoption**: A/B test tour effectiveness
- **Maintenance overhead**: Plan for ongoing tour updates

---

**Document Version**: 1.0  
**Last Updated**: January 2025  
**Next Review**: End of Sprint 1
