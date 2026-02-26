"use client";

import { Button } from "@/components/ui/button";

interface SelectionToolbarProps {
  selectedText: string;
  onAnnotate: () => void;
  visible: boolean;
}

export function SelectionToolbar({
  selectedText,
  onAnnotate,
  visible,
}: SelectionToolbarProps) {
  if (!visible) return null;

  const truncated =
    selectedText.length > 60
      ? selectedText.slice(0, 60) + "..."
      : selectedText;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background transition-transform duration-200"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <p className="flex-1 truncate text-sm text-muted-foreground font-mono">
          &ldquo;{truncated}&rdquo;
        </p>
        <Button size="sm" onClick={onAnnotate}>
          Annotate
        </Button>
      </div>
    </div>
  );
}
