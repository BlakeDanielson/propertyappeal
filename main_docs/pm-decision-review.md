# Product Decision Review: Property Tax Appeal Platform

## Purpose
This document helps us make smart, cost-conscious decisions step-by-step before implementation. We'll review each critical decision point with cost implications, alternatives, and recommendations.

---

## Decision Framework

For each decision, we'll consider:
1. **Cost** - What does it cost per user/request?
2. **MVP Feasibility** - Can we launch without it?
3. **Scalability** - Will it work at 10K users? 100K users?
4. **Maintenance** - How much ongoing work is required?
5. **Risk** - What happens if it fails?

---

## CRITICAL DECISION #1: Data Sources for Property & Comparable Sales ✅ DECIDED

**DECISION: Use RentCast API**

**Rationale:**
- ✅ Legal and compliant (no ToS violations)
- ✅ Has all required data (assessments, comparables, property characteristics)
- ✅ Free tier for MVP testing (50 requests/month)
- ✅ Nationwide coverage (140M+ properties)
- ✅ Competitive pricing (to be verified)
- ✅ Easy integration (RESTful API, developer playground)
- ✅ High data quality (500K+ updates daily)
- ✅ Supports radius-based geographic queries natively (no Haversine/PostGIS needed)

**What RentCast Provides:**
- Property characteristics (sqft, beds, baths, lot size, year built)
- Tax assessment history and property tax amounts
- Comparable properties with distance calculations
- Owner details and sale transaction history
- Value estimates (AVM) and market statistics

**Implementation Plan:**
- Start with free tier for MVP development
- Test API endpoints for property data and comparables
- Verify assessment data completeness
- Verify comparables endpoint radius search (confirmed: supports lat/lng/radius)
- Check pricing beyond free tier and scale plan accordingly
- Document integration in tech architecture

