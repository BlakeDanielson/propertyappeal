# Technical Architecture Document: Property Tax Appeal Platform

## System Overview

A scalable web application built with modern, simple technologies that junior engineers can understand and maintain. The architecture emphasizes testability, separation of concerns, and incremental development.

---

## Technology Stack Decisions

### Backend: **Node.js + Express + TypeScript**

**Why Node.js/Express:**
- JavaScript across full stack = easier for junior engineers
- Large ecosystem for APIs and data processing
- Good performance for I/O-heavy operations (web scraping, API calls)
- Excellent testing tools (Jest, Supertest)

**Why TypeScript:**
- Catches errors at compile time vs. runtime
- Better IDE support and autocomplete for junior developers
- Self-documenting code through type definitions
- Easier refactoring as system grows

**Alternative Considered:** Python/Django
- **Rejected:** More complex for simple CRUD operations, overkill for MVP

### Frontend: **Next.js + TypeScript**

**Why Next.js:**
- Built-in API routes eliminate need for separate Express server setup
- App Router provides modern React patterns with Server Components
- Automatic optimizations (fonts, images, code splitting)
- Seamless Vercel deployment integration
- Excellent TypeScript support out of the box
- Built-in SEO optimizations and performance features

**Why React:**
- Component-based architecture matches our feature breakdown
- Huge community support for questions/debugging
- Great testing ecosystem (React Testing Library)
- Junior engineers likely familiar with it

**Alternative Considered:** Vite + React
- **Rejected:** Would require separate API server setup, less integrated hosting for MVP

### Database: **PostgreSQL**

**Why PostgreSQL:**
- Excellent JSON support for flexible property data
- Geographic data storage (latitude/longitude) - RentCast provides coords, we store them
- ACID compliance for financial data
- Reliable and well-understood by junior engineers
- ✅ **No Haversine formula needed** - RentCast API handles radius searches natively!

**Schema Design Principles:**
- One table per major entity (users, properties, appeals, comparables)
- JSON columns for flexible data (property features, form data)
- Foreign key constraints to prevent orphaned data

### CSS Framework: **Tailwind CSS**

**Why Tailwind:**
- Utility-first approach eliminates CSS architecture decisions
- No custom CSS means less to debug
- Consistent spacing/colors across components
- Junior engineers can't write conflicting styles

### Hosting & Infrastructure: **Vercel (Frontend + API) + Supabase (Database + Storage)**

**Why Vercel:**
- Zero-config React deployment
- Automatic HTTPS and CDN
- Preview deployments for each PR
- Serverless API routes (Express → Vercel Functions)
- Built-in cron jobs (Vercel Cron)
- Great developer experience
- Generous free tier for MVP

**Why Supabase:**
- Managed PostgreSQL with backups
- S3-compatible object storage (Supabase Storage)
- Built-in authentication (optional replacement for custom JWT)
- Database GUI and SQL editor
- Real-time subscriptions (future use)
- Excellent free tier (500MB database, 1GB storage)

**Alternative Considered:** AWS
- **Rejected:** Too complex for MVP. Too many services to configure and monitor.

**Alternative Considered:** Railway (all-in-one)
- **Rejected:** Vercel + Supabase offers better developer experience, free MVP tier, and modern serverless architecture.

### External Services

#### **Data Sources**
- **RentCast API** - Primary data source for property data and comparable sales
  - Provides: Property characteristics (sqft, beds, baths, lot size, year built)
  - Provides: Tax assessment history and property tax amounts
  - Provides: Comparable properties with distance calculations
  - Provides: Owner details and sale transaction history
  - Provides: Value estimates (AVM) and market statistics
  - Coverage: 140+ million properties nationwide
  - Data Quality: 500K+ updates daily, multiple sources normalized
  - Cost: Free tier (50 requests/month) for MVP testing, scalable pricing
  - Legal: Flexible licensing, ToS compliant, commercial use allowed
- **Google Maps API (Places Autocomplete)** - Address validation and geocoding
  - Generous free tier: $200/month credit
  - Cost: $5 per 1,000 requests after free tier
- **County Assessor Websites (Fallback)** - Web scraping as backup
  - Primary: Automated web scraping with Puppeteer (only if RentCast fails)
  - Fallback: Manual data entry by user
  - Use when: RentCast doesn't have data for specific county/property

#### **Communication**
- **Email:** Resend (developer-friendly, better than SendGrid)
- **SMS:** Twilio (industry standard, excellent docs)

#### **File Storage**
- **Supabase Storage** (S3-compatible storage for generated PDFs, templates, user uploads)
- Simple integration with Supabase SDK
- Free tier includes 1GB storage
- Pay-per-use pricing at scale

