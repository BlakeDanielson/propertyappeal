# Implementation Resolutions: Property Tax Appeal Platform

This document resolves all critical gaps and inconsistencies identified in the PRD review.

---

## 1. Data Source Strategy - RESOLVED

### Decision: RentCast API as Primary Data Source

**Primary Data Sources:**
1. **Property Characteristics, Comparable Sales & Assessment Values:** RentCast API
   - Provides: Address, sqft, bedrooms, bathrooms, lot size, year built
   - Provides: Tax assessment history and property tax amounts
   - Provides: Comparable properties with distance calculations (handles geographic queries natively)
   - Provides: Owner details and sale transaction history
   - Coverage: 140+ million properties nationwide
   - Cost: Free tier (50 requests/month) for MVP testing, scalable pricing
   - Legal: Flexible licensing, ToS compliant, commercial use allowed

2. **Geocoding:** Google Maps API
   - Address validation and geocoding
   - Cost: $5 per 1,000 requests (free tier: $200/month credit)

3. **Assessment Values (Fallback):** County Assessor Websites (Web Scraping)
   - Primary: RentCast API (handles assessments)
   - Fallback: Automated web scraping with Puppeteer (only if RentCast fails)
   - Last Resort: Manual data entry by user
   - Use when: RentCast doesn't have data for specific county/property

### Fallback Order:
1. Try RentCast API for property data, assessments, and comparables
2. If RentCast fails → Try county assessor scraping for assessments
3. If scraping fails → Allow manual entry
4. If no comparables → Show "insufficient data" warning

### Implementation:
- ✅ Updated `tech-architecture.md` to reflect RentCast API
- Create `RentCastService.ts` that wraps RentCast API calls
- Create `AssessorScraper.ts` for county website scraping (fallback only)
- Implement graceful degradation at each step
- ✅ RentCast API handles geographic queries natively (no Haversine needed)

---

## 2. Database Access Pattern - RESOLVED

### Decision: Use Prisma ORM

**Rationale:**
- Better type safety for junior engineers
- Automatic migrations
- Better IDE support
- Consistent with TypeScript-first approach

### Implementation:
- Remove all raw SQL examples from architecture docs
- Update TDD plan to use Prisma syntax
- Use Prisma Client for all database operations
- Prisma Migrate for schema changes

### Update All Examples:
```typescript
// Before (raw SQL):
await db.query('DELETE FROM users');

// After (Prisma):
await prisma.user.deleteMany();
```

---

## 3. Geographic Queries - RESOLVED

### Decision: RentCast API Handles Geographic Queries Natively

**Rationale:**
- ✅ RentCast API supports radius-based searches natively
- ✅ Accepts `lat`, `lng`, and `radius` parameters
- ✅ Returns comparables with distance already calculated
- ✅ No Haversine formula needed
- ✅ No PostGIS extension needed
- ✅ No application-level distance calculations

### Implementation:
```typescript
// RentCast API handles geographic filtering - no manual calculation needed!
async getComparableSales(
  latitude: number,
  longitude: number,
  radiusMiles: number = 1.0,
  monthsBack: number = 6
): Promise<RentCastComparable[]> {
  const response = await rentCastService.getComparableSales(
    latitude,
    longitude,
    radiusMiles,
    monthsBack
  );
  // Distance already included in RentCast response
  return response;
}
```

### Update Schema:
- Store latitude/longitude for properties (from RentCast)
- Use simple DECIMAL indexes on latitude/longitude for property lookups
- No geographic extension needed - RentCast handles all radius searches

---

## 4. Authentication Token Strategy - RESOLVED

### Decision: Database-Stored Refresh Tokens

**Implementation:**
- Store refresh tokens in database for revocation
- Access token: 24 hours, stored in httpOnly cookie
- Refresh token: 7 days, stored in database
- Token rotation on refresh for security

### Schema Addition:
```sql
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    INDEX idx_refresh_tokens_user_id (user_id),
    INDEX idx_refresh_tokens_token (token)
);
```

### Endpoints:
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Revoke refresh token

---

## 5. Password Requirements - RESOLVED

### Decision: 12+ Characters Minimum

**Implementation:**
- Enforce 12 character minimum per PRD security requirements
- Update TDD test expectations from 8 to 12 characters
- Add password strength indicator (optional but recommended)

---

## 6. Subscription/Monetization Schema - RESOLVED

### Decision: Include in MVP (Simplified)

