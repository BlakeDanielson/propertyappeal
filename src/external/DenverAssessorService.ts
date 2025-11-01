import axios, { AxiosInstance } from 'axios';
import {
  DenverAssessorPropertyRecord,
  DenverAssessorAddressSuggestion,
  DenverAssessorSearchSuggestions,
  DenverAssessorPropertyId,
} from './DenverAssessorTypes';

/**
 * Service for interacting with Denver Assessor Property Records API
 * 
 * Base URL: https://property.spatialest.com/co/denver
 * 
 * API Endpoints:
 * - POST /api/v2/search/suggestions - Address autocomplete/suggestions
 * - GET /api/v1/recordcard/{propertyId} - Property detail record
 * 
 * Property ID Format: 13-digit string (e.g., "0229227041000")
 * Schedule Number Format: "02292-27-041-000" (from propertyId)
 */
export class DenverAssessorService {
  private api: AxiosInstance;
  private baseURL = 'https://property.spatialest.com/co/denver';

  constructor() {
    this.api = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 15000, // 15 second timeout
    });
  }

  /**
   * Normalize address format for Denver Assessor API
   * Converts "467 South Emerson Street" -> "467 s emerson st"
   * The API expects lowercase with abbreviated directions and street types
   */
  private normalizeAddress(address: string): string {
    let normalized = address.trim();
    
    // Direction abbreviations (case-insensitive)
    const directions: Record<string, string> = {
      'north': 'n',
      'south': 's',
      'east': 'e',
      'west': 'w',
      'northeast': 'ne',
      'northwest': 'nw',
      'southeast': 'se',
      'southwest': 'sw',
    };
    
    // Street type abbreviations (case-insensitive)
    const streetTypes: Record<string, string> = {
      'street': 'st',
      'avenue': 'ave',
      'road': 'rd',
      'drive': 'dr',
      'lane': 'ln',
      'court': 'ct',
      'place': 'pl',
      'circle': 'cir',
      'boulevard': 'blvd',
      'parkway': 'pkwy',
      'way': 'way',
      'terrace': 'ter',
      'trail': 'trl',
    };
    
    // Replace directions
    for (const [full, abbrev] of Object.entries(directions)) {
      const regex = new RegExp(`\\b${full}\\b`, 'gi');
      normalized = normalized.replace(regex, abbrev);
    }
    
    // Replace street types (at end of string or before comma)
    for (const [full, abbrev] of Object.entries(streetTypes)) {
      const regex = new RegExp(`\\b${full}\\b(?=\\s*[,\\s]|$)`, 'gi');
      normalized = normalized.replace(regex, abbrev);
    }
    
    // Convert to lowercase
    normalized = normalized.toLowerCase();
    
    // Clean up extra spaces
    normalized = normalized.replace(/\s+/g, ' ').trim();
    
    return normalized;
  }

  /**
   * Get address suggestions/autocomplete results
   * 
   * API Format:
   * - Request: { filters: { term: "...", page: 1 }, debug: { currentURL: "..." } }
   * - Response: { success: true, suggestions: [{ id: "0514210031000", suggest: "467 S EMERSON ST" }] }
   * 
   * @param query - Address search query (e.g., "467 S Emerson St")
   * @returns Array of address suggestions with property IDs
   */
  async getAddressSuggestions(query: string): Promise<DenverAssessorAddressSuggestion[]> {
    // Normalize the address query to match Denver Assessor API format
    const normalizedQuery = this.normalizeAddress(query);
    console.log('🔍 DenverAssessorService.getAddressSuggestions called with query:', query);
    console.log('🔧 Normalized query:', normalizedQuery);
    console.log('📡 Request URL:', `${this.baseURL}/api/v2/search/suggestions`);
    
    try {
      const requestBody = {
        filters: {
          term: normalizedQuery,
          page: 1,
        },
        debug: {
          currentURL: `${this.baseURL}#/`,
        },
      };
      
      console.log('📤 Request body:', JSON.stringify(requestBody, null, 2));
      
      const response = await this.api.post<{
        success: boolean;
        suggestions: Array<{
          id: string;
          suggest: string;
        }> | null;
      }>(
        '/api/v2/search/suggestions',
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json, text/plain, */*',
            'X-Requested-With': 'XMLHttpRequest',
          },
        }
      );

      console.log('📥 Denver Assessor API response status:', response.status);
      console.log('📥 Denver Assessor API response data:', JSON.stringify(response.data, null, 2));

      const suggestions: DenverAssessorAddressSuggestion[] = [];

      // Parse the actual API response format
      if (response.data?.success && Array.isArray(response.data.suggestions)) {
        console.log(`✅ Found ${response.data.suggestions.length} suggestions`);
        for (const item of response.data.suggestions) {
          // Each suggestion has an 'id' (property ID) and 'suggest' (address text)
          suggestions.push({
            text: item.suggest,
            propertyId: item.id,
            url: `${this.baseURL}#/property/${item.id}`,
            type: 'property',
          });
          console.log(`  - Suggestion: ${item.suggest} (ID: ${item.id})`);
        }
      } else {
        console.warn('⚠️ Unexpected response format:', {
          success: response.data?.success,
          suggestionsType: Array.isArray(response.data?.suggestions) ? 'array' : typeof response.data?.suggestions,
          suggestionsLength: Array.isArray(response.data?.suggestions) ? response.data.suggestions.length : 'N/A',
        });
      }

      console.log(`✅ Returning ${suggestions.length} suggestions`);
      return suggestions;
    } catch (error) {
      console.error('❌ DenverAssessorService: Error in getAddressSuggestions:', error);
      if (axios.isAxiosError(error)) {
        console.error('❌ Axios error details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          url: error.config?.url,
          method: error.config?.method,
        });
        
        if (error.response?.status === 404) {
          console.warn('⚠️ 404 - No suggestions found for this address');
          throw new Error('No suggestions found for this address');
        }
        if (error.response?.status === 429) {
          console.warn('⚠️ 429 - Rate limit exceeded');
          throw new Error('Denver Assessor API rate limit exceeded');
        }
        // Log response for debugging
        if (error.response?.data) {
          console.error('❌ API Error Response:', error.response.data);
        }
      }
      return [];
    }
  }

  /**
   * Extract property ID from a suggestion URL or direct property link
   * @param suggestion - Address suggestion that may contain property ID
   * @returns Property ID if found, null otherwise
   */
  extractPropertyId(suggestion: DenverAssessorAddressSuggestion): string | null {
    if (suggestion.propertyId) {
      return suggestion.propertyId;
    }
    if (suggestion.url && suggestion.url.includes('/property/')) {
      const match = suggestion.url.match(/\/property\/([^\/\?]+)/);
      return match ? match[1] : null;
    }
    return null;
  }

  /**
   * Search for a property by address and return the first matching property ID
   * @param address - Address to search for
   * @returns Property ID if found, null otherwise
   */
  async searchPropertyId(address: string): Promise<string | null> {
    console.log('🔍 DenverAssessorService.searchPropertyId called with address:', address);
    
    try {
      const suggestions = await this.getAddressSuggestions(address);
      
      console.log(`📋 Received ${suggestions.length} suggestions from getAddressSuggestions`);
      
      // The API now returns suggestions with direct property IDs
      // Return the first property ID found
      if (suggestions.length > 0 && suggestions[0].propertyId) {
        const propertyId = suggestions[0].propertyId;
        console.log(`✅ Found property ID: ${propertyId} for address: ${address}`);
        return propertyId;
      }

      console.warn(`⚠️ No property ID found in suggestions for address: ${address}`);
      return null;
    } catch (error) {
      console.error('❌ DenverAssessorService: Error in searchPropertyId:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        address,
      });
      return null;
    }
  }

  /**
   * Parse currency string to number (e.g., "$667,800" -> 667800)
   */
  private parseCurrency(value: string | undefined): number {
    if (!value) return 0;
    return parseFloat(value.replace(/[$,]/g, '')) || 0;
  }

  /**
   * Parse number string with commas (e.g., "2,380" -> 2380)
   */
  private parseNumber(value: string | undefined): number {
    if (!value) return 0;
    return parseFloat(value.replace(/,/g, '')) || 0;
  }

  /**
   * Map raw API response to our typed structure
   */
  private mapApiResponseToPropertyRecord(apiData: any, propertyId: string): DenverAssessorPropertyRecord {
    const parcel = apiData.parcel || {};
    const header = parcel.header || {};
    const sections = parcel.sections || [];

    // Extract key information (sections[0][0])
    const keyInfo = sections[0]?.[0]?.[0] || {};
    
    // Extract actual values (sections[0][1])
    const actualValuesData = sections[0]?.[1]?.[0] || {};
    
    // Extract assessed values (sections[0][2] and sections[0][3])
    const assessedValuesData = sections[0]?.[2]?.[0] || {};
    const schoolAssessedData = sections[0]?.[3]?.[0] || {};

    // Extract land details (sections[1])
    const landDetails = (sections[1] || []).map((landSection: any[]) => {
      const land = landSection[0] || {};
      return {
        landLineNumber: land.LLINE || 0,
        landType: land.LTYPE || '',
        code: String(land.CODE || ''),
        class: land.CLASS || '',
        areaSqFt: this.parseNumber(land.SF),
        acres: parseFloat(land.ACRES) || 0,
        appraisedValue: this.parseCurrency(land.ACTUAL_LAND_VAL),
      };
    });

    // Extract building details (sections[2])
    const buildingData = sections[2]?.[1]?.[0] || {};

    // Extract sale details (sections[6])
    // sections[6] is an array containing one array of sales: [[sale1, sale2, ...]]
    // So we need to access sections[6][0] to get the actual sales array
    const salesArray = sections[6]?.[0] || [];
    const saleDetails = salesArray.map((sale: any) => ({
      receptionNumber: sale.RECEPTION_NUM || '',
      saleDate: sale.SALE_DATE || '',
      salePrice: this.parseCurrency(sale.SALE_PRICE),
      instrument: sale.INSTRUMENT || '',
      grantor: sale.GRANTOR || '',
      grantee: sale.GRANTEE || '',
    }));

    // Parse address from FullAddress
    const fullAddress = header.FullAddress || keyInfo.FullAddress || '';
    // FullAddress is typically just the street address (e.g., "467 S EMERSON ST")
    // OwnerFullAddress has the full mailing address (e.g., "467 S EMERSON ST DENVER CO 80209")
    const ownerAddress = header.OwnerFullAddress || '';
    const ownerParts = ownerAddress.split(/\s+/);
    const zipMatch = ownerAddress.match(/\b(\d{5})\b/) || (header.ZIPBASE ? [null, header.ZIPBASE] : null);
    const zipCode = zipMatch ? zipMatch[1] : header.ZIPBASE || undefined;
    
    // Extract city and state from owner address (typically format: "... DENVER CO 80209")
    let city = 'Denver';
    let state = 'CO';
    if (ownerParts.length >= 3) {
      // Usually: [street, city, state, zip]
      const stateIndex = ownerParts.findIndex((p: string) => /^[A-Z]{2}$/.test(p));
      if (stateIndex > 0) {
        state = ownerParts[stateIndex];
        city = ownerParts.slice(1, stateIndex).join(' ');
      }
    }

    const scheduleNumber = this.propertyIdToScheduleNumber(propertyId);

    return {
      scheduleNumber,
      propertyId,
      address: {
        situs: fullAddress,
        line1: fullAddress,
        city,
        state,
        zipCode,
      },
      owner: {
        name: header.OwnerNames || keyInfo.OwnerNames || '',
        mailingAddress: header.OwnerFullAddress || '',
      },
      keyInformation: {
        scheduleNumber,
        situsAddress: fullAddress,
        owner: header.OwnerNames || keyInfo.OwnerNames || '',
        class: keyInfo.CLASSDESCR || '',
        landUseCode: keyInfo.LUC || '',
        zoning: keyInfo.ZONE1 || '',
        taxDistrict: keyInfo.TAX_DIST || '',
        landSqFt: this.parseNumber(keyInfo.SF),
        buildingSqFt: this.parseNumber(keyInfo.BLDG_SQFT),
        legalDescription: keyInfo.LEGAL_DESC1 || '',
        priorYearMillLevy: keyInfo.LEVY || '',
      },
      actualValues: {
        taxYear: String(actualValuesData.TAXYEAR || ''),
        land: this.parseCurrency(actualValuesData.ACTUAL_LAND_VAL),
        improvements: this.parseCurrency(actualValuesData.ACTUAL_BLDG_VAL),
        total: this.parseCurrency(actualValuesData.ACTUAL_VAL || header.ACTUAL_VAL),
      },
      assessedValues: {
        school: {
          land: this.parseCurrency(schoolAssessedData.ASSESS_LAND_VAL_SCH),
          improvements: this.parseCurrency(schoolAssessedData.ASSESS_BLDG_VAL_SCH),
          total: this.parseCurrency(schoolAssessedData.ASSESS_VAL_SCH),
          exempt: this.parseCurrency(schoolAssessedData.EXEMPT_PROP_VAL_SCH),
          taxableTotal: this.parseCurrency(schoolAssessedData.NET_ASSESS_VAL_SCH),
        },
        localGovernment: {
          land: this.parseCurrency(assessedValuesData.ASSESS_LAND_VAL),
          improvements: this.parseCurrency(assessedValuesData.ASSESS_BLDG_VAL),
          total: this.parseCurrency(assessedValuesData.ASSESS_VAL),
          exempt: this.parseCurrency(assessedValuesData.EXEMPT_PROP_VAL),
          taxableTotal: this.parseCurrency(assessedValuesData.NET_ASSESS_VAL),
        },
      },
      buildingDetails: buildingData ? {
        class: buildingData.CLASSDESCR || '',
        exteriorWalls: buildingData.DESCRIB || '',
        grade: buildingData.GRADE || '',
        fullBathrooms: parseInt(buildingData.FIXBATH) || 0,
        halfBathrooms: parseInt(buildingData.FIXHALF) || 0,
        fixtures: parseInt(buildingData.FIXTOT) || 0,
        yearBuilt: parseInt(buildingData.YRBLT) || 0,
        effectiveYear: buildingData.EFFYR ? String(buildingData.EFFYR) : undefined,
        yearRemodel: buildingData.YRREMOD ? String(buildingData.YRREMOD) : undefined,
        condition: buildingData.CDUDESCR || '',
        style: buildingData.STYLEDESCR || '',
        stories: parseFloat(buildingData.STORIES) || 0,
        totalBasement: buildingData.total_bsmt || '',
        finishedBasement: buildingData.FINBSMTAREA || '',
        totalLivingArea: this.parseNumber(buildingData.SFLA),
      } : undefined,
      landDetails: landDetails.length > 0 ? landDetails : undefined,
      saleDetails: saleDetails.length > 0 ? saleDetails : undefined,
    };
  }

  /**
   * Get property record by property ID
   * @param propertyId - 13-digit property ID (e.g., "0229227041000")
   * @returns Complete property record with assessment and tax information
   */
  async getPropertyRecord(propertyId: string): Promise<DenverAssessorPropertyRecord> {
    console.log('🔍 DenverAssessorService.getPropertyRecord called with propertyId:', propertyId);
    
    try {
      // Validate property ID format (should be 13 digits)
      if (!/^\d{13}$/.test(propertyId)) {
        console.error(`❌ Invalid property ID format: ${propertyId}. Expected 13 digits.`);
        throw new Error(`Invalid property ID format: ${propertyId}. Expected 13 digits.`);
      }

      const requestUrl = `/api/v1/recordcard/${propertyId}`;
      console.log('📡 Request URL:', `${this.baseURL}${requestUrl}`);

      const response = await this.api.get<any>(requestUrl);

      console.log('📥 Denver Assessor property record response status:', response.status);
      console.log('📥 Denver Assessor property record response data keys:', Object.keys(response.data || {}));

      // Map the raw API response to our typed structure
      const mappedRecord = this.mapApiResponseToPropertyRecord(response.data, propertyId);
      
      console.log('✅ Successfully mapped property record:', {
        propertyId: mappedRecord.propertyId,
        scheduleNumber: mappedRecord.scheduleNumber,
        address: mappedRecord.address.situs,
        hasActualValues: !!mappedRecord.actualValues,
        hasBuildingDetails: !!mappedRecord.buildingDetails,
      });
      
      return mappedRecord;
    } catch (error) {
      console.error('❌ DenverAssessorService: Error in getPropertyRecord:', error);
      if (axios.isAxiosError(error)) {
        console.error('❌ Axios error details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          url: error.config?.url,
          method: error.config?.method,
          propertyId,
        });
        
        if (error.response?.status === 404) {
          console.warn(`⚠️ 404 - Property not found: ${propertyId}`);
          throw new Error(`Property not found: ${propertyId}`);
        }
        if (error.response?.status === 429) {
          console.warn('⚠️ 429 - Rate limit exceeded');
          throw new Error('Denver Assessor API rate limit exceeded');
        }
        // Try to parse error message from response
        if (error.response?.data) {
          const errorMessage = typeof error.response.data === 'string' 
            ? error.response.data 
            : error.response.data.error || error.response.data.message;
          console.error('❌ API error message:', errorMessage);
          throw new Error(errorMessage || 'Failed to fetch property record');
        }
      }
      throw error;
    }
  }

  /**
   * Search for a property by address and return complete property record
   * This is a convenience method that combines searchPropertyId and getPropertyRecord
   * @param address - Address to search for (e.g., "3319 w moncrieff pl")
   * @returns Complete property record if found
   */
  async searchPropertyByAddress(address: string): Promise<DenverAssessorPropertyRecord | null> {
    console.log('🔍 DenverAssessorService.searchPropertyByAddress called with address:', address);
    
    try {
      console.log('📡 Step 1: Searching for property ID...');
      const propertyId = await this.searchPropertyId(address);
      
      if (!propertyId) {
        console.warn(`⚠️ No property ID found for address: ${address}`);
        return null;
      }

      console.log(`✅ Step 1 complete: Found property ID ${propertyId}`);
      console.log('📡 Step 2: Fetching property record...');
      
      const propertyRecord = await this.getPropertyRecord(propertyId);
      
      console.log(`✅ Step 2 complete: Successfully fetched property record for ${address}`);
      return propertyRecord;
    } catch (error) {
      console.error('❌ DenverAssessorService: Error in searchPropertyByAddress:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        address,
      });
      return null;
    }
  }

  /**
   * Convert property ID to schedule number format
   * @param propertyId - 13-digit property ID (e.g., "0229227041000")
   * @returns Schedule number in format "02292-27-041-000"
   */
  propertyIdToScheduleNumber(propertyId: string): string {
    if (!/^\d{13}$/.test(propertyId)) {
      throw new Error(`Invalid property ID format: ${propertyId}`);
    }
    
    // Format: 0229227041000 -> 02292-27-041-000
    // Split into: 02292 (5) - 27 (2) - 041 (3) - 000 (3)
    return `${propertyId.substring(0, 5)}-${propertyId.substring(5, 7)}-${propertyId.substring(7, 10)}-${propertyId.substring(10, 13)}`;
  }

  /**
   * Convert schedule number to property ID format
   * @param scheduleNumber - Schedule number (e.g., "02292-27-041-000")
   * @returns Property ID in format "0229227041000"
   */
  scheduleNumberToPropertyId(scheduleNumber: string): string {
    // Remove dashes and spaces
    const cleaned = scheduleNumber.replace(/[-\s]/g, '');
    
    if (!/^\d{13}$/.test(cleaned)) {
      throw new Error(`Invalid schedule number format: ${scheduleNumber}`);
    }
    
    return cleaned;
  }
}

