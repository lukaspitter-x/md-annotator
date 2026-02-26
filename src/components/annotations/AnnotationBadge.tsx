"use client";

import { Badge } from "@/components/ui/badge";
import { AnnotationType, ANNOTATION_TYPE_LABELS } from "@/lib/annotations/types";

const typeStyles: Record<AnnotationType, string> = {
  edit: "bg-neutral-200 text-neutral-800",
  ask: "bg-neutral-300 text-neutral-900",
  keep: "bg-neutral-100 text-neutral-700 border border-neutral-300",
  del: "bg-neutral-400 text-neutral-950",
  note: "bg-neutral-150 text-neutral-700",
};

export function AnnotationBadge({ type }: { type: AnnotationType }) {
  return (
    <Badge variant="secondary" className={`text-xs font-mono ${typeStyles[type] || ""}`}>
      {ANNOTATION_TYPE_LABELS[type]}
    </Badge>
  );
}
