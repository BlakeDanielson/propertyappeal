"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PropertyVerification } from "@/components/analysis/property-verification";
import { Property } from "@/external/RentCastTypes";
import { DenverAssessorPropertyRecord } from "@/external/DenverAssessorTypes";

type PropertyWithDenver = Property & { denverAssessorData?: DenverAssessorPropertyRecord | null };

function VerifyPageContent() {
  const router = useRouter();
  const [property, setProperty] = useState<PropertyWithDenver | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get property data from sessionStorage (set by landing page)
    const storedProperty = sessionStorage.getItem('propertyData');
    if (storedProperty) {
      try {
        const parsedProperty = JSON.parse(storedProperty);
        
        // Convert date strings back to Date objects if needed
        if (parsedProperty.assessmentDate) {
          parsedProperty.assessmentDate = new Date(parsedProperty.assessmentDate);
        }
        
        setProperty(parsedProperty as PropertyWithDenver);
      } catch (error) {
        console.error('Error parsing property data:', error);
        setError('Failed to load property data. Please try again.');
      }
    } else {
      // No property data found, redirect to home
      router.push('/');
      return;
    }
    setLoading(false);
  }, [router]);

  const handleBack = () => {
    router.push('/');
  };

  const handleConfirm = async (verifiedProperty: Property) => {
    try {
      // Store verified property data
      sessionStorage.setItem('verifiedPropertyData', JSON.stringify(verifiedProperty));
      
      // Now proceed with analysis using verified property
      // The analysis API will use this verified data
      const addressToAnalyze = `${verifiedProperty.addressLine1}, ${verifiedProperty.city}, ${verifiedProperty.state} ${verifiedProperty.zipCode}`;
      
      // Call the analysis API with verified property info
      const response = await fetch('/api/analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: addressToAnalyze,
          addressData: {
            fullAddress: addressToAnalyze,
            line1: verifiedProperty.addressLine1,
            city: verifiedProperty.city,
            state: verifiedProperty.state,
            zipCode: verifiedProperty.zipCode,
            latitude: verifiedProperty.latitude,
            longitude: verifiedProperty.longitude,
          },
          verifiedProperty: verifiedProperty, // Pass verified property data
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Analysis failed');
      }

      const analysisData = await response.json();

      // Store the analysis data in sessionStorage
      sessionStorage.setItem('analysisData', JSON.stringify(analysisData));

      // Navigate to loading screen, then it will redirect to results
      router.push('/analysis/loading');

    } catch (error) {
      console.error('Analysis error:', error);
      setError(error instanceof Error ? error.message : 'An error occurred. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto mb-4"></div>
          <p className="text-trust-secondary">Loading property information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary-dark"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!property) {
    return null;
  }

  return (
    <PropertyVerification
      property={property}
      onConfirm={handleConfirm}
      onBack={handleBack}
    />
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyPageContent />
    </Suspense>
  );
}