**Schema Addition:**
```sql
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
```

**Limits:**
- Free: 1 property analysis per calendar year
- Premium: Unlimited (tracked but not limited)
- Professional: Unlimited (tracked but not limited)

---

## 7. Deadline Reminder Scheduling - RESOLVED

### Decision: Vercel Cron (Scheduled Serverless Functions)

**Implementation:**
```typescript
// src/api/cron/deadline-reminders.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { EmailService } from '../../services/EmailService';
import { prisma } from '../../config/database';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Vercel Cron sends a special header to verify this is a cron request
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

**Vercel Configuration (vercel.json):**
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

**Benefits:**
- Managed by Vercel (more reliable than node-cron on single server)
- Auto-scaling if needed
- Better monitoring and logs
- No server maintenance required

---

## 8. Form Template Management - RESOLVED

### Decision: Supabase Storage with Versioning

**Storage Structure:**
```
supabase-storage/buckets/templates/
  ├── {state}/
  │   ├── {county}/
  │   │   ├── {year}/
  │   │   │   └── appeal-form.pdf
  │   │   └── latest -> {year}/
```

**Acquisition Process:**
1. Manual download from county assessor websites (Denver County for MVP)
2. Upload to Supabase Storage with metadata (year, last updated)
3. Validate template matches current year's form
4. Update `jurisdictions.forms_info` with template path (Supabase Storage URL)

**Template Metadata in Database:**
```sql
-- Add to jurisdictions table
ALTER TABLE jurisdictions ADD COLUMN template_version INTEGER;
ALTER TABLE jurisdictions ADD COLUMN template_supabase_path VARCHAR(500);
ALTER TABLE jurisdictions ADD COLUMN template_last_updated DATE;
```

**Validation Checklist:**
- [ ] Form matches current assessment year
- [ ] All required fields present
- [ ] Form format matches county requirements
- [ ] Test form generation with sample data

---

## 9. Comparable Sales Adjustment Logic - RESOLVED

### Complete Adjustment Rules:

```typescript
interface AdjustmentRules {
  sizePerSqft: number;        // $150/sqft difference
  bedroomValue: number;       // $15,000 per bedroom
  bathroomValue: number;      // $10,000 per bathroom
  lotSizePerAcre: number;    // $50,000 per acre difference
  ageDepreciation: number;    // $2,000 per year difference
  conditionAdjustment: {      // Manual or estimated
    excellent: 0;
    good: -10000;
    fair: -25000;
    poor: -50000;
  };
}

const DEFAULT_ADJUSTMENTS: AdjustmentRules = {
  sizePerSqft: 150,
  bedroomValue: 15000,
  bathroomValue: 10000,
  lotSizePerAcre: 50000,
  ageDepreciation: 2000,
  conditionAdjustment: {
    excellent: 0,
    good: -10000,
    fair: -25000,
    poor: -50000
  }
};

function calculateAdjustments(
  subject: Property,
  comparable: Comparable,
  rules: AdjustmentRules = DEFAULT_ADJUSTMENTS
): AdjustmentResult {
  const adjustments = {
    sizeDifference: (comparable.sqft - subject.sqft) * rules.sizePerSqft,
    bedroomDifference: (comparable.bedrooms - subject.bedrooms) * rules.bedroomValue,
    bathroomDifference: (comparable.bathrooms - subject.bathrooms) * rules.bathroomValue,
    lotSizeDifference: (comparable.lotSize - subject.lotSize) * rules.lotSizePerAcre,
    ageDifference: (comparable.yearBuilt - subject.yearBuilt) * rules.ageDepreciation,
    conditionDifference: rules.conditionAdjustment[comparable.condition] - 
                        rules.conditionAdjustment[subject.condition]
  };

  const totalAdjustment = Object.values(adjustments).reduce((sum, val) => sum + val, 0);
  const adjustedPrice = comparable.salePrice - totalAdjustment;

  return {
    adjustments,
    adjustedPrice,
    explanation: generateExplanation(adjustments, subject, comparable)
  };
}

