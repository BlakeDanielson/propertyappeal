# Test-Driven Development Plan: Property Tax Appeal Platform

## Testing Philosophy

**Test Pyramid Approach:** Many unit tests, fewer integration tests, minimal E2E tests. Each test should be fast, isolated, and focused on a single concern.

**TDD Process for Junior Engineers:**
1. **Red:** Write failing test first (describes desired behavior)
2. **Green:** Write minimal code to make test pass
3. **Refactor:** Improve code while keeping tests green
4. **Repeat:** Next feature or test case

---

## Testing Stack

### Backend Testing

```typescript
// Test Stack
- Jest: Test runner and assertion library
- Supertest: HTTP integration testing
- @types/jest: TypeScript support
- testcontainers: Real database testing
- nock: Mock external HTTP calls
```

### Frontend Testing

```typescript
// Test Stack
- Jest: Test runner and assertion library (Next.js compatible)
- React Testing Library: Component testing
- MSW (Mock Service Worker): API mocking
- @testing-library/user-event: User interaction simulation
```

---

## Test Structure & Organization

### Backend Test Organization

```
src/
├── __tests__/               # Test files mirror src structure
│   ├── unit/                
│   │   ├── services/        # Business logic tests
│   │   │   ├── PropertyService.test.ts
│   │   │   ├── ComparableService.test.ts
│   │   │   └── DeadlineService.test.ts
│   │   ├── controllers/     # Controller tests
│   │   │   ├── PropertyController.test.ts
│   │   │   └── AuthController.test.ts
│   │   └── utils/           # Utility function tests
│   │       ├── validators.test.ts
│   │       └── formatters.test.ts
│   ├── integration/         # API endpoint tests
│   │   ├── auth.test.ts
│   │   ├── properties.test.ts
│   │   └── appeals.test.ts
│   └── fixtures/            # Test data
│       ├── properties.json
│       ├── users.json
│       └── comparables.json
└── jest.config.js           # Jest configuration
```

### Frontend Test Organization

```
src/
├── __tests__/               
│   ├── components/          # Component tests
│   │   ├── PropertySearch.test.tsx
│   │   ├── ComparableSales.test.tsx
│   │   └── Dashboard.test.tsx
│   ├── hooks/               # Custom hook tests
│   │   ├── useProperty.test.ts
│   │   └── useAuth.test.ts
│   ├── services/            # API service tests
│   │   └── propertyService.test.ts
│   └── utils/               # Utility tests
│       └── formatters.test.ts
├── __mocks__/               # Mock implementations
│   └── api.ts
└── jest.config.js           # Jest configuration
```

---

## Implementation Order & Test Strategy

### Phase 1: Foundation (Week 1-2)

#### 1.1 Database Models & Basic CRUD

**Start with:** User model (simplest entity)

```typescript
// src/models/User.test.ts - Write this test FIRST
describe('User Model', () => {
  beforeEach(async () => {
    // Clear test database using Prisma
    await prisma.user.deleteMany();
  });

  it('should create user with valid data', async () => {
    const userData = {
      email: 'test@example.com',
      password: 'securePassword123',
      firstName: 'John',
      lastName: 'Doe'
    };

    const user = await prisma.user.create({
      data: {
        email: userData.email,
        passwordHash: await bcrypt.hash(userData.password, 12),
        firstName: userData.firstName,
        lastName: userData.lastName
      }
    });

    expect(user.id).toBeDefined();
    expect(user.email).toBe(userData.email);
    expect(user.passwordHash).not.toBe(userData.password); // Should be hashed
    expect(user.createdAt).toBeDefined();
  });

  it('should reject user with invalid email', async () => {
    const userData = {
      email: 'invalid-email',
      password: 'securePassword123',
      firstName: 'John',
      lastName: 'Doe'
    };

    await expect(
      prisma.user.create({
        data: {
          email: userData.email,
          passwordHash: await bcrypt.hash(userData.password, 12),
          firstName: userData.firstName,
          lastName: userData.lastName
        }
      })
    ).rejects.toThrow(); // Prisma will throw if email format invalid or unique constraint violated
  });

  it('should reject duplicate email', async () => {
    const userData = {
      email: 'test@example.com',
      password: 'securePassword123',
      firstName: 'John',
      lastName: 'Doe'
    };

    await prisma.user.create({
      data: {
        email: userData.email,
        passwordHash: await bcrypt.hash(userData.password, 12),
        firstName: userData.firstName,
        lastName: userData.lastName
      }
    });

    await expect(
      prisma.user.create({
        data: {
          email: userData.email,
          passwordHash: await bcrypt.hash(userData.password, 12),
          firstName: userData.firstName,
          lastName: userData.lastName
        }
      })
    ).rejects.toThrow(); // Unique constraint violation
  });
});
```

**Then implement:** Minimal User model validation (email validation happens at API layer)

#### 1.2 Authentication System

**Test authentication flow:**

