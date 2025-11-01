/**
 * TypeScript types for Denver Assessor/Property Records API
 * Based on https://property.spatialest.com/co/denver
 */

export interface DenverAssessorPropertyId {
  id: string; // Format: "0229227041000" (13 digits)
  scheduleNumber: string; // Format: "02292-27-041-000"
}

export interface DenverAssessorAddressSuggestion {
  text: string;
  propertyId?: string; // Present if this is a direct property match
  url?: string; // Link to property detail page
  type: 'find' | 'map' | 'property';
}

export interface DenverAssessorSearchSuggestions {
  suggestions: DenverAssessorAddressSuggestion[];
}

export interface DenverAssessorPropertyRecord {
  scheduleNumber: string;
  propertyId: string;
  address: {
    situs: string; // Full situs address
    line1: string;
    city: string;
    state: string;
    zipCode?: string;
  };
  owner: {
    name: string;
    mailingAddress: string;
  };
  keyInformation: {
    scheduleNumber: string;
    situsAddress: string;
    owner: string;
    class: string; // e.g., "RESIDENTIAL"
    landUseCode: string; // e.g., "114 - SFR Grade B"
    zoning: string;
    taxDistrict: string;
    landSqFt: number;
    buildingSqFt: number;
    legalDescription: string;
    priorYearMillLevy: string;
  };
  actualValues: {
    taxYear: string;
    land: number;
    improvements: number;
    total: number; // Total appraised value
  };
  assessedValues: {
    school: {
      land: number;
      improvements: number;
      total: number;
      exempt: number;
      taxableTotal: number;
    };
    localGovernment: {
      land: number;
      improvements: number;
      total: number;
      exempt: number;
      taxableTotal: number;
    };
  };
  buildingDetails?: {
    class: string;
    exteriorWalls: string;
    grade: string;
    fullBathrooms: number;
    halfBathrooms: number;
    fixtures: number;
    yearBuilt: number;
    effectiveYear?: string;
    yearRemodel?: string;
    condition: string;
    style: string;
    stories: number;
    totalBasement: string;
    finishedBasement: string;
    totalLivingArea: number;
  };
  landDetails?: Array<{
    landLineNumber: number;
    landType: string;
    code: string;
    class: string;
    areaSqFt: number;
    acres: number;
    appraisedValue: number;
  }>;
  saleDetails?: Array<{
    receptionNumber: string;
    saleDate: string;
    salePrice: number;
    instrument: string;
    grantor: string;
    grantee: string;
  }>;
  taxInformation?: {
    currentYear: string;
    millLevy: string;
    installments: Array<{
      type: string;
      dueDate: string;
      datePaid?: string;
      originalTaxLevy: number;
      liensFees: number;
      interest: number;
      paid: number;
      due: number;
    }>;
  };
  additionalInfo?: {
    neighborhood?: string;
    subdivision?: string;
    enterpriseZone?: string;
    historicLandmark?: boolean;
    historicLandmarkDistrict?: boolean;
    floodplainDesignation?: string;
  };
}

export interface DenverAssessorApiResponse<T> {
  data?: T;
  error?: string;
  status?: number;
}

