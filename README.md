<p align="center">
  <h1 align="center">QuoteKit</h1>
</p>

<p align="center">
  <a href="https://opensource.org/licenses/MIT" rel="nofollow"><img src="https://img.shields.io/github/license/kolbysisk/next-supabase-stripe-starter" alt="License"></a>
</p>

## 🌟 Overview

**QuoteKit** is a comprehensive quote management system for landscaping and lawn care businesses. Create, manage, track, and deliver professional PDF quotes with advanced features like templates, bulk operations, and status tracking.

### ✨ Key Features

- **🔐 Authentication** - Secure passwordless login with email magic links
- **🎯 User Onboarding** - Comprehensive driver.js guided tours for new users
- **🏢 Company Management** - Business information, logo upload, and rate management
- **📋 Item Library** - Enhanced catalog with categories, favorites, and bulk operations
- **💼 Quote Management** - Complete quote lifecycle with status tracking
- **📝 Templates** - Save and reuse frequently used quote configurations
- **🏠 Property Management** - Multi-property support with detailed property information
- **📊 Property Assessments** - Comprehensive field assessment system with modular components
- **🧮 Advanced Pricing Engine** - Condition-based pricing with 15+ adjustment factors
- **📄 Professional Reports** - Assessment reports with PDF generation and company branding
- **💰 Assessment-to-Quote Integration** - Seamless workflow from assessment to quote
- **📊 Analytics** - Dashboard with quotes, revenue, and performance insights
- **💳 Payments** - Stripe integration for subscriptions and billing
- **📄 PDF Generation** - Professional quote PDFs with React-PDF

### 🎯 **Blueprint Implementation Progress** (100% Complete) ✅

**Status**: ✅ **COMPLETE** - Comprehensive lawn care quote software blueprint fully implemented

#### **Foundation & Core Extensions** ✅
- ✅ **M1.1-M1.2**: Database Foundation - Extended schema with commercial client support
- ✅ **M1.3-M1.4**: Client Management Extensions - Property management and multi-property support
- ✅ **M1.5**: Property-Quote Integration - PropertySelector and property-aware quote creation

#### **Assessment System** ✅
- ✅ **M2.1**: Assessment Database - Property assessments with comprehensive field structure
- ✅ **M2.2**: Assessment Server Actions - Full CRUD operations and analytics
- ✅ **M2.3**: Assessment UI Components - Modular architecture with 6 specialized field components
- ✅ **M2.4**: Assessment UI Integration - PropertyMeasurements and complete assessment workflow

#### **Advanced Integration** ✅
- ✅ **M2.5**: Assessment-Quote Integration - Advanced pricing engine with intelligent suggestions
- ✅ **M2.6**: Enhanced Pricing Engine - Condition-based pricing with 15+ adjustment factors (1.1x-1.6x multipliers)

#### **Professional Features** ✅
- ✅ **Assessment Reports** - Professional PDF generation with condition analysis
- ✅ **Advanced Pricing** - Labor breakdown, equipment costs, material adjustments
- ✅ **Complete UI Integration** - Seamless navigation between assessments, quotes, and reports
- ✅ **B2B2C Payment Ready** - Infrastructure for homeowner invoice system

**Final Achievement**: Complete Blueprint implementation with production-ready assessment-to-quote pipeline, advanced pricing engine, and professional reporting system.

## 🚀 Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd QuoteKit

# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local

# Start development server
npm run dev
```

## 📚 Documentation

All documentation is organized in the `docs/` directory:

- **📖 [Complete Documentation](docs/README.md)** - Full documentation index
- **🏗️ [Architecture](docs/architecture/README.md)** - System architecture and design
- **🚀 [Development Guide](docs/development/README.md)** - Development setup and guides
- **🎯 [User Onboarding](docs/development/driver.js/README.md)** - Driver.js onboarding system
- **🎯 [Features](docs/features/README.md)** - Feature specifications and user stories
- **🔧 [Integrations](docs/integrations/README.md)** - Third-party integrations
- **🚀 [Deployment](docs/deployment/README.md)** - Deployment and infrastructure

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions)
- **Payments**: Stripe (Subscriptions, Billing)
- **PDF**: React-PDF
- **Deployment**: Fly.io
- **Analytics**: PostHog

## 📋 Project Status

- ✅ **MVP Complete** - All foundational features delivered
- ✅ **User Onboarding** - Comprehensive driver.js guided tours implemented
- 🚀 **Active Development** - Professional UI/UX enhancements
- 🎯 **Target**: $2,424 MRR within 6 months

### Recent Achievements
- **Driver.js Integration**: Complete onboarding system with 4 guided tours
- **TypeScript Compliance**: 100% type-safe implementation with 0 errors
- **ESLint Clean**: All 22 ESLint errors resolved, maintaining code quality
- **Test Coverage**: 17+ comprehensive unit tests for onboarding features

## 🤝 Contributing

1. Check the [Development Guide](docs/development/README.md)
2. Review [Architecture Documentation](docs/architecture/README.md)
3. Follow [Coding Standards](docs/features/prd/architecture/coding-standards.md)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](docs/reference/LICENSE) file for details.

## 🔗 Links

- **Documentation**: [docs/README.md](docs/README.md)
- **Changelog**: [docs/reference/CHANGELOG.md](docs/reference/CHANGELOG.md)
- **Security**: [docs/security/](docs/security/)
- **Deployment**: [docs/deployment/](docs/deployment/)

---

*For detailed project information, see [docs/README-PROJECT.md](docs/README-PROJECT.md)*
