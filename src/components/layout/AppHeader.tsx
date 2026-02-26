"use client";

import { Button } from "@/components/ui/button";

interface AppHeaderProps {
  onClear: () => void;
  onExport: () => void;
  onToggleAnnotationList: () => void;
  annotationCount: number;
  hasDocument: boolean;
}

export function AppHeader({
  onClear,
  onExport,
  onToggleAnnotationList,
  annotationCount,
  hasDocument,
}: AppHeaderProps) {
  return (
    <header className="flex items-center justify-between border-b px-4 py-2 shrink-0">
      <h1 className="text-lg font-semibold tracking-tight font-mono">
        MD Annotator
      </h1>
      <div className="flex items-center gap-2">
        {hasDocument && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleAnnotationList}
              className="relative"
            >
              Annotations
              {annotationCount > 0 && (
                <span className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                  {annotationCount}
                </span>
              )}
            </Button>
            <Button variant="outline" size="sm" onClick={onClear}>
              Clear
            </Button>
            <Button size="sm" onClick={onExport}>
              Export
            </Button>
          </>
        )}
      </div>
    </header>
  );
}
