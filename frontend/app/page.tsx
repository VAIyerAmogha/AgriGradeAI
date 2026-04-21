"use client";

import { useState } from "react";
import GradeResultCard from "@/components/GradeResultCard";
import ImageUploader from "@/components/ImageUploader";
import LoadingSpinner from "@/components/LoadingSpinner";
import PriceCard from "@/components/PriceCard";
import { fetchPrice, gradeImage } from "@/lib/api";
import type { GradeResponse, PriceResponse } from "@/lib/types";

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [gradeResult, setGradeResult] = useState<GradeResponse | null>(null);
  const [priceResult, setPriceResult] = useState<PriceResponse | null>(null);
  const [isGrading, setIsGrading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGrade = async (file: File) => {
    setSelectedFile(file);
    setIsGrading(true);
    setGradeResult(null);
    setPriceResult(null);
    setError(null);

    try {
      const result = await gradeImage(file);
      setGradeResult(result);

      const mandiPrice = await fetchPrice(result.produce_name.toLowerCase(), "Karnataka");
      setPriceResult(mandiPrice);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong while grading.";
      setError(message);
    } finally {
      setIsGrading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden px-4 pb-16 pt-10 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(82,183,136,0.22),transparent_45%),radial-gradient(circle_at_80%_5%,rgba(45,106,79,0.2),transparent_42%),linear-gradient(180deg,#fbf9f4_0%,#f2efe6_100%)]" />

      <section className="mx-auto max-w-6xl space-y-8">
        <header className="space-y-2 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-agri-mid">Independent mandi-grade intelligence</p>
          <h1 className="font-display text-4xl text-agri-dark sm:text-5xl">Grade your produce in seconds</h1>
          <p className="mx-auto max-w-2xl text-base text-stone-700 sm:text-lg">
            Upload a produce photo to get an explainable quality grade and a live mandi price snapshot from Agmarknet.
          </p>
          {selectedFile ? (
            <p className="text-sm text-stone-600">Selected: {selectedFile.name}</p>
          ) : null}
        </header>

        <ImageUploader onGrade={handleGrade} isLoading={isGrading} />

        {isGrading ? <LoadingSpinner message="Analyzing quality and fetching mandi prices..." /> : null}

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">
            {error}
          </div>
        ) : null}

        <div className="space-y-6 transition-all duration-500 ease-out animate-fade-in">
          {gradeResult ? <GradeResultCard result={gradeResult} /> : null}

          <section id="prices" className="scroll-mt-24">
            {priceResult ? (
              <PriceCard price={priceResult} />
            ) : (
              <div className="rounded-2xl border border-stone-200 bg-white/70 p-6 text-center text-stone-600 shadow-sm">
                Mandi prices will appear here after grading a produce image.
              </div>
            )}
          </section>
        </div>
      </section>
    </div>
  );
}