---

## System Architecture

### High-Level Architecture

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   React     │    │   Vercel    │    │  Supabase   │
│  Frontend   │◄──►│   Serverless│◄──►│  PostgreSQL │
│  (Vercel)   │    │   Functions │    │  Database   │
│             │    │   (API)     │    │             │
└─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │
       │                   │                   ▼
       │                   │            ┌─────────────┐
       │                   │            │  Supabase   │
       │                   │            │  Storage   │
       │                   │            │  (Files)   │
       │                   │            └─────────────┘
       │                   │                   │
       │                   ▼                   │
       │            ┌─────────────┐            │
       │            │  External   │            │
       │            │  Services   │            │
       └───────────►│ (RentCast, │            │
                    │  Maps, etc) │            │
                    └─────────────┘            │
                                               │
                    ┌─────────────┐            │
                    │  Vercel     │            │
                    │  Cron Jobs  │────────────┘
                    │ (Reminders) │
                    └─────────────┘
```

### Component Breakdown

#### **Frontend Components (React)**

```
src/
├── components/
│   ├── common/           # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   └── LoadingSpinner.tsx
│   ├── property/         # Property-specific components
│   │   ├── PropertySearch.tsx
│   │   ├── PropertyAnalysis.tsx
│   │   └── ComparableSales.tsx
│   ├── appeal/           # Appeal process components
│   │   ├── DeadlineTracker.tsx
│   │   ├── FormGenerator.tsx
│   │   └── SubmissionGuide.tsx
│   └── user/             # User management
│       ├── LoginForm.tsx
│       ├── Dashboard.tsx
│       └── ProfileSettings.tsx
├── pages/                # Top-level page components
│   ├── HomePage.tsx
│   ├── PropertyAnalysisPage.tsx
│   ├── AppealFormPage.tsx
│   └── DashboardPage.tsx
├── hooks/                # Custom React hooks
│   ├── useProperty.ts
│   ├── useComparables.ts
│   └── useAuth.ts
├── services/             # API communication
│   ├── api.ts           # Axios configuration
│   ├── propertyService.ts
│   └── appealService.ts
├── utils/                # Helper functions
│   ├── formatters.ts
│   ├── validators.ts
│   └── constants.ts
└── types/                # TypeScript definitions
    ├── property.ts
    ├── user.ts
    └── appeal.ts
```

#### **Backend API Structure (Vercel Serverless Functions)**

```
src/
├── api/                    # Vercel serverless API routes
│   ├── auth/              # /api/auth/*
│   │   ├── login.ts       # POST /api/auth/login
│   │   ├── register.ts    # POST /api/auth/register
│   │   └── refresh.ts     # POST /api/auth/refresh
│   ├── properties/        # /api/properties/*
│   │   ├── lookup.ts      # POST /api/properties/lookup
│   │   ├── [id].ts        # GET /api/properties/:id
│   │   └── analysis.ts    # POST /api/properties/analysis
│   ├── comparables/       # /api/comparables/*
│   │   └── [propertyId].ts # GET /api/comparables/:propertyId
│   ├── appeals/           # /api/appeals/*
│   │   ├── index.ts       # GET/POST /api/appeals
│   │   └── [id].ts        # GET /api/appeals/:id
│   └── cron/              # Scheduled jobs (Vercel Cron)
│       └── deadline-reminders.ts # Daily reminder job
├── controllers/           # Route handlers (shared logic)
│   ├── AuthController.ts
│   ├── PropertyController.ts
│   └── AppealController.ts
├── services/              # Business logic
│   ├── PropertyService.ts
│   ├── ComparableService.ts      # Comparable matching & adjustments
│   ├── DeadlineService.ts
│   ├── FormGeneratorService.ts
│   └── AppealLetterService.ts     # Appeal letter generation
├── models/                # Database models (Prisma ORM)
│   ├── User.ts            # Prisma Client usage
│   ├── Property.ts
│   ├── Comparable.ts
│   └── Appeal.ts
├── external/              # Third-party API integrations
│   ├── RentCastService.ts      # RentCast API for property/comparable data
│   ├── AssessorScraper.ts      # County assessor website scraping (fallback only)
│   └── GeocodingService.ts     # Google Maps API integration
├── middleware/            # Express middleware (for shared logic)
│   ├── auth.ts           # JWT verification
│   ├── errorHandler.ts   # Global error handler
│   └── validator.ts      # Request validation
├── utils/                 # Helper functions
│   ├── formatters.ts
│   ├── validators.ts
│   └── constants.ts
├── config/                # Configuration
│   ├── database.ts       # Prisma client setup
│   ├── supabase.ts       # Supabase client setup
│   └── env.ts            # Environment variables
└── types/                 # TypeScript definitions
    ├── property.ts
    ├── user.ts
    └── appeal.ts