```typescript
// src/__tests__/integration/auth.test.ts
describe('POST /api/auth/register', () => {
  it('should register new user and return JWT', async () => {
    const userData = {
      email: 'test@example.com',
      password: 'securePassword123',
      firstName: 'John',
      lastName: 'Doe'
    };

    const response = await request(app)
      .post('/api/auth/register')
      .send(userData)
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.user.email).toBe(userData.email);
    expect(response.body.data.user.password).toBeUndefined(); // Don't return password
    expect(response.body.data.token).toBeDefined();

    // Verify JWT is valid
    const decoded = jwt.verify(response.body.data.token, process.env.JWT_SECRET!);
    expect(decoded.userId).toBeDefined();
  });

  it('should reject registration with weak password', async () => {
    const userData = {
      email: 'test@example.com',
      password: '123', // Too weak - must be 12+ characters
      firstName: 'John',
      lastName: 'Doe'
    };

    const response = await request(app)
      .post('/api/auth/register')
      .send(userData)
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.error).toContain('Password must be at least 12 characters');
  });
});

describe('POST /api/auth/login', () => {
  it('should login existing user', async () => {
    // First create a user
    const user = await User.create({
      email: 'test@example.com',
      password: 'securePassword123',
      firstName: 'John',
      lastName: 'Doe'
    });

    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'securePassword123'
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.token).toBeDefined();
  });

  it('should reject invalid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'nonexistent@example.com',
        password: 'wrongpassword'
      })
      .expect(401);

    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe('Invalid credentials');
  });
});
```

#### 1.3 Property Model

**Test property CRUD operations:**

```typescript
// src/models/Property.test.ts
describe('Property Model', () => {
  let testUser: User;

  beforeEach(async () => {
    await prisma.property.deleteMany();
    await prisma.user.deleteMany();
    
    testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        passwordHash: await bcrypt.hash('password123', 12),
        firstName: 'John',
        lastName: 'Doe'
      }
    });
  });

  it('should create property with valid address', async () => {
    const propertyData = {
      userId: testUser.id,
      addressLine1: '123 Main St',
      city: 'Denver',
      state: 'CO',
      zipCode: '80202',
      county: 'Denver'
    };

    const property = await prisma.property.create({
      data: {
        userId: propertyData.userId,
        addressLine1: propertyData.addressLine1,
        city: propertyData.city,
        state: propertyData.state,
        zipCode: propertyData.zipCode,
        county: propertyData.county,
        characteristics: {}
      }
    });

    expect(property.id).toBeDefined();
    expect(property.userId).toBe(testUser.id);
    expect(`${property.addressLine1}, ${property.city}, ${property.state} ${property.zipCode}`).toBe('123 Main St, Denver, CO 80202');
  });

  it('should validate required fields', async () => {
    const incompleteData = {
      userId: testUser.id,
      addressLine1: '123 Main St'
      // Missing city, state, zip
    };

    await expect(
      prisma.property.create({
        data: incompleteData as any
      })
    ).rejects.toThrow(); // Prisma will throw validation error
  });

  it('should find properties by user ID', async () => {
    await prisma.property.create({
      data: {
        userId: testUser.id,
        addressLine1: '123 Main St',
        city: 'Denver',
        state: 'CO',
        zipCode: '80202',
        county: 'Denver',
        characteristics: {}
      }
    });

    const properties = await prisma.property.findMany({
      where: { userId: testUser.id }
    });
    
    expect(properties).toHaveLength(1);
    expect(properties[0].addressLine1).toBe('123 Main St');
  });
});
```

### Phase 2: Core Business Logic (Week 3-4)

#### 2.1 Property Analysis Service

**Test the heart of our application:**

```typescript
// src/services/PropertyService.test.ts
describe('PropertyService', () => {
  let propertyService: PropertyService;
  let mockRentCastService: jest.Mocked<RentCastService>;

  beforeEach(() => {
    mockRentCastService = {
      getPropertyByAddress: jest.fn(),
      getComparableSales: jest.fn()
    } as jest.Mocked<RentCastService>;
    
    propertyService = new PropertyService(mockRentCastService);
  });

  describe('analyzeProperty', () => {
    it('should return overassessed when assessment > market value', async () => {
      const property = {
        id: 'prop-1',
        assessedValue: 500000,
        characteristics: { sqft: 2000, bedrooms: 3, bathrooms: 2 }
      };

      const comparables = [
        { salePrice: 450000, adjustedPrice: 440000, sqft: 2000 },
        { salePrice: 430000, adjustedPrice: 435000, sqft: 1950 },
        { salePrice: 460000, adjustedPrice: 455000, sqft: 2100 }
      ];

      mockRentCastService.getComparableSales.mockResolvedValue(comparables);

      const analysis = await propertyService.analyzeProperty(property);

      expect(analysis.likelyOverassessed).toBe(true);
      expect(analysis.marketValueEstimate).toBeCloseTo(443333, -2); // Average of comparables
      expect(analysis.potentialSavings).toBeGreaterThan(1000);
      expect(analysis.confidence).toBe('high'); // 3+ comparables = high confidence
    });

    it('should return fairly assessed when assessment ≈ market value', async () => {
      const property = {
        id: 'prop-1',
        assessedValue: 450000,
        characteristics: { sqft: 2000, bedrooms: 3, bathrooms: 2 }
      };

      const comparables = [
        { salePrice: 445000, adjustedPrice: 448000, sqft: 2000 },
        { salePrice: 455000, adjustedPrice: 452000, sqft: 2050 }
      ];

      mockRentCastService.getComparableSales.mockResolvedValue(comparables);

      const analysis = await propertyService.analyzeProperty(property);

      expect(analysis.likelyOverassessed).toBe(false);
      expect(analysis.confidence).toBe('medium'); // 2 comparables = medium confidence
    });

    it('should handle insufficient comparable data', async () => {
      const property = {
        id: 'prop-1',
        assessedValue: 500000,
        characteristics: { sqft: 2000, bedrooms: 3, bathrooms: 2 }
      };

      mockRentCastService.getComparableSales.mockResolvedValue([]); // No comparables found

      await expect(propertyService.analyzeProperty(property))
        .rejects.toThrow('Insufficient comparable sales data');
    });
  });
});
```

