import { type ReactNode } from "react";
import { type MdSpan } from "./tokenize";

export function renderMarkdownSegment(
  text: string,
  segOffset: number,
  mdSpans: MdSpan[]
): ReactNode[] {
  const segEnd = segOffset + text.length;

  // Filter spans that overlap this segment
  const relevant = mdSpans.filter(
    (s) => s.start < segEnd && s.end > segOffset
  );

  if (relevant.length === 0) {
    return [text];
  }

  // Collect all boundary points within the segment range
  const boundaries = new Set<number>();
  boundaries.add(segOffset);
  boundaries.add(segEnd);

  for (const span of relevant) {
    if (span.start > segOffset && span.start < segEnd) {
      boundaries.add(span.start);
    }
    if (span.end > segOffset && span.end < segEnd) {
      boundaries.add(span.end);
    }
  }

  const sorted = Array.from(boundaries).sort((a, b) => a - b);
  const nodes: ReactNode[] = [];

  for (let i = 0; i < sorted.length - 1; i++) {
    const rangeStart = sorted[i];
    const rangeEnd = sorted[i + 1];

    // Find all classes that apply to this sub-range
    const classes: string[] = [];
    for (const span of relevant) {
      if (span.start <= rangeStart && span.end >= rangeEnd) {
        for (const cls of span.classes) {
          if (!classes.includes(cls)) {
            classes.push(cls);
          }
        }
      }
    }

    const substr = text.slice(rangeStart - segOffset, rangeEnd - segOffset);

    if (classes.length > 0) {
      nodes.push(
        <span key={i} className={classes.join(" ")}>
          {substr}
        </span>
      );
    } else {
      nodes.push(substr);
    }
  }

  return nodes;
}