```

**Note:** Vercel serverless functions are organized in the `/api` directory. Each file exports a default function that handles HTTP requests (GET, POST, etc.).

---

## Database Schema

### Core Tables

```sql
-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Properties table
CREATE TABLE properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(2) NOT NULL,
    zip_code VARCHAR(10) NOT NULL,
    county VARCHAR(100) NOT NULL,
    parcel_number VARCHAR(50),
    
    -- Property characteristics (JSON for flexibility)
    characteristics JSONB NOT NULL DEFAULT '{}',
    -- Example: {"sqft": 2400, "bedrooms": 3, "bathrooms": 2.5, "lot_size": 0.25, "year_built": 2010}
    
    -- Assessment data
    current_assessed_value INTEGER,
    assessment_year INTEGER,
    assessment_date DATE,
    
    -- Geographic data for comparable searches
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Appeals table
CREATE TABLE appeals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    
    -- Appeal details
    appeal_year INTEGER NOT NULL,
    current_assessment INTEGER NOT NULL,
    proposed_assessment INTEGER,
    estimated_savings DECIMAL(10, 2),
    
    -- Process tracking
    status VARCHAR(50) DEFAULT 'draft', -- draft, submitted, pending, approved, denied
    submitted_at TIMESTAMP,
    deadline_date DATE NOT NULL,
    
    -- Generated documents
    forms_data JSONB DEFAULT '{}',
    evidence_data JSONB DEFAULT '{}',
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Comparable sales table
CREATE TABLE comparables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appeal_id UUID NOT NULL REFERENCES appeals(id) ON DELETE CASCADE,
    
    -- Property info
    address VARCHAR(500) NOT NULL,
    sale_price INTEGER NOT NULL,
    sale_date DATE NOT NULL,
    
    -- Property characteristics (JSON for flexibility)
    characteristics JSONB NOT NULL DEFAULT '{}',
    
    -- Comparison data
    distance_miles DECIMAL(4, 2),
    adjustments JSONB DEFAULT '{}', -- {"size_diff": -50000, "condition_diff": -25000}
    adjusted_price INTEGER,
    
    -- Source tracking
    source VARCHAR(50), -- 'mls', 'public_records', 'manual'
    source_id VARCHAR(100),
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Jurisdictions table (for deadline management)
CREATE TABLE jurisdictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    state VARCHAR(2) NOT NULL,
    county VARCHAR(100) NOT NULL,
    
    -- Deadline rules
    deadline_rule VARCHAR(50) NOT NULL, -- 'fixed_date', 'days_after_notice', 'assessment_cycle'
    deadline_date DATE, -- For fixed dates like "June 8"
    deadline_days INTEGER, -- For "30 days after notice"
    
    -- Form and process info
    forms_info JSONB DEFAULT '{}',
    submission_info JSONB DEFAULT '{}',
    
    -- Tax rate and template info
    estimated_tax_rate DECIMAL(5, 4), -- e.g., 0.0120 = 1.2%
    template_version INTEGER,
    template_supabase_path VARCHAR(500),  -- Path to template in Supabase Storage
    template_last_updated DATE,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(state, county)
);

-- Subscriptions table (for freemium model)
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_type VARCHAR(50) NOT NULL DEFAULT 'free', -- 'free', 'premium', 'professional'
    status VARCHAR(50) NOT NULL DEFAULT 'active', -- 'active', 'cancelled', 'expired'
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    properties_used INTEGER NOT NULL DEFAULT 0,
    properties_limit INTEGER, -- NULL = unlimited
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Usage tracking table (for free tier limits)
CREATE TABLE usage_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL, -- 'property_analysis', 'form_generation'
    action_year INTEGER NOT NULL,
    count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, action_type, action_year)
);

-- Refresh tokens table (for JWT refresh)
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Notification preferences table
CREATE TABLE notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email_enabled BOOLEAN NOT NULL DEFAULT true,
    sms_enabled BOOLEAN NOT NULL DEFAULT false,
    email_30_days BOOLEAN NOT NULL DEFAULT true,
    email_14_days BOOLEAN NOT NULL DEFAULT true,
    email_3_days BOOLEAN NOT NULL DEFAULT true,
    sms_1_day BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id)
);
```

-- Add outcome tracking to appeals table (for future feature)
ALTER TABLE appeals ADD COLUMN outcome VARCHAR(50); -- 'approved', 'denied', 'partial', 'pending'
ALTER TABLE appeals ADD COLUMN final_assessment INTEGER;
ALTER TABLE appeals ADD COLUMN actual_savings DECIMAL(10, 2);
ALTER TABLE appeals ADD COLUMN outcome_date DATE;
ALTER TABLE appeals ADD COLUMN outcome_notes TEXT;
```