**Implement service to make tests pass:**

```typescript
// src/services/PropertyService.ts
export class PropertyService {
  constructor(private rentCastService: RentCastService) {}

  async analyzeProperty(property: Property): Promise<PropertyAnalysis> {
    // RentCast API handles geographic filtering natively - no Haversine needed!
    const comparables = await this.rentCastService.getComparableSales(
      property.latitude!,
      property.longitude!,
      1.0, // radius in miles
      6    // months back
    );

    if (comparables.length === 0) {
      throw new Error('Insufficient comparable sales data');
    }

    // Calculate market value estimate
    const marketValue = this.calculateMarketValue(comparables);
    const overassessedAmount = property.assessedValue - marketValue;
    const overassessedPercent = overassessedAmount / marketValue;

    // Determine confidence based on comparable count
    const confidence = this.getConfidenceLevel(comparables.length);

    // Calculate potential tax savings (assume 1.2% effective tax rate)
    const potentialSavings = Math.max(0, overassessedAmount * 0.012);

    return {
      likelyOverassessed: overassessedPercent > 0.05, // 5% threshold
      marketValueEstimate: Math.round(marketValue),
      potentialSavings: Math.round(potentialSavings),
      confidence,
      comparableCount: comparables.length,
      explanation: this.generateExplanation(overassessedPercent, comparables.length)
    };
  }

  private calculateMarketValue(comparables: Comparable[]): number {
    const adjustedPrices = comparables.map(c => c.adjustedPrice);
    return adjustedPrices.reduce((sum, price) => sum + price, 0) / adjustedPrices.length;
  }

  private getConfidenceLevel(comparableCount: number): 'low' | 'medium' | 'high' {
    if (comparableCount >= 5) return 'high';
    if (comparableCount >= 3) return 'medium';
    return 'low';
  }
}
```

#### 2.2 Comparable Sales Service

**Test comparable sales matching logic:**

```typescript
// src/services/ComparableService.test.ts
describe('ComparableService', () => {
  let comparableService: ComparableService;
  
  beforeEach(() => {
    comparableService = new ComparableService();
  });

  describe('filterComparables', () => {
    const targetProperty = {
      sqft: 2000,
      bedrooms: 3,
      bathrooms: 2,
      lotSize: 0.25,
      yearBuilt: 2010
    };

    it('should include properties within size tolerance', () => {
      const candidates = [
        { sqft: 1900, bedrooms: 3, bathrooms: 2, salePrice: 400000 }, // -5%, should include
        { sqft: 2100, bedrooms: 3, bathrooms: 2, salePrice: 410000 }, // +5%, should include  
        { sqft: 1500, bedrooms: 3, bathrooms: 2, salePrice: 350000 }, // -25%, should exclude
        { sqft: 2600, bedrooms: 3, bathrooms: 2, salePrice: 500000 }  // +30%, should exclude
      ];

      const filtered = comparableService.filterComparables(targetProperty, candidates);
      
      expect(filtered).toHaveLength(2);
      expect(filtered.map(c => c.sqft)).toEqual(expect.arrayContaining([1900, 2100]));
    });

    it('should prefer exact bedroom/bathroom matches', () => {
      const candidates = [
        { sqft: 2000, bedrooms: 3, bathrooms: 2, salePrice: 400000 }, // Exact match
        { sqft: 2000, bedrooms: 4, bathrooms: 2, salePrice: 420000 }, // +1 bedroom
        { sqft: 2000, bedrooms: 3, bathrooms: 3, salePrice: 430000 }, // +1 bathroom
        { sqft: 2000, bedrooms: 2, bathrooms: 2, salePrice: 380000 }  // -1 bedroom
      ];

      const filtered = comparableService.filterComparables(targetProperty, candidates, { limit: 3 });
      
      // Should prioritize exact match first
      expect(filtered[0].bedrooms).toBe(3);
      expect(filtered[0].bathrooms).toBe(2);
    });
  });

  describe('adjustComparable', () => {
    it('should adjust for size differences', () => {
      const targetProperty = { sqft: 2000, bedrooms: 3, bathrooms: 2 };
      const comparable = { sqft: 1800, bedrooms: 3, bathrooms: 2, salePrice: 360000 };

      const adjusted = comparableService.adjustComparable(targetProperty, comparable);

      // Smaller house should adjust upward (200 sqft * $150/sqft = +$30k)
      expect(adjusted.adjustedPrice).toBeCloseTo(390000, -2);
      expect(adjusted.adjustments.sizeDifference).toBeCloseTo(30000, -2);
    });

    it('should adjust for bedroom/bathroom differences', () => {
      const targetProperty = { sqft: 2000, bedrooms: 3, bathrooms: 2 };
      const comparable = { sqft: 2000, bedrooms: 4, bathrooms: 3, salePrice: 450000 };

      const adjusted = comparableService.adjustComparable(targetProperty, comparable);

      // Comparable has +1 bed (+$15k) and +1 bath (+$10k), so adjust down -$25k
      expect(adjusted.adjustedPrice).toBeCloseTo(425000, -2);
      expect(adjusted.adjustments.bedroomDifference).toBeCloseTo(-15000, -2);
      expect(adjusted.adjustments.bathroomDifference).toBeCloseTo(-10000, -2);
    });
  });
});
```

