"use client";

import { PropertyAnalysis } from "@/external/RentCastTypes";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Calendar,
  Home,
  Ruler,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Navigation,
} from "lucide-react";

interface ComparableSalesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  analysis: PropertyAnalysis;
}

export function ComparableSalesDialog({
  open,
  onOpenChange,
  analysis,
}: ComparableSalesDialogProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: Date | string) => {
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDistance = (miles: number) => {
    if (miles < 0.1) {
      return `${(miles * 5280).toFixed(0)} ft`;
    }
    return `${miles.toFixed(2)} mi`;
  };

  const calculateDifference = (comparablePrice: number) => {
    const diff = comparablePrice - analysis.marketValue;
    const percentDiff = (diff / analysis.marketValue) * 100;
    return { diff, percentDiff };
  };

  const getSubjectProperty = () => analysis.property;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="text-2xl font-bold text-trust-dark">
            Comparable Sales Analysis
          </DialogTitle>
          <DialogDescription className="text-base">
            Detailed comparison of recent sales used to determine your property&apos;s
            market value
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 px-6 pb-6">
          {/* Subject Property Summary */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-3">
                    <Badge variant="default" className="bg-brand-primary text-white">
                      Subject Property
                    </Badge>
                    <MapPin className="h-4 w-4 text-trust-secondary" />
                    <span className="font-semibold text-trust-dark">
                      {getSubjectProperty().addressLine1},{" "}
                      {getSubjectProperty().city}, {getSubjectProperty().state}{" "}
                      {getSubjectProperty().zipCode}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    <div>
                      <div className="text-xs text-trust-muted mb-1">Bedrooms</div>
                      <div className="text-lg font-semibold text-trust-dark">
                        {getSubjectProperty().characteristics.bedrooms}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-trust-muted mb-1">Bathrooms</div>
                      <div className="text-lg font-semibold text-trust-dark">
                        {getSubjectProperty().characteristics.bathrooms}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-trust-muted mb-1">Square Feet</div>
                      <div className="text-lg font-semibold text-trust-dark">
                        {getSubjectProperty().characteristics.sqft.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-trust-muted mb-1">
                        Est. Market Value
                      </div>
                      <div className="text-lg font-semibold text-brand-primary">
                        {formatCurrency(analysis.marketValue)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statistics Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-trust-muted mb-1">
                  Total Comparables
                </div>
                <div className="text-2xl font-bold text-trust-dark">
                  {analysis.comparables.length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-trust-muted mb-1">
                  Average Sale Price
                </div>
                <div className="text-2xl font-bold text-trust-dark">
                  {formatCurrency(
                    analysis.comparables.reduce(
                      (sum, comp) => sum + comp.salePrice,
                      0
                    ) / analysis.comparables.length
                  )}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-trust-muted mb-1">
                  Confidence Level
                </div>
                <div className="text-2xl font-bold capitalize text-brand-primary">
                  {analysis.confidence.level}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Comparable Sales List */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-trust-dark">
              Recent Comparable Sales
            </h3>
            {analysis.comparables.map((comp, index) => {
              const { diff, percentDiff } = calculateDifference(comp.salePrice);
              const isHigher = diff > 0;
              const isLower = diff < 0;

              return (
                <Card
                  key={comp.id || index}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      {/* Left side - Property Info */}
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start space-x-2">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <MapPin className="h-4 w-4 text-trust-secondary flex-shrink-0" />
                              <span className="font-semibold text-trust-dark">
                                {comp.address}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-trust-muted ml-6">
                              <div className="flex items-center space-x-1">
                                <Home className="h-3 w-3" />
                                <span>
                                  {comp.characteristics.bedrooms} bed /{" "}
                                  {comp.characteristics.bathrooms} bath
                                </span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Ruler className="h-3 w-3" />
                                <span>
                                  {comp.characteristics.sqft.toLocaleString()} sqft
                                </span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Navigation className="h-3 w-3" />
                                <span>{formatDistance(comp.distanceMiles)} away</span>
                              </div>
                              {comp.characteristics.yearBuilt && (
                                <div className="flex items-center space-x-1">
                                  <Calendar className="h-3 w-3" />
                                  <span>Built {comp.characteristics.yearBuilt}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Sale Date */}
                        <div className="flex items-center space-x-2 text-sm text-trust-secondary ml-6">
                          <Calendar className="h-3 w-3" />
                          <span>
                            Sold: {formatDate(comp.saleDate)}
                          </span>
                        </div>
                      </div>

                      {/* Right side - Price and Comparison */}
                      <div className="flex flex-col items-end space-y-2 md:min-w-[200px]">
                        <div className="text-right">
                          <div className="text-2xl font-bold text-trust-dark">
                            {formatCurrency(comp.salePrice)}
                          </div>
                          {comp.adjustedPrice &&
                            comp.adjustedPrice !== comp.salePrice && (
                              <div className="text-xs text-trust-muted mt-1">
                                Adjusted: {formatCurrency(comp.adjustedPrice)}
                              </div>
                            )}
                        </div>

                        {/* Difference from Market Value */}
                        <div
                          className={`flex items-center space-x-1 text-sm font-medium ${
                            isHigher
                              ? "text-green-600"
                              : isLower
                              ? "text-red-600"
                              : "text-gray-600"
                          }`}
                        >
                          {isHigher ? (
                            <TrendingUp className="h-4 w-4" />
                          ) : isLower ? (
                            <TrendingDown className="h-4 w-4" />
                          ) : null}
                          <span>
                            {isHigher ? "+" : ""}
                            {formatCurrency(Math.abs(diff))} (
                            {percentDiff > 0 ? "+" : ""}
                            {percentDiff.toFixed(1)}%)
                          </span>
                        </div>

                        {/* Price per sqft */}
                        <div className="text-xs text-trust-muted">
                          ${(
                            comp.salePrice / comp.characteristics.sqft
                          ).toFixed(0)}{" "}
                          / sqft
                        </div>
                      </div>
                    </div>

                    {/* Adjustments if available */}
                    {comp.adjustments &&
                      Object.keys(comp.adjustments).length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="text-xs font-medium text-trust-muted mb-2">
                            Price Adjustments:
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(comp.adjustments).map(([key, value]) => (
                              <Badge
                                key={key}
                                variant="outline"
                                className="text-xs"
                              >
                                {key}: {value > 0 ? "+" : ""}
                                {formatCurrency(Math.abs(value))}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Methodology Note */}
          <Card className="bg-gray-50 border-gray-200">
            <CardContent className="p-4">
              <div className="text-sm text-trust-muted">
                <strong className="text-trust-dark">Note:</strong> These comparable
                sales were selected based on similarity to your property (size,
                features, location) and recent sale dates. Prices may have been
                adjusted for differences in characteristics to provide a more accurate
                comparison.
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}

