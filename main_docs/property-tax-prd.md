# Product Requirements Document: Property Tax Appeal Automation Platform

## Executive Summary

A web application that automates property tax appeals for residential property owners in the United States, reducing the complexity, time, and expertise required to successfully challenge overassessed property valuations.

---

## Problem Statement

**Current Pain Points:**
- Only 5% of eligible property owners file appeals despite 30-60% being potentially over-assessed
- Appeal deadlines vary by jurisdiction (Texas: May 15, Colorado: June 8, California: Nov 30, etc.)
- Property owners don't know if they're over-assessed
- Evidence gathering (comparable sales) is time-consuming and requires expertise
- Forms and procedures differ by county (3,000+ counties nationwide)
- Miss deadline = wait 1-3 years for next cycle

**User Impact:**
- Average successful appeal: 10-28% reduction in assessed value
- Typical savings: $500-$3,000+ annually in reduced taxes
- Current barrier: Complexity and fear of bureaucratic process

---

## Target Users

### Primary Persona: "Busy Homeowner Betty"
- **Demographics:** Age 35-65, owns residential property valued $200K-$800K
- **Tech comfort:** Can use email, online banking, basic web apps
- **Pain:** Received assessment notice, suspects overvaluation, no time for research
- **Goal:** Reduce property taxes with minimal effort

### Secondary Persona: "Property Portfolio Paul"
- **Demographics:** Owns 3-10 rental properties
- **Tech comfort:** Moderate to high
- **Pain:** Managing multiple appeals across different jurisdictions
- **Goal:** Systematic approach to appeal all properties annually

---

## Success Metrics

### Business Metrics
- **User acquisition:** 10,000 users in Year 1
- **Appeal submission rate:** 70%+ of users who complete analysis
- **Success rate:** 50%+ of appeals result in reduction
- **NPS score:** 60+ (users would recommend)

### Product Metrics
- **Time to first appeal:** < 30 minutes from signup to submission
- **Completion rate:** 65%+ start-to-finish
- **Return users:** 80%+ for next assessment cycle
- **Mobile usage:** 40%+ of sessions

---

## Core Features

### MVP (Version 1.0) - Single Jurisdiction Focus

#### 1. Property Lookup & Analysis
**User Story:** As a homeowner, I want to enter my address and instantly know if I'm likely over-assessed.

**Requirements:**
- Address input with autocomplete validation
- Fetch current assessment from county records (if available via API)
- Compare assessment to recent comparable sales (last 6 months, within 1 mile)
- Display simple verdict: "Likely Over-assessed" / "Fairly Assessed" / "Under-assessed"
- Show estimated tax savings if appeal succeeds

**Success Criteria:**
- 95% address recognition accuracy
- Analysis completes in < 10 seconds
- Clear recommendation with confidence level

#### 2. Comparable Sales Research
**User Story:** As a user, I need evidence to support my appeal without manual research.

**Requirements:**
- Automatically find 5-10 comparable properties:
  - Similar square footage (±20%)
  - Same bed/bath count (±1)
  - Similar lot size (±25%)
  - Within 1 mile radius
  - Sold in last 6-12 months
- Display side-by-side comparison table
- Allow user to add/remove comparables manually
- Generate adjustment explanations (e.g., "Subject property has older roof")

**Success Criteria:**
- Find adequate comparables for 80% of properties
- Adjustments are reasonable and defensible
- User can understand logic without real estate expertise

#### 3. Deadline Management
**User Story:** As a user, I need to know my deadline and receive reminders so I don't miss filing.

**Requirements:**
- Database of filing deadlines for all US counties
- Calculate user's specific deadline based on address
- Display prominent countdown timer
- Email reminders: 30 days, 14 days, 3 days before deadline
- SMS reminder option (day before deadline)

**Success Criteria:**
- 100% deadline accuracy for supported jurisdictions
- 0 missed deadlines due to incorrect information
- 95%+ delivery rate for notifications

#### 4. Appeal Form Generation
**User Story:** As a user, I want pre-filled forms ready to submit without having to understand complex paperwork.

**Requirements:**
- Jurisdiction-specific form templates (start with top 50 counties by population)
- Auto-populate from user data: name, address, parcel number, assessment amount
- Pre-fill comparable sales evidence
- Generate appeal letter with reasoning
- Produce PDF ready for download/print/email

**Success Criteria:**
- Forms are compliant with jurisdiction requirements
- 90% of fields auto-populated
- Professional appearance matching official standards

#### 5. Submission Guidance
**User Story:** As a user, I want clear instructions on how to submit my appeal so I don't make mistakes.

**Requirements:**
- Step-by-step submission instructions by jurisdiction:
  - Where to submit (address, online portal link, email)
  - How to submit (mail, online, in-person, fax)
  - What to submit (number of copies, attachments)
  - Confirmation method
