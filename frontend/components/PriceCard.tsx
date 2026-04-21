"use client";

import { useState } from "react";
import type { PriceResponse } from "@/lib/types";

interface PriceCardProps {
  price: PriceResponse;
}

export default function PriceCard({ price }: PriceCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <article id="prices" className="rounded-2xl border border-stone-200 bg-white/90 p-6 shadow-md backdrop-blur-sm">
      <h3 className="font-display text-2xl text-agri-dark">
        Current Mandi Prices — {price.commodity} in {price.state}
      </h3>

      <div className="mt-5 space-y-3">
        <div className="flex items-center justify-between rounded-lg bg-grade-A/10 px-4 py-3">
          <span className="font-semibold text-grade-A">Grade A Estimate</span>
          <span className="font-bold text-grade-A">₹{price.grade_A_estimate}/quintal</span>
        </div>
        <div className="flex items-center justify-between rounded-lg bg-grade-B/10 px-4 py-3">
          <span className="font-semibold text-grade-B">Grade B Estimate</span>
          <span className="font-bold text-grade-B">₹{price.grade_B_estimate}/quintal</span>
        </div>
        <div className="flex items-center justify-between rounded-lg bg-grade-REJECT/10 px-4 py-3">
          <span className="font-semibold text-grade-REJECT">Grade C Estimate</span>
          <span className="font-bold text-grade-REJECT">₹{price.grade_C_estimate}/quintal</span>
        </div>
      </div>

      <button
        type="button"
        className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-agri-mid transition hover:text-agri-dark"
        onClick={() => setExpanded((prev) => !prev)}
      >
        {expanded ? "Hide Recent Records" : "Show Recent Records"}
        <span>{expanded ? "▲" : "▼"}</span>
      </button>

      {expanded ? (
        <div className="mt-4 overflow-x-auto rounded-xl border border-stone-200">
          <table className="min-w-full divide-y divide-stone-200 text-sm">
            <thead className="bg-stone-100">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-stone-700">Date</th>
                <th className="px-3 py-2 text-left font-semibold text-stone-700">Market</th>
                <th className="px-3 py-2 text-left font-semibold text-stone-700">Min</th>
                <th className="px-3 py-2 text-left font-semibold text-stone-700">Modal</th>
                <th className="px-3 py-2 text-left font-semibold text-stone-700">Max</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 bg-white">
              {price.records.map((record, index) => (
                <tr key={`${record.date}-${record.market}-${index}`}>
                  <td className="px-3 py-2">{record.date}</td>
                  <td className="px-3 py-2">{record.market}</td>
                  <td className="px-3 py-2">₹{record.min_price}</td>
                  <td className="px-3 py-2">₹{record.modal_price}</td>
                  <td className="px-3 py-2">₹{record.max_price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <p className="mt-4 text-xs text-stone-500">Prices sourced from Agmarknet via data.gov.in. Updated daily.</p>
    </article>
  );
}