### Indexes for Performance

```sql
-- Geographic indexes (for storing property coordinates from RentCast)
-- Note: RentCast API handles radius searches, so we don't need PostGIS or Haversine calculations
-- We store lat/lng for reference and to pass to RentCast API
CREATE INDEX idx_properties_latitude ON properties(latitude);
CREATE INDEX idx_properties_longitude ON properties(longitude);

-- User property lookups
CREATE INDEX idx_properties_user_id ON properties(user_id);

-- Appeal status filtering
CREATE INDEX idx_appeals_status ON appeals(status);
CREATE INDEX idx_appeals_deadline ON appeals(deadline_date);

-- Comparable searches
CREATE INDEX idx_comparables_appeal_id ON comparables(appeal_id);

-- Subscription and usage tracking
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_usage_tracking_user_id ON usage_tracking(user_id);
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
```

---

## API Design

### RESTful Endpoint Structure

```typescript
// Auth endpoints
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me

// Property endpoints
GET    /api/properties              // List user's properties
POST   /api/properties              // Add new property
GET    /api/properties/:id          // Get property details
PUT    /api/properties/:id          // Update property
DELETE /api/properties/:id          // Delete property

// Property analysis
POST   /api/properties/lookup       // Lookup property by address
POST   /api/properties/:id/analyze  // Analyze if over-assessed

// Comparable sales
GET    /api/properties/:id/comparables    // Get comparable sales
POST   /api/properties/:id/comparables    // Add manual comparable
DELETE /api/comparables/:id               // Remove comparable

// Appeal management
GET    /api/appeals                     // List user's appeals
POST   /api/appeals                     // Create new appeal
GET    /api/appeals/:id                 // Get appeal details
PUT    /api/appeals/:id                 // Update appeal
POST   /api/appeals/:id/generate-forms  // Generate appeal forms
POST   /api/appeals/:id/submit         // Mark as submitted

// Jurisdiction data
GET    /api/jurisdictions/search       // Find jurisdiction by address
GET    /api/jurisdictions/:id/deadline // Get filing deadline

// Utility endpoints
GET    /api/health                     // Health check
GET    /api/version                    // API version info
```

### Request/Response Examples

#### Property Analysis Request

```typescript
// POST /api/properties/lookup
{
  "address": "123 Main St",
  "city": "Denver",
  "state": "CO",
  "zip": "80202"
}

// Response
{
  "success": true,
  "data": {
    "property": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "address": "123 Main St, Denver, CO 80202",
      "parcel_number": "12345678900",
      "assessed_value": 450000,
      "assessment_year": 2025,
      "characteristics": {
        "sqft": 2400,
        "bedrooms": 3,
        "bathrooms": 2.5,
        "year_built": 2010
      }
    },
    "analysis": {
      "likely_overassessed": true,
      "confidence": "high",
      "market_value_estimate": 385000,
      "potential_savings": 1200,
      "explanation": "Based on 8 comparable sales, your property appears overassessed by 14%"
    },
    "jurisdiction": {
      "county": "Denver",
      "deadline": "2025-06-08",
      "days_remaining": 45
    }
  }
}
```

---

## Security Architecture

### Authentication Strategy

**JWT-based Authentication (Simple and Stateless)**

```typescript
// JWT Payload
interface JWTPayload {
  userId: string;
  email: string;
  iat: number;  // issued at
  exp: number;  // expires (24 hours for access, 7 days for refresh)
}

// Auth Flow
1. User logs in → Server validates credentials
2. Server returns JWT access token + refresh token
3. Client stores in httpOnly cookies (more secure than localStorage)
4. Client sends token in Authorization header
5. Server validates token on protected routes
```

### Data Protection

**Encryption Strategy:**
- **Passwords:** bcrypt with salt rounds = 12
- **PII:** AES-256 encryption for stored addresses/names
- **JWT secrets:** 256-bit random keys stored in environment variables
- **Database:** SSL connections only, encrypted at rest

**Input Validation:**
- All inputs validated with Joi schemas
- SQL injection prevention via Prisma ORM
- XSS prevention via input sanitization
- CSRF tokens for state-changing operations

### API Security