- Email submission assistance (send via our system where possible)
- Submission checklist before finalizing

**Success Criteria:**
- Clear instructions for 100% of supported jurisdictions
- 85%+ of users successfully submit first time
- Reduce support requests about "what to do next"

#### 6. User Account & Dashboard
**User Story:** As a user, I want to track my appeal status and access my documents anytime.

**Requirements:**
- Secure account creation (email/password)
- Dashboard showing:
  - Current appeal status
  - Documents generated
  - Next action required
  - Deadline countdown
- Document storage (forms, comparables, correspondence)
- Multi-property support for one account

**Success Criteria:**
- < 60 second signup process
- 99.9% uptime for dashboard access
- All documents retrievable for 3+ years

---

### Version 2.0 - Enhanced Features

#### 7. Hearing Preparation Assistant
- Generate talking points for board hearing
- Sample Q&A for common board questions
- Evidence presentation order recommendations
- Hearing etiquette tips by jurisdiction

#### 8. Professional Photo Documentation
- Guided photo checklist for property defects
- Before/after comparison tools
- Annotation features for highlighting issues
- Photo organization by category (roof, foundation, etc.)

#### 9. Appeal Tracking & Outcomes
- Status updates from user input
- Outcome tracking (approved/denied/partial)
- Savings calculator based on results
- Historical data for improvement insights

#### 10. Multi-Year Strategy
- Track assessment history over time
- Predict next assessment increase
- Proactive appeal recommendations
- Biennial/triennial cycle management

---

### Version 3.0 - Advanced Automation

#### 11. Automated Status Checking
- Integration with county systems (where APIs exist)
- Automatic outcome detection
- Real-time status updates without user input

#### 12. Professional Service Marketplace
- Connect with local property tax consultants
- Appraisal ordering service
- Attorney referrals for complex cases
- Revenue share model

#### 13. Batch Processing for Landlords
- Upload multiple properties via CSV
- Bulk analysis and form generation
- Portfolio-level reporting
- Priority queue for high-value appeals

---

## Out of Scope (Explicitly NOT Building)

### What We're NOT Automating
1. **Actual hearing attendance** - Users attend their own hearings (or hire representation)
2. **Legal advice** - We provide information, not attorney-client relationship
3. **Appraisal services** - We don't replace professional appraisers
4. **Commercial properties** - Residential only for MVP
5. **Tax payment processing** - We don't handle tax payments
6. **Arbitration/litigation** - Stop at local board level

### Why AI Is NOT the Answer (for most of this)
- **Deadline tracking:** Simple database lookup beats AI every time
- **Form filling:** Template + data insertion, no AI needed
- **Comparable sales:** Rule-based filtering is faster and more reliable
- **Instructions:** Static content management, not generative

### Where AI MIGHT Help (Future Consideration)
- **OCR for assessment notices:** Extract data from uploaded PDFs
- **Natural language appeal letters:** Make reasoning sound professional
- **Property description enhancement:** Convert user input to formal language
- **Chatbot for common questions:** Reduce support burden

**Rule for AI:** Only use if traditional programming is demonstrably insufficient AND accuracy can be validated.

---

## Non-Functional Requirements

### Performance
- Page load time: < 2 seconds on 3G connection
- Analysis completion: < 10 seconds for property lookup
- Form generation: < 5 seconds
- API response times: 95th percentile < 500ms

### Security
- SOC 2 Type II compliance (future, post-MVP)
- PII encryption at rest and in transit
- HTTPS only, no mixed content
- Password requirements: 12+ characters
- Two-factor authentication (optional but recommended)
- GDPR/CCPA compliant data handling

### Reliability
- 99.9% uptime during peak appeal season
- Automated backups every 6 hours
- Disaster recovery plan with < 24hr RTO
- Graceful degradation if external data sources fail

### Scalability
- Support 10,000 concurrent users
- Handle 50,000 properties in system
- 1M+ comparable sales records
- Horizontal scaling capability

### Accessibility
- WCAG 2.1 AA compliance
- Screen reader compatible
- Keyboard navigation support
- Mobile responsive (320px to 2560px)

### Legal & Compliance
- Terms of Service clearly stating we're not attorneys
- Disclaimers about outcome guarantees
- Data retention policy (3 years minimum for user records)
- Privacy policy compliant with all 50 states
- Cookie consent management

---

## User Flows

### Primary Flow: First-Time Appeal
1. **Landing page** → "Enter your address to check if you're overpaying"
2. **Address input** → Autocomplete suggestions
3. **Analysis screen** → "You're likely over-assessed by 15% - Save ~$800/year"
4. **Sign up prompt** → "Create free account to start appeal"
5. **Comparable sales review** → See evidence, add/remove properties
6. **Form generation** → "Your forms are ready"
7. **Submission instructions** → "Here's exactly what to do next"
8. **Download/submit** → Get files, submit to county
9. **Confirmation** → "Appeal submitted! Next steps..."

