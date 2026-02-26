"use client";

import { useState, useCallback, useEffect } from "react";
import { nanoid } from "nanoid";
import {
  Annotation,
  AnnotationType,
  DocumentSession,
} from "@/lib/annotations/types";
import { hasOverlap } from "@/lib/annotations/selection";
import { loadSession, saveSession, clearSession } from "@/lib/storage/local-session";
import { useDebouncedCallback } from "use-debounce";

const emptySession: DocumentSession = {
  markdown: "",
  annotations: [],
  updatedAt: new Date().toISOString(),
};

export function useDocumentSession() {
  const [session, setSession] = useState<DocumentSession>(emptySession);
  const [loaded, setLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = loadSession();
    if (saved) {
      setSession(saved);
    }
    setLoaded(true);
  }, []);

  // Autosave debounced
  const debouncedSave = useDebouncedCallback((s: DocumentSession) => {
    saveSession(s);
  }, 1000);

  const updateSession = useCallback(
    (updater: (prev: DocumentSession) => DocumentSession) => {
      setSession((prev) => {
        const next = updater(prev);
        debouncedSave(next);
        return next;
      });
    },
    [debouncedSave]
  );

  const setMarkdown = useCallback(
    (markdown: string) => {
      updateSession((prev) => ({
        ...prev,
        markdown,
        updatedAt: new Date().toISOString(),
      }));
    },
    [updateSession]
  );

  const addAnnotation = useCallback(
    (
      selectionStart: number,
      selectionEnd: number,
      type: AnnotationType,
      comment: string
    ): { success: boolean; error?: string } => {
      let result: { success: boolean; error?: string } = { success: false, error: "" };
      setSession((prev) => {
        if (hasOverlap(selectionStart, selectionEnd, prev.annotations)) {
          result = {
            success: false,
            error: "Selection overlaps with an existing annotation",
          };
          return prev;
        }
        const annotation: Annotation = {
          id: nanoid(8),
          type,
          selectionStart,
          selectionEnd,
          selectedTextSnapshot: prev.markdown.slice(
            selectionStart,
            selectionEnd
          ),
          comment,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        const next = {
          ...prev,
          annotations: [...prev.annotations, annotation],
          updatedAt: new Date().toISOString(),
        };
        result = { success: true };
        debouncedSave(next);
        return next;
      });
      return result;
    },
    [debouncedSave]
  );

  const updateAnnotation = useCallback(
    (id: string, updates: Partial<Pick<Annotation, "type" | "comment">>) => {
      updateSession((prev) => ({
        ...prev,
        annotations: prev.annotations.map((a) =>
          a.id === id
            ? { ...a, ...updates, updatedAt: new Date().toISOString() }
            : a
        ),
        updatedAt: new Date().toISOString(),
      }));
    },
    [updateSession]
  );

  const deleteAnnotation = useCallback(
    (id: string) => {
      updateSession((prev) => ({
        ...prev,
        annotations: prev.annotations.filter((a) => a.id !== id),
        updatedAt: new Date().toISOString(),
      }));
    },
    [updateSession]
  );

  const clearAll = useCallback(() => {
    setSession({ ...emptySession, updatedAt: new Date().toISOString() });
    clearSession();
  }, []);

  return {
    session,
    loaded,
    setMarkdown,
    addAnnotation,
    updateAnnotation,
    deleteAnnotation,
    clearAll,
  };
}
