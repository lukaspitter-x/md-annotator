import { Annotation, AnnotationType } from "./types";

export interface Segment {
  text: string;
  offset: number;
  annotation?: Annotation;
}

export function buildSegments(
  markdown: string,
  annotations: Annotation[]
): Segment[] {
  if (annotations.length === 0) {
    return [{ text: markdown, offset: 0 }];
  }

  const sorted = [...annotations].sort(
    (a, b) => a.selectionStart - b.selectionStart
  );

  const segments: Segment[] = [];
  let cursor = 0;

  for (const ann of sorted) {
    // Plain text before this annotation
    if (ann.selectionStart > cursor) {
      segments.push({ text: markdown.slice(cursor, ann.selectionStart), offset: cursor });
    }
    // Annotated segment
    segments.push({
      text: markdown.slice(ann.selectionStart, ann.selectionEnd),
      offset: ann.selectionStart,
      annotation: ann,
    });
    cursor = ann.selectionEnd;
  }

  // Remaining plain text
  if (cursor < markdown.length) {
    segments.push({ text: markdown.slice(cursor), offset: cursor });
  }

  return segments;
}

export const annotationTypeClass: Record<AnnotationType, string> = {
  edit: "ann-edit",
  ask: "ann-ask",
  keep: "ann-keep",
  del: "ann-del",
  note: "ann-note",
};