```typescript
// Rate limiting (express-rate-limit)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP"
});

// Auth middleware (using Prisma)
const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies.accessToken || req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, firstName: true, lastName: true }
    });
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
```

---

## External Integrations

### Property Data Sources

#### **Primary: RentCast API**
```typescript
interface RentCastPropertyResponse {
  id: string;
  address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    zipCode: string;
    county: string;
    latitude: number;
    longitude: number;
  };
  property: {
    bedrooms: number;
    bathrooms: number;
    squareFootage: number;
    lotSize: number;
    yearBuilt: number;
    type: string;
  };
  assessment: {
    taxAmount: number;
    taxYear: number;
    assessedValue: number;
    assessedYear: number;
  };
  owner: {
    name: string;
    mailingAddress: string;
  };
  salesHistory: Array<{
    saleDate: string;
    salePrice: number;
  }>;
}

interface RentCastComparableResponse {
  comparables: Array<{
    id: string;
    address: string;
    salePrice: number;
    saleDate: string;
    distance: number; // Distance in miles from subject property
    property: {
      bedrooms: number;
      bathrooms: number;
      squareFootage: number;
      lotSize: number;
      yearBuilt: number;
    };
  }>;
}

class RentCastService {
  constructor(private apiKey: string) {}

  async getPropertyData(address: string): Promise<RentCastPropertyResponse> {
    // Call RentCast API property endpoint
    // Handle errors and fallback to county scraping if needed
  }
  
  async getComparableSales(
    latitude: number,
    longitude: number,
    radiusMiles: number = 1.0,
    monthsBack: number = 6
  ): Promise<RentCastComparableResponse> {
    // ✅ RentCast API supports radius-based searches!
    // Pass lat, lng, and radius parameters
    // API handles geographic filtering and returns distance in response
    // Example: GET /v1/listings/sale?lat={lat}&lng={lng}&radius={radiusMiles}
    // No Haversine formula needed!
  }
}
```

#### **Fallback: County Assessor Web Scraping**
For counties without API access, implement ethical web scraping:

```typescript
class AssessorScraper {
  async scrapeProperty(parcelNumber: string, county: string): Promise<PropertyData> {
    // Use Puppeteer for JavaScript-heavy sites
    // Respect robots.txt
    // Implement rate limiting (1 request per 3 seconds)
    // Cache results for 24 hours
  }
}
```

### Address Autocomplete Integration

**Google Places Autocomplete API:**
```typescript
// Frontend: Using @react-google-maps/api
import { useLoadScript, Autocomplete } from '@react-google-maps/api';

function AddressInput({ onAddressSelect }) {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY,
    libraries: ['places']
  });

  const handlePlaceSelect = (place: google.maps.places.PlaceResult) => {
    // Extract address components and coordinates
    // Validate and normalize address
    // Call onAddressSelect callback
  };
  
  return (
    <Autocomplete
      onPlaceChanged={handlePlaceSelect}
      options={{
        types: ['address'],
        componentRestrictions: { country: 'us' }
      }}
    >
      <input type="text" placeholder="Enter property address" />
    </Autocomplete>
  );
}
```

**Caching Strategy:**
- Cache validated addresses in localStorage (24 hours)
- Cache geocoded coordinates in database
- Reduce API calls for repeat searches

### Form Generation

**PDF Generation Strategy:**
- Use PDF-lib (not Puppeteer - too heavy for simple forms)
- Pre-built templates for each jurisdiction
- Fill-in-the-blank approach with form data

```typescript
import { PDFDocument, rgb } from 'pdf-lib';

class FormGenerator {
  async generateAppealForm(appealData: AppealData, jurisdiction: Jurisdiction): Promise<Buffer> {
    // Load jurisdiction-specific template
    const templatePath = `./templates/${jurisdiction.state}/${jurisdiction.county}.pdf`;
    const existingPdfBytes = await fs.readFile(templatePath);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    
    // Fill form fields
    const form = pdfDoc.getForm();
    form.getTextField('propertyAddress').setText(appealData.property.address);
    form.getTextField('assessedValue').setText(appealData.assessedValue.toString());
    
    // Return completed PDF
    return await pdfDoc.save();
  }
}
```

### Scheduled Jobs & Background Tasks

