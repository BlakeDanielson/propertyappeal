import { Comparable, Property } from '../external/RentCastTypes';

export class ComparableService {
  /**
   * Calculate price adjustments for comparables based on property differences
   */
  calculateAdjustments(subjectProperty: Property, comparable: Comparable): Record<string, number> {
    const adjustments: Record<string, number> = {};

    // Size adjustment (per square foot)
    const sizeDiff = comparable.characteristics.sqft - subjectProperty.characteristics.sqft;
    const sizeAdjustment = sizeDiff * 150; // $150 per sq ft difference
    adjustments.size = -sizeAdjustment;

    // Bedroom adjustment
    const bedroomDiff = comparable.characteristics.bedrooms - subjectProperty.characteristics.bedrooms;
    const bedroomAdjustment = bedroomDiff * 25000; // $25K per bedroom difference
    adjustments.bedroom = -bedroomAdjustment;

    // Bathroom adjustment
    const bathroomDiff = comparable.characteristics.bathrooms - subjectProperty.characteristics.bathrooms;
    const bathroomAdjustment = bathroomDiff * 15000; // $15K per bathroom difference
    adjustments.bathroom = -bathroomAdjustment;

    // Lot size adjustment (per acre, assuming lot sizes are in acres)
    const lotDiff = comparable.characteristics.lotSize - subjectProperty.characteristics.lotSize;
    const lotAdjustment = lotDiff * 50000; // $50K per acre difference
    adjustments.lotSize = -lotAdjustment;

    // Age adjustment (per year)
    const ageDiff = comparable.characteristics.yearBuilt - subjectProperty.characteristics.yearBuilt;
    const ageAdjustment = ageDiff * 1000; // $1K per year difference
    adjustments.age = -ageAdjustment;

    return adjustments;
  }

  /**
   * Apply adjustments to get adjusted price
   */
  applyAdjustments(comparable: Comparable): Comparable {
    const totalAdjustment = Object.values(comparable.adjustments).reduce((sum, adj) => sum + adj, 0);
    comparable.adjustedPrice = comparable.salePrice + totalAdjustment;
    return comparable;
  }

  /**
   * Filter comparables based on quality criteria
   */
  filterComparables(comparables: Comparable[], subjectProperty: Property): Comparable[] {
    return comparables.filter(comp => {
      // Size within ±20%
      const sizeRatio = comp.characteristics.sqft / subjectProperty.characteristics.sqft;
      if (sizeRatio < 0.8 || sizeRatio > 1.2) return false;

      // Bedrooms within ±1
      const bedroomDiff = Math.abs(comp.characteristics.bedrooms - subjectProperty.characteristics.bedrooms);
      if (bedroomDiff > 1) return false;

      // Bathrooms within ±1
      const bathroomDiff = Math.abs(comp.characteristics.bathrooms - subjectProperty.characteristics.bathrooms);
      if (bathroomDiff > 1) return false;

      // Lot size within ±25%
      const lotRatio = comp.characteristics.lotSize / subjectProperty.characteristics.lotSize;
      if (lotRatio < 0.75 || lotRatio > 1.25) return false;

      // Within 1 mile radius
      if (comp.distanceMiles > 1.0) return false;

      // Sold within last 6 months (comparables should already be filtered by API)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      if (comp.saleDate < sixMonthsAgo) return false;

      return true;
    });
  }

  /**
   * Calculate market value from comparables
   */
  calculateMarketValue(comparables: Comparable[]): number {
    if (comparables.length === 0) return 0;

    const adjustedPrices = comparables.map(comp => comp.adjustedPrice);
    adjustedPrices.sort((a, b) => a - b);

    // Remove outliers (top and bottom 20%)
    const removeCount = Math.floor(adjustedPrices.length * 0.2);
    const trimmedPrices = adjustedPrices.slice(removeCount, adjustedPrices.length - removeCount);

    // Return median of trimmed prices
    const mid = Math.floor(trimmedPrices.length / 2);
    return trimmedPrices.length % 2 === 0
      ? (trimmedPrices[mid - 1] + trimmedPrices[mid]) / 2
      : trimmedPrices[mid];
  }

  /**
   * Calculate confidence level based on data quality
   */
  calculateConfidence(comparables: Comparable[]): 'high' | 'medium' | 'low' {
    const count = comparables.length;

    if (count >= 5) return 'high';
    if (count >= 3) return 'medium';
    return 'low';
  }

  /**
   * Process comparables: filter, adjust, and calculate market value
   */
  processComparables(
    rawComparables: Comparable[],
    subjectProperty: Property
  ): {
    comparables: Comparable[];
    marketValue: number;
    confidence: 'high' | 'medium' | 'low';
  } {
    // Filter comparables
    let filteredComparables = this.filterComparables(rawComparables, subjectProperty);

    // Calculate adjustments for each comparable
    filteredComparables = filteredComparables.map(comp => {
      comp.adjustments = this.calculateAdjustments(subjectProperty, comp);
      return this.applyAdjustments(comp);
    });

    // Calculate market value
    const marketValue = this.calculateMarketValue(filteredComparables);

    // Determine confidence
    const confidence = this.calculateConfidence(filteredComparables);

    return {
      comparables: filteredComparables,
      marketValue,
      confidence,
    };
  }
}