**Status:** ✅ Verified - RentCast API supports radius-based searches natively, eliminating need for manual geographic calculations (see Decision #2).

---

## CRITICAL DECISION #2: Geographic Query Approach ✅ SOLVED BY RENTCAST

### The Problem
We need to find comparable sales within 1 mile radius of a property.

### Solution: RentCast API Handles Geographic Queries Natively ✅

**RentCast API eliminates the need for manual geographic calculations!**

- ✅ **RentCast API supports radius-based searches natively**
- ✅ Accepts `lat`, `lng`, and `radius` parameters
- ✅ Returns comparables with distance already calculated
- ✅ **No Haversine formula needed**
- ✅ **No PostGIS extension needed**
- ✅ **No application-level distance calculations**

**API Endpoint:** `GET /v1/listings/sale?lat=39.7392&lng=-104.9903&radius=1.0&status=Sold`

**Result:** Geographic query problem is completely solved by RentCast API. We simply pass lat/lng/radius to RentCast and receive filtered comparables with distance included.

### Previous Options (No Longer Needed):
- ~~Haversine Formula~~ - Not needed, RentCast handles it
- ~~PostGIS Extension~~ - Not needed, RentCast handles it
- ~~Hybrid approach~~ - Not needed, RentCast handles it

**DECISION:** Use RentCast API's built-in geographic query capabilities. No additional implementation needed.

---

## CRITICAL DECISION #3: Hosting & Infrastructure ✅ DECIDED

**DECISION: Vercel (Frontend + API) + Supabase (Database + Storage + Auth)**

**Rationale:**
- ✅ **Only 2 providers** (vs. 1 with Railway, but better fit for our needs)
- ✅ Vercel: Best-in-class frontend hosting + serverless API routes
- ✅ Supabase: PostgreSQL + Storage + Built-in auth (can replace JWT auth)
- ✅ Supabase Storage: S3-compatible storage for PDFs/templates
- ✅ Vercel Cron: Built-in scheduled jobs (replaces node-cron)
- ✅ Excellent developer experience
- ✅ Great free tiers for MVP
- ✅ Better separation of concerns (frontend vs. backend services)

**What Vercel Provides:**
- **Frontend:** React static site hosting (zero-config)
- **API Routes:** Serverless functions for Express API endpoints
- **Cron Jobs:** Scheduled jobs via Vercel Cron (replaces node-cron)
- **Preview Deployments:** Automatic preview on every PR
- **CDN:** Global edge network for fast delivery

**What Supabase Provides:**
- **Database:** Managed PostgreSQL with backups
- **Storage:** S3-compatible object storage for PDFs/templates
- **Auth:** Built-in authentication (can replace custom JWT auth)
- **Real-time:** Optional real-time subscriptions (future use)
- **Dashboard:** Database GUI, SQL editor, storage browser

**Architecture Changes:**
- **API Routes:** Convert Express routes to Vercel serverless functions (`/api/*`)
- **Scheduled Jobs:** Use Vercel Cron instead of node-cron (scheduled functions)
- **Authentication:** Consider Supabase Auth instead of custom JWT (optional)
- **File Storage:** Use Supabase Storage instead of Railway volumes

**Cost Estimate:**
- **MVP:**
  - Vercel: $0 (hobby tier - unlimited for personal projects)
  - Supabase: $0 (free tier: 500MB database, 1GB storage, 50K monthly active users)
  - **Total: $0/month for MVP**
- **Growth (10K users):**
  - Vercel: $0-20/month (Pro tier if needed)
  - Supabase: $25/month (Pro tier: 8GB database, 100GB storage)
  - **Total: ~$25-45/month**

**Comparison: Railway vs. Vercel + Supabase**

| Feature | Railway (All-in-One) | Vercel + Supabase |
|---------|---------------------|-------------------|
| **Providers** | 1 provider | 2 providers |
| **Frontend** | ✅ Static hosting | ✅ Best-in-class (zero-config) |
| **Backend** | ✅ Express server | ✅ Serverless functions |
| **Database** | ✅ PostgreSQL | ✅ PostgreSQL + GUI |
| **Storage** | ✅ Volume storage | ✅ S3-compatible storage |
| **Scheduled Jobs** | ✅ node-cron | ✅ Vercel Cron |
| **Auth** | ❌ Custom (JWT) | ✅ Built-in (optional) |
| **Free Tier** | Limited | ✅ Generous |
| **MVP Cost** | ~$20/month | **$0/month** |
| **Developer Experience** | Good | ✅ Excellent |
| **Preview Deployments** | Limited | ✅ Every PR |
| **Scalability** | Manual | ✅ Auto-scaling |

**Tradeoffs:**
- **Railway:** Single provider, simpler billing, traditional Express server
- **Vercel + Supabase:** Better DX, free MVP tier, serverless architecture, modern tooling

**Status:** ✅ Confirmed - Vercel + Supabase selected for better developer experience, free MVP tier, and modern serverless architecture.

---

## CRITICAL DECISION #4: Database Access Pattern

### The Problem
How do we interact with the database?

### Options

**Option A: Prisma ORM**
- Type-safe queries
- Automatic migrations
- Better for junior engineers
- **Cost:** $0
- **Setup:** ~1 day initial setup

**Option B: Raw SQL**
- More control
- Potentially faster
- More error-prone
- **Cost:** $0
- **Setup:** $0 (but more code to write)

**Option C: Another ORM (TypeORM, Sequelize)**
- Similar to Prisma
- Different API patterns

### Recommendation:
**Prisma ORM** - Worth the setup time for type safety and easier maintenance. Junior engineers will make fewer mistakes.

**Action Required:** PM to confirm - Low cost decision, high value for team productivity.

---

## CRITICAL DECISION #5: Address Autocomplete ✅ DECIDED

**DECISION: Use Google Places Autocomplete**

**Rationale:**
- ✅ Best accuracy (meets PRD requirement of 95% recognition accuracy)
- ✅ Within free tier for MVP ($200/month free credit)
- ✅ Excellent UX with real-time autocomplete
- ✅ Cost-effective at scale (~$400/month at 100K users)

**Cost:**
- $5 per 1,000 requests (after $200/month free credit)
- At 10K users: ~$0 cost (within free tier)
- At 100K users: ~$400/month

**Implementation:**
- Integrate Google Places Autocomplete API
- Use for property address input field
- Validate and geocode addresses before property lookup

**Status:** ✅ Confirmed - Google Places Autocomplete selected for MVP.

---

## CRITICAL DECISION #6: Form Generation Templates ✅ DECIDED

**DECISION: Manual Template Acquisition - MVP: Denver County Only**

**Key Requirements:**
- **MVP Scope:** Denver County only (build extensible architecture for future counties)
- **Storage:** Store forms in Supabase Storage (S3-compatible object storage)
- **Architecture:** Build system to easily add new counties when ready

**Rationale:**
- Start with single county to validate product-market fit
- Focus on building robust, extensible architecture
- Low cost for MVP (Supabase free tier includes 1GB storage)
- Easy to scale by adding new county templates

**Implementation Plan:**
- Download Denver County appeal form template
- Store in Supabase Storage with organized structure (e.g., `forms/{state}/{county}/template.pdf`)
- Build abstraction layer for form template management
- Design database schema to support multiple counties (even if MVP only uses Denver)
- Create admin interface/page for adding new county templates (future)

**Architecture Considerations:**
- Template storage: Supabase Storage (S3-compatible)
- Template naming convention: `{state}-{county}.pdf` (e.g., `CO-Denver.pdf`)
- Database field: `jurisdiction.templatePath` pointing to Supabase Storage URL
- Form generation service should be county-agnostic (template path from database)
- Easy to add new counties: Upload template to Supabase Storage, add jurisdiction record to database

**Cost:**
- Supabase Storage: Free tier includes 1GB (enough for hundreds of templates)
- At 50 counties: Well within free tier (templates are ~100KB each)
- Manual acquisition: 1-2 hours per county (future)

**Status:** ✅ Confirmed - MVP Denver County only, extensible architecture for future counties. Supabase Storage for template storage.

---

## CRITICAL DECISION #7: Deadline Reminder System ✅ DECIDED

**DECISION: Use Vercel Cron (Scheduled Serverless Functions)**

**Rationale:**
- ✅ Built into Vercel platform (no additional setup)
- ✅ More reliable than node-cron (managed by Vercel)
- ✅ $0 cost (included in Vercel)
- ✅ Automatic scaling and reliability
- ✅ Better for serverless architecture

**Implementation:**
- Use Vercel Cron for scheduled email reminders
- Create cron job function in `/api/cron/deadline-reminders.ts`
- Configure schedule in `vercel.json`: `"crons": [{ "path": "/api/cron/deadline-reminders", "schedule": "0 9 * * *" }]`
- Send reminders at 30, 14, 3, and 1 days before deadline
- Runs daily job to check for upcoming deadlines and send reminders

**Benefits:**
- Managed by Vercel (more reliable than node-cron on single server)
- Auto-scaling if needed
- Better monitoring and logs
- No server maintenance required

**Status:** ✅ Confirmed - Vercel Cron for MVP deadline reminder system.

---

## CRITICAL DECISION #8: Email/SMS Service ✅ DECIDED

**DECISION: Resend for Email, No SMS for MVP**

**Rationale:**
- ✅ Resend has excellent free tier (3,000/month)
- ✅ Simple API, good developer experience
- ✅ Cost-effective at scale ($20/month for 50K emails)
- ✅ SMS not needed for MVP - can add later if needed

**Email Service: Resend**
- Free tier: 3,000 emails/month
- After free tier: $20/month for 50K emails
- At 10K users (4 emails each): ~$15-20/month
- MVP Cost: $0 (within free tier)

**SMS Service: Not Included in MVP**
- No SMS functionality for MVP
- Can add Twilio later if needed
- Saves cost and complexity for initial launch

**Status:** ✅ Confirmed - Resend for email only, no SMS for MVP.

---

## CRITICAL DECISION #9: Monetization Strategy ✅ DECIDED

**DECISION: Contingency Model Based on Successful Appeal**

**Key Principles:**
- ✅ Users can do almost everything except submit the appeal before entering payment info
- ✅ Charge only when the appeal is successful
- ✅ Payment model: Percentage of savings OR monthly fee (still deciding)
- ✅ Free to analyze property, view comparables, generate forms
- ✅ Payment required only to submit completed appeal

**User Flow:**
1. User enters property address (free)
2. User views analysis results (free)
3. User reviews comparable sales (free)
4. User generates appeal forms (free)
5. User reviews and customizes appeal forms (free)
6. **Payment required:** User must enter payment info to submit the appeal
7. **Payment charged:** Only after successful appeal resolution

**Payment Models (Still Deciding):**
- **Option A:** Percentage of tax savings (e.g., 20% of first year savings)
- **Option B:** Monthly fee (e.g., $X/month until appeal is resolved)
- **Option C:** One-time fee upon successful appeal (e.g., $99 flat fee)

**Benefits:**
- Low barrier to entry - users can fully explore value before committing
- Aligns incentives - we only make money when users succeed
- Reduces risk for users - pay only if appeal is successful
- Attracts more users - free analysis and form generation

**Implementation Considerations:**
- Store payment info securely (Stripe, etc.) but don't charge until appeal success
- Track appeal status to determine when to charge
- Need mechanism to verify appeal success (user self-report or integration with county systems)
- Clear communication about payment terms upfront

**Status:** ✅ Confirmed - Contingency model, users can do everything except submit before payment. Charge % of savings or monthly fee, only upon successful appeal.

---

## Summary of Decisions Needed

### ✅ Decided (Ready for Implementation):
1. ✅ **Data Sources** - RentCast API selected
2. ✅ **Geographic Queries** - Solved by RentCast API (no Haversine/PostGIS needed)
3. ✅ **Hosting & Infrastructure** - Vercel (frontend + API) + Supabase (database + storage)
4. ✅ **Address Autocomplete** - Google Places Autocomplete
5. ✅ **Form Templates** - Denver County only for MVP, extensible architecture, Supabase Storage
6. ✅ **Deadline Reminder System** - Vercel Cron scheduled functions
7. ✅ **Email/SMS Service** - Resend for email, no SMS for MVP
8. ✅ **Monetization Strategy** - Contingency model, charge only on successful appeal

### Medium Priority (Can decide during development):
9. Database pattern (Prisma) - Already recommended, low cost
10. Payment model specifics (percentage vs. monthly fee) - Still deciding

### Low Priority (Post-MVP):
11. External job scheduler (upgrade from node-cron if needed)
12. Advanced caching
13. SMS functionality
14. Additional counties beyond Denver

---

## Next Steps

**Immediate Actions:**
1. ✅ Data sources - RentCast API selected
2. ✅ Hosting - Vercel + Supabase confirmed
3. ✅ Address autocomplete - Google Places confirmed
4. ✅ Form templates - Denver County MVP scope confirmed
5. ✅ Deadline reminders - Vercel Cron confirmed
6. ✅ Email service - Resend confirmed, no SMS
7. ✅ Monetization - Contingency model confirmed

**Still Need to Decide:**
1. Payment model specifics (percentage of savings vs. monthly fee vs. flat fee)
2. Database pattern confirmation (Prisma recommended)

**Implementation Ready:**
- All critical decisions made
- Can proceed with MVP development
- Architecture defined for extensibility (counties, payment models)

---

*Created: [Date] - Review with PM before proceeding*

