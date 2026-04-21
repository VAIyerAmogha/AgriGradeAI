import type { UploadHistoryEntry } from "@/lib/types";

const STORAGE_KEY = "agrigrade-ai:upload-history";

export function loadHistory(): UploadHistoryEntry[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored) as UploadHistoryEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveHistory(entries: UploadHistoryEntry[]): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function appendHistory(entry: UploadHistoryEntry): UploadHistoryEntry[] {
  const nextEntries = [entry, ...loadHistory()].slice(0, 50);
  saveHistory(nextEntries);
  return nextEntries;
}

export function clearHistory(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
}