// RentCast API TypeScript interfaces
// Based on RentCast API documentation: https://developers.rentcast.io/

export interface RentCastPropertyRecord {
  id: string;
  formattedAddress: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  stateFips: string;
  zipCode: string;
  county: string;
  countyFips: string;
  latitude: number;
  longitude: number;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  squareFootage: number;
  lotSize: number;
  yearBuilt: number;
  assessorID: string;
  legalDescription?: string;
  subdivision?: string;
  zoning?: string;
  lastSaleDate?: string;
  hoa?: {
    fee: number;
  };
  features?: {
    architectureType?: string;
    cooling?: boolean;
    coolingType?: string;
    exteriorType?: string;
    fireplace?: boolean;
    fireplaceType?: string;
    floorCount?: number;
    foundationType?: string;
    garage?: boolean;
    garageSpaces?: number;
    garageType?: string;
    heating?: boolean;
    heatingType?: string;
    pool?: boolean;
    poolType?: string;
    roofType?: string;
    roomCount?: number;
    unitCount?: number;
    viewType?: string;
  };
  taxAssessments?: {
    [year: string]: {
      year: number;
      value: number;
      land: number;
      improvements: number;
    };
  };
  propertyTaxes?: {
    [year: string]: {
      year: number;
      total: number;
    };
  };
  history?: {
    [date: string]: {
      event: string;
      date: string;
      price?: number;
    };
  };
  owner?: {
    names: string[];
    type: string;
    mailingAddress?: {
      id: string;
      formattedAddress: string;
      addressLine1: string;
      addressLine2?: string | null;
      city: string;
      state: string;
      stateFips: string;
      zipCode: string;
    };
  };
  ownerOccupied?: boolean;
}

// Comparable sales from /listings/sale endpoint
// Based on actual RentCast API response structure
export interface RentCastComparable {
  id: string;
  formattedAddress: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  zipCode: string;
  county: string;
  latitude: number;
  longitude: number;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  squareFootage: number;
  lotSize: number;
  yearBuilt: number;
  price: number; // Sale price
  status: 'Active' | 'Inactive' | 'Sold';
  listingType: string;
  listedDate?: string;
  removedDate?: string | null;
  lastSeenDate?: string;
  daysOnMarket?: number;
  distance: number; // Distance in miles from subject property
  daysOld?: number;
  correlation?: number;
  lastSaleDate?: string;
  lastSalePrice?: number;
}

export interface RentCastApiResponse<T> {
  data: T;
  status: 'success' | 'error';
  message?: string;
}

// Domain types that match our existing mock data structure
export interface Property {
  id: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
  county: string;
  latitude?: number;
  longitude?: number;
  parcelNumber?: string;
  characteristics: {
    sqft: number;
    bedrooms: number;
    bathrooms: number;
    lotSize: number;
    yearBuilt: number;
    propertyType: string;
  };
  currentAssessedValue?: number;
  assessmentYear?: number;
  assessmentDate?: Date;
  taxAmount?: number;
  ownerName?: string;
}

export interface Comparable {
  id: string;
  address: string;
  salePrice: number;
  saleDate: Date;
  distanceMiles: number;
  characteristics: {
    sqft: number;
    bedrooms: number;
    bathrooms: number;
    lotSize: number;
    yearBuilt: number;
  };
  adjustments: Record<string, number>; // Price adjustments for different factors
  adjustedPrice: number; // Price after adjustments
  source: string; // 'rentcast', 'manual', etc.
  sourceId: string; // Original API ID
}

export interface PropertyAnalysis {
  property: Property;
  comparables: Comparable[];
  marketValue: number;
  assessedValue: number;
  difference: number;
  percentageDifference: number;
  taxRate: number;
  annualSavings: number;
  monthlySavings: number;
  confidence: {
    level: 'high' | 'medium' | 'low';
    sampleSize: number;
    lastUpdated: Date;
  };
  verdict: 'over-assessed' | 'fair' | 'under-assessed';
}