#### 2.3 Deadline Management Service

**Test deadline calculation logic:**

```typescript
// src/services/DeadlineService.test.ts
describe('DeadlineService', () => {
  let deadlineService: DeadlineService;
  let mockJurisdictionRepo: jest.Mocked<JurisdictionRepository>;

  beforeEach(() => {
    mockJurisdictionRepo = {
      findByStateAndCounty: jest.fn()
    } as jest.Mocked<JurisdictionRepository>;
    
    deadlineService = new DeadlineService(mockJurisdictionRepo);
  });

  it('should calculate fixed date deadlines', async () => {
    const jurisdiction = {
      state: 'CO',
      county: 'Denver',
      deadlineRule: 'fixed_date',
      deadlineDate: new Date('2025-06-08')
    };

    mockJurisdictionRepo.findByStateAndCounty.mockResolvedValue(jurisdiction);

    const deadline = await deadlineService.getDeadline('CO', 'Denver', 2025);

    expect(deadline.deadlineDate).toEqual(new Date('2025-06-08'));
    expect(deadline.daysRemaining).toBeGreaterThan(0); // Assuming test runs before June 8
  });

  it('should calculate days-after-notice deadlines', async () => {
    const jurisdiction = {
      state: 'TX',
      county: 'Harris',
      deadlineRule: 'days_after_notice',
      deadlineDate: null,
      deadlineDays: 30
    };

    mockJurisdictionRepo.findByStateAndCounty.mockResolvedValue(jurisdiction);

    const noticeDate = new Date('2025-04-15');
    const deadline = await deadlineService.getDeadline('TX', 'Harris', 2025, noticeDate);

    const expectedDeadline = new Date('2025-05-15'); // 30 days after April 15
    expect(deadline.deadlineDate).toEqual(expectedDeadline);
  });

  it('should handle unknown jurisdictions gracefully', async () => {
    mockJurisdictionRepo.findByStateAndCounty.mockResolvedValue(null);

    await expect(deadlineService.getDeadline('XX', 'Unknown', 2025))
      .rejects.toThrow('Jurisdiction not supported: XX, Unknown');
  });
});
```

### Phase 3: API Integration Layer (Week 5-6)

#### 3.1 External API Services

**Test MLS data integration with mocked responses:**

```typescript
// src/external/RentCastService.test.ts
describe('RentCastService', () => {
  let rentCastService: RentCastService;

  beforeEach(() => {
    rentCastService = new RentCastService('test-api-key');
  });

  afterEach(() => {
    nock.cleanAll(); // Clean up HTTP mocks
  });

  it('should fetch property data from RentCast API', async () => {
    const mockResponse = {
      status: 'success',
      data: {
        id: 'prop-123',
        address: {
          line1: '456 Oak St',
          city: 'Denver',
          state: 'CO',
          zipCode: '80202',
          county: 'Denver',
          latitude: 39.7392,
          longitude: -104.9903
        },
        property: {
          bedrooms: 3,
          bathrooms: 2,
          squareFootage: 1950,
          lotSize: 0.23,
          yearBuilt: 2010
        },
        assessment: {
          assessedValue: 425000,
          assessedYear: 2024,
          taxAmount: 5100,
          taxYear: 2024
        }
      }
    };

    nock('https://api.rentcast.io')
      .get('/v1/property')
      .query({
        address: '456 Oak St, Denver, CO 80202'
      })
      .reply(200, mockResponse);

    const result = await rentCastService.getPropertyByAddress('456 Oak St, Denver, CO 80202');

    expect(result.id).toBe('prop-123');
    expect(result.assessment.assessedValue).toBe(425000);
    expect(result.property.squareFootage).toBe(1950);
  });

  it('should fetch comparable sales from RentCast API with radius search', async () => {
    const mockResponse = {
      status: 'success',
      data: [
        {
          id: 'comp-1',
          address: '789 Pine St, Denver, CO 80202',
          salePrice: 425000,
          saleDate: '2024-10-15',
          distance: 0.3, // Distance already calculated by RentCast API
          property: {
            bedrooms: 3,
            bathrooms: 2,
            squareFootage: 1950,
            lotSize: 0.23,
            yearBuilt: 2010
          }
        }
      ]
    };

    // RentCast API handles geographic queries natively - no Haversine needed!
    nock('https://api.rentcast.io')
      .get('/v1/listings/sale')
      .query({
        lat: 39.7392,
        lng: -104.9903,
        radius: 1.0,
        status: 'Sold'
      })
      .reply(200, mockResponse);

    const result = await rentCastService.getComparableSales(
      39.7392,  // latitude
      -104.9903, // longitude
      1.0,      // radius in miles
      6         // months back
    );

    expect(result).toHaveLength(1);
    expect(result[0].salePrice).toBe(425000);
    expect(result[0].distance).toBe(0.3); // Distance included in RentCast response
  });

  it('should handle API errors gracefully', async () => {
    nock('https://api.rentcast.io')
      .get('/v1/property')
      .query(true)
      .reply(500, { status: 'error', message: 'Internal server error' });

    await expect(rentCastService.getPropertyByAddress('123 Main St'))
      .rejects.toThrow('RentCast API error');
  });

  it('should handle property not found', async () => {
    nock('https://api.rentcast.io')
      .get('/v1/property')
      .query(true)
      .reply(404, { status: 'error', message: 'Property not found' });

    await expect(rentCastService.getPropertyByAddress('999 Nonexistent St'))
      .rejects.toThrow('Property not found in RentCast database');
  });

  it('should handle rate limiting', async () => {
    nock('https://api.rentcast.io')
      .get('/v1/property')
      .query(true)
      .reply(429, { status: 'error', message: 'Rate limit exceeded' });

    await expect(rentCastService.getPropertyByAddress('123 Main St'))
      .rejects.toThrow('rate limit exceeded');
  });
});
```