#### **Deadline Reminder Scheduler (Vercel Cron)**
```typescript
// src/api/cron/deadline-reminders.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { EmailService } from '../../services/EmailService';
import { prisma } from '../../config/database';

// Vercel Cron runs this daily at 9 AM UTC (configured in vercel.json)
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Verify this is a cron request
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const today = new Date();
  const reminders = [
    { daysBefore: 30, email: true },
    { daysBefore: 14, email: true },
    { daysBefore: 3, email: true },
    { daysBefore: 1, email: true }
  ];

  for (const reminder of reminders) {
    const deadlineDate = new Date(today);
    deadlineDate.setDate(today.getDate() + reminder.daysBefore);

    const appeals = await prisma.appeal.findMany({
      where: {
        deadlineDate: {
          gte: new Date(deadlineDate.setHours(0, 0, 0, 0)),
          lt: new Date(deadlineDate.setHours(23, 59, 59, 999))
        },
        status: { in: ['draft', 'submitted'] }
      },
      include: {
        property: {
          include: {
            user: {
              include: {
                notificationPreferences: true
              }
            }
          }
        }
      }
    });

    for (const appeal of appeals) {
      const preferences = appeal.property.user.notificationPreferences;
      
      if (reminder.email && preferences?.emailEnabled) {
        await EmailService.sendDeadlineReminder(
          appeal.property.user,
          appeal,
          reminder.daysBefore
        );
      }
    }
  }

  return res.status(200).json({ success: true, processed: appeals.length });
}
```

### Communication Services

#### **Email (Resend)**
```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

class EmailService {
  async sendDeadlineReminder(user: User, appeal: Appeal, daysRemaining: number) {
    await resend.emails.send({
      from: 'alerts@propertytaxappeal.com',
      to: user.email,
      subject: `Property Tax Appeal Deadline - ${daysRemaining} Days Remaining`,
      html: this.renderReminderTemplate(appeal, daysRemaining)
    });
  }
}
```

---

## Error Handling & Monitoring

### Error Handling Strategy

```typescript
// Custom error classes
class AppError extends Error {
  statusCode: number;
  isOperational: boolean;
  
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // Vs programming errors
    Error.captureStackTrace(this, this.constructor);
  }
}

// Global error handler middleware
const errorHandler = (error: Error, req: Request, res: Response, next: NextFunction) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      error: error.message
    });
  }
  
  // Log unexpected errors
  console.error('Unexpected error:', error);
  
  // Don't leak internals to client
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
};
```

### Monitoring & Logging

**Simple Approach for MVP:**
- **Console logging** with structured format (JSON)
- **Health check endpoint** (`/api/health`) for uptime monitoring
- **Error tracking:** Sentry for production error monitoring
- **Analytics:** PostHog for user behavior tracking

```typescript
// Structured logging
const logger = {
  info: (message: string, meta?: object) => {
    console.log(JSON.stringify({
      level: 'info',
      timestamp: new Date().toISOString(),
      message,
      ...meta
    }));
  },
  error: (message: string, error?: Error, meta?: object) => {
    console.error(JSON.stringify({
      level: 'error',
      timestamp: new Date().toISOString(),
      message,
      error: error?.stack,
      ...meta
    }));
  }
};
```

---

## Performance Considerations

### Caching Strategy

```typescript
// Redis for session storage and API response caching
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

class CacheService {
  // Cache property data for 24 hours
  async cachePropertyData(address: string, data: PropertyData) {
    await redis.setex(`property:${address}`, 86400, JSON.stringify(data));
  }
  
  // Cache comparable sales for 1 hour (real estate data changes frequently)
  async cacheComparables(propertyId: string, comparables: Comparable[]) {
    await redis.setex(`comparables:${propertyId}`, 3600, JSON.stringify(comparables));
  }
}
```

### Database Optimization

```typescript
// Connection pooling (via Prisma)
// Prisma handles connection pooling automatically
// Configure in DATABASE_URL or schema.prisma

// Query optimization patterns using Prisma
class PropertyService {
  // Avoid N+1 queries by eager loading
  async getUserPropertiesWithAppeals(userId: string) {
    return await prisma.property.findMany({
      where: { userId },
      include: {
        appeals: {
          select: {
            id: true,
            status: true,
            deadlineDate: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }
  
  // ✅ RentCast API handles radius searches natively - no Haversine needed!
  // Just pass lat/lng/radius to RentCast API and it returns filtered comparables with distance
  async getComparableSales(property: Property) {
    const comparables = await rentCastService.getComparableSales(
      property.latitude,
      property.longitude,
      1.0, // radius in miles
      6    // months back
    );
    // Distance already included in RentCast response
    return comparables;
  }
}

// ❌ HAVERSINE FORMULA NOT NEEDED - RentCast API handles geographic queries!
// Removed: No need for manual distance calculations
```

### Frontend Optimization

