"use client";

import { useState, useCallback, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AddressData {
  fullAddress: string;
  line1: string;
  city: string;
  state: string;
  zipCode: string;
  latitude?: number;
  longitude?: number;
}

interface AddressInputProps {
  value: string;
  onChange: (value: string) => void;
  onAddressSelect: (addressData: AddressData) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  error?: string;
}

/**
 * AddressInput component using Mapbox Address Autofill
 * 
 * Much simpler than Google Places - uses standard HTML form with Mapbox enhancement
 * Free tier: 100,000 requests/month
 */
export function AddressInput({
  value,
  onChange,
  onAddressSelect,
  placeholder = "Enter property address",
  disabled = false,
  className,
  error
}: AddressInputProps) {
  const [apiError, setApiError] = useState<string | null>(null);
  const [MapboxAutofill, setMapboxAutofill] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load Mapbox component only on client side
  useEffect(() => {
    let isMounted = true;

    const loadMapbox = async () => {
      try {
        const { AddressAutofill } = await import('@mapbox/search-js-react');
        if (isMounted) {
          setMapboxAutofill(() => AddressAutofill);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error loading Mapbox:', error);
        if (isMounted) {
          setApiError('Address autocomplete failed to load.');
          setIsLoading(false);
        }
      }
    };

    loadMapbox();

    return () => {
      isMounted = false;
    };
  }, []);

  // Cache key for storing validated addresses
  const getCacheKey = (address: string) => `address_cache_${address.replace(/\s+/g, '_').toLowerCase()}`;

  // Check cache for previously validated address
  const getCachedAddress = useCallback((address: string): AddressData | null => {
    if (typeof window === 'undefined') return null;

    try {
      const cacheKey = getCacheKey(address);
      const cached = localStorage.getItem(cacheKey);

      if (cached) {
        const parsed = JSON.parse(cached);
        // Check if cache is still valid (24 hours)
        const cacheTime = parsed.timestamp;
        const now = Date.now();
        const cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

        if (now - cacheTime < cacheExpiry) {
          return parsed.data;
        } else {
          // Remove expired cache
          localStorage.removeItem(cacheKey);
        }
      }
    } catch (error) {
      console.warn('Error reading address cache:', error);
    }

    return null;
  }, []);

  // Cache validated address
  const cacheAddress = useCallback((address: string, data: AddressData) => {
    if (typeof window === 'undefined') return;

    try {
      const cacheKey = getCacheKey(address);
      const cacheData = {
        data,
        timestamp: Date.now()
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Error caching address:', error);
    }
  }, []);

  // Handle Mapbox address selection
  const handleRetrieve = useCallback(async (result: any) => {
    console.log('Mapbox address selected (full result):', JSON.stringify(result, null, 2));

    try {
      const feature = result.features[0];
      
      if (!feature) {
        console.warn('No feature found in Mapbox result');
        return;
      }

      console.log('Mapbox feature:', JSON.stringify(feature, null, 2));

      // Extract address components from Mapbox feature
      const properties = feature.properties;
      
      // Mapbox places the context info directly in properties, not nested
      const addressNumber = properties.address_number || '';
      const street = properties.street || properties.address_line1 || '';
      const line1 = addressNumber && street ? `${addressNumber} ${street}` : (street || addressNumber);
      
      // Build address data
      const addressData: AddressData = {
        fullAddress: properties.full_address || properties.place_name || feature.place_name || '',
        line1: line1,
        city: properties.place || properties.locality || properties.city || '',
        state: properties.region_code || properties.region || '',
        zipCode: properties.postcode || '',
        latitude: feature.geometry?.coordinates?.[1],
        longitude: feature.geometry?.coordinates?.[0]
      };

      console.log('Extracted address data (before validation):', addressData);

      // Validate that we have essential components
      if (!addressData.line1 || !addressData.city || !addressData.state || !addressData.zipCode) {
        console.warn('Incomplete address data from Mapbox:', addressData);
        setApiError('Please enter a complete address with street, city, state, and ZIP code.');
        return;
      }

      console.log('✅ Valid address data for RentCast:', addressData);

      // Check cache first
      const cachedAddress = getCachedAddress(addressData.fullAddress);
      if (cachedAddress) {
        console.log('Using cached address:', cachedAddress);
        onAddressSelect(cachedAddress);
        onChange(cachedAddress.fullAddress);
        setApiError(null);
        return;
      }

      // Cache the validated address
      cacheAddress(addressData.fullAddress, addressData);

      // Update parent component with formatted address
      onAddressSelect(addressData);
      onChange(addressData.fullAddress);
      setApiError(null);
    } catch (error) {
      console.error('Error processing Mapbox address selection:', error);
      setApiError('Error processing address. Please try again.');
    }
  }, [getCachedAddress, cacheAddress, onAddressSelect, onChange]);

  // Check if Mapbox API key is configured
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  // Show loading state while Mapbox loads
  if (isLoading) {
    return (
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 z-10" />
        <Input
          type="text"
          placeholder="Loading address autocomplete..."
          disabled={true}
          className={cn("pl-12", className)}
        />
      </div>
    );
  }

  // Show fallback if no API key or Mapbox failed to load
  if (!mapboxToken || !MapboxAutofill) {
    return (
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 z-10" />
          <Input
            type="text"
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className={cn("pl-12", className)}
          />
        </div>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Address autocomplete is unavailable. Please enter your address manually.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <MapboxAutofill
        accessToken={mapboxToken}
        onRetrieve={handleRetrieve}
        options={{
          country: 'US',
          language: 'en'
        }}
      >
        <div className="relative">
          {/* Search icon overlay */}
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 z-10 pointer-events-none" />
          
          {/* Address input with Mapbox autocomplete */}
          <Input
            type="text"
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className={cn("pl-12", className)}
            autoComplete="address-line1"
            name="address"
          />
        </div>
      </MapboxAutofill>

      {/* Error messages */}
      {(apiError || error) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || apiError}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
