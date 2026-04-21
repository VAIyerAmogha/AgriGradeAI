"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import GradeResultCard from "@/components/GradeResultCard";
import ImageUploader from "@/components/ImageUploader";
import LoadingSpinner from "@/components/LoadingSpinner";
import PriceCard from "@/components/PriceCard";
import { fetchPrice, gradeImage } from "@/lib/api";
import { appendHistory, loadHistory } from "@/lib/history";
import type { GradeResponse, PriceResponse, UploadHistoryEntry } from "@/lib/types";

function formatTime(timestamp: string): string {
  return new Date(timestamp).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function UploadPage() {
  const [gradeResult, setGradeResult] = useState<GradeResponse | null>(null);
  const [priceResult, setPriceResult] = useState<PriceResponse | null>(null);
  const [isGrading, setIsGrading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<UploadHistoryEntry[]>([]);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  const recentUploads = useMemo(() => history.filter((entry) => entry.source === "upload").slice(0, 4), [history]);

  const handleGrade = async (file: File) => {
    setIsGrading(true);
    setGradeResult(null);
    setPriceResult(null);
    setError(null);

    try {
      const result = await gradeImage(file);
      setGradeResult(result);

      const mandiPrice = await fetchPrice(result.produce_name.toLowerCase(), "Karnataka");
      setPriceResult(mandiPrice);

      const entry: UploadHistoryEntry = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        source: "upload",
        fileName: file.name,
        produceName: result.produce_name,
        grade: result.grade,
        confidence: result.confidence,
        defectPercentage: result.defect_percentage,
        reason: result.reason,
        price: mandiPrice,
      };
      setHistory(appendHistory(entry));
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
        <div className="rounded-3xl border border-white/70 bg-white/80 p-8 shadow-lg backdrop-blur-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-agri-mid">Upload workspace</p>
          <h1 className="mt-2 font-display text-4xl text-agri-dark sm:text-5xl">Grade produce and save the result</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-stone-700">
            Drop in a fruit or vegetable image, get an explainable grade, fetch the corresponding mandi snapshot, and store the full run in the dashboard history.
          </p>

          <div className="mt-6 flex flex-wrap gap-3 text-sm font-semibold">
            <Link href="/" className="rounded-full border border-stone-300 px-5 py-3 text-stone-700 transition hover:border-agri-mid hover:text-agri-mid">
              Back to dashboard
            </Link>
            <Link href="/prices" className="rounded-full bg-agri-dark px-5 py-3 text-white transition hover:bg-agri-mid">
              Open price explorer
            </Link>
          </div>
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">
            {error}
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <ImageUploader onGrade={handleGrade} isLoading={isGrading} />

            {isGrading ? <LoadingSpinner message="Running image analysis and fetching mandi prices..." /> : null}

            {gradeResult ? <GradeResultCard result={gradeResult} /> : null}
            {priceResult ? <PriceCard price={priceResult} /> : null}
          </div>

          <aside className="space-y-6">

            <div className="rounded-3xl border border-stone-200 bg-white/90 p-6 shadow-md">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-agri-mid">Recent uploads</p>
              <div className="mt-4 space-y-3">
                {recentUploads.length ? (
                  recentUploads.map((entry) => (
                    <div key={entry.id} className="rounded-2xl bg-stone-50 px-4 py-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-agri-dark">{entry.fileName}</p>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${entry.grade === "REJECT" ? "bg-grade-REJECT/15 text-grade-REJECT" : "bg-agri-light/15 text-agri-dark"}`}>
                          {entry.grade}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-stone-500">{entry.produceName} · {entry.defectPercentage.toFixed(1)}% defect · {formatTime(entry.timestamp)}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-stone-500">No uploads saved yet. Your history will appear here after the first successful grade.</p>
                )}
              </div>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}