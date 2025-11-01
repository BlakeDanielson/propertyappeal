"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnalysisResults } from "@/components/analysis/analysis-results";
import { ComparableSalesDialog } from "@/components/analysis/comparable-sales-dialog";
import { PropertyAnalysis } from "@/external/RentCastTypes";

function ResultsPageContent() {
  const router = useRouter();
  const [analysisData, setAnalysisData] = useState<PropertyAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [showComparablesDialog, setShowComparablesDialog] = useState(false);

  useEffect(() => {
    // Get analysis data from sessionStorage
    const storedData = sessionStorage.getItem('analysisData');
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        
        // Convert date strings back to Date objects
        if (parsedData.confidence?.lastUpdated) {
          parsedData.confidence.lastUpdated = new Date(parsedData.confidence.lastUpdated);
        }
        if (parsedData.comparables) {
          parsedData.comparables = parsedData.comparables.map((comp: any) => ({
            ...comp,
            saleDate: comp.saleDate ? new Date(comp.saleDate) : new Date(),
          }));
        }
        if (parsedData.property?.assessmentDate) {
          parsedData.property.assessmentDate = new Date(parsedData.property.assessmentDate);
        }
        
        setAnalysisData(parsedData as PropertyAnalysis);
      } catch (error) {
        console.error('Error parsing analysis data:', error);
        router.push('/');
        return;
      }
    } else {
      // No data found, redirect to home
      router.push('/');
      return;
    }
    setLoading(false);
  }, [router]);

  if (loading || !analysisData) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const handleBack = () => {
    router.push('/');
  };

  const handleCreateAccount = () => {
    // TODO: Navigate to account creation
    alert('Account creation flow would start here');
  };

  const handleViewComparables = () => {
    setShowComparablesDialog(true);
  };

  return (
    <>
      <AnalysisResults
        analysis={analysisData}
        onBack={handleBack}
        onCreateAccount={handleCreateAccount}
        onViewComparables={handleViewComparables}
      />
      {analysisData && (
        <ComparableSalesDialog
          open={showComparablesDialog}
          onOpenChange={setShowComparablesDialog}
          analysis={analysisData}
        />
      )}
    </>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResultsPageContent />
    </Suspense>
  );
}
