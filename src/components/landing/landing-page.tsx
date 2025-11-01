"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AddressInput, type AddressData } from "@/components/ui/address-input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Clock, Shield, DollarSign, CheckCircle, Star } from "lucide-react";

export function LandingPage() {
  const [address, setAddress] = useState("");
  const [selectedAddress, setSelectedAddress] = useState<AddressData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const router = useRouter();

  const handleAddressSelect = (addressData: AddressData) => {
    setSelectedAddress(addressData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) return;

    setIsAnalyzing(true);

    try {
      // Use structured address data if available, otherwise use the text input
      const addressToAnalyze = selectedAddress?.fullAddress || address.trim();

      // Call the property API to fetch property data for verification
      const response = await fetch('/api/property', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: addressToAnalyze,
          addressData: selectedAddress // Pass structured data for better property lookup
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch property data');
      }

      const propertyData = await response.json();

      // Store the property data in sessionStorage to pass to verification page
      sessionStorage.setItem('propertyData', JSON.stringify(propertyData));

      setIsAnalyzing(false);

      // Navigate to verification page
      router.push('/analysis/verify');

    } catch (error) {
      setIsAnalyzing(false);
      console.error('Property lookup error:', error);

      // For now, show a simple alert. In production, you'd show a proper error UI
      alert(error instanceof Error ? error.message : 'An error occurred. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Shield className="h-8 w-8 text-brand-primary" />
            <span className="text-xl font-bold text-trust-dark">PropertyTaxAppeal</span>
          </div>
          <nav className="hidden md:flex space-x-6">
            <a href="#how-it-works" className="text-trust-secondary hover:text-brand-primary transition-colors">
              How It Works
            </a>
            <a href="#about" className="text-trust-secondary hover:text-brand-primary transition-colors">
              About
            </a>
            <a href="#contact" className="text-trust-secondary hover:text-brand-primary transition-colors">
              Contact
            </a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* Main Headline */}
          <h1 className="text-4xl md:text-6xl font-bold text-trust-dark mb-6 leading-tight">
            Save Money on Your
            <span className="text-brand-primary block">Property Taxes</span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl text-trust-secondary mb-8 max-w-2xl mx-auto leading-relaxed">
            Find out if you&apos;re overpaying on your property taxes in just 30 seconds.
            Free analysis compares your assessment to recent sales in your area.
          </p>

          {/* Address Input Form */}
          <Card className="max-w-2xl mx-auto mb-12 shadow-xl border-0 bg-white/90 backdrop-blur-sm">
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-4">
                <AddressInput
                  value={address}
                  onChange={setAddress}
                  onAddressSelect={handleAddressSelect}
                  placeholder="Enter your property address (e.g., 123 Main St, Denver, CO)"
                  disabled={isAnalyzing}
                  className="py-4 text-lg h-14 border-2 border-gray-200 focus:border-brand-primary rounded-xl"
                />

                <Button
                  type="submit"
                  variant="trust"
                  size="lg"
                  className="w-full h-14 text-lg rounded-xl"
                  disabled={!address.trim() || isAnalyzing}
                >
                  {isAnalyzing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Analyzing Your Property...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-5 w-5" />
                      Check My Property Taxes - Free
                    </>
                  )}
                </Button>
              </form>

              {/* Trust Indicators */}
              <div className="flex flex-wrap justify-center gap-4 mt-6 pt-6 border-t border-gray-100">
                <div className="flex items-center text-sm text-trust-muted">
                  <Clock className="h-4 w-4 mr-1 text-brand-success" />
                  30 Second Analysis
                </div>
                <div className="flex items-center text-sm text-trust-muted">
                  <Shield className="h-4 w-4 mr-1 text-brand-success" />
                  100% Free
                </div>
                <div className="flex items-center text-sm text-trust-muted">
                  <CheckCircle className="h-4 w-4 mr-1 text-brand-success" />
                  No Credit Card Required
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Social Proof & Stats */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="text-center">
              <div className="text-3xl font-bold text-brand-primary mb-2">$2.3M+</div>
              <div className="text-trust-secondary">Tax Savings Found</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-brand-primary mb-2">15,000+</div>
              <div className="text-trust-secondary">Properties Analyzed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-brand-primary mb-2">68%</div>
              <div className="text-trust-secondary">Success Rate</div>
            </div>
          </div>

          {/* How It Works */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-trust-dark mb-12">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-brand-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-trust-dark mb-2">1. Enter Address</h3>
                <p className="text-trust-secondary">Tell us your property location</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-brand-success rounded-full flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-trust-dark mb-2">2. Get Results</h3>
                <p className="text-trust-secondary">We analyze comparable sales data</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-brand-accent rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-trust-dark mb-2">3. File Appeal</h3>
                <p className="text-trust-secondary">Generate and submit professional forms</p>
              </div>
            </div>
          </div>

          {/* Testimonials */}
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 shadow-lg">
            <h2 className="text-2xl font-bold text-trust-dark mb-8 text-center">Trusted by Homeowners</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <Card className="border-0 shadow-none bg-transparent">
                <CardContent className="p-0">
                  <div className="flex items-center mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-trust-secondary italic mb-4">
                    &ldquo;Saved $450 on my property taxes this year. The process was incredibly simple and the analysis was spot-on accurate.&rdquo;
                  </p>
                  <div className="font-semibold text-trust-dark">Sarah M., Denver, CO</div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-none bg-transparent">
                <CardContent className="p-0">
                  <div className="flex items-center mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-trust-secondary italic mb-4">
                    &ldquo;I was shocked to find out I was overpaying by 12%. PropertyTaxAppeal made the appeal process straightforward.&rdquo;
                  </p>
                  <div className="font-semibold text-trust-dark">Michael R., Boulder, CO</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-trust-dark text-white py-12 mt-16">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Shield className="h-6 w-6" />
            <span className="text-lg font-semibold">PropertyTaxAppeal</span>
          </div>
          <p className="text-gray-300 mb-4">
            Helping homeowners save money on property taxes since 2024
          </p>
          <div className="flex justify-center space-x-6 text-sm text-gray-400">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
