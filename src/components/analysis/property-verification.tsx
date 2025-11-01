"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  CheckCircle,
  Edit2,
  MapPin,
  Home,
  Calendar,
  DollarSign,
  Loader2,
  Shield
} from "lucide-react";
import { Property } from "@/external/RentCastTypes";
import { DenverAssessorPropertyRecord } from "@/external/DenverAssessorTypes";

interface PropertyVerificationProps {
  property: Property & { denverAssessorData?: DenverAssessorPropertyRecord | null };
  onConfirm: (verifiedProperty: Property) => void;
  onBack: () => void;
}

export function PropertyVerification({ property: initialProperty, onConfirm, onBack }: PropertyVerificationProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editedProperty, setEditedProperty] = useState<Property & { denverAssessorData?: DenverAssessorPropertyRecord | null }>(initialProperty);

  // Update edited property when initial property changes
  useEffect(() => {
    setEditedProperty(initialProperty);
  }, [initialProperty]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditedProperty(initialProperty);
    setIsEditing(false);
  };

  const handleSave = () => {
    setIsEditing(false);
  };

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      // Here we would call /listings/sale endpoint with verified property data
      // For now, we'll just pass the verified property to proceed with analysis
      // The actual /listings/sale call will be handled in the analysis flow
      onConfirm(editedProperty);
    } catch (error) {
      console.error('Error confirming property:', error);
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Button
            variant="ghost"
            onClick={onBack}
            className="flex items-center space-x-2 text-trust-secondary hover:text-brand-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Button>
          <div className="flex items-center space-x-2">
            <MapPin className="h-8 w-8 text-brand-primary" />
            <span className="text-xl font-bold text-trust-dark">Verify Property Information</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Instructions */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-trust-dark mb-2">Verify Your Property Information</h3>
                  <p className="text-sm text-trust-secondary">
                    We found your property in our database. Please review the information below and make any necessary corrections 
                    before we proceed with the analysis. Accurate data ensures the best comparable sales analysis.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Property Information Card */}
          <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Home className="h-5 w-5 text-brand-primary" />
                <span>Property Details</span>
              </CardTitle>
              {!isEditing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEdit}
                  className="flex items-center space-x-2"
                >
                  <Edit2 className="h-4 w-4" />
                  <span>Edit</span>
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Address Section */}
              <div className="space-y-4">
                <h3 className="font-semibold text-trust-dark flex items-center space-x-2">
                  <MapPin className="h-4 w-4" />
                  <span>Address</span>
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="addressLine1">Street Address</Label>
                    <Input
                      id="addressLine1"
                      value={editedProperty.addressLine1}
                      onChange={(e) => setEditedProperty({ ...editedProperty, addressLine1: e.target.value })}
                      disabled={!isEditing}
                      className={!isEditing ? "bg-gray-50" : ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="addressLine2">Address Line 2 (Optional)</Label>
                    <Input
                      id="addressLine2"
                      value={editedProperty.addressLine2 || ""}
                      onChange={(e) => setEditedProperty({ ...editedProperty, addressLine2: e.target.value || undefined })}
                      disabled={!isEditing}
                      className={!isEditing ? "bg-gray-50" : ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={editedProperty.city}
                      onChange={(e) => setEditedProperty({ ...editedProperty, city: e.target.value })}
                      disabled={!isEditing}
                      className={!isEditing ? "bg-gray-50" : ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={editedProperty.state}
                      onChange={(e) => setEditedProperty({ ...editedProperty, state: e.target.value })}
                      disabled={!isEditing}
                      maxLength={2}
                      className={!isEditing ? "bg-gray-50" : ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zipCode">ZIP Code</Label>
                    <Input
                      id="zipCode"
                      value={editedProperty.zipCode}
                      onChange={(e) => setEditedProperty({ ...editedProperty, zipCode: e.target.value })}
                      disabled={!isEditing}
                      className={!isEditing ? "bg-gray-50" : ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="county">County</Label>
                    <Input
                      id="county"
                      value={editedProperty.county || ""}
                      onChange={(e) => setEditedProperty({ ...editedProperty, county: e.target.value })}
                      disabled={!isEditing}
                      className={!isEditing ? "bg-gray-50" : ""}
                    />
                  </div>
                </div>
              </div>

              {/* Property Characteristics */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-semibold text-trust-dark flex items-center space-x-2">
                  <Home className="h-4 w-4" />
                  <span>Property Characteristics</span>
                </h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="propertyType">Property Type</Label>
                    <Input
                      id="propertyType"
                      value={editedProperty.characteristics.propertyType}
                      onChange={(e) => setEditedProperty({
                        ...editedProperty,
                        characteristics: { ...editedProperty.characteristics, propertyType: e.target.value }
                      })}
                      disabled={!isEditing}
                      className={!isEditing ? "bg-gray-50" : ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bedrooms">Bedrooms</Label>
                    <Input
                      id="bedrooms"
                      type="number"
                      min="0"
                      value={editedProperty.characteristics.bedrooms}
                      onChange={(e) => setEditedProperty({
                        ...editedProperty,
                        characteristics: { ...editedProperty.characteristics, bedrooms: parseInt(e.target.value) || 0 }
                      })}
                      disabled={!isEditing}
                      className={!isEditing ? "bg-gray-50" : ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bathrooms">Bathrooms</Label>
                    <Input
                      id="bathrooms"
                      type="number"
                      min="0"
                      step="0.5"
                      value={editedProperty.characteristics.bathrooms}
                      onChange={(e) => setEditedProperty({
                        ...editedProperty,
                        characteristics: { ...editedProperty.characteristics, bathrooms: parseFloat(e.target.value) || 0 }
                      })}
                      disabled={!isEditing}
                      className={!isEditing ? "bg-gray-50" : ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sqft">Square Footage</Label>
                    <Input
                      id="sqft"
                      type="number"
                      min="0"
                      value={editedProperty.characteristics.sqft}
                      onChange={(e) => setEditedProperty({
                        ...editedProperty,
                        characteristics: { ...editedProperty.characteristics, sqft: parseInt(e.target.value) || 0 }
                      })}
                      disabled={!isEditing}
                      className={!isEditing ? "bg-gray-50" : ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lotSize">Lot Size (sqft)</Label>
                    <Input
                      id="lotSize"
                      type="number"
                      min="0"
                      value={editedProperty.characteristics.lotSize}
                      onChange={(e) => setEditedProperty({
                        ...editedProperty,
                        characteristics: { ...editedProperty.characteristics, lotSize: parseInt(e.target.value) || 0 }
                      })}
                      disabled={!isEditing}
                      className={!isEditing ? "bg-gray-50" : ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="yearBuilt">Year Built</Label>
                    <Input
                      id="yearBuilt"
                      type="number"
                      min="1800"
                      max={new Date().getFullYear()}
                      value={editedProperty.characteristics.yearBuilt}
                      onChange={(e) => setEditedProperty({
                        ...editedProperty,
                        characteristics: { ...editedProperty.characteristics, yearBuilt: parseInt(e.target.value) || 0 }
                      })}
                      disabled={!isEditing}
                      className={!isEditing ? "bg-gray-50" : ""}
                    />
                  </div>
                </div>
              </div>

              {/* Assessment Information */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-semibold text-trust-dark flex items-center space-x-2">
                  <DollarSign className="h-4 w-4" />
                  <span>Assessment Information</span>
                </h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="assessedValue">Current Assessed Value</Label>
                    <Input
                      id="assessedValue"
                      type="number"
                      min="0"
                      value={editedProperty.currentAssessedValue || ""}
                      onChange={(e) => setEditedProperty({
                        ...editedProperty,
                        currentAssessedValue: e.target.value ? parseFloat(e.target.value) : undefined
                      })}
                      disabled={!isEditing}
                      className={!isEditing ? "bg-gray-50" : ""}
                      placeholder="N/A"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="assessmentYear">Assessment Year</Label>
                    <Input
                      id="assessmentYear"
                      type="number"
                      min="2000"
                      max={new Date().getFullYear()}
                      value={editedProperty.assessmentYear || ""}
                      onChange={(e) => setEditedProperty({
                        ...editedProperty,
                        assessmentYear: e.target.value ? parseInt(e.target.value) : undefined
                      })}
                      disabled={!isEditing}
                      className={!isEditing ? "bg-gray-50" : ""}
                      placeholder="N/A"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="parcelNumber">Parcel Number</Label>
                    <Input
                      id="parcelNumber"
                      value={editedProperty.parcelNumber || ""}
                      onChange={(e) => setEditedProperty({
                        ...editedProperty,
                        parcelNumber: e.target.value || undefined
                      })}
                      disabled={!isEditing}
                      className={!isEditing ? "bg-gray-50" : ""}
                      placeholder="N/A"
                    />
                  </div>
                </div>
              </div>

              {/* Edit Actions */}
              {isEditing && (
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <Button variant="outline" onClick={handleCancel}>
                    Cancel
                  </Button>
                  <Button variant="trust" onClick={handleSave}>
                    Save Changes
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

              {/* Denver Assessor Data Section */}
              {editedProperty.denverAssessorData && (
                <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm mt-6">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Shield className="h-5 w-5 text-green-600" />
                      <span>Denver County Assessor Data</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm text-gray-600">Schedule Number</Label>
                        <p className="font-semibold">{editedProperty.denverAssessorData.scheduleNumber}</p>
                      </div>
                      <div>
                        <Label className="text-sm text-gray-600">Property ID</Label>
                        <p className="font-semibold">{editedProperty.denverAssessorData.propertyId}</p>
                      </div>
                      {editedProperty.denverAssessorData.actualValues && (
                        <>
                          <div>
                            <Label className="text-sm text-gray-600">Total Appraised Value (Denver)</Label>
                            <p className="font-semibold text-lg text-green-700">
                              {formatCurrency(editedProperty.denverAssessorData.actualValues.total)}
                            </p>
                          </div>
                          <div>
                            <Label className="text-sm text-gray-600">Land Value</Label>
                            <p className="font-semibold">
                              {formatCurrency(editedProperty.denverAssessorData.actualValues.land)}
                            </p>
                          </div>
                          <div>
                            <Label className="text-sm text-gray-600">Improvements Value</Label>
                            <p className="font-semibold">
                              {formatCurrency(editedProperty.denverAssessorData.actualValues.improvements)}
                            </p>
                          </div>
                          <div>
                            <Label className="text-sm text-gray-600">Tax Year</Label>
                            <p className="font-semibold">{editedProperty.denverAssessorData.actualValues.taxYear}</p>
                          </div>
                        </>
                      )}
                      {editedProperty.denverAssessorData.keyInformation && (
                        <>
                          <div>
                            <Label className="text-sm text-gray-600">Zoning</Label>
                            <p className="font-semibold">{editedProperty.denverAssessorData.keyInformation.zoning}</p>
                          </div>
                          <div>
                            <Label className="text-sm text-gray-600">Land Use Code</Label>
                            <p className="font-semibold">{editedProperty.denverAssessorData.keyInformation.landUseCode}</p>
                          </div>
                        </>
                      )}
                    </div>
                    {editedProperty.denverAssessorData.buildingDetails && (
                      <div className="pt-4 border-t border-green-300">
                        <h4 className="font-semibold text-sm mb-2">Building Details (Denver)</h4>
                        <div className="grid md:grid-cols-3 gap-3 text-sm">
                          <div>
                            <span className="text-gray-600">Year Built: </span>
                            <span className="font-semibold">{editedProperty.denverAssessorData.buildingDetails.yearBuilt}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Living Area: </span>
                            <span className="font-semibold">{editedProperty.denverAssessorData.buildingDetails.totalLivingArea} sqft</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Bathrooms: </span>
                            <span className="font-semibold">
                              {editedProperty.denverAssessorData.buildingDetails.fullBathrooms} full, {editedProperty.denverAssessorData.buildingDetails.halfBathrooms} half
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-end">
            <Button
              variant="outline"
              size="lg"
              onClick={onBack}
              className="flex-1 sm:flex-none"
            >
              Back
            </Button>
            <Button
              variant="trust"
              size="lg"
              onClick={handleConfirm}
              disabled={isLoading}
              className="flex-1 sm:flex-none"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-5 w-5" />
                  Confirm & Continue to Analysis
                </>
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