#### 3.2 Form Generation Service

**Test PDF form generation:**

```typescript
// src/services/FormGeneratorService.test.ts
describe('FormGeneratorService', () => {
  let formGenerator: FormGeneratorService;
  let tempDir: string;

  beforeEach(async () => {
    // Create temporary directory for test files
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'form-test-'));
    formGenerator = new FormGeneratorService({
      templateDir: tempDir
    });
  });

  afterEach(async () => {
    // Clean up temp files
    await fs.rm(tempDir, { recursive: true });
  });

  it('should generate PDF form with property data', async () => {
    // Create minimal template file
    const templateContent = await createMinimalPDF(); // Helper function
    await fs.writeFile(path.join(tempDir, 'CO-Denver.pdf'), templateContent);

    const appealData = {
      property: {
        address: '123 Main St, Denver, CO 80202',
        parcelNumber: 'ABC123456789',
        assessedValue: 500000
      },
      proposedValue: 425000,
      comparables: [
        { address: '456 Oak St', salePrice: 420000 },
        { address: '789 Pine St', salePrice: 430000 }
      ]
    };

    const jurisdiction = {
      state: 'CO',
      county: 'Denver',
      templateName: 'CO-Denver.pdf'
    };

    const pdfBuffer = await formGenerator.generateAppealForm(appealData, jurisdiction);

    expect(Buffer.isBuffer(pdfBuffer)).toBe(true);
    expect(pdfBuffer.length).toBeGreaterThan(1000); // PDF should have reasonable size

    // Verify PDF content (basic check)
    const pdfText = await extractTextFromPDF(pdfBuffer);
    expect(pdfText).toContain('123 Main St');
    expect(pdfText).toContain('500000');
    expect(pdfText).toContain('425000');
  });

  it('should handle missing template gracefully', async () => {
    const appealData = { /* minimal data */ };
    const jurisdiction = {
      state: 'XX',
      county: 'Unknown',
      templateName: 'nonexistent.pdf'
    };

    await expect(formGenerator.generateAppealForm(appealData, jurisdiction))
      .rejects.toThrow('Form template not found');
  });
});
```

### Phase 4: Frontend Components (Week 7-8)

#### 4.1 Property Search Component

**Test user interaction flows:**

```typescript
// src/__tests__/components/PropertySearch.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PropertySearch } from '../components/PropertySearch';
import { propertyService } from '../services/propertyService';

// Mock the service
jest.mock('../services/propertyService');
const mockPropertyService = propertyService as jest.Mocked<typeof propertyService>;

describe('PropertySearch', () => {
  const mockOnPropertyFound = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should search for property when address is entered', async () => {
    const user = userEvent.setup();
    
    mockPropertyService.lookupProperty.mockResolvedValue({
      id: 'prop-1',
      address: '123 Main St, Denver, CO 80202',
      assessedValue: 500000,
      characteristics: { sqft: 2000, bedrooms: 3, bathrooms: 2 }
    });

    render(<PropertySearch onPropertyFound={mockOnPropertyFound} />);

    // User types address
    const addressInput = screen.getByLabelText(/property address/i);
    await user.type(addressInput, '123 Main St, Denver, CO 80202');

    // User clicks search button
    const searchButton = screen.getByRole('button', { name: /search/i });
    await user.click(searchButton);

    // Should show loading state
    expect(screen.getByText(/searching/i)).toBeInTheDocument();

    // Wait for search to complete
    await waitFor(() => {
      expect(mockPropertyService.lookupProperty).toHaveBeenCalledWith('123 Main St, Denver, CO 80202');
      expect(mockOnPropertyFound).toHaveBeenCalledWith(expect.objectContaining({
        address: '123 Main St, Denver, CO 80202'
      }));
    });

    // Should hide loading state
    expect(screen.queryByText(/searching/i)).not.toBeInTheDocument();
  });

  it('should show error when property not found', async () => {
    const user = userEvent.setup();
    
    mockPropertyService.lookupProperty.mockRejectedValue(new Error('Property not found'));

    render(<PropertySearch onPropertyFound={mockOnPropertyFound} />);

    const addressInput = screen.getByLabelText(/property address/i);
    await user.type(addressInput, '999 Nonexistent St');

    const searchButton = screen.getByRole('button', { name: /search/i });
    await user.click(searchButton);

    await waitFor(() => {
      expect(screen.getByText(/property not found/i)).toBeInTheDocument();
    });

    expect(mockOnPropertyFound).not.toHaveBeenCalled();
  });

  it('should validate address format before searching', async () => {
    const user = userEvent.setup();
    
    render(<PropertySearch onPropertyFound={mockOnPropertyFound} />);

    const addressInput = screen.getByLabelText(/property address/i);
    await user.type(addressInput, 'invalid');

    const searchButton = screen.getByRole('button', { name: /search/i });
    await user.click(searchButton);

    // Should show validation error without making API call
    expect(screen.getByText(/please enter a valid address/i)).toBeInTheDocument();
    expect(mockPropertyService.lookupProperty).not.toHaveBeenCalled();
  });
});
```

