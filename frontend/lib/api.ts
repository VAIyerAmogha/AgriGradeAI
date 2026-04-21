import type { GradeResponse, PriceResponse } from "@/lib/types";

const BASE_URL = "http://localhost:8000/api";

async function parseError(response: Response, fallback: string): Promise<string> {
  try {
    const data = (await response.json()) as { detail?: string; error?: string };
    return data.detail ?? data.error ?? fallback;
  } catch {
    return fallback;
  }
}

export async function gradeImage(file: File): Promise<GradeResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${BASE_URL}/grade`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const message = await parseError(response, "Failed to grade image");
    throw new Error(`Grade API error: ${message}`);
  }

  return (await response.json()) as GradeResponse;
}

export async function fetchPrice(commodity: string, state: string = "Karnataka"): Promise<PriceResponse> {
  const params = new URLSearchParams({ commodity, state });
  const response = await fetch(`${BASE_URL}/price?${params.toString()}`);

  if (!response.ok) {
    const message = await parseError(response, "Failed to fetch mandi prices");
    throw new Error(`Price API error: ${message}`);
  }

  return (await response.json()) as PriceResponse;
}
