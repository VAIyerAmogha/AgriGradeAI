"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import PriceCard from "@/components/PriceCard";
import LoadingSpinner from "@/components/LoadingSpinner";
import { fetchPrice } from "@/lib/api";
import { appendHistory, loadHistory } from "@/lib/history";
import type { PriceResponse, UploadHistoryEntry } from "@/lib/types";

const commodityOptions = ["tomato", "mango", "potato", "apple", "banana", "onion", "grapes"];
const stateOptions = [
  "Karnataka",
  "Maharashtra",
  "Tamil Nadu",
  "Andhra Pradesh",
  "Telangana",
  "Kerala",
  "Gujarat",
  "Uttar Pradesh",
  "Rajasthan",
  "Madhya Pradesh",
];

function formatTime(timestamp: string): string {
  return new Date(timestamp).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function PricesPage() {
  const [commodity, setCommodity] = useState("tomato");
  const [state, setState] = useState("Karnataka");
  const [priceResult, setPriceResult] = useState<PriceResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<UploadHistoryEntry[]>([]);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  const recentPriceViews = useMemo(
    () => history.filter((entry) => entry.source === "price" && entry.price).slice(0, 6),
    [history],
  );

  const runLookup = async (nextCommodity: string = commodity, nextState: string = state) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchPrice(nextCommodity, nextState);
      setPriceResult(result);

      const entry: UploadHistoryEntry = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        source: "price",
        fileName: `${result.commodity} price lookup`,
        produceName: result.commodity,
        grade: "B",
        confidence: 1,
        defectPercentage: 0,
        reason: `Loaded mandi pricing for ${result.commodity} in ${result.state}.`,
        price: result,
      };
      setHistory(appendHistory(entry));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to fetch mandi prices right now.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void runLookup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void runLookup(commodity, state);
  };

  return (
    <div className="relative min-h-screen overflow-hidden px-4 pb-16 pt-10 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(82,183,136,0.22),transparent_45%),radial-gradient(circle_at_80%_5%,rgba(45,106,79,0.2),transparent_42%),linear-gradient(180deg,#fbf9f4_0%,#f2efe6_100%)]" />

      <section className="mx-auto max-w-6xl space-y-8">
        <div className="rounded-3xl border border-white/70 bg-white/80 p-8 shadow-lg backdrop-blur-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-agri-mid">Mandi price explorer</p>
          <h1 className="mt-2 font-display text-4xl text-agri-dark sm:text-5xl">Compare live mandi prices</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-stone-700">
            Search a commodity and state, inspect the latest records, and keep a running price history alongside your grading workflow.
          </p>

          <div className="mt-6 flex flex-wrap gap-3 text-sm font-semibold">
            <Link href="/" className="rounded-full border border-stone-300 px-5 py-3 text-stone-700 transition hover:border-agri-mid hover:text-agri-mid">
              Back to dashboard
            </Link>
            <Link href="/upload" className="rounded-full bg-agri-dark px-5 py-3 text-white transition hover:bg-agri-mid">
              Go to upload workspace
            </Link>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-6">
            <form onSubmit={handleSubmit} className="rounded-3xl border border-stone-200 bg-white/90 p-6 shadow-md">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-agri-mid">Search controls</p>
              <div className="mt-5 grid gap-4">
                <label className="space-y-2 text-sm font-medium text-stone-700">
                  Commodity
                  <select
                    value={commodity}
                    onChange={(event) => setCommodity(event.target.value)}
                    className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-800 outline-none transition focus:border-agri-mid"
                  >
                    {commodityOptions.map((option) => (
                      <option key={option} value={option}>
                        {option.charAt(0).toUpperCase() + option.slice(1)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2 text-sm font-medium text-stone-700">
                  State
                  <select
                    value={state}
                    onChange={(event) => setState(event.target.value)}
                    className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-800 outline-none transition focus:border-agri-mid"
                  >
                    {stateOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex items-center justify-center rounded-full bg-agri-dark px-5 py-3 text-sm font-semibold text-white transition hover:bg-agri-mid disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isLoading ? "Fetching prices..." : "Fetch mandi prices"}
                </button>
              </div>
            </form>

            <div className="rounded-3xl border border-stone-200 bg-white/90 p-6 shadow-md">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-agri-mid">Recent price views</p>
              <div className="mt-4 space-y-3">
                {recentPriceViews.length ? (
                  recentPriceViews.map((entry) => (
                    <div key={entry.id} className="rounded-2xl bg-stone-50 px-4 py-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-agri-dark">{entry.produceName}</p>
                        <p className="text-xs text-stone-500">{formatTime(entry.timestamp)}</p>
                      </div>
                      <p className="mt-1 text-sm text-stone-600">{entry.price?.state} · A {entry.price?.grade_A_estimate} · B {entry.price?.grade_B_estimate} · C {entry.price?.grade_C_estimate}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-stone-500">No saved price lookups yet.</p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">
                {error}
              </div>
            ) : null}

            {isLoading ? <LoadingSpinner message="Loading mandi data and recent records..." /> : null}

            {priceResult ? <PriceCard price={priceResult} /> : null}

            <div className="rounded-3xl border border-stone-200 bg-white/90 p-6 shadow-md">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-agri-mid">Notes</p>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-stone-700">
                <li>• Karnataka is tried first. If no Karnataka records exist, the app falls back to the average across available mandi prices.</li>
                <li>• The raw response table shows the latest records returned by the API.
                </li>
                <li>• Recent price lookups are stored locally in this browser for quick revisits.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}