#### 4.2 Property Analysis Component

**Test analysis display logic:**

```typescript
// src/__tests__/components/PropertyAnalysis.test.tsx
describe('PropertyAnalysis', () => {
  it('should display overassessed status prominently', () => {
    const analysisData = {
      likelyOverassessed: true,
      marketValueEstimate: 425000,
      potentialSavings: 1200,
      confidence: 'high' as const,
      explanation: 'Based on 5 comparable sales'
    };

    render(<PropertyAnalysis analysis={analysisData} />);

    // Should show overassessed status clearly
    expect(screen.getByText(/likely over-assessed/i)).toBeInTheDocument();
    expect(screen.getByText(/save ~\$1,200/i)).toBeInTheDocument();
    
    // Should show confidence level
    expect(screen.getByText(/high confidence/i)).toBeInTheDocument();
    
    // Should have prominent CTA button
    const ctaButton = screen.getByRole('button', { name: /start appeal/i });
    expect(ctaButton).toBeInTheDocument();
    expect(ctaButton).toHaveClass('bg-green-600'); // Should be visually prominent
  });

  it('should display fairly assessed status differently', () => {
    const analysisData = {
      likelyOverassessed: false,
      marketValueEstimate: 495000,
      potentialSavings: 0,
      confidence: 'medium' as const,
      explanation: 'Assessment appears fair'
    };

    render(<PropertyAnalysis analysis={analysisData} />);

    expect(screen.getByText(/fairly assessed/i)).toBeInTheDocument();
    expect(screen.queryByText(/start appeal/i)).not.toBeInTheDocument();
    
    // Should suggest checking back next cycle
    expect(screen.getByText(/check again next year/i)).toBeInTheDocument();
  });

  it('should show confidence indicators appropriately', () => {
    const lowConfidenceAnalysis = {
      likelyOverassessed: true,
      marketValueEstimate: 400000,
      potentialSavings: 800,
      confidence: 'low' as const,
      explanation: 'Based on limited data'
    };

    render(<PropertyAnalysis analysis={lowConfidenceAnalysis} />);

    expect(screen.getByText(/low confidence/i)).toBeInTheDocument();
    expect(screen.getByText(/consider professional appraisal/i)).toBeInTheDocument();
  });
});
```

#### 4.3 Custom Hooks Testing

**Test data fetching hooks:**

```typescript
// src/__tests__/hooks/useProperty.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { useProperty } from '../hooks/useProperty';
import { propertyService } from '../services/propertyService';

jest.mock('../services/propertyService');
const mockPropertyService = propertyService as jest.Mocked<typeof propertyService>;

describe('useProperty', () => {
  it('should fetch property data on mount', async () => {
    const mockProperty = {
      id: 'prop-1',
      address: '123 Main St',
      assessedValue: 500000
    };

    mockPropertyService.getProperty.mockResolvedValue(mockProperty);

    const { result } = renderHook(() => useProperty('prop-1'));

    // Initially loading
    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBe(null);
    expect(result.current.error).toBe(null);

    // Wait for data to load
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(mockProperty);
    expect(result.current.error).toBe(null);
  });

  it('should handle fetch errors', async () => {
    mockPropertyService.getProperty.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useProperty('prop-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBe(null);
    expect(result.current.error).toBe('Network error');
  });

  it('should refetch when property ID changes', async () => {
    mockPropertyService.getProperty
      .mockResolvedValueOnce({ id: 'prop-1', address: '123 Main St' })
      .mockResolvedValueOnce({ id: 'prop-2', address: '456 Oak St' });

    const { result, rerender } = renderHook(
      ({ propertyId }) => useProperty(propertyId),
      { initialProps: { propertyId: 'prop-1' } }
    );

    await waitFor(() => {
      expect(result.current.data?.address).toBe('123 Main St');
    });

    // Change property ID
    rerender({ propertyId: 'prop-2' });

    await waitFor(() => {
      expect(result.current.data?.address).toBe('456 Oak St');
    });

    expect(mockPropertyService.getProperty).toHaveBeenCalledTimes(2);
  });
});
```

