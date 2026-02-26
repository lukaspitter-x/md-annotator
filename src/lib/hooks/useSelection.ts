"use client";

import { useEffect, useCallback, useRef, useState } from "react";

interface SelectionState {
  start: number;
  end: number;
  text: string;
}

export function useSelection(
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
) {
  const [selection, setSelection] = useState<SelectionState | null>(null);
  const selectionTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

  const handleSelectionChange = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Only track selection if the textarea is the active element
    if (document.activeElement !== textarea) {
      return;
    }

    // Debounce to let iOS finalize the selection
    if (selectionTimeoutRef.current) {
      clearTimeout(selectionTimeoutRef.current);
    }

    selectionTimeoutRef.current = setTimeout(() => {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      if (start !== end) {
        setSelection({
          start,
          end,
          text: textarea.value.slice(start, end),
        });
      } else {
        setSelection(null);
      }
    }, 100);
  }, [textareaRef]);

  useEffect(() => {
    document.addEventListener("selectionchange", handleSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
      if (selectionTimeoutRef.current) {
        clearTimeout(selectionTimeoutRef.current);
      }
    };
  }, [handleSelectionChange]);

  const clearSelection = useCallback(() => {
    setSelection(null);
  }, []);

  return { selection, clearSelection };
}