**Time to complete:** 20-30 minutes

### Secondary Flow: Returning User
1. **Login** → Dashboard
2. **View properties** → Select property for this cycle
3. **Update analysis** → Refresh comparables with new data
4. **Regenerate forms** → New assessment amount
5. **Submit** → Faster second time

**Time to complete:** 10-15 minutes

---

## Monetization Strategy

### Freemium Model (Recommended)

**Free Tier:**
- 1 property analysis per year
- Basic comparable sales (5 properties)
- Form generation for supported jurisdictions
- Email notifications

**Premium Tier ($49/year per property):**
- Unlimited properties
- Priority comparable research (10+ properties)
- Phone number deadline reminders
- Hearing preparation materials
- Document storage unlimited
- Priority customer support
- Multi-year tracking

**Professional Tier ($299/year):**
- Everything in Premium
- Batch upload (CSV)
- Portfolio reporting
- API access (future)
- White-label option (future)
- Dedicated account manager

### Alternative: Contingency Model
- Free to use, pay only if appeal succeeds
- 25% of first year tax savings
- Higher revenue per user but may discourage trials
- Requires outcome verification system
- Recommend as Phase 2 option

---

## Success Criteria

### MVP Launch Criteria (3 months)
- ✅ Support top 10 counties by population
- ✅ 95% accuracy on property assessment retrieval
- ✅ Comparable sales for 80% of properties
- ✅ Forms generated in < 5 seconds
- ✅ 100 beta users complete full flow
- ✅ 60% of beta users submit appeals

### 6-Month Criteria
- ✅ 50 counties supported (covers 30% of US population)
- ✅ 5,000 registered users
- ✅ 2,000 appeals submitted through platform
- ✅ 50% of submitted appeals result in reduction
- ✅ NPS score > 50

### 12-Month Criteria
- ✅ 200+ counties supported (covers 60% of US population)
- ✅ 25,000 registered users
- ✅ 10,000 appeals submitted
- ✅ $10M+ in tax savings for users
- ✅ Revenue positive (if paid model)
- ✅ < 5% churn rate

---

## Risk Assessment

### High Risk
**Risk:** Incorrect deadline information leads to missed filing
- **Mitigation:** Triple-verify all deadline data, annual review process, user testing
- **Fallback:** Clear disclaimers, insurance policy for errors

**Risk:** Comparable sales data insufficient or inaccurate
- **Mitigation:** Multiple data sources, manual review option, user override capability
- **Fallback:** Professional appraisal referral service

### Medium Risk
**Risk:** County assessor websites change, breaking integrations
- **Mitigation:** Monthly automated testing, user error reporting, graceful fallbacks
- **Fallback:** Manual data entry instructions

**Risk:** Legal liability for bad advice
- **Mitigation:** Clear disclaimers, no attorney-client relationship, terms requiring independent verification
- **Fallback:** Business insurance, legal review of all content

### Low Risk
**Risk:** Low user adoption
- **Mitigation:** Strong SEO, targeted ads during assessment notice season, referral program
- **Fallback:** Pivot to B2B (sell to tax consultants)

---

## Open Questions (To Be Resolved)

1. **Data sourcing strategy:** ✅ RESOLVED - Using RentCast API as primary data source
2. **County prioritization:** ✅ RESOLVED - MVP focuses on Denver County only (extensible architecture)
3. **Mobile app:** Web-only MVP or native apps for iOS/Android?
4. **Customer support:** Chatbot vs. human support for complex questions?
5. **Outcome tracking:** Honor system vs. verified results via county APIs?
6. **International expansion:** Canada/UK property tax appeals in future?

---

## Dependencies

### External Data Sources
- RentCast API (primary) - Property characteristics, assessments, comparable sales
- County assessor websites (fallback) - Web scraping when RentCast doesn't have data
- Google Maps Places API - Address autocomplete and geocoding

### Regulatory/Legal
- Terms of Service legal review
- Privacy policy template (GDPR/CCPA compliant)
- Non-attorney disclaimer language
- Business insurance (E&O coverage)

### Infrastructure
- Domain name and hosting
- Email delivery service (SendGrid, Postmark)
- SMS service (Twilio)
- Cloud storage (S3 for documents)
- Database hosting (managed PostgreSQL)

---

## Timeline Estimate

**Month 1-2:** Core infrastructure, data pipeline, property lookup
**Month 2-3:** Comparable sales engine, form generation
**Month 3:** Deadline management, user accounts, beta launch
**Month 4-6:** 50-county expansion, polish, marketing
**Month 7-12:** Advanced features, scaling, growth

**Total MVP time: 3 months with 2-3 junior engineers + 1 senior lead**

---

*End of Product Requirements Document*