import { NextRequest, NextResponse } from 'next/server';
import { RentCastService } from '../../../external/RentCastService';
import { PropertyService } from '../../../services/PropertyService';
import { DenverAssessorService } from '../../../external/DenverAssessorService';

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

// Initialize services
const rentCastService = new RentCastService(process.env.RENTCAST_API_KEY || '');
const propertyService = new PropertyService(rentCastService);
const denverAssessorService = new DenverAssessorService();

/**
 * GET property data from RentCast for verification
 * This endpoint fetches property data without performing full analysis
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address, addressData } = body;

    console.log('Property API called with:', { address, addressData });

    if (!address || typeof address !== 'string') {
      return NextResponse.json(
        { error: 'Address is required and must be a string' },
        { status: 400 }
      );
    }

    // Use structured address data if provided (from Mapbox autocomplete)
    const addressToUse = isAddressData(addressData)
      ? buildRentCastAddress(addressData)
      : address.trim();

    console.log('Using address for RentCast:', addressToUse);

    // Fetch property data (this calls RentCast but doesn't do full analysis)
    const property = await propertyService.lookupProperty(addressToUse);

    console.log('Property data fetched successfully');
    console.log('Property details:', {
      city: property.city,
      state: property.state,
      addressLine1: property.addressLine1,
    });

    // Check if property is in Denver, CO - if so, also fetch Denver Assessor data
    let denverData = null;
    const propertyCity = property.city?.toLowerCase();
    const propertyState = property.state?.toUpperCase();
    const isDenverProperty = propertyCity === 'denver' && propertyState === 'CO';
    
    console.log('Checking if property is in Denver:', {
      propertyCity,
      propertyState,
      isDenverProperty,
    });
    
    if (isDenverProperty) {
      // Build address string for Denver Assessor search
      // The API expects just the street address, not city/state (per test script examples)
      const denverAddress = property.addressLine1;
      
      try {
        console.log('✅ Property is in Denver - fetching Denver Assessor data...');
        console.log('🔍 Denver Assessor search address (street only):', denverAddress);
        console.log('🔍 Full property address:', `${property.addressLine1}, ${property.city}, ${property.state}`);
        
        denverData = await denverAssessorService.searchPropertyByAddress(denverAddress);
        
        if (denverData) {
          console.log('✅ Denver Assessor data fetched successfully:', {
            propertyId: denverData.propertyId,
            scheduleNumber: denverData.scheduleNumber,
            hasActualValues: !!denverData.actualValues,
            hasBuildingDetails: !!denverData.buildingDetails,
          });
        } else {
          console.warn('⚠️ No Denver Assessor data found for address:', denverAddress);
        }
      } catch (error) {
        // Don't fail the whole request if Denver lookup fails - just log it
        console.error('❌ Failed to fetch Denver Assessor data:', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          address: denverAddress,
        });
        denverData = null;
      }
    } else {
      console.log('ℹ️ Property is not in Denver, CO - skipping Denver Assessor lookup');
    }

    // Return property data with optional Denver data
    console.log('📤 Returning property data:', {
      hasDenverData: !!denverData,
      denverDataPropertyId: denverData?.propertyId || 'N/A',
      propertyAddress: property.addressLine1,
    });
    
    return NextResponse.json({
      ...property,
      denverAssessorData: denverData, // Include Denver data if available
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Property API error:', error);

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
      { error: 'An error occurred while fetching property data. Please try again.' },
      { status: 500 }
    );
  }
}

