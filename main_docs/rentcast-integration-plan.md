# RentCast API Integration Plan

## Overview

This document outlines the integration plan for RentCast API as our primary data source for property tax appeal platform. RentCast provides comprehensive property data including assessments, comparables, and property characteristics.

**API Documentation:** https://developers.rentcast.io/

---

## API Endpoints We'll Use

### 1. Property Records
**Endpoint:** `GET /v1/property`

**Purpose:** Get property data including characteristics and assessment values

**What We Need:**
- Property address lookup
- Property characteristics (sqft, beds, baths, lot size, year built)
- Tax assessment history
- Current assessed value
- Property tax amount

**Endpoint:** `GET /v1/property/{id}`

**Purpose:** Get property by RentCast ID (after initial lookup)

### 2. Comparable Sales ✅ VERIFIED: RentCast Supports Radius Search!

**Endpoint:** `GET /v1/listings/sale` (for sale listings/comparables)

**Purpose:** Get comparable properties for analysis

**✅ CONFIRMED CAPABILITIES:**
- ✅ **Radius-based searches supported!** 
- ✅ Accepts latitude, longitude, and radius parameters
- ✅ Returns comparables with distance already calculated
- ✅ **No Haversine formula needed!**

**API Parameters:**
- `lat` - Latitude of subject property
- `lng` - Longitude of subject property  
- `radius` - Radius in miles (we'll use 1.0)
- Additional filters: date range, property characteristics

**What We Get:**
- Properties sold within 1 mile radius ✅
- Sold within last 6-12 months ✅
- Similar characteristics (sqft ±20%, beds/baths ±1) ✅
- Sale prices and dates ✅
- **Distance from subject property already calculated** ✅

**Example API Call:**
```
GET /v1/listings/sale?lat=39.7392&lng=-104.9903&radius=1.0&status=Sold
```

**Result:** ✅ **No Haversine formula needed** - RentCast handles all geographic queries!

### 3. Property Valuation
**Endpoint:** `GET /v1/property/value-estimate`

**Purpose:** Get automated valuation model (AVM) estimate

**Note:** May be useful for comparison, but we'll primarily use comparables for appeal analysis

---

## Integration Architecture

### Service Layer Structure

```
src/
├── external/
│   ├── RentCastService.ts          # Main service class
│   ├── RentCastTypes.ts            # TypeScript interfaces
│   └── RentCastMapper.ts           # Map RentCast responses to our domain models
├── services/
│   ├── PropertyService.ts          # Uses RentCastService
│   └── ComparableService.ts       # Uses RentCastService
```

### Service Implementation

```typescript
// src/external/RentCastTypes.ts
export interface RentCastPropertyRecord {
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
    parcelNumber?: string;
  };
  assessment?: {
    taxAmount: number;
    taxYear: number;
    assessedValue: number;
    assessedYear: number;
  };
  owner?: {
    name: string;
    mailingAddress: string;
  };
  salesHistory?: Array<{
    saleDate: string;
    salePrice: number;
  }>;
}

export interface RentCastComparable {
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
}

export interface RentCastApiResponse<T> {
  data: T;
  status: 'success' | 'error';
  message?: string;
}

// src/external/RentCastService.ts
import axios, { AxiosInstance } from 'axios';
import { RentCastPropertyRecord, RentCastComparable } from './RentCastTypes';

export class RentCastService {
  private api: AxiosInstance;
  private apiKey: string;
  private baseURL = 'https://api.rentcast.io/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.api = axios.create({
      baseURL: this.baseURL,
      headers: {
        'X-Api-Key': this.apiKey,
        'Content-Type': 'application/json',
      },
      timeout: 10000, // 10 second timeout
    });
  }

  /**
   * Get property data by address
   * @param address - Full address string or address components
   * @returns Property record with assessment data
   */
  async getPropertyByAddress(
    address: string | {
      line1: string;
      city: string;
      state: string;
      zipCode?: string;
    }
  ): Promise<RentCastPropertyRecord> {
    try {
      let queryParams: Record<string, string> = {};

      if (typeof address === 'string') {
        queryParams.address = address;
      } else {
        queryParams.address = `${address.line1}, ${address.city}, ${address.state}`;
        if (address.zipCode) {
          queryParams.address += ` ${address.zipCode}`;
        }
      }

      const response = await this.api.get<RentCastApiResponse<RentCastPropertyRecord>>(
        '/property',
        { params: queryParams }
      );

      if (response.data.status === 'error') {
        throw new Error(response.data.message || 'RentCast API error');
      }

      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error('Property not found in RentCast database');
        }
        if (error.response?.status === 429) {
          throw new Error('RentCast API rate limit exceeded');
        }
      }
      throw error;
    }
  }

  /**
   * Get property by RentCast ID (faster than address lookup)
   */
  async getPropertyById(id: string): Promise<RentCastPropertyRecord> {
    try {
      const response = await this.api.get<RentCastApiResponse<RentCastPropertyRecord>>(
        `/property/${id}`
      );

      if (response.data.status === 'error') {
        throw new Error(response.data.message || 'RentCast API error');
      }

      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error('Property not found');
        }
      }
      throw error;
    }
  }

  /**
   * Get comparable sales for a property
   * ✅ RentCast API supports radius-based searches natively!
   * 
   * @param latitude - Subject property latitude
   * @param longitude - Subject property longitude
   * @param radiusMiles - Search radius in miles (default 1.0)
   * @param monthsBack - How many months back to search (default 6)
   * @returns Array of comparable properties with distance already calculated
   */
  async getComparableSales(
    latitude: number,
    longitude: number,
    radiusMiles: number = 1.0,
    monthsBack: number = 6
  ): Promise<RentCastComparable[]> {
    try {
      const params = {
        lat: latitude,
        lng: longitude,
        radius: radiusMiles,
        // Additional filters for date range and characteristics
        // RentCast API handles geographic filtering - no Haversine needed!
      };

      const response = await this.api.get<RentCastApiResponse<RentCastComparable[]>>(
        '/listings/sale',
        { params }
      );

      if (response.data.status === 'error') {
        throw new Error(response.data.message || 'RentCast API error');
      }

      // Distance already included in RentCast response - no calculation needed!
      return response.data.data || [];
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          return []; // No comparables found
        }
        if (error.response?.status === 429) {
          throw new Error('RentCast API rate limit exceeded');
        }
      }
      throw error;
    }
  }

  /**
   * Get property value estimate (AVM)
   * May be useful for comparison, but we'll primarily use comparables
   */
  async getValueEstimate(propertyId: string): Promise<number | null> {
    try {
      const response = await this.api.get<RentCastApiResponse<{ estimate: number }>>(
        `/property/${propertyId}/value-estimate`
      );

      if (response.data.status === 'error') {
        return null;
      }

      return response.data.data?.estimate || null;
    } catch (error) {
      return null; // Fail silently, not critical for appeal analysis
    }
  }
}
```

### Domain Model Mapping

```typescript
// src/external/RentCastMapper.ts
import { RentCastPropertyRecord, RentCastComparable } from './RentCastTypes';
import { Property, Comparable } from '../types/domain';

export class RentCastMapper {
  /**
   * Map RentCast property record to our domain Property model
   */
  static mapToProperty(record: RentCastPropertyRecord): Property {
    return {
      id: record.id,
      addressLine1: record.address.line1,
      addressLine2: record.address.line2,
      city: record.address.city,
      state: record.address.state,
      zipCode: record.address.zipCode,
      county: record.address.county,
      latitude: record.address.latitude,
      longitude: record.address.longitude,
      parcelNumber: record.property.parcelNumber,
      characteristics: {
        sqft: record.property.squareFootage,
        bedrooms: record.property.bedrooms,
        bathrooms: record.property.bathrooms,
        lotSize: record.property.lotSize,
        yearBuilt: record.property.yearBuilt,
        propertyType: record.property.type,
      },
      currentAssessedValue: record.assessment?.assessedValue || null,
      assessmentYear: record.assessment?.assessedYear || null,
      assessmentDate: record.assessment?.taxYear 
        ? new Date(record.assessment.taxYear, 0, 1) 
        : null,
      taxAmount: record.assessment?.taxAmount || null,
      ownerName: record.owner?.name || null,
    };
  }

  /**
   * Map RentCast comparable to our domain Comparable model
   */
  static mapToComparable(
    comparable: RentCastComparable,
    subjectProperty: Property
  ): Comparable {
    return {
      id: comparable.id,
      address: comparable.address,
      salePrice: comparable.salePrice,
      saleDate: new Date(comparable.saleDate),
      distanceMiles: comparable.distance,
      characteristics: {
        sqft: comparable.property.squareFootage,
        bedrooms: comparable.property.bedrooms,
        bathrooms: comparable.property.bathrooms,
        lotSize: comparable.property.lotSize,
        yearBuilt: comparable.property.yearBuilt,
      },
      adjustments: {}, // Will be calculated by ComparableService
      adjustedPrice: comparable.salePrice, // Initial, will be adjusted
      source: 'rentcast',
      sourceId: comparable.id,
    };
  }
}
```

---

## Integration with PropertyService

```typescript
// src/services/PropertyService.ts
import { RentCastService } from '../external/RentCastService';
import { RentCastMapper } from '../external/RentCastMapper';
import { AssessorScraper } from '../external/AssessorScraper'; // Fallback

export class PropertyService {
  constructor(
    private rentCastService: RentCastService,
    private assessorScraper: AssessorScraper // Fallback only
  ) {}

  async lookupProperty(address: string): Promise<Property> {
    try {
      // Try RentCast first
      const record = await this.rentCastService.getPropertyByAddress(address);
      return RentCastMapper.mapToProperty(record);
    } catch (error) {
      // If RentCast fails or property not found, try fallback
      if (error.message.includes('not found')) {
        return await this.assessorScraper.scrapeProperty(address);
      }
      throw error;
    }
  }

  async getComparableSales(
    property: Property,
    options: {
      radiusMiles?: number;
      monthsBack?: number;
    } = {}
  ): Promise<Comparable[]> {
    // ✅ RentCast handles radius search - pass lat/lng/radius directly
    const comparables = await this.rentCastService.getComparableSales(
      property.latitude!,
      property.longitude!,
      options.radiusMiles || 1.0,
      options.monthsBack || 6
    );

    // Distance already included in RentCast response!
    return comparables.map(comp => 
      RentCastMapper.mapToComparable(comp, property)
    );
  }
}
```

---

## Error Handling & Fallbacks

### Error Scenarios

1. **Property Not Found in RentCast**
   - Fallback to county assessor scraping
   - If that fails, allow manual entry

2. **API Rate Limit Exceeded**
   - Implement request queuing
   - Cache results aggressively
   - Show user-friendly error message

3. **No Comparables Found**
   - Show "insufficient data" warning
   - Suggest professional appraisal
   - Allow user to proceed with manual entry

4. **Network/API Errors**
   - Retry with exponential backoff
   - Fallback to cached data if available
   - Log error for monitoring

### Caching Strategy

```typescript
// Cache property data for 24 hours
// Cache comparables for 1 hour (real estate data changes frequently)
// Use Redis or in-memory cache (for MVP)

class CacheService {
  async cachePropertyData(address: string, data: Property) {
    await redis.setex(
      `property:${address}`,
      86400, // 24 hours
      JSON.stringify(data)
    );
  }

  async getCachedPropertyData(address: string): Promise<Property | null> {
    const cached = await redis.get(`property:${address}`);
    return cached ? JSON.parse(cached) : null;
  }

  async cacheComparables(propertyId: string, comparables: Comparable[]) {
    await redis.setex(
      `comparables:${propertyId}`,
      3600, // 1 hour
      JSON.stringify(comparables)
    );
  }
}
```

---

## Rate Limiting & Cost Management

### Free Tier Limits
- **50 requests/month** - Perfect for MVP testing
- Monitor usage in RentCast dashboard

### Paid Tier (When Scaling)
- Need to verify exact pricing
- Implement request batching where possible
- Cache aggressively to reduce API calls
- Only call API when user actually needs data

### Cost Optimization Strategies

1. **Cache Everything**
   - Property data: 24 hours
   - Comparables: 1 hour
   - Reduces API calls significantly

2. **Lazy Loading**
   - Only fetch comparables when user starts appeal process
   - Don't fetch unless user continues past analysis

3. **Batch Requests**
   - If RentCast supports batch endpoints, use them
   - Reduce number of API calls

4. **Smart Fallbacks**
   - Use free county scraping when RentCast doesn't have data
   - Reduces need for RentCast calls

---

## Testing Strategy

### Unit Tests

```typescript
// src/external/RentCastService.test.ts
describe('RentCastService', () => {
  let service: RentCastService;
  let mockAxios: jest.Mocked<typeof axios>;

  beforeEach(() => {
    service = new RentCastService('test-api-key');
  });

  it('should fetch property data by address', async () => {
    const mockResponse = {
      data: {
        status: 'success',
        data: {
          id: 'prop-123',
          address: { /* ... */ },
          property: { /* ... */ },
          assessment: { /* ... */ }
        }
      }
    };

    mockAxios.get.mockResolvedValue(mockResponse);

    const result = await service.getPropertyByAddress('123 Main St, Denver, CO');

    expect(result.id).toBe('prop-123');
    expect(mockAxios.get).toHaveBeenCalledWith('/property', {
      params: { address: '123 Main St, Denver, CO' }
    });
  });

  it('should handle property not found', async () => {
    mockAxios.get.mockRejectedValue({
      response: { status: 404 }
    });

    await expect(
      service.getPropertyByAddress('999 Nonexistent St')
    ).rejects.toThrow('Property not found');
  });

  it('should handle rate limiting', async () => {
    mockAxios.get.mockRejectedValue({
      response: { status: 429 }
    });

    await expect(
      service.getPropertyByAddress('123 Main St')
    ).rejects.toThrow('rate limit exceeded');
  });
});
```

### Integration Tests

```typescript
// src/external/__tests__/integration/rentcast.test.ts
describe('RentCast API Integration', () => {
  let service: RentCastService;

  beforeAll(() => {
    service = new RentCastService(process.env.RENTCAST_API_KEY!);
  });

  it('should fetch real property data', async () => {
    const property = await service.getPropertyByAddress(
      '123 Main St, Denver, CO 80202'
    );

    expect(property).toBeDefined();
    expect(property.address.city).toBe('Denver');
    expect(property.assessment).toBeDefined();
  }, 10000); // Longer timeout for real API calls

  it('should fetch comparables for a property', async () => {
    // First get a property
    const property = await service.getPropertyByAddress(
      '123 Main St, Denver, CO 80202'
    );

    // Then get comparables
    const comparables = await service.getComparableSales(property.id, {
      radiusMiles: 1.0,
      monthsBack: 6
    });

    expect(comparables.length).toBeGreaterThan(0);
    expect(comparables[0].distance).toBeLessThanOrEqual(1.0);
  }, 15000);
});
```

---

## Environment Configuration

```bash
# .env
RENTCAST_API_KEY=your_api_key_here

# For development/testing
RENTCAST_API_KEY=test_key_for_free_tier

# For production
RENTCAST_API_KEY=production_key_from_paid_plan
```

---

## Implementation Checklist

### Phase 1: Setup & Testing (Week 1)
- [ ] Create RentCast account
- [ ] Generate API key
- [ ] Set up environment variables
- [ ] Install axios or fetch library
- [ ] Create RentCastService class
- [ ] Test with free tier (50 requests)
- [ ] Verify property data endpoint works
- [ ] Verify comparables endpoint works
- [ ] Verify assessment data exists

### Phase 2: Integration (Week 2)
- [ ] Create RentCastMapper
- [ ] Integrate with PropertyService
- [ ] Add error handling
- [ ] Add caching layer
- [ ] Add fallback to county scraping
- [ ] Write unit tests
- [ ] Write integration tests

### Phase 3: Production Readiness (Week 3)
- [ ] Verify pricing and upgrade plan if needed
- [ ] Set up monitoring for API usage
- [ ] Set up rate limiting safeguards
- [ ] Document API usage in dashboard
- [ ] Test fallback scenarios
- [ ] Load test with realistic usage

---

## Monitoring & Metrics

### Key Metrics to Track

1. **API Usage**
   - Requests per day
   - Requests per user
   - Success rate
   - Error rate

2. **Cost Tracking**
   - Monthly API cost
   - Cost per user
   - Cost per appeal

3. **Performance**
   - Average response time
   - Cache hit rate
   - Fallback usage rate

4. **Data Quality**
   - Properties found vs. not found
   - Comparables found per property
   - Assessment data completeness

---

## Next Steps

1. **Sign up for RentCast account**
   - https://developers.rentcast.io/
   - Get API key
   - Test free tier

2. **Verify API endpoints**
   - Check exact endpoint names
   - Verify parameter names
   - Test response formats

3. **Test with sample properties**
   - Test in top 10 counties (per PRD)
   - Verify data completeness
   - Verify comparables work

4. **Update tech architecture**
   - Already done ✅

5. **Update TDD plan**
   - Replace Zillow references with RentCast
   - Update test examples

---

*Created: [Date] - RentCast API Integration Plan*