```typescript
// Code splitting for faster initial loads
const LazyDashboard = lazy(() => import('./components/Dashboard'));
const LazyAppealForm = lazy(() => import('./components/AppealForm'));

// Implement proper loading states
const useProperty = (propertyId: string) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    // Fetch property data with error handling
  }, [propertyId]);
  
  return { data, loading, error };
};
```

---

## Development Workflow

### Environment Setup

```bash
# Development setup script
#!/bin/bash

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Start PostgreSQL (Docker)
docker run --name postgres-dev -e POSTGRES_PASSWORD=password -d -p 5432:5432 postgres

# Run database migrations
npx prisma migrate dev

# Seed development data
npm run seed

# Start development servers
npm run dev  # Starts both frontend and backend
```

### Git Workflow

```bash
# Feature branch workflow
git checkout -b feature/property-lookup
git commit -m "feat: add property lookup by address"
git push origin feature/property-lookup

# Create PR → Code review → Merge to main → Auto-deploy
```

---

## Deployment Strategy

### Staging Environment
- **Frontend:** Vercel preview deployment on every PR
- **API:** Vercel preview deployment (serverless functions)
- **Database:** Supabase staging project (separate from production)
- **Storage:** Supabase Storage staging bucket
- **Testing:** Automated E2E tests run on staging before production deploy

### Production Environment
- **Frontend:** Vercel production (main branch auto-deploy)
- **API:** Vercel production (serverless functions auto-deploy with frontend)
- **Database:** Supabase production PostgreSQL with automated backups
- **Storage:** Supabase Storage production bucket
- **Cron Jobs:** Vercel Cron configured in `vercel.json`
- **Monitoring:** Health checks, error tracking, performance monitoring

### Environment Variables

```bash
# Backend API Routes (.env)
DATABASE_URL=postgresql://user:pass@db.supabase.co:5432/postgres
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
JWT_SECRET=your-256-bit-secret
JWT_REFRESH_SECRET=your-refresh-secret
RESEND_API_KEY=your-resend-key
GOOGLE_MAPS_API_KEY=your-maps-key
RENTCAST_API_KEY=your-rentcast-api-key

# Frontend (.env.local)
VITE_API_BASE_URL=http://localhost:3000/api
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_GOOGLE_MAPS_KEY=your-maps-key
```

### Vercel Configuration (vercel.json)

```json
{
  "crons": [
    {
      "path": "/api/cron/deadline-reminders",
      "schedule": "0 9 * * *"
    }
  ]
}
```

---

## Scalability Plan

### Horizontal Scaling Strategy

**Phase 1 (MVP):** Single deployment handles 10,000 users
- Vercel (Frontend + Serverless Functions) + Supabase (Database + Storage)
- Auto-scaling serverless functions
- No special scaling needed

**Phase 2 (Growth):** 100,000+ users
- Vercel automatically scales serverless functions
- Supabase read replicas for database queries
- CDN for static assets (included in Vercel)
- Supabase Storage CDN for PDFs
- Redis caching layer (optional, for API response caching)

**Phase 3 (Enterprise):** 1M+ users
- Microservices split:
  - User/Auth service (Vercel Functions)
  - Property data service (Vercel Functions)
  - Appeal processing service (Vercel Functions)
  - Form generation service (Vercel Functions)
- Event-driven architecture with message queues
- Separate Supabase projects per service (if needed)
- Edge functions for global performance

### Cost Optimization

**MVP Budget (Monthly):**
- Vercel: $0 (hobby tier - unlimited for personal projects)
- Supabase: $0 (free tier: 500MB database, 1GB storage, 50K monthly active users)
- External APIs: $100-200 (based on usage)
- **Total: ~$100-200/month for MVP**

**Growth Budget (10K users):**
- Vercel: $0-20/month (Pro tier if needed)
- Supabase: $25/month (Pro tier: 8GB database, 100GB storage)
- External APIs: $500-1000/month
- **Total: ~$525-1045/month**

---

## Security Compliance

### Data Privacy (GDPR/CCPA)

```typescript
// User data export
class PrivacyService {
  async exportUserData(userId: string): Promise<UserDataExport> {
    const user = await User.findById(userId);
    const properties = await Property.findByUserId(userId);
    const appeals = await Appeal.findByUserId(userId);
    
    return {
      personal_info: user,
      properties: properties,
      appeals: appeals,
      exported_at: new Date().toISOString()
    };
  }
  
  async deleteUserData(userId: string): Promise<void> {
    // Cascade delete with 30-day grace period
    await User.markForDeletion(userId);
  }
}
```

### Business Insurance Requirements

