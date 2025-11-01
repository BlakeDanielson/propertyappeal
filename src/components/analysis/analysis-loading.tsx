"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Loader2, MapPin, BarChart3, Calculator, CheckCircle, Shield } from "lucide-react";

interface AnalysisLoadingProps {
  onBack: () => void;
  onComplete: () => void;
}

export function AnalysisLoading({ onBack, onComplete }: AnalysisLoadingProps) {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    { icon: MapPin, text: "Fetching property data..." },
    { icon: BarChart3, text: "Comparing to market values..." },
    { icon: Calculator, text: "Calculating potential savings..." },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prevProgress) => {
        if (prevProgress >= 100) {
          clearInterval(interval);
          // Small delay before completing to show 100%
          setTimeout(() => {
            onComplete();
          }, 500);
          return 100;
        }

        // Update step based on progress
        const newStep = Math.floor((prevProgress + 10) / 33.3);
        setCurrentStep(Math.min(newStep, steps.length - 1));

        return prevProgress + 10;
      });
    }, 800); // Update every 800ms

    return () => clearInterval(interval);
  }, [onComplete, steps.length]);

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

      <main className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          {/* Title */}
          <h1 className="text-3xl font-bold text-trust-dark mb-8">
            Analyzing Your Property
          </h1>

          {/* Main Loading Card */}
          <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
            <CardContent className="p-8">
              {/* Loading Spinner */}
              <div className="flex justify-center mb-8">
                <div className="relative">
                  <Loader2 className="h-16 w-16 text-brand-primary animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-brand-primary">
                        {Math.round(progress)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-8">
                <Progress value={progress} className="h-3 mb-4" />
                <div className="text-sm text-trust-secondary">
                  Progress: {Math.round(progress)}%
                </div>
              </div>

              {/* Current Step */}
              <div className="mb-8">
                <div className="flex items-center justify-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-brand-primary/10 rounded-full flex items-center justify-center">
                    {React.createElement(steps[currentStep].icon, {
                      className: "h-6 w-6 text-brand-primary"
                    })}
                  </div>
                  <div className="text-left">
                    <div className="text-lg font-semibold text-trust-dark">
                      {steps[currentStep].text}
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Messages */}
              <div className="space-y-3 mb-8">
                {steps.map((step, index) => (
                  <div
                    key={index}
                    className={`flex items-center space-x-3 p-3 rounded-lg transition-all ${
                      index < currentStep
                        ? "bg-brand-success/10 text-brand-success"
                        : index === currentStep
                        ? "bg-brand-primary/10 text-brand-primary"
                        : "bg-gray-50 text-trust-muted"
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      index < currentStep
                        ? "bg-brand-success text-white"
                        : index === currentStep
                        ? "bg-brand-primary text-white"
                        : "bg-gray-200"
                    }`}>
                      {index < currentStep ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : index === currentStep ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <span className="text-xs font-medium">{index + 1}</span>
                      )}
                    </div>
                    <span className="text-sm">
                      {index < currentStep ? `${step.text} ✓` : step.text}
                    </span>
                  </div>
                ))}
              </div>

              {/* Time Estimate */}
              <div className="text-center">
                <p className="text-trust-secondary">
                  This usually takes <span className="font-medium">10-15 seconds</span>
                </p>
                <p className="text-sm text-trust-muted mt-2">
                  We&apos;re analyzing thousands of recent sales in your area
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

