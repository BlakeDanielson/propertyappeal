import { PropertyService } from './PropertyService';
import { ComparableService } from './ComparableService';
import {
  Property,
  Comparable,
  PropertyAnalysis
} from '../external/RentCastTypes';

export class AnalysisService {
  constructor(
    private propertyService: PropertyService,
    private comparableService: ComparableService
  ) {}

  /**
   * Perform complete property analysis
   */
  async analyzeProperty(address: string): Promise<PropertyAnalysis> {
    // Step 1: Get property data
    const property = await this.propertyService.lookupProperty(address);

    // Step 2: Get comparable sales
    const rawComparables = await this.propertyService.getComparableSales(property, {
      radiusMiles: 1.0,
      monthsBack: 6,
    });

    // Step 3: Process comparables and calculate market value
    const { comparables, marketValue, confidence } =
      this.comparableService.processComparables(rawComparables, property);

    // Step 4: Get AVM valuation for comparison/validation (if available)
    let avmValue: number | null = null;
    try {
      // Import RentCastService dynamically to avoid circular dependency
      const { RentCastService } = await import('../external/RentCastService');
      const rentCastService = new RentCastService(process.env.RENTCAST_API_KEY || '');
      const avmResult = await rentCastService.getPropertyValuation(address);
      avmValue = avmResult?.value || null;
    } catch (error) {
      // AVM is optional, continue without it
      console.log('AVM valuation not available, proceeding with comparables only');
    }

    // Step 5: Use comparables-based value, but log AVM comparison if available
    let finalMarketValue = marketValue;
    if (avmValue && comparables.length < 3) {
      // If we have few comparables, blend AVM with our calculation
      finalMarketValue = (marketValue * 0.7) + (avmValue * 0.3);
      console.log(`Using blended value: Comparables $${marketValue.toLocaleString()}, AVM $${avmValue.toLocaleString()}, Final $${finalMarketValue.toLocaleString()}`);
    } else if (avmValue) {
      // Log comparison for validation
      const avmDiff = Math.abs(marketValue - avmValue) / marketValue;
      console.log(`AVM Comparison: Our value $${marketValue.toLocaleString()}, AVM $${avmValue.toLocaleString()}, Difference ${(avmDiff * 100).toFixed(1)}%`);
    }

    // Step 6: Calculate assessment comparison
    const assessedValue = property.currentAssessedValue || 0;
    const difference = assessedValue - finalMarketValue;
    const percentageDifference = assessedValue > 0 ? (difference / assessedValue) * 100 : 0;

    // Step 7: Determine verdict
    let verdict: 'over-assessed' | 'fair' | 'under-assessed';
    if (Math.abs(percentageDifference) <= 5) {
      verdict = 'fair';
    } else if (percentageDifference > 5) {
      verdict = 'over-assessed';
    } else {
      verdict = 'under-assessed';
    }

    // Step 8: Calculate tax savings (using a default tax rate if not available)
    const taxRate = 0.055; // 5.5% default - could be made dynamic by jurisdiction
    const annualSavings = verdict === 'over-assessed' ? Math.abs(difference) * taxRate : 0;
    const monthlySavings = annualSavings / 12;

    return {
      property,
      comparables,
      marketValue: finalMarketValue,
      assessedValue,
      difference,
      percentageDifference,
      taxRate,
      annualSavings,
      monthlySavings,
      confidence: {
        level: confidence,
        sampleSize: comparables.length,
        lastUpdated: new Date(),
      },
      verdict,
    };
  }

  /**
   * Get analysis by property ID (for returning users)
   */
  async getAnalysisByPropertyId(propertyId: string): Promise<PropertyAnalysis> {
    const property = await this.propertyService.getPropertyById(propertyId);

    const rawComparables = await this.propertyService.getComparableSales(property, {
      radiusMiles: 1.0,
      monthsBack: 6,
    });

    const { comparables, marketValue, confidence } =
      this.comparableService.processComparables(rawComparables, property);

    const assessedValue = property.currentAssessedValue || 0;
    const difference = assessedValue - marketValue;
    const percentageDifference = assessedValue > 0 ? (difference / assessedValue) * 100 : 0;

    let verdict: 'over-assessed' | 'fair' | 'under-assessed';
    if (Math.abs(percentageDifference) <= 5) {
      verdict = 'fair';
    } else if (percentageDifference > 5) {
      verdict = 'over-assessed';
    } else {
      verdict = 'under-assessed';
    }

    const taxRate = 0.055;
    const annualSavings = verdict === 'over-assessed' ? Math.abs(difference) * taxRate : 0;
    const monthlySavings = annualSavings / 12;

    return {
      property,
      comparables,
      marketValue,
      assessedValue,
      difference,
      percentageDifference,
      taxRate,
      annualSavings,
      monthlySavings,
      confidence: {
        level: confidence,
        sampleSize: comparables.length,
        lastUpdated: new Date(),
      },
      verdict,
    };
  }
}
