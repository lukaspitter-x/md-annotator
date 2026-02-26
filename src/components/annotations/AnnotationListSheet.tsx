"use client";

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Annotation } from "@/lib/annotations/types";
import { AnnotationBadge } from "./AnnotationBadge";

interface AnnotationListSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  annotations: Annotation[];
  onTap: (annotation: Annotation) => void;
  onDelete: (id: string) => void;
}

export function AnnotationListSheet({
  open,
  onOpenChange,
  annotations,
  onTap,
  onDelete,
}: AnnotationListSheetProps) {
  const sorted = [...annotations].sort(
    (a, b) => a.selectionStart - b.selectionStart
  );

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <div className="mx-auto w-full max-w-lg">
          <DrawerHeader>
            <DrawerTitle>
              Annotations ({annotations.length})
            </DrawerTitle>
          </DrawerHeader>

          <ScrollArea className="max-h-[60vh] px-4">
            {sorted.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No annotations yet. Select text in the editor to add one.
              </p>
            ) : (
              <div className="space-y-1 pb-4">
                {sorted.map((ann, i) => {
                  const excerpt =
                    ann.selectedTextSnapshot.length > 50
                      ? ann.selectedTextSnapshot.slice(0, 50) + "..."
                      : ann.selectedTextSnapshot;
                  const commentPreview =
                    ann.comment.length > 60
                      ? ann.comment.slice(0, 60) + "..."
                      : ann.comment;

                  return (
                    <div key={ann.id}>
                      {i > 0 && <Separator className="my-1" />}
                      <div className="flex items-start gap-3 py-2">
                        <button
                          type="button"
                          className="flex-1 min-w-0 text-left cursor-pointer rounded-md px-2 py-1 -mx-2 -my-1 transition-colors hover:bg-muted/50 active:bg-muted"
                          onClick={() => onTap(ann)}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <AnnotationBadge type={ann.type} />
                            <span className="text-xs text-muted-foreground font-mono">
                              #{ann.id}
                            </span>
                          </div>
                          <p className="text-sm font-mono truncate">
                            &ldquo;{excerpt}&rdquo;
                          </p>
                          {ann.comment && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {commentPreview}
                            </p>
                          )}
                        </button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-xs text-destructive shrink-0"
                          onClick={() => onDelete(ann.id)}
                        >
                          Del
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
