import axios, { AxiosInstance } from 'axios';
import {
  RentCastPropertyRecord,
  RentCastComparable,
  RentCastApiResponse
} from './RentCastTypes';

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

      console.log('RentCastService: Calling getPropertyByAddress with:', queryParams);
      console.log('RentCastService: API Key present:', !!this.apiKey);
      console.log('RentCastService: Base URL:', this.baseURL);

      const response = await this.api.get<RentCastApiResponse<RentCastPropertyRecord[]>>(
        '/properties',
        { params: queryParams }
      );

      console.log('RentCastService: Response status:', response.status);
      console.log('RentCastService: Response data:', JSON.stringify(response.data).substring(0, 500));

      // /properties endpoint returns an array directly
      const properties = response.data;
      
      // Check if it's an error response
      if (Array.isArray(properties) && properties.length === 0) {
        throw new Error('Property not found in RentCast database');
      }
      
      if (!Array.isArray(properties)) {
        // Old format with status wrapper
        if ((properties as any).status === 'error') {
          throw new Error((properties as any).message || 'RentCast API error');
        }
        throw new Error('Unexpected response format from RentCast');
      }

      return properties[0];
    } catch (error) {
      console.error('RentCastService: Error in getPropertyByAddress:', error);
      if (axios.isAxiosError(error)) {
        console.error('RentCastService: Axios error details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message
        });
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
      const response = await this.api.get<RentCastPropertyRecord>(
        `/properties/${id}`
      );

      // /properties/{id} endpoint returns the property object directly
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error('Property not found');
        }
        if (error.response?.status === 429) {
          throw new Error('RentCast API rate limit exceeded');
        }
      }
      throw error;
    }
  }

  /**
   * Get comparable sales for a property
   * Uses address-based search on /listings/sale endpoint (simpler than lat/lng/radius)
   *
   * @param address - Subject property address line 1
   * @param city - Subject property city
   * @param state - Subject property state (2-letter code)
   * @param zipCode - Optional ZIP code for more precise matching
   * @param limit - Maximum number of results (default 20)
   * @param monthsBack - How many months back to search (default 6)
   * @returns Array of comparable properties (sold/inactive listings)
   */
  async getComparableSales(
    address: string,
    city: string,
    state: string,
    zipCode?: string,
    limit: number = 20,
    monthsBack: number = 6
  ): Promise<RentCastComparable[]> {
    try {
      const params: Record<string, string | number> = {
        address: address,
        city: city,
        state: state,
        status: 'Inactive',
        limit: limit,
      };

      if (zipCode) {
        params.zipCode = zipCode;
      }

      const response = await this.api.get<RentCastComparable[]>(
        '/listings/sale',
        { params }
      );

      // /listings/sale endpoint returns an array directly
      let comparables = Array.isArray(response.data) ? response.data : [];
      
      // Additional filter for sold/inactive in case API returns mixed results
      comparables = comparables.filter(comp => 
        comp.status === 'Sold' || comp.status === 'Inactive' || comp.lastSaleDate
      );
      
      // Filter by date if needed (monthsBack parameter)
      if (monthsBack > 0) {
        const cutoffDate = new Date();
        cutoffDate.setMonth(cutoffDate.getMonth() - monthsBack);
        
        comparables = comparables.filter(comp => {
          const saleDate = comp.lastSaleDate || comp.removedDate || comp.listedDate;
          if (!saleDate) return false;
          return new Date(saleDate) >= cutoffDate;
        });
      }

      return comparables;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('RentCastService: Error in getComparableSales:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          params: { address, city, state, zipCode, limit }
        });
        
        // If /listings/sale fails, return empty array
        // The AVM endpoint will provide comparables as fallback
        if (error.response?.status === 400 || error.response?.status === 404) {
          console.warn('RentCastService: /listings/sale endpoint unavailable, will use AVM comparables');
          return []; // Return empty, caller can use AVM comparables
        }
        if (error.response?.status === 429) {
          throw new Error('RentCast API rate limit exceeded');
        }
      }
      // Return empty array on other errors - AnalysisService will use AVM comparables
      console.warn('RentCastService: getComparableSales failed, returning empty array');
      return [];
    }
  }

  /**
   * Get property value estimate (AVM) by property ID
   * May be useful for comparison, but we'll primarily use comparables
   * Note: This is a fallback method - prefer getPropertyValuation() which uses /avm/value
   */
  async getValueEstimate(propertyId: string): Promise<number | null> {
    try {
      // Based on RentCast API pattern, this might be /properties/{id}/value-estimate
      // But since this is only used as fallback, keeping existing endpoint
      const response = await this.api.get<{ estimate: number }>(
        `/properties/${propertyId}/value-estimate`
      );

      // Return estimate directly if endpoint returns it directly, or handle wrapped response
      return response.data?.estimate || null;
    } catch (error) {
      return null; // Fail silently, not critical for appeal analysis
    }
  }

  /**
   * Get comprehensive property valuation by address (AVM)
   * This is the more powerful endpoint that provides full valuation analysis
   * Returns property value estimate, confidence score, and valuation details
   */
  async getPropertyValuation(
    address: string | {
      line1: string;
      city: string;
      state: string;
      zipCode?: string;
    }
  ): Promise<{
    value: number;
    confidence: 'high' | 'medium' | 'low';
    valuationDate: string;
    propertyType: string;
    bedrooms?: number;
    bathrooms?: number;
    squareFootage?: number;
  } | null> {
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

      // Call the AVM endpoint - returns data directly, not wrapped
      const response = await this.api.get<{
        price: number;
        priceRangeLow: number;
        priceRangeHigh: number;
        subjectProperty: RentCastPropertyRecord;
        comparables: any[];
      }>(
        '/avm/value',
        { params: queryParams }
      );

      const data = response.data;
      
      // Calculate confidence based on price range
      const priceRange = data.priceRangeHigh - data.priceRangeLow;
      const priceRangePercent = (priceRange / data.price) * 100;
      let confidence: 'high' | 'medium' | 'low' = 'medium';
      
      if (priceRangePercent < 20) {
        confidence = 'high';
      } else if (priceRangePercent > 40) {
        confidence = 'low';
      }

      return {
        value: data.price,
        confidence,
        valuationDate: new Date().toISOString(),
        propertyType: data.subjectProperty.propertyType,
        bedrooms: data.subjectProperty.bedrooms,
        bathrooms: data.subjectProperty.bathrooms,
        squareFootage: data.subjectProperty.squareFootage,
      };
    } catch (error) {
      // Fallback to the property-specific value estimate if AVM fails
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        // Try to get property first, then value estimate
        try {
          const property = await this.getPropertyByAddress(address);
          if (property.id) {
            const valueEstimate = await this.getValueEstimate(property.id);
            if (valueEstimate) {
              return {
                value: valueEstimate,
                confidence: 'medium',
                valuationDate: new Date().toISOString(),
                propertyType: property.propertyType,
                bedrooms: property.bedrooms,
                bathrooms: property.bathrooms,
                squareFootage: property.squareFootage,
              };
            }
          }
        } catch (fallbackError) {
          // Both endpoints failed
        }
      }
      return null; // Fail silently
    }
  }
}
