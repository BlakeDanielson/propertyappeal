import { NextRequest, NextResponse } from 'next/server';
import { RentCastService } from '../../../external/RentCastService';
import { PropertyService } from '../../../services/PropertyService';
import { ComparableService } from '../../../services/ComparableService';
import { Property } from '../../../external/RentCastTypes';

type AddressData = {
  fullAddress: string;
  line1: string;
  city: string;
  state: string;
  zipCode: string;
  latitude?: number;
  longitude?: number;
};

const isAddressData = (value: unknown): value is AddressData => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const data = value as Partial<AddressData>;
  return Boolean(
    data.line1 &&
    data.city &&
    data.state &&
    data.zipCode &&
    typeof data.line1 === 'string' &&
    typeof data.city === 'string' &&
    typeof data.state === 'string' &&
    typeof data.zipCode === 'string'
  );
};

const buildRentCastAddress = (data: AddressData) => {
  return `${data.line1}, ${data.city}, ${data.state} ${data.zipCode}`.trim();
};

// Initialize services (will be moved to dependency injection later)
const rentCastService = new RentCastService(process.env.RENTCAST_API_KEY || '');
const propertyService = new PropertyService(rentCastService);
const comparableService = new ComparableService();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address, addressData, verifiedProperty } = body;

    console.log('Analysis API called with:', { address, addressData, hasVerifiedProperty: !!verifiedProperty });

    if (!address || typeof address !== 'string') {
      return NextResponse.json(
        { error: 'Address is required and must be a string' },
        { status: 400 }
      );
    }

    let property: Property;

    // If verified property data is provided, use it directly (skip lookup)
    if (verifiedProperty && typeof verifiedProperty === 'object') {
      console.log('Using verified property data');
      property = verifiedProperty as Property;
      
      // Ensure dates are properly converted
      if (property.assessmentDate && typeof property.assessmentDate === 'string') {
        property.assessmentDate = new Date(property.assessmentDate);
      }
    } else {
      // Otherwise, lookup property by address
      const addressToUse = isAddressData(addressData)
        ? buildRentCastAddress(addressData)
        : address.trim();

      console.log('Looking up property by address:', addressToUse);
      property = await propertyService.lookupProperty(addressToUse);
    }

    // Get comparable sales using verified/looked-up property
    const rawComparables = await propertyService.getComparableSales(property, {
      radiusMiles: 1.0,
      monthsBack: 6,
    });

    // Process comparables and calculate market value
    const { comparables, marketValue, confidence } =
      comparableService.processComparables(rawComparables, property);

    // Get AVM valuation for comparison/validation (if available)
    let avmValue: number | null = null;
    try {
      const addressToUse = isAddressData(addressData)
        ? buildRentCastAddress(addressData)
        : address.trim();
      const avmResult = await rentCastService.getPropertyValuation(addressToUse);
      avmValue = avmResult?.value || null;
    } catch (error) {
      // AVM is optional, continue without it
      console.log('AVM valuation not available, proceeding with comparables only');
    }

    // Use comparables-based value, but blend with AVM if needed
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

    // Calculate assessment comparison
    const assessedValue = property.currentAssessedValue || 0;
    const difference = assessedValue - finalMarketValue;
    const percentageDifference = assessedValue > 0 ? (difference / assessedValue) * 100 : 0;

    // Determine verdict
    let verdict: 'over-assessed' | 'fair' | 'under-assessed';
    if (Math.abs(percentageDifference) <= 5) {
      verdict = 'fair';
    } else if (percentageDifference > 5) {
      verdict = 'over-assessed';
    } else {
      verdict = 'under-assessed';
    }

    // Calculate tax savings (using a default tax rate if not available)
    const taxRate = 0.055; // 5.5% default - could be made dynamic by jurisdiction
    const annualSavings = verdict === 'over-assessed' ? Math.abs(difference) * taxRate : 0;
    const monthlySavings = annualSavings / 12;

    const analysis = {
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

    console.log('Analysis completed successfully');

    // Serialize PropertyAnalysis - NextResponse.json will convert Date objects to ISO strings
    // The frontend will convert them back to Date objects when parsing
    return NextResponse.json(analysis, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Analysis API error:', error);

    if (error instanceof Error) {
      // Handle specific error types
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: 'Property not found. Please check the address and try again.' },
          { status: 404 }
        );
      }

      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { error: 'Service temporarily unavailable due to high demand. Please try again in a few minutes.' },
          { status: 429 }
        );
      }
    }

    // Generic error response
    return NextResponse.json(
      { error: 'An error occurred while analyzing the property. Please try again.' },
      { status: 500 }
    );
  }
}
