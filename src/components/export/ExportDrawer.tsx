"use client";

import { useState } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Annotation } from "@/lib/annotations/types";
import {
  generateFullPayload,
  generateAnnotatedMarkdown,
  generateClaudeInstructions,
} from "@/lib/annotations/export";
import { toast } from "sonner";

interface ExportDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  markdown: string;
  annotations: Annotation[];
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for iOS Safari
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand("copy");
      document.body.removeChild(textarea);
      return true;
    } catch {
      document.body.removeChild(textarea);
      return false;
    }
  }
}

export function ExportDrawer({
  open,
  onOpenChange,
  markdown,
  annotations,
}: ExportDrawerProps) {
  const [instructionsPosition, setInstructionsPosition] = useState<"top" | "bottom">("top");
  const [includeIndex, setIncludeIndex] = useState(true);

  const handleCopy = async (
    content: string,
    label: string
  ) => {
    const ok = await copyToClipboard(content);
    if (ok) {
      toast.success(`${label} copied to clipboard`);
    } else {
      toast.error("Copy failed. Try selecting the text manually.");
    }
  };

  const fullPayload = generateFullPayload(markdown, annotations, {
    instructionsPosition,
    includeIndex,
  });
  const annotatedMd = generateAnnotatedMarkdown(markdown, annotations);
  const instructions = generateClaudeInstructions();

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[75vh]">
        <div className="mx-auto w-full max-w-lg flex flex-col min-h-0 overflow-hidden">
          <DrawerHeader className="shrink-0">
            <DrawerTitle>Export Payload</DrawerTitle>
          </DrawerHeader>

          <div className="px-4 space-y-4 shrink-0">
            <div className="flex items-center gap-4">
              <Label className="text-xs text-muted-foreground shrink-0">
                Instructions
              </Label>
              <div className="flex gap-1">
                <Button
                  variant={instructionsPosition === "top" ? "default" : "outline"}
                  size="sm"
                  className="text-xs"
                  onClick={() => setInstructionsPosition("top")}
                >
                  Top
                </Button>
                <Button
                  variant={instructionsPosition === "bottom" ? "default" : "outline"}
                  size="sm"
                  className="text-xs"
                  onClick={() => setInstructionsPosition("bottom")}
                >
                  Bottom
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Label className="text-xs text-muted-foreground shrink-0">
                Include index
              </Label>
              <div className="flex gap-1">
                <Button
                  variant={includeIndex ? "default" : "outline"}
                  size="sm"
                  className="text-xs"
                  onClick={() => setIncludeIndex(true)}
                >
                  Yes
                </Button>
                <Button
                  variant={!includeIndex ? "default" : "outline"}
                  size="sm"
                  className="text-xs"
                  onClick={() => setIncludeIndex(false)}
                >
                  No
                </Button>
              </div>
            </div>

            <Separator />
          </div>

          <div className="px-4 py-4 min-h-0 flex-1 overflow-y-auto rounded-md border mx-4">
            <pre className="font-mono text-xs leading-relaxed whitespace-pre-wrap">
              {fullPayload}
            </pre>
          </div>

          <DrawerFooter className="shrink-0">
            <Button
              className="w-full"
              onClick={() => handleCopy(fullPayload, "Full payload")}
            >
              Copy Full Payload
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 text-xs"
                onClick={() =>
                  handleCopy(annotatedMd, "Annotated markdown")
                }
              >
                Copy Annotated MD
              </Button>
              <Button
                variant="outline"
                className="flex-1 text-xs"
                onClick={() =>
                  handleCopy(instructions, "Instructions")
                }
              >
                Copy Instructions
              </Button>
            </div>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
