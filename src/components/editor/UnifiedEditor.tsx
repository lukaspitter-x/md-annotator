"use client";

import { forwardRef, useCallback, useMemo, useRef } from "react";
import { Annotation } from "@/lib/annotations/types";
import { buildSegments, annotationTypeClass } from "@/lib/annotations/segments";
import { tokenizeMarkdown } from "@/lib/markdown/tokenize";
import { renderMarkdownSegment } from "@/lib/markdown/render";

interface UnifiedEditorProps {
  value: string;
  onChange: (value: string) => void;
  annotations: Annotation[];
  onAnnotationClick: (annotation: Annotation) => void;
}

export const UnifiedEditor = forwardRef<HTMLTextAreaElement, UnifiedEditorProps>(
  function UnifiedEditor({ value, onChange, annotations, onAnnotationClick }, ref) {
    const internalRef = useRef<HTMLTextAreaElement>(null);
    const backdropRef = useRef<HTMLDivElement>(null);
    const scrollRAF = useRef<number>(0);

    // Combine forwarded ref with internal ref
    const setRefs = useCallback(
      (node: HTMLTextAreaElement | null) => {
        internalRef.current = node;
        if (typeof ref === "function") {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      },
      [ref]
    );

    const segments = useMemo(
      () => buildSegments(value, annotations),
      [value, annotations]
    );

    const mdSpans = useMemo(
      () => tokenizeMarkdown(value),
      [value]
    );

    const handleScroll = useCallback(() => {
      cancelAnimationFrame(scrollRAF.current);
      scrollRAF.current = requestAnimationFrame(() => {
        const textarea = internalRef.current;
        const backdrop = backdropRef.current;
        if (textarea && backdrop) {
          backdrop.scrollTop = textarea.scrollTop;
          backdrop.scrollLeft = textarea.scrollLeft;
        }
      });
    }, []);

    const handleClick = useCallback(() => {
      const textarea = internalRef.current;
      if (!textarea) return;

      // Only trigger if cursor is placed (no text selected)
      const { selectionStart, selectionEnd } = textarea;
      if (selectionStart !== selectionEnd) return;

      const clickedAnnotation = annotations.find(
        (ann) =>
          selectionStart >= ann.selectionStart &&
          selectionStart < ann.selectionEnd
      );

      if (clickedAnnotation) {
        onAnnotationClick(clickedAnnotation);
      }
    }, [annotations, onAnnotationClick]);

    return (
      <div className="unified-editor-wrapper">
        {value.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-8 z-10">
            <p className="text-muted-foreground text-center text-sm">
              Paste your Markdown here to get started
            </p>
          </div>
        )}

        {/* Backdrop: styled text with annotation highlights */}
        <div
          ref={backdropRef}
          className="unified-editor-backdrop"
          aria-hidden="true"
        >
          {segments.map((seg, i) => {
            const content = renderMarkdownSegment(seg.text, seg.offset, mdSpans);
            if (!seg.annotation) {
              return <span key={i}>{content}</span>;
            }
            return (
              <span
                key={i}
                className={annotationTypeClass[seg.annotation.type]}
              >
                {content}
              </span>
            );
          })}
        </div>

        {/* Textarea: transparent text on top, captures all input */}
        <textarea
          ref={setRefs}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onScroll={handleScroll}
          onClick={handleClick}
          className="unified-editor-textarea"
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          autoComplete="off"
        />
      </div>
    );
  }
);
