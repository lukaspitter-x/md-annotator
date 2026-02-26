import { Annotation } from "./types";

export function generateAnnotatedMarkdown(
  markdown: string,
  annotations: Annotation[]
): string {
  if (annotations.length === 0) return markdown;

  // Process in reverse offset order to avoid shifting
  const sorted = [...annotations].sort(
    (a, b) => b.selectionStart - a.selectionStart
  );
  let result = markdown;
  for (const ann of sorted) {
    result =
      result.slice(0, ann.selectionEnd) +
      `<</ANN>>` +
      result.slice(ann.selectionEnd);
    result =
      result.slice(0, ann.selectionStart) +
      `<<ANN:id=${ann.id} type=${ann.type}>>` +
      result.slice(ann.selectionStart);
  }
  return result;
}

export function generateAnnotationIndex(annotations: Annotation[]): string {
  const sorted = [...annotations].sort(
    (a, b) => a.selectionStart - b.selectionStart
  );
  const entries = sorted.map((ann) => ({
    id: ann.id,
    type: ann.type,
    selectedText: ann.selectedTextSnapshot,
    comment: ann.comment,
  }));
  return `<!-- CLAUDE_ANNOTATION_INDEX_START\n${JSON.stringify(entries, null, 2)}\nCLAUDE_ANNOTATION_INDEX_END -->`;
}

export function generateClaudeInstructions(): string {
  return `# Claude Code Instructions for Annotated Markdown

You are given a Markdown document with inline annotation markers:
- \`<<ANN:id=... type=...>>\` ... \`<</ANN>>\`

There is also an annotation index in a comment block.

Please follow this process exactly:

1. Parse all annotations and summarize them as proposed edits/questions.
2. FIRST show your suggested solutions for each annotation (grouped by annotation ID).
3. Do NOT rewrite the original document yet.
4. Wait for my approval or discussion.
5. After approval, rewrite the original Markdown document (without annotation markers unless I ask to keep them).
6. Finally, show a diff against the original document.
7. Respect all \`type=keep\` annotations as hard constraints.
8. For \`type=ask\`, propose options and recommend one.
9. For \`type=del\`, propose removal and note any surrounding text that may need adjustment.
10. For \`type=note\`, acknowledge the note but no change is needed unless the note implies one.

When suggesting changes, preserve Markdown structure and formatting.`;
}

export function generateFullPayload(
  markdown: string,
  annotations: Annotation[],
  options: {
    instructionsPosition: "top" | "bottom";
    includeIndex: boolean;
  } = { instructionsPosition: "top", includeIndex: true }
): string {
  const instructions = generateClaudeInstructions();
  const annotatedMd = generateAnnotatedMarkdown(markdown, annotations);
  const index = options.includeIndex
    ? generateAnnotationIndex(annotations)
    : "";

  const parts: string[] = [];

  if (options.instructionsPosition === "top") {
    parts.push(instructions);
    parts.push("---\n");
  }

  parts.push("# Annotated Document\n");
  parts.push(annotatedMd);

  if (index) {
    parts.push("\n\n---\n");
    parts.push(index);
  }

  if (options.instructionsPosition === "bottom") {
    parts.push("\n\n---\n");
    parts.push(instructions);
  }

  return parts.join("\n");
}
