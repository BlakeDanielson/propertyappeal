"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  DollarSign,
  MapPin,
  Calendar,
  Users,
  Shield
} from "lucide-react";
import { PropertyAnalysis } from "@/external/RentCastTypes";

interface AnalysisResultsProps {
  analysis: PropertyAnalysis;
  onBack: () => void;
  onCreateAccount: () => void;
  onViewComparables: () => void;
}

export function AnalysisResults({ analysis, onBack, onCreateAccount, onViewComparables }: AnalysisResultsProps) {
  const [showDetails, setShowDetails] = useState(false);

  const isOverAssessed = analysis.verdict === 'over-assessed';
  const isFair = analysis.verdict === 'fair';

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (percentage: number) => {
    return `${Math.abs(percentage).toFixed(1)}%`;
  };

  const getConfidenceColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-brand-success';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getConfidenceIcon = (level: string) => {
    switch (level) {
      case 'high': return <CheckCircle className="h-4 w-4" />;
      case 'medium': return <AlertCircle className="h-4 w-4" />;
      case 'low': return <AlertCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
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
            <span>Back to Search</span>
          </Button>
          <div className="flex items-center space-x-2">
            <Shield className="h-8 w-8 text-brand-primary" />
            <span className="text-xl font-bold text-trust-dark">PropertyTaxAppeal</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Property Header */}
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 text-trust-secondary mb-2">
              <MapPin className="h-5 w-5" />
              <span className="text-lg">
                {analysis.property.addressLine1}, {analysis.property.city}, {analysis.property.state} {analysis.property.zipCode}
              </span>
            </div>
            <div className="flex items-center justify-center space-x-4 text-sm text-trust-muted">
              <div className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>Analysis completed today</span>
              </div>
              <div className="flex items-center space-x-1">
                <Users className="h-4 w-4" />
                <span>Based on {analysis.comparables.length} comparable sales</span>
              </div>
            </div>
          </div>

          {/* Main Verdict Card */}
          <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                {isOverAssessed ? (
                  <>
                    <div className="w-20 h-20 bg-brand-success rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="h-10 w-10 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-trust-dark mb-2">
                      Great News! Potential Savings Found
                    </h1>
                    <p className="text-lg text-trust-secondary">
                      Your property appears to be <span className="font-semibold text-brand-primary">OVER-ASSESSED</span>
                    </p>
                  </>
                ) : isFair ? (
                  <>
                    <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Shield className="h-10 w-10 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-trust-dark mb-2">
                      Fair Assessment
                    </h1>
                    <p className="text-lg text-trust-secondary">
                      Your property assessment appears <span className="font-semibold text-blue-600">FAIR and ACCURATE</span>
                    </p>
                  </>
                ) : (
                  <>
                    <div className="w-20 h-20 bg-gray-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <AlertCircle className="h-10 w-10 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-trust-dark mb-2">
                      Assessment Review Complete
                    </h1>
                    <p className="text-lg text-trust-secondary">
                      Analysis complete for your property
                    </p>
                  </>
                )}
              </div>

              {/* Assessment Summary */}
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-trust-secondary mb-1">Current Assessment</div>
                  <div className="text-2xl font-bold text-trust-dark">{formatCurrency(analysis.assessedValue)}</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-trust-secondary mb-1">Estimated Market Value</div>
                  <div className="text-2xl font-bold text-trust-dark">{formatCurrency(analysis.marketValue)}</div>
                </div>
                <div className={`text-center p-4 rounded-lg ${isOverAssessed ? 'bg-brand-success-bg' : 'bg-gray-50'}`}>
                  <div className="text-sm text-trust-secondary mb-1">
                    {isOverAssessed ? 'Over-Assessed Amount' : 'Assessment Difference'}
                  </div>
                  <div className={`text-2xl font-bold ${isOverAssessed ? 'text-brand-success' : 'text-trust-dark'}`}>
                    {isOverAssessed ? '-' : ''}{formatCurrency(Math.abs(analysis.difference))}
                    {isOverAssessed && (
                      <div className="text-sm font-normal mt-1">
                        ({formatPercentage(analysis.percentageDifference)})
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Savings Display (only for over-assessed) */}
              {isOverAssessed && (
                <div className="bg-gradient-to-r from-brand-success-bg to-green-50 rounded-xl p-6 mb-8 border border-brand-success/20">
                  <div className="flex items-center justify-center space-x-2 mb-4">
                    <DollarSign className="h-6 w-6 text-brand-success" />
                    <h2 className="text-2xl font-bold text-brand-success">Potential Annual Savings</h2>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-brand-success mb-2">
                      {formatCurrency(analysis.annualSavings)}
                    </div>
                    <div className="text-trust-secondary">
                      That&apos;s {formatCurrency(analysis.monthlySavings)} per month
                    </div>
                  </div>
                </div>
              )}

              {/* Confidence Indicator */}
              <div className="flex items-center justify-center space-x-4 mb-8 p-4 bg-gray-50 rounded-lg">
                <div className={`flex items-center space-x-2 ${getConfidenceColor(analysis.confidence.level)}`}>
                  {getConfidenceIcon(analysis.confidence.level)}
                  <span className="font-medium capitalize">{analysis.confidence.level} Confidence</span>
                </div>
                <div className="text-sm text-trust-muted">
                  Based on {analysis.confidence.sampleSize} recent sales within 1 mile
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  variant="trust"
                  size="lg"
                  onClick={onCreateAccount}
                  className="flex-1 sm:flex-none"
                >
                  {isOverAssessed ? 'Start Your Appeal - Free' : 'Create Free Account'}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={onViewComparables}
                  className="flex-1 sm:flex-none"
                >
                  View Comparable Sales
                </Button>
              </div>

              {/* Additional Info Toggle */}
              <div className="text-center mt-6">
                <Button
                  variant="ghost"
                  onClick={() => setShowDetails(!showDetails)}
                  className="text-trust-secondary hover:text-brand-primary"
                >
                  {showDetails ? 'Hide Details' : 'Show Analysis Details'}
                </Button>
              </div>

              {/* Detailed Analysis (expandable) */}
              {showDetails && (
                <div className="mt-8 pt-6 border-t border-gray-200 space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-trust-dark mb-4">Comparable Sales Analysis</h3>
                    <div className="space-y-3">
                      {analysis.comparables.slice(0, 5).map((comp, index) => (
                        <div key={comp.id || index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <div>
                            <div className="font-medium text-trust-dark">{comp.address}</div>
                            <div className="text-sm text-trust-muted">
                              {comp.characteristics.bedrooms} bed • {comp.characteristics.bathrooms} bath • {comp.characteristics.sqft.toLocaleString()} sqft • {comp.distanceMiles.toFixed(1)} miles away
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-trust-dark">{formatCurrency(comp.salePrice)}</div>
                            <div className="text-sm text-trust-muted">
                              {comp.saleDate instanceof Date 
                                ? comp.saleDate.toLocaleDateString() 
                                : new Date(comp.saleDate).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Assessment Details</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-trust-secondary">Tax Rate:</span>
                          <span className="font-medium">{(analysis.taxRate * 100).toFixed(2)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-trust-secondary">Analysis Date:</span>
                          <span className="font-medium">
                            {analysis.confidence.lastUpdated instanceof Date
                              ? analysis.confidence.lastUpdated.toLocaleDateString()
                              : new Date(analysis.confidence.lastUpdated).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-trust-secondary">Data Source:</span>
                          <span className="font-medium">RentCast API</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Next Steps</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ol className="list-decimal list-inside space-y-1 text-sm text-trust-secondary">
                          <li>Create your free account</li>
                          <li>Review comparable sales data</li>
                          <li>Generate appeal documents</li>
                          <li>Submit to your county assessor</li>
                          <li>Track your appeal status</li>
                        </ol>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
