"use client";

import { useRef, useState, useCallback, useMemo } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { UnifiedEditor } from "@/components/editor/UnifiedEditor";
import { SelectionToolbar } from "@/components/editor/SelectionToolbar";
import { AnnotationSheet } from "@/components/annotations/AnnotationSheet";
import { AnnotationListSheet } from "@/components/annotations/AnnotationListSheet";
import { ExportDrawer } from "@/components/export/ExportDrawer";
import { useDocumentSession } from "@/lib/hooks/useDocumentSession";
import { useSelection } from "@/lib/hooks/useSelection";
import { validateAnchors } from "@/lib/annotations/validation";
import { Annotation, AnnotationType } from "@/lib/annotations/types";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Home() {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const {
    session,
    loaded,
    setMarkdown,
    addAnnotation,
    updateAnnotation,
    deleteAnnotation,
    clearAll,
  } = useDocumentSession();
  const { selection, clearSelection } = useSelection(textareaRef);

  const [annotationSheetOpen, setAnnotationSheetOpen] = useState(false);
  const [annotationListOpen, setAnnotationListOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [editingAnnotation, setEditingAnnotation] = useState<Annotation | null>(
    null
  );
  const [pendingSelection, setPendingSelection] = useState<{
    start: number;
    end: number;
    text: string;
  } | null>(null);

  // Reactively check for annotation mismatches
  const mismatches = useMemo(
    () => validateAnchors(session.markdown, session.annotations),
    [session.markdown, session.annotations]
  );

  const handleAnnotate = useCallback(() => {
    if (!selection) return;
    setPendingSelection({
      start: selection.start,
      end: selection.end,
      text: selection.text,
    });
    setEditingAnnotation(null);
    setAnnotationSheetOpen(true);
    clearSelection();
  }, [selection, clearSelection]);

  const handleSaveAnnotation = useCallback(
    (type: AnnotationType, comment: string) => {
      if (editingAnnotation) {
        updateAnnotation(editingAnnotation.id, { type, comment });
        toast.success("Annotation updated");
      } else if (pendingSelection) {
        const result = addAnnotation(
          pendingSelection.start,
          pendingSelection.end,
          type,
          comment
        );
        if (result.success) {
          toast.success("Annotation added");
        } else {
          toast.error(result.error || "Failed to add annotation");
        }
      }
      setPendingSelection(null);
      setEditingAnnotation(null);
    },
    [editingAnnotation, pendingSelection, addAnnotation, updateAnnotation]
  );

  const handleDeleteAnnotation = useCallback(
    (id?: string) => {
      const targetId = id || editingAnnotation?.id;
      if (targetId) {
        deleteAnnotation(targetId);
        toast.success("Annotation deleted");
        setAnnotationSheetOpen(false);
        setEditingAnnotation(null);
      }
    },
    [editingAnnotation, deleteAnnotation]
  );

  const sortedAnnotations = useMemo(
    () => [...session.annotations].sort((a, b) => a.selectionStart - b.selectionStart),
    [session.annotations]
  );

  const scrollTextareaTo = useCallback((textarea: HTMLTextAreaElement, position: number) => {
    // Measure where the position falls by using a hidden mirror div
    const mirror = document.createElement("div");
    const style = getComputedStyle(textarea);
    mirror.style.cssText = [
      "position:absolute",
      "visibility:hidden",
      "white-space:pre-wrap",
      "word-wrap:break-word",
      `width:${textarea.clientWidth}px`,
      `font:${style.font}`,
      `padding:${style.padding}`,
      `line-height:${style.lineHeight}`,
      `letter-spacing:${style.letterSpacing}`,
    ].join(";");
    mirror.textContent = textarea.value.substring(0, position);
    document.body.appendChild(mirror);
    const targetY = mirror.scrollHeight;
    document.body.removeChild(mirror);

    // Scroll so the annotation is roughly 1/3 from the top
    textarea.scrollTop = Math.max(0, targetY - textarea.clientHeight / 3);
  }, []);

  const handleEditAnnotation = useCallback((ann: Annotation) => {
    setEditingAnnotation(ann);
    setPendingSelection({
      start: ann.selectionStart,
      end: ann.selectionEnd,
      text: ann.selectedTextSnapshot,
    });
    setAnnotationSheetOpen(true);
  }, []);

  const handleNavigateAnnotation = useCallback(
    (direction: "prev" | "next") => {
      if (!editingAnnotation || sortedAnnotations.length < 2) return;
      const currentIndex = sortedAnnotations.findIndex((a) => a.id === editingAnnotation.id);
      if (currentIndex === -1) return;
      const nextIndex =
        direction === "next"
          ? (currentIndex + 1) % sortedAnnotations.length
          : (currentIndex - 1 + sortedAnnotations.length) % sortedAnnotations.length;
      const target = sortedAnnotations[nextIndex];

      // Jump editor to the target annotation
      const textarea = textareaRef.current;
      if (textarea) {
        scrollTextareaTo(textarea, target.selectionStart);
        textarea.setSelectionRange(target.selectionStart, target.selectionEnd);
      }

      // Switch the editing state to the new annotation
      setEditingAnnotation(target);
      setPendingSelection({
        start: target.selectionStart,
        end: target.selectionEnd,
        text: target.selectedTextSnapshot,
      });
    },
    [editingAnnotation, sortedAnnotations, scrollTextareaTo]
  );

  const handleAnnotationTap = useCallback(
    (ann: Annotation) => {
      // Close the list drawer first, then jump and open edit
      setAnnotationListOpen(false);
      // Wait for the drawer to start closing, then scroll and open edit
      setTimeout(() => {
        const textarea = textareaRef.current;
        if (textarea) {
          textarea.focus();
          scrollTextareaTo(textarea, ann.selectionStart);
          textarea.setSelectionRange(ann.selectionStart, ann.selectionEnd);
        }
        handleEditAnnotation(ann);
      }, 250);
    },
    [handleEditAnnotation, scrollTextareaTo]
  );

  const handleJumpToAnnotation = useCallback(
    (ann: Annotation) => {
      const textarea = textareaRef.current;
      if (textarea) {
        textarea.focus();
        scrollTextareaTo(textarea, ann.selectionStart);
        textarea.setSelectionRange(ann.selectionStart, ann.selectionEnd);
      }
    },
    [scrollTextareaTo]
  );

  const handleExport = useCallback(() => {
    const results = validateAnchors(session.markdown, session.annotations);
    if (results.length > 0) {
      toast.warning(
        `${results.length} annotation(s) may have shifted. Review before exporting.`
      );
    }
    setExportOpen(true);
  }, [session.markdown, session.annotations]);

  if (!loaded) {
    return (
      <div className="flex h-dvh items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const selectedText = selection?.text || pendingSelection?.text || "";

  return (
    <div className="flex h-dvh flex-col">
      <AppHeader
        onClear={clearAll}
        onExport={handleExport}
        onToggleAnnotationList={() => setAnnotationListOpen(true)}
        annotationCount={session.annotations.length}
        hasDocument={session.markdown.length > 0}
      />

      {mismatches.length > 0 && session.annotations.length > 0 && (
        <Alert className="mx-4 mt-2">
          <AlertDescription className="text-xs">
            {mismatches.length} annotation(s) may not match the current text.
            Text was edited after annotations were placed.
          </AlertDescription>
        </Alert>
      )}

      <UnifiedEditor
        ref={textareaRef}
        value={session.markdown}
        onChange={setMarkdown}
        annotations={session.annotations}
        onAnnotationClick={handleEditAnnotation}
      />

      <SelectionToolbar
        selectedText={selection?.text || ""}
        onAnnotate={handleAnnotate}
        visible={!!selection}
      />

      <AnnotationSheet
        open={annotationSheetOpen}
        onOpenChange={setAnnotationSheetOpen}
        selectedText={
          editingAnnotation?.selectedTextSnapshot || selectedText
        }
        selectionStart={pendingSelection?.start || 0}
        selectionEnd={pendingSelection?.end || 0}
        existingAnnotation={editingAnnotation}
        onSave={handleSaveAnnotation}
        onDelete={() => handleDeleteAnnotation()}
        onNavigate={sortedAnnotations.length > 1 ? handleNavigateAnnotation : undefined}
        annotationPosition={
          editingAnnotation
            ? {
                current: sortedAnnotations.findIndex((a) => a.id === editingAnnotation.id) + 1,
                total: sortedAnnotations.length,
              }
            : undefined
        }
      />

      <AnnotationListSheet
        open={annotationListOpen}
        onOpenChange={setAnnotationListOpen}
        annotations={session.annotations}
        onTap={handleAnnotationTap}
        onDelete={(id) => handleDeleteAnnotation(id)}
      />

      <ExportDrawer
        open={exportOpen}
        onOpenChange={setExportOpen}
        markdown={session.markdown}
        annotations={session.annotations}
      />
    </div>
  );
}
