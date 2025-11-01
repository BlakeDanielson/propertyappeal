# Denver Assessor API Integration

This integration allows you to search for Denver properties and retrieve detailed assessment information from the Denver Assessor's Office.

## Overview

The Denver Assessor API is accessed through `https://property.spatialest.com/co/denver`:

- **Autocomplete API**: `POST /api/v2/search/suggestions` - Get address suggestions with property IDs
  - Request: `{ filters: { term: "address", page: 1 }, debug: { currentURL: "..." } }`
  - Response: `{ success: true, suggestions: [{ id: "0514210031000", suggest: "467 S EMERSON ST" }] }`
- **Property Detail API**: `GET /api/v1/recordcard/{propertyId}` - Get complete property record

## Property ID Format

- **Property ID**: 13-digit string (e.g., `"0229227041000"`)
- **Schedule Number**: Formatted version (e.g., `"02292-27-041-000"`)

The property ID can be converted to schedule number and vice versa using helper methods.

## Usage

### Using the Service Class

```typescript
import { DenverAssessorService } from '../src/external/DenverAssessorService';

const service = new DenverAssessorService();

// Method 1: Search by address and get property record
const property = await service.searchPropertyByAddress('3319 w moncrieff pl');
if (property) {
  console.log(`Total Appraised Value: $${property.actualValues.total.toLocaleString()}`);
}

// Method 2: Get address suggestions first
const suggestions = await service.getAddressSuggestions('3319 w moncrieff pl');
const propertyId = await service.searchPropertyId('3319 w moncrieff pl');
if (propertyId) {
  const property = await service.getPropertyRecord(propertyId);
}

// Method 3: Direct property ID lookup
const property = await service.getPropertyRecord('0229227041000');

// Convert between formats
const scheduleNumber = service.propertyIdToScheduleNumber('0229227041000');
// Returns: "02292-27-041-000"

const propertyId = service.scheduleNumberToPropertyId('02292-27-041-000');
// Returns: "0229227041000"
```

### Using the Test Script

```bash
# Search by address (using npx - uses local tsx)
npx tsx scripts/test-denver-assessor.ts "3319 w moncrieff pl"

# Search by property ID
npx tsx scripts/test-denver-assessor.ts "0229227041000"

# Get full JSON output
npx tsx scripts/test-denver-assessor.ts "3319 w moncrieff pl" --json

# Or use the npm script (recommended)
npm run test:denver "3319 w moncrieff pl"
```

## API Response Structure

The property record includes:

- **Key Information**: Schedule number, address, owner, class, zoning, land/building square footage
- **Actual Values**: Land value, improvements value, total appraised value
- **Assessed Values**: School and local government assessed values
- **Building Details**: Year built, square footage, bedrooms, bathrooms, style, condition
- **Land Details**: Land line items with types and values
- **Sale Details**: Historical sale transactions
- **Tax Information**: Current year taxes, mill levy, payment status

## Limitations & Notes

1. **Autocomplete API**: The suggestions API may return `null` suggestions - the autocomplete dropdown appears to be generated client-side. The service handles this gracefully.

2. **Rate Limiting**: Be respectful of API rate limits. The service includes timeout and error handling.

3. **Property ID Discovery**: If the autocomplete API doesn't return property IDs, you may need to:
   - Use the search results page URL format: `#/search/?term={address}`
   - Parse HTML responses (not recommended)
   - Use a known property ID if available

4. **Data Availability**: Some properties may not have complete data. Check for `null` or `undefined` values.

## Integration with Property Appeal Platform

This service can be used as:

1. **Fallback Data Source**: When RentCast API doesn't have property data
2. **Assessment Verification**: Cross-reference assessed values
3. **Denver-Specific Data**: Get official Denver assessor information
4. **Tax Information**: Retrieve current tax amounts and payment status

## Example Integration

```typescript
// In PropertyService.ts
import { DenverAssessorService } from '../external/DenverAssessorService';

async function lookupProperty(address: string) {
  // Try RentCast first
  try {
    return await rentCastService.getPropertyByAddress(address);
  } catch (error) {
    // Fallback to Denver Assessor for Denver properties
    if (address.toLowerCase().includes('denver')) {
      const denverService = new DenverAssessorService();
      const denverProperty = await denverService.searchPropertyByAddress(address);
      if (denverProperty) {
        // Map Denver property format to our Property type
        return mapDenverPropertyToProperty(denverProperty);
      }
    }
    throw error;
  }
}
```

## Future Enhancements

- HTML parsing fallback for when API doesn't return suggestions
- Caching of property records to reduce API calls
- Batch property lookup support
- Integration with other Colorado counties using similar Spatialest platform