**Required Coverage:**
- **Professional Liability:** $2M (covers errors in deadline info)
- **Cyber Liability:** $1M (data breach protection)
- **General Business:** $1M (basic business protection)

**Estimated Cost:** $3,000-5,000/year

---

## Success Metrics & Analytics

### Key Performance Indicators

```typescript
// Analytics events to track
interface AnalyticsEvent {
  'property_analyzed': { address: string; likely_overassessed: boolean };
  'appeal_created': { property_id: string; estimated_savings: number };
  'appeal_submitted': { appeal_id: string; jurisdiction: string };
  'user_registered': { source: string; property_count: number };
  'form_generated': { jurisdiction: string; form_type: string };
}

// Conversion funnel tracking
const conversionFunnel = [
  'landing_page_view',     // 100% baseline
  'property_lookup',       // Target: 60%
  'analysis_completed',    // Target: 80%
  'account_created',       // Target: 70%
  'appeal_generated',      // Target: 85%
  'appeal_submitted'       // Target: 90%
];
```

### A/B Testing Framework

```typescript
// Simple feature flagging for A/B tests
class FeatureFlags {
  async isEnabled(flag: string, userId: string): Promise<boolean> {
    // Hash user ID to determine test group
    const hash = crypto.createHash('md5').update(userId + flag).digest('hex');
    const bucket = parseInt(hash.substring(0, 2), 16) % 100;
    
    const flagConfig = await this.getFlagConfig(flag);
    return bucket < flagConfig.rolloutPercent;
  }
}

// Example usage in React
const useFeatureFlag = (flag: string) => {
  const { user } = useAuth();
  const [enabled, setEnabled] = useState(false);
  
  useEffect(() => {
    if (user) {
      featureFlags.isEnabled(flag, user.id).then(setEnabled);
    }
  }, [flag, user]);
  
  return enabled;
};
```

---

## Technical Debt Management

### Code Quality Gates

```bash
# Pre-commit hooks (husky)
npm run lint        # ESLint + Prettier
npm run typecheck   # TypeScript compilation
npm run test        # Unit tests must pass
npm run audit       # Security vulnerability check
```

### Refactoring Schedule

**Monthly Reviews:**
- Database query performance analysis
- Bundle size optimization
- Dependency updates and security patches
- Code duplication identification

**Quarterly Reviews:**
- Architecture review for scalability bottlenecks
- Third-party service evaluation (cost vs. benefit)
- User feedback integration for UX improvements
- Technical debt prioritization vs. new features

---

## Documentation Strategy

### API Documentation (OpenAPI/Swagger)

```typescript
/**
 * @swagger
 * /api/properties/{id}/analyze:
 *   post:
 *     summary: Analyze if property is over-assessed
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Analysis completed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PropertyAnalysis'
 */
```

### Code Documentation Standards

```typescript
// Every service class needs:
/**
 * PropertyService handles all property-related business logic
 * 
 * Key responsibilities:
 * - Property lookup and validation
 * - Assessment data retrieval
 * - Market value analysis
 * 
 * External dependencies:
 * - Rentals.com API for property data
 * - Google Maps API for geocoding
 * - County assessor websites (fallback)
 */
class PropertyService {
  /**
   * Analyzes if a property is likely over-assessed
   * 
   * @param propertyId - UUID of property to analyze
   * @returns Analysis results with confidence level
   * @throws PropertyNotFoundError if property doesn't exist
   * @throws InsufficientDataError if no comparables found
   */
  async analyzeProperty(propertyId: string): Promise<PropertyAnalysis> {
    // Implementation...
  }
}
```

---

## Risk Mitigation

### Technical Risks

**Risk: External API failures (MLS data, county websites)**
- **Mitigation:** Multiple data sources, graceful degradation, user fallback options
- **Monitoring:** API uptime alerts, error rate tracking
- **Fallback:** Manual data entry option, "Professional appraisal recommended" message

**Risk: Database performance degradation**
- **Mitigation:** Query optimization, proper indexing, connection pooling
- **Monitoring:** Query performance tracking, slow query alerts
- **Fallback:** Read replicas, query result caching

### Business Risks

**Risk: Legal liability for incorrect deadline information**
- **Mitigation:** Triple-verification process, legal disclaimers, insurance coverage
- **Monitoring:** User reports of incorrect deadlines
- **Fallback:** "Verify with county" disclaimers, professional service referrals

**Risk: Low user adoption**
- **Mitigation:** Strong SEO, targeted ads, referral program, free tier
- **Monitoring:** Conversion funnel analysis, user feedback
- **Fallback:** B2B pivot (sell to tax consultants)

---

*End of Technical Architecture Document*