function generateExplanation(adjustments: any, subject: Property, comparable: Comparable): string {
  const reasons: string[] = [];
  
  if (adjustments.sizeDifference !== 0) {
    const diff = Math.abs(adjustments.sizeDifference);
    const direction = adjustments.sizeDifference > 0 ? 'larger' : 'smaller';
    reasons.push(`Comparable is ${Math.abs(comparable.sqft - subject.sqft)} sqft ${direction} (+${diff.toLocaleString()})`);
  }
  
  if (adjustments.bedroomDifference !== 0) {
    const diff = Math.abs(adjustments.bedroomDifference);
    const direction = adjustments.bedroomDifference > 0 ? 'more' : 'fewer';
    reasons.push(`Comparable has ${Math.abs(comparable.bedrooms - subject.bedrooms)} ${direction} bedrooms (+${diff.toLocaleString()})`);
  }
  
  // ... similar for other adjustments
  
  return reasons.join('; ');
}
```

---

## 10. Free Tier Limitation Enforcement - RESOLVED

### Implementation: Usage Middleware

```typescript
// src/middleware/usageLimits.ts
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';

export async function checkUsageLimit(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const userId = req.user!.id;
  const currentYear = new Date().getFullYear();

  // Get user's subscription
  const subscription = await prisma.subscription.findUnique({
    where: { userId }
  });

  if (!subscription) {
    return res.status(500).json({ error: 'Subscription not found' });
  }

  // Free tier has limits
  if (subscription.planType === 'free') {
    const usage = await prisma.usageTracking.findUnique({
      where: {
        user_id_action_type_action_year: {
          userId,
          actionType: 'property_analysis',
          actionYear: currentYear
        }
      }
    });

    const analysisCount = usage?.count || 0;

    if (analysisCount >= 1) {
      return res.status(403).json({
        error: 'Free tier limit reached',
        message: 'You have reached your free tier limit of 1 property analysis per year.',
        upgradeUrl: '/pricing'
      });
    }
  }

  next();
}

// Increment usage after analysis
export async function incrementUsage(userId: string, actionType: string) {
  const currentYear = new Date().getFullYear();

  await prisma.usageTracking.upsert({
    where: {
      user_id_action_type_action_year: {
        userId,
        actionType,
        actionYear: currentYear
      }
    },
    update: {
      count: { increment: 1 }
    },
    create: {
      userId,
      actionType,
      actionYear: currentYear,
      count: 1
    }
  });
}
```

**Reset Logic:**
- Usage resets on January 1st of each calendar year
- Tracked per `action_year` field
- Automatic reset when new year begins

---

## 11. Address Autocomplete Implementation - RESOLVED

### Decision: Google Places Autocomplete API

**Implementation:**
```typescript
// Frontend: src/components/AddressInput.tsx
import { useLoadScript, Autocomplete } from '@react-google-maps/api';

