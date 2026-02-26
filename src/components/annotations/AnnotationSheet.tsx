"use client";

import { useState, useEffect } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Annotation,
  AnnotationType,
  ANNOTATION_TYPE_LABELS,
  ANNOTATION_TYPE_DESCRIPTIONS,
} from "@/lib/annotations/types";

interface AnnotationSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedText: string;
  selectionStart: number;
  selectionEnd: number;
  existingAnnotation?: Annotation | null;
  onSave: (type: AnnotationType, comment: string) => void;
  onDelete?: () => void;
  onNavigate?: (direction: "prev" | "next") => void;
  annotationPosition?: { current: number; total: number };
}

const annotationTypes: AnnotationType[] = ["edit", "ask", "keep", "del", "note"];

export function AnnotationSheet({
  open,
  onOpenChange,
  selectedText,
  existingAnnotation,
  onSave,
  onDelete,
  onNavigate,
  annotationPosition,
}: AnnotationSheetProps) {
  const [type, setType] = useState<AnnotationType>("edit");
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (existingAnnotation) {
      setType(existingAnnotation.type);
      setComment(existingAnnotation.comment);
    } else {
      setType("edit");
      setComment("");
    }
  }, [existingAnnotation, open]);

  const handleSave = () => {
    onSave(type, comment);
    onOpenChange(false);
  };

  const truncatedText =
    selectedText.length > 120
      ? selectedText.slice(0, 120) + "..."
      : selectedText;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <div className="mx-auto w-full max-w-lg">
          <DrawerHeader>
            <div className="flex items-center justify-between">
              <DrawerTitle>
                {existingAnnotation ? "Edit Annotation" : "Add Annotation"}
              </DrawerTitle>
              {existingAnnotation && onNavigate && annotationPosition && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => onNavigate("prev")}
                  >
                    Prev
                  </Button>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {annotationPosition.current}/{annotationPosition.total}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => onNavigate("next")}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          </DrawerHeader>

          <div className="px-4 space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground">
                Selected text
              </Label>
              <p className="mt-1 rounded-md bg-muted p-2 font-mono text-xs leading-relaxed">
                {truncatedText}
              </p>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">
                Type
              </Label>
              <div className="flex flex-wrap gap-2">
                {annotationTypes.map((t) => (
                  <Button
                    key={t}
                    variant={type === t ? "default" : "outline"}
                    size="sm"
                    onClick={() => setType(t)}
                    className="font-mono text-xs"
                    title={ANNOTATION_TYPE_DESCRIPTIONS[t]}
                  >
                    {ANNOTATION_TYPE_LABELS[t]}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="annotation-comment" className="text-xs text-muted-foreground">
                Comment / Instruction
              </Label>
              <Textarea
                id="annotation-comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="What should Claude do with this text?"
                className="mt-1 font-mono text-sm min-h-[80px]"
              />
            </div>
          </div>

          <DrawerFooter className="flex-row gap-2">
            {existingAnnotation && onDelete && (
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => {
                  onDelete();
                  onOpenChange(false);
                }}
              >
                Delete
              </Button>
            )}
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleSave}>
              Save
            </Button>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
