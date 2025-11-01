import {
  RentCastPropertyRecord,
  RentCastComparable,
  Property,
  Comparable
} from './RentCastTypes';

export class RentCastMapper {
  /**
   * Map RentCast property record to our domain Property model
   */
  static mapToProperty(record: RentCastPropertyRecord): Property {
    // RentCast API returns flat structure, not nested objects
    // Get the most recent tax assessment (highest year)
    const taxAssessments = record.taxAssessments || {};
    const assessmentYears = Object.keys(taxAssessments).sort().reverse();
    const latestAssessmentYear = assessmentYears[0];
    const latestAssessment = latestAssessmentYear ? taxAssessments[latestAssessmentYear] : null;
    
    // Get the most recent property tax amount
    const propertyTaxes = record.propertyTaxes || {};
    const taxYears = Object.keys(propertyTaxes).sort().reverse();
    const latestTaxYear = taxYears[0];
    const latestTax = latestTaxYear ? propertyTaxes[latestTaxYear] : null;

    return {
      id: record.id,
      addressLine1: record.addressLine1,
      addressLine2: record.addressLine2 || undefined,
      city: record.city,
      state: record.state,
      zipCode: record.zipCode,
      county: record.county,
      latitude: record.latitude,
      longitude: record.longitude,
      parcelNumber: record.assessorID || undefined,
      characteristics: {
        sqft: record.squareFootage,
        bedrooms: record.bedrooms,
        bathrooms: record.bathrooms,
        lotSize: record.lotSize,
        yearBuilt: record.yearBuilt,
        propertyType: record.propertyType,
      },
      currentAssessedValue: latestAssessment?.value || undefined,
      assessmentYear: latestAssessmentYear ? parseInt(latestAssessmentYear) : undefined,
      assessmentDate: latestAssessmentYear 
        ? new Date(parseInt(latestAssessmentYear), 0, 1)
        : undefined,
      taxAmount: latestTax?.total || undefined,
      ownerName: record.owner?.names?.[0] || undefined,
    };
  }

  /**
   * Map RentCast comparable to our domain Comparable model
   */
  static mapToComparable(
    comparable: RentCastComparable,
    subjectProperty: Property
  ): Comparable {
    // Determine sale date from available fields
    const saleDateStr = comparable.lastSaleDate || comparable.removedDate || comparable.listedDate || new Date().toISOString();
    const saleDate = new Date(saleDateStr);
    
    // Use price as sale price (this is the sale price from listings/sale endpoint)
    const salePrice = comparable.price || comparable.lastSalePrice || 0;

    return {
      id: comparable.id,
      address: comparable.formattedAddress || `${comparable.addressLine1}, ${comparable.city}, ${comparable.state} ${comparable.zipCode}`,
      salePrice,
      saleDate,
      distanceMiles: comparable.distance || 0, // Will be calculated by PropertyService if not provided
      characteristics: {
        sqft: comparable.squareFootage,
        bedrooms: comparable.bedrooms,
        bathrooms: comparable.bathrooms,
        lotSize: comparable.lotSize,
        yearBuilt: comparable.yearBuilt,
      },
      adjustments: {}, // Will be calculated by ComparableService
      adjustedPrice: salePrice, // Initial, will be adjusted
      source: 'rentcast',
      sourceId: comparable.id,
    };
  }
}