### Phase 5: End-to-End Integration (Week 9)

#### 5.1 Complete User Flow Test

**Test the full appeal process:**

```typescript
// src/__tests__/e2e/appeal-flow.test.ts
import { test, expect } from '@playwright/test';

test.describe('Property Tax Appeal Flow', () => {
  test('should complete full appeal process', async ({ page }) => {
    // Landing page
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Lower Your Property Taxes');

    // Enter address
    await page.fill('[data-testid="address-input"]', '123 Main St, Denver, CO 80202');
    await page.click('[data-testid="search-button"]');

    // Wait for analysis results
    await expect(page.locator('[data-testid="analysis-result"]')).toBeVisible();
    await expect(page.locator('text=Likely Over-assessed')).toBeVisible();
    await expect(page.locator('text=Save ~$1,200')).toBeVisible();

    // Start appeal process
    await page.click('[data-testid="start-appeal-button"]');

    // Should prompt for signup
    await expect(page.locator('h2')).toContainText('Create Account');
    
    // Fill signup form
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'SecurePassword123');
    await page.fill('[data-testid="first-name-input"]', 'John');
    await page.fill('[data-testid="last-name-input"]', 'Doe');
    await page.click('[data-testid="signup-button"]');

    // Should redirect to comparable sales
    await expect(page.locator('h2')).toContainText('Review Comparable Sales');
    
    // Should show list of comparables
    await expect(page.locator('[data-testid="comparable-list"]')).toBeVisible();
    await expect(page.locator('[data-testid="comparable-item"]')).toHaveCount.greaterThan(3);

    // Continue to form generation
    await page.click('[data-testid="continue-button"]');

    // Should show form generation page
    await expect(page.locator('h2')).toContainText('Your Appeal Forms');
    
    // Should show deadline prominently
    await expect(page.locator('[data-testid="deadline-warning"]')).toContainText('June 8, 2025');
    
    // Generate and download forms
    await page.click('[data-testid="generate-forms-button"]');
    await expect(page.locator('text=Forms Generated')).toBeVisible();

    // Should show download button
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="download-button"]');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('.pdf');

    // Should show submission instructions
    await expect(page.locator('[data-testid="submission-instructions"]')).toBeVisible();
    await expect(page.locator('text=Mail to: Denver Assessor')).toBeVisible();

    // Mark as submitted
    await page.click('[data-testid="mark-submitted-button"]');
    await expect(page.locator('text=Appeal Submitted Successfully')).toBeVisible();
  });

  test('should handle property not overassessed', async ({ page }) => {
    await page.goto('/');
    
    // Mock API to return fairly assessed property
    await page.route('/api/properties/lookup', async route => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          success: true,
          data: {
            property: { address: '123 Main St' },
            analysis: { 
              likelyOverassessed: false,
              explanation: 'Property appears fairly assessed'
            }
          }
        })
      });
    });

    await page.fill('[data-testid="address-input"]', '123 Main St, Denver, CO 80202');
    await page.click('[data-testid="search-button"]');

    // Should show fairly assessed message
    await expect(page.locator('text=Fairly Assessed')).toBeVisible();
    await expect(page.locator('text=No appeal recommended')).toBeVisible();
    
    // Should not show appeal CTA
    await expect(page.locator('[data-testid="start-appeal-button"]')).not.toBeVisible();
  });
});
```

---

## Test Configuration

### Jest Configuration (Backend)

```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/types/**',
    '!src/config/**'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  testTimeout: 10000
};
```

### Test Setup Files

```typescript
// src/__tests__/setup.ts - Backend test setup
import { PrismaClient } from '@prisma/client';

// Global test database setup
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5433/test'
    }
  }
});

beforeAll(async () => {
  // Run migrations
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
});

beforeEach(async () => {
  // Clear all tables before each test
  await prisma.appeal.deleteMany();
  await prisma.comparable.deleteMany();
  await prisma.property.deleteMany();
  await prisma.usageTracking.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.notificationPreference.deleteMany();
  await prisma.user.deleteMany();
});

// Make Prisma available globally
global.prisma = prisma;
```

### Jest Configuration (Frontend)

```typescript
// jest.config.js
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    // Handle module aliases (this will be automatically configured for you based on your tsconfig.json paths)
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testEnvironment: 'jest-environment-jsdom',
  coverage: {
    reporter: ['text', 'json', 'html'],
    exclude: [
      'node_modules/',
      'src/__tests__/',
      '**/*.d.ts',
      'src/types/'
    ]
  }
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)
```

---

## Testing Best Practices for Junior Engineers

### 1. **Test File Naming Convention**

```
✅ Good:
- PropertyService.test.ts
- useProperty.test.tsx
- auth.test.ts (integration tests)

❌ Bad:
- property-service-tests.ts
- test-property.ts
- PropertyServiceTestSuite.ts
```

### 2. **Test Structure (AAA Pattern)**

```typescript
it('should calculate market value from comparables', () => {
  // Arrange - Set up test data
  const comparables = [
    { adjustedPrice: 400000 },
    { adjustedPrice: 420000 },
    { adjustedPrice: 410000 }
  ];

  // Act - Execute the code being tested
  const result = calculateMarketValue(comparables);

  // Assert - Verify the results
  expect(result).toBe(410000); // Average of the three prices
});
```

