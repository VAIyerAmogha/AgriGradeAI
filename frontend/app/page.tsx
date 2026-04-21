"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { clearHistory, loadHistory } from "@/lib/history";
import type { UploadHistoryEntry } from "@/lib/types";

function formatTime(timestamp: string): string {
  return new Date(timestamp).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatGradeLabel(grade: UploadHistoryEntry["grade"]): string {
  if (grade === "REJECT") {
    return "Rejected";
  }
  return `Grade ${grade}`;
}

export default function DashboardPage() {
  const [history, setHistory] = useState<UploadHistoryEntry[]>([]);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  useEffect(() => {
    const handleStorage = () => setHistory(loadHistory());
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const stats = useMemo(() => {
    const uploads = history.filter((entry) => entry.source === "upload");
    const priceLookups = history.filter((entry) => entry.source === "price");
    const rejects = history.filter((entry) => entry.grade === "REJECT").length;
    const averageDefect = history.length
      ? history.reduce((total, entry) => total + entry.defectPercentage, 0) / history.length
      : 0;
    const averageConfidence = history.length
      ? history.reduce((total, entry) => total + entry.confidence, 0) / history.length
      : 0;

    return {
      uploads: uploads.length,
      priceLookups: priceLookups.length,
      rejects,
      averageDefect,
      averageConfidence,
      latestProduce: history[0]?.produceName ?? "No uploads yet",
    };
  }, [history]);

  const latestEntries = history.slice(0, 6);

  const handleClearHistory = () => {
    clearHistory();
    setHistory([]);
  };

  return (
    <div className="relative min-h-screen overflow-hidden px-4 pb-16 pt-10 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(82,183,136,0.22),transparent_45%),radial-gradient(circle_at_80%_5%,rgba(45,106,79,0.2),transparent_42%),linear-gradient(180deg,#fbf9f4_0%,#f2efe6_100%)]" />

      <section className="mx-auto max-w-6xl space-y-8">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-white/70 bg-white/80 p-8 shadow-lg backdrop-blur-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-agri-mid">Dashboard</p>
            <h1 className="mt-2 font-display text-4xl text-agri-dark sm:text-5xl">AgriGrade AI command center</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-stone-700">
              Track every upload, review the latest grading activity, and jump straight into produce grading or mandi price exploration.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/upload" className="rounded-full bg-agri-dark px-5 py-3 text-sm font-semibold text-white transition hover:bg-agri-mid">
                Upload produce
              </Link>
              <Link href="/prices" className="rounded-full border border-agri-mid px-5 py-3 text-sm font-semibold text-agri-dark transition hover:bg-agri-light/10">
                Explore mandi prices
              </Link>
              <button
                type="button"
                onClick={handleClearHistory}
                className="rounded-full border border-stone-300 px-5 py-3 text-sm font-semibold text-stone-600 transition hover:border-stone-400 hover:text-stone-800"
              >
                Clear history
              </button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-2xl border border-stone-200 bg-white/90 p-5 shadow-sm">
              <p className="text-sm font-medium text-stone-500">Latest produce</p>
              <p className="mt-2 font-display text-2xl text-agri-dark">{stats.latestProduce}</p>
              <p className="mt-1 text-sm text-stone-600">Most recent upload or price lookup.</p>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-white/90 p-5 shadow-sm">
              <p className="text-sm font-medium text-stone-500">Activity split</p>
              <p className="mt-2 text-3xl font-bold text-agri-dark">{stats.uploads + stats.priceLookups}</p>
              <p className="mt-1 text-sm text-stone-600">{stats.uploads} uploads · {stats.priceLookups} price lookups</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-stone-200 bg-white/90 p-5 shadow-sm">
            <p className="text-sm text-stone-500">Uploads</p>
            <p className="mt-2 text-3xl font-bold text-agri-dark">{stats.uploads}</p>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-white/90 p-5 shadow-sm">
            <p className="text-sm text-stone-500">Price lookups</p>
            <p className="mt-2 text-3xl font-bold text-agri-dark">{stats.priceLookups}</p>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-white/90 p-5 shadow-sm">
            <p className="text-sm text-stone-500">Auto rejects</p>
            <p className="mt-2 text-3xl font-bold text-grade-REJECT">{stats.rejects}</p>
            <p className="mt-1 text-xs text-stone-500">Rejected when defect coverage exceeds 15%.</p>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-white/90 p-5 shadow-sm">
            <p className="text-sm text-stone-500">Avg. defect coverage</p>
            <p className="mt-2 text-3xl font-bold text-agri-dark">{stats.averageDefect.toFixed(1)}%</p>
            <p className="mt-1 text-xs text-stone-500">Avg. confidence: {(stats.averageConfidence * 100).toFixed(0)}%</p>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <div className="rounded-3xl border border-stone-200 bg-white/90 p-6 shadow-md">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-agri-mid">Recent activity</p>
                <h2 className="mt-1 font-display text-2xl text-agri-dark">Uploads and market lookups</h2>
              </div>
              <p className="text-sm text-stone-500">Stored locally in this browser</p>
            </div>

            <div className="mt-5 space-y-4">
              {latestEntries.length ? (
                latestEntries.map((entry) => (
                  <div key={entry.id} className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-agri-dark">{entry.fileName}</p>
                        <p className="text-sm text-stone-500">{formatTime(entry.timestamp)} · {entry.source === "upload" ? "Upload" : "Price lookup"}</p>
                      </div>
                      <div className={`rounded-full px-3 py-1 text-xs font-semibold ${entry.grade === "REJECT" ? "bg-grade-REJECT/15 text-grade-REJECT" : "bg-agri-light/15 text-agri-dark"}`}>
                        {formatGradeLabel(entry.grade)}
                      </div>
                    </div>

                    <div className="mt-3 grid gap-2 text-sm text-stone-700 sm:grid-cols-2">
                      <p><span className="font-medium text-stone-500">Produce:</span> {entry.produceName}</p>
                      <p><span className="font-medium text-stone-500">Defect:</span> {entry.defectPercentage.toFixed(1)}%</p>
                      <p><span className="font-medium text-stone-500">Confidence:</span> {(entry.confidence * 100).toFixed(0)}%</p>
                      {entry.price ? (
                        <p><span className="font-medium text-stone-500">State:</span> {entry.price.state}</p>
                      ) : null}
                    </div>

                    <p className="mt-3 text-sm leading-6 text-stone-600">{entry.reason}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-6 py-10 text-center text-stone-600">
                  No history yet. Upload produce to start tracking grades and mandi prices.
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl border border-stone-200 bg-white/90 p-6 shadow-md">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-agri-mid">What this app does</p>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-stone-700">
                <li>• Grades produce from an uploaded image using the ONNX model in the backend.</li>
                <li>• Rejects lots automatically when defect coverage is above 15%.</li>
                <li>• Pulls mandi prices from data.gov.in and falls back to an average if Karnataka is unavailable.</li>
                <li>• Stores usage history locally so you can review past uploads and lookups.</li>
              </ul>
            </div>

            <div className="rounded-3xl border border-stone-200 bg-agri-dark p-6 text-white shadow-md">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/80">Quick links</p>
              <div className="mt-4 space-y-3">
                <Link href="/upload" className="block rounded-2xl bg-white/10 px-4 py-3 transition hover:bg-white/15">
                  Open the upload workspace
                </Link>
                <Link href="/prices" className="block rounded-2xl bg-white/10 px-4 py-3 transition hover:bg-white/15">
                  Browse mandi prices by commodity
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}