function AddressInput({ onAddressSelect }) {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY,
    libraries: ['places']
  });

  const handlePlaceSelect = (place: google.maps.places.PlaceResult) => {
    const address = {
      street: place.address_components?.find(c => c.types.includes('street_number'))?.long_name + ' ' +
              place.address_components?.find(c => c.types.includes('route'))?.long_name,
      city: place.address_components?.find(c => c.types.includes('locality'))?.long_name,
      state: place.address_components?.find(c => c.types.includes('administrative_area_level_1'))?.short_name,
      zip: place.address_components?.find(c => c.types.includes('postal_code'))?.long_name,
      coordinates: {
        lat: place.geometry?.location?.lat(),
        lng: place.geometry?.location?.lng()
      }
    };
    
    onAddressSelect(address);
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

**Caching:**
- Cache validated addresses in localStorage (24 hours)
- Cache geocoded coordinates in database
- Reduce API calls for repeat searches

**Fallback:**
- If Google API down → Allow manual address entry
- Validate format client-side (basic regex)
- Backend validates address exists via geocoding

---

## 12. Error Handling Matrix - RESOLVED

### Comprehensive Error Handling:

| Scenario | User Action | System Response |
|----------|-------------|-----------------|
| Property assessment not found | Show manual entry form | Allow user to enter assessment value manually |
| No comparables found | Show warning + options | "We couldn't find enough comparable sales. Options: 1) Expand search radius 2) Manual entry 3) Professional appraisal recommended" |
| County deadline missing | Show contact info | "This jurisdiction is not yet supported. Please contact [county name] assessor at [phone/email]" |
| Form template missing | Show message | "Form generation not yet available for this county. Download manual form from [county website link]" |
| RentCast API failure | Retry with fallback | Try county scraping → Manual entry |
| Invalid address | Show validation error | Highlight invalid fields, suggest corrections |
| Insufficient data for analysis | Show partial results | "Low confidence - based on limited data. Consider professional appraisal." |

**Minimum Viable Data:**
- Property address ✓
- Assessment value (manual entry allowed) ✓
- At least 1 comparable OR user proceeds with manual entry ✓

---

## 13. Tax Savings Calculation Formula - RESOLVED

### Decision: Jurisdiction-Specific Rates with Fallback

**Implementation:**
```typescript
// Add to jurisdictions table
ALTER TABLE jurisdictions ADD COLUMN estimated_tax_rate DECIMAL(5, 4); // e.g., 0.0120 = 1.2%

// Default fallback rate: 1.2%
const DEFAULT_TAX_RATE = 0.012;

function calculateTaxSavings(
  overassessedAmount: number,
  jurisdiction: Jurisdiction
): number {
  const taxRate = jurisdiction.estimatedTaxRate || DEFAULT_TAX_RATE;
  return Math.max(0, overassessedAmount * taxRate);
}
```

**MVP Strategy:**
- Use 1.2% estimate with disclaimer: "Estimated savings based on average tax rate. Actual savings may vary."
- Store jurisdiction-specific rates as we gather data
- Future: Fetch actual tax rates from county data

**Display:**
- Show estimated savings prominently
- Include disclaimer about estimated rate
- Allow users to input their own tax rate for more accurate calculation

---

## 14. Appeal Letter Generation - RESOLVED

### Decision: Template-Based Approach (No AI for MVP)

**Letter Structure:**
```
1. Header: Property address, parcel number, assessment year
2. Introduction: "I am writing to appeal the assessed value..."
3. Current Assessment: State current assessed value
4. Proposed Value: State proposed value and justification
5. Comparable Sales: List 3-5 comparables with adjustments
6. Reasoning: Explain why assessment is incorrect
7. Conclusion: Request reduction and next steps
8. Signature: User name, date, contact info
```

**Template:**
```typescript
function generateAppealLetter(appeal: Appeal, comparables: Comparable[]): string {
  return `
PROPERTY TAX ASSESSMENT APPEAL

Property Address: ${appeal.property.address}
Parcel Number: ${appeal.property.parcelNumber}
Assessment Year: ${appeal.appealYear}

Dear [County Assessor],

I am writing to formally appeal the assessed value of my property for the ${appeal.appealYear} tax year.

CURRENT ASSESSMENT
The current assessed value is $${appeal.currentAssessment.toLocaleString()}.

PROPOSED VALUE
Based on recent comparable sales in my area, I believe the fair market value should be $${appeal.proposedAssessment.toLocaleString()}.

COMPARABLE SALES EVIDENCE
${comparables.map(c => `
Property: ${c.address}
Sale Price: $${c.salePrice.toLocaleString()}
Sale Date: ${c.saleDate}
Adjusted Price: $${c.adjustedPrice.toLocaleString()}
${c.adjustments ? `Adjustments: ${Object.entries(c.adjustments).map(([k, v]) => `${k}: ${v}`).join(', ')}` : ''}
`).join('\n')}

REASONING
[Generated explanation based on comparable sales analysis]

I respectfully request that the assessed value be reduced to $${appeal.proposedAssessment.toLocaleString()} based on the evidence provided above.

Thank you for your consideration.

Sincerely,
${appeal.property.user.firstName} ${appeal.property.user.lastName}
${appeal.property.user.email}
${appeal.property.user.phone ? appeal.property.user.phone : ''}
${new Date().toLocaleDateString()}
  `.trim();
}
```

**Jurisdiction-Specific:**
- Store letter templates per jurisdiction if required
- Fallback to generic template if specific template not available

---

## 15. Additional Schema Additions

### Notification Preferences Table:
```sql
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

### Appeal Outcomes (Future):
```sql
ALTER TABLE appeals ADD COLUMN outcome VARCHAR(50); -- 'approved', 'denied', 'partial', 'pending'
ALTER TABLE appeals ADD COLUMN final_assessment INTEGER;
ALTER TABLE appeals ADD COLUMN actual_savings DECIMAL(10, 2);
ALTER TABLE appeals ADD COLUMN outcome_date DATE;
ALTER TABLE appeals ADD COLUMN outcome_notes TEXT;
```

---

## Next Steps

1. Update `tech-architecture.md` with all resolved items
2. Update `tdd-development-plan.md` with Prisma examples and corrected password requirements
3. Update `property-tax-prd.md` with clarifications
4. Create database migration files with all schema additions
5. Implement the resolved components

---

*End of Implementation Resolutions Document*

