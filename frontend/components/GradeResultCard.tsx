import type { GradeResponse } from "@/lib/types";
import ScoreBar from "@/components/ScoreBar";

interface GradeResultCardProps {
  result: GradeResponse;
}

const badgeMap: Record<GradeResponse["grade"], { color: string; label: string }> = {
  A: { color: "bg-grade-A", label: "Premium Quality" },
  B: { color: "bg-grade-B", label: "Standard Quality" },
  C: { color: "bg-grade-C", label: "Processing Grade" },
  REJECT: { color: "bg-grade-REJECT", label: "Not Market Ready" },
};

export default function GradeResultCard({ result }: GradeResultCardProps) {
  const badge = badgeMap[result.grade];

  return (
    <article className="rounded-2xl border border-stone-200 bg-white/90 p-6 shadow-md backdrop-blur-sm">
      {result.uncertain ? (
        <div className="mb-4 rounded-lg border border-yellow-300 bg-yellow-50 px-3 py-2 text-sm text-yellow-700">
          ⚠️ Low confidence — result may need manual verification
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-2xl text-agri-dark">{result.produce_name}</h2>
        <p className="text-sm text-stone-600">{Math.round(result.confidence * 100)}% confident</p>
      </div>

      <div className="my-6 flex items-center justify-center">
        <div className={`min-w-52 rounded-2xl px-8 py-6 text-center text-white ${badge.color}`}>
          <p className="text-4xl font-extrabold tracking-wide">{result.grade}</p>
          <p className="mt-1 text-sm font-semibold uppercase tracking-wide">{badge.label}</p>
        </div>
      </div>

      <div className="space-y-4">
        <ScoreBar label="Defect Coverage" value={result.defect_percentage} max={100} invert />
        <ScoreBar label="Color Score" value={result.color_score} />
        <ScoreBar label="Texture Score" value={result.texture_score} />
        <ScoreBar label="Shape Score" value={result.shape_score} />
      </div>

      <div className="mt-5 rounded-lg bg-stone-100 p-3 text-sm text-stone-700">{result.reason}</div>
    </article>
  );
}