### 3. **Descriptive Test Names**

```typescript
// Test names should describe WHAT and WHEN
describe('PropertyService', () => {
  describe('analyzeProperty', () => {
    it('should return overassessed when assessment exceeds market value by 5%', () => {});
    it('should return fairly assessed when assessment is within 5% of market value', () => {});
    it('should throw error when no comparable sales are found', () => {});
    it('should have high confidence when 5+ comparables available', () => {});
  });
});
```

### 4. **Test Independence**

```typescript
// ✅ Good - Each test is independent
describe('User Registration', () => {
  beforeEach(async () => {
    // Clean slate for every test
    await db.query('DELETE FROM users');
  });

  it('should create user with valid data', async () => {
    const user = await User.create(validUserData);
    expect(user.email).toBe(validUserData.email);
  });

  it('should reject duplicate email', async () => {
    await User.create(validUserData);
    await expect(User.create(validUserData)).rejects.toThrow();
  });
});
```

### 5. **Mock External Dependencies**

```typescript
// ✅ Good - Mock external services
describe('PropertyService', () => {
  let mockMLSService: jest.Mocked<MLSService>;
  
  beforeEach(() => {
    mockMLSService = {
      getComparableSales: jest.fn()
    } as jest.Mocked<MLSService>;
  });

  it('should handle MLS service errors', async () => {
    mockMLSService.getComparableSales.mockRejectedValue(new Error('API down'));
    
    await expect(propertyService.analyzeProperty(property))
      .rejects.toThrow('Unable to analyze property');
  });
});
```

---

## Test Coverage Goals

### Coverage Targets by Component

| Component Type | Line Coverage | Branch Coverage | Function Coverage |
|---------------|---------------|-----------------|-------------------|
| Models | 95% | 90% | 100% |
| Services (Business Logic) | 90% | 85% | 95% |
| Controllers (API) | 85% | 80% | 90% |
| Components (React) | 80% | 75% | 85% |
| Utilities | 95% | 90% | 100% |

### What NOT to Test

**Don't test these (waste of time):**
- Third-party library functions (React, Express, Jest itself)
- Simple getters/setters with no logic
- Constants and configuration files
- Database connection setup code
- Exact styling/CSS (test behavior, not appearance)

**Focus testing on:**
- Business logic (property analysis, comparable matching)
- User interactions (form submission, error handling)
- Data transformations (price adjustments, calculations)
- API endpoint behavior (success/error responses)
- Edge cases and error conditions

---

## Continuous Testing Workflow

### Pre-commit Hooks

```bash
#!/bin/sh
# .husky/pre-commit
npm run test:unit
npm run test:integration
npm run lint
npm run typecheck
```

### CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/test.yml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test:unit
        
      - name: Run integration tests
        run: npm run test:integration
        env:
          TEST_DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
      
      - name: Run E2E tests (on main branch only)
        if: github.ref == 'refs/heads/main'
        run: npm run test:e2e
        
      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
```

---

## Performance Testing Strategy

### Load Testing (Optional for MVP)

```typescript
// __tests__/performance/load.test.ts
import autocannon from 'autocannon';

describe('API Performance', () => {
  it('should handle property lookup load', async () => {
    const result = await autocannon({
      url: 'http://localhost:3001/api/properties/lookup',
      connections: 10,
      pipelining: 1,
      duration: 10, // 10 seconds
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        address: '123 Main St, Denver, CO 80202'
      })
    });

    // 95% of requests should complete in < 500ms
    expect(result.latency.p95).toBeLessThan(500);
    // Should handle at least 50 requests/second
    expect(result.requests.average).toBeGreaterThan(50);
  });
});
```

---

## Test Data Management

### Fixture Data

```typescript
// src/__tests__/fixtures/properties.ts
export const sampleProperties = {
  denverRanch: {
    id: 'prop-denver-ranch',
    address: '123 Main St, Denver, CO 80202',
    county: 'Denver',
    assessedValue: 500000,
    characteristics: {
      sqft: 2000,
      bedrooms: 3,
      bathrooms: 2,
      yearBuilt: 2010,
      lotSize: 0.25
    }
  },
  
  denverTownhome: {
    id: 'prop-denver-townhome',
    address: '456 Oak St, Denver, CO 80202',
    county: 'Denver',
    assessedValue: 400000,
    characteristics: {
      sqft: 1800,
      bedrooms: 3,
      bathrooms: 2.5,
      yearBuilt: 2015,
      lotSize: 0.05
    }
  }
};

export const sampleComparables = {
  denverArea: [
    {
      address: '789 Pine St, Denver, CO 80202',
      salePrice: 475000,
      saleDate: '2024-09-15',
      characteristics: { sqft: 1950, bedrooms: 3, bathrooms: 2 },
      distanceMiles: 0.3
    },
    {
      address: '321 Elm St, Denver, CO 80202', 
      salePrice: 485000,
      saleDate: '2024-10-01',
      characteristics: { sqft: 2050, bedrooms: 3, bathrooms: 2 },
      distanceMiles: 0.7
    }
  ]
};
```

---

*End of Test-Driven Development Plan*