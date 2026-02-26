import { DocumentSession } from "@/lib/annotations/types";

const STORAGE_KEY = "md-annotator-session";

export function loadSession(): DocumentSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DocumentSession;
  } catch {
    return null;
  }
}

export function saveSession(session: DocumentSession): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Safari private browsing may throw
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
