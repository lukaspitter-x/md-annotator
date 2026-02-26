import { Annotation } from "./types";

export interface MismatchResult {
  annotation: Annotation;
  currentText: string;
}

export function validateAnchors(
  markdown: string,
  annotations: Annotation[]
): MismatchResult[] {
  const mismatches: MismatchResult[] = [];

  for (const ann of annotations) {
    const currentText = markdown.slice(ann.selectionStart, ann.selectionEnd);
    if (currentText !== ann.selectedTextSnapshot) {
      mismatches.push({ annotation: ann, currentText });
    }
  }

  return mismatches;
}
