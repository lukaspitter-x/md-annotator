import { Annotation } from "./types";

export function hasOverlap(
  start: number,
  end: number,
  annotations: Annotation[],
  excludeId?: string
): boolean {
  return annotations.some(
    (a) =>
      a.id !== excludeId && start < a.selectionEnd && end > a.selectionStart
  );
}
