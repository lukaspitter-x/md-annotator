export type AnnotationType = "edit" | "ask" | "keep" | "del" | "note";

export interface Annotation {
  id: string;
  type: AnnotationType;
  selectionStart: number;
  selectionEnd: number;
  selectedTextSnapshot: string;
  comment: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentSession {
  markdown: string;
  annotations: Annotation[];
  updatedAt: string;
}

export const ANNOTATION_TYPE_LABELS: Record<AnnotationType, string> = {
  edit: "Edit",
  ask: "Ask",
  keep: "Keep",
  del: "Delete",
  note: "Note",
};

export const ANNOTATION_TYPE_DESCRIPTIONS: Record<AnnotationType, string> = {
  edit: "Request a change to this text",
  ask: "Ask a question about this text",
  keep: "Mark this text as must not change",
  del: "Request deletion of this text",
  note: "Add a note about this text",
};
