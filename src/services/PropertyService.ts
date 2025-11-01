import { RentCastService } from '../external/RentCastService';
import { RentCastMapper } from '../external/RentCastMapper';
import { Property, Comparable } from '../external/RentCastTypes';

export class PropertyService {
  constructor(private rentCastService: RentCastService) {}

  async lookupProperty(address: string): Promise<Property> {
    try {
      // Try RentCast first
      const record = await this.rentCastService.getPropertyByAddress(address);
      return RentCastMapper.mapToProperty(record);
    } catch (error) {
      // For now, just re-throw. We'll add fallback scraping later
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          throw new Error(`Property not found: ${address}. Please check the address and try again.`);
        }
        if (error.message.includes('rate limit')) {
          throw new Error('Service temporarily unavailable. Please try again in a few minutes.');
        }
      }
      throw error;
    }
  }

  async getComparableSales(
    property: Property,
    options: {
      radiusMiles?: number;
      monthsBack?: number;
      limit?: number;
    } = {}
  ): Promise<Comparable[]> {
    // Use address-based search - simpler and API handles geographic proximity
    const comparables = await this.rentCastService.getComparableSales(
      property.addressLine1,
      property.city,
      property.state,
      property.zipCode,
      options.limit || 20,
      options.monthsBack || 6
    );

    // Calculate distance from subject property if we have coordinates
    // (RentCast API may not include distance in address-based search)
    return comparables.map(comp => {
      const mapped = RentCastMapper.mapToComparable(comp, property);
      
      // Calculate distance if both properties have coordinates
      if (property.latitude && property.longitude && comp.latitude && comp.longitude) {
        mapped.distanceMiles = this.calculateDistance(
          property.latitude,
          property.longitude,
          comp.latitude,
          comp.longitude
        );
      }
      
      return mapped;
    });
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   * Returns distance in miles
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 3959; // Earth's radius in miles
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }

  async getPropertyById(id: string): Promise<Property> {
    const record = await this.rentCastService.getPropertyById(id);
    return RentCastMapper.mapToProperty(record);
  }
}
