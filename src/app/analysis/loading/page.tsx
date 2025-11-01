"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnalysisLoading } from "@/components/analysis/analysis-loading";

function LoadingPageContent() {
  const router = useRouter();

  const handleBack = () => {
    router.push('/');
  };

  const handleComplete = () => {
    // Navigate to results page - data is already stored in sessionStorage
    router.push('/analysis/results');
  };

  return (
    <AnalysisLoading
      onBack={handleBack}
      onComplete={handleComplete}
    />
  );
}

export default function LoadingPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoadingPageContent />
    </Suspense>
  );
}
