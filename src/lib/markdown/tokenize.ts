export interface MdSpan {
  start: number;
  end: number;
  classes: string[];
}

export function tokenizeMarkdown(markdown: string): MdSpan[] {
  const spans: MdSpan[] = [];
  const claimed = new Set<number>();

  function claim(start: number, end: number): boolean {
    for (let i = start; i < end; i++) {
      if (claimed.has(i)) return false;
    }
    for (let i = start; i < end; i++) {
      claimed.add(i);
    }
    return true;
  }

  function addSpan(start: number, end: number, classes: string[]) {
    if (end > start) {
      spans.push({ start, end, classes });
    }
  }

  // Track which ranges are inside fenced code blocks (skip inline parsing)
  const codeBlockRanges: Array<{ start: number; end: number }> = [];

  // Pass 1: Block-level (line by line)
  const lines = markdown.split("\n");
  let offset = 0;
  let inCodeBlock = false;
  let codeBlockStart = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineStart = offset;
    const lineEnd = offset + line.length;

    // Fenced code blocks
    const fenceMatch = line.match(/^(`{3,}|~{3,})(.*)/);
    if (fenceMatch) {
      if (!inCodeBlock) {
        inCodeBlock = true;
        codeBlockStart = lineStart;
        addSpan(lineStart, lineEnd, ["md-codeblock-fence", "md-dim"]);
        claim(lineStart, lineEnd);
      } else {
        addSpan(lineStart, lineEnd, ["md-codeblock-fence", "md-dim"]);
        claim(lineStart, lineEnd);
        codeBlockRanges.push({ start: codeBlockStart, end: lineEnd });
        inCodeBlock = false;
      }
      offset = lineEnd + 1; // +1 for newline
      continue;
    }

    if (inCodeBlock) {
      addSpan(lineStart, lineEnd, ["md-codeblock-content"]);
      claim(lineStart, lineEnd);
      offset = lineEnd + 1;
      continue;
    }

    // Headings
    const headingMatch = line.match(/^(#{1,6})\s/);
    if (headingMatch) {
      const markerEnd = lineStart + headingMatch[0].length;
      const level = headingMatch[1].length;
      addSpan(lineStart, markerEnd, ["md-heading-marker", "md-dim"]);
      claim(lineStart, markerEnd);
      if (markerEnd < lineEnd) {
        addSpan(markerEnd, lineEnd, ["md-heading", `md-heading-${level}`]);
        claim(markerEnd, lineEnd);
      }
      offset = lineEnd + 1;
      continue;
    }

    // Horizontal rules
    if (/^(\s{0,3})([-*_])(\s*\2){2,}\s*$/.test(line)) {
      addSpan(lineStart, lineEnd, ["md-hr"]);
      claim(lineStart, lineEnd);
      offset = lineEnd + 1;
      continue;
    }

    // Blockquotes
    const bqMatch = line.match(/^(\s{0,3}>+\s?)/);
    if (bqMatch) {
      const markerEnd = lineStart + bqMatch[1].length;
      addSpan(lineStart, markerEnd, ["md-blockquote-marker", "md-dim"]);
      claim(lineStart, markerEnd);
      if (markerEnd < lineEnd) {
        addSpan(markerEnd, lineEnd, ["md-blockquote-content"]);
        // Don't claim content — allow inline parsing inside blockquotes
      }
      offset = lineEnd + 1;
      continue;
    }

    // List markers (unordered: - * +, ordered: 1.)
    const listMatch = line.match(/^(\s*)([-*+]|\d+[.)]) /);
    if (listMatch) {
      const markerStart = lineStart + listMatch[1].length;
      const markerEnd = lineStart + listMatch[0].length;
      addSpan(markerStart, markerEnd, ["md-list-marker"]);
      claim(markerStart, markerEnd);
    }

    offset = lineEnd + 1;
  }

  // If unclosed code block, treat rest as code content
  if (inCodeBlock) {
    codeBlockRanges.push({ start: codeBlockStart, end: markdown.length });
  }

  // Pass 2: Inline parsing (skip code block ranges)
  function isInCodeBlock(pos: number): boolean {
    return codeBlockRanges.some((r) => pos >= r.start && pos < r.end);
  }

  // Inline code (backticks)
  const inlineCodeRe = /`([^`\n]+)`/g;
  let m: RegExpExecArray | null;
  while ((m = inlineCodeRe.exec(markdown)) !== null) {
    const matchStart = m.index;
    const matchEnd = matchStart + m[0].length;
    if (isInCodeBlock(matchStart)) continue;
    // Opening backtick
    if (claim(matchStart, matchStart + 1)) {
      addSpan(matchStart, matchStart + 1, ["md-dim"]);
    }
    // Content
    const contentStart = matchStart + 1;
    const contentEnd = matchEnd - 1;
    if (claim(contentStart, contentEnd)) {
      addSpan(contentStart, contentEnd, ["md-code"]);
    }
    // Closing backtick
    if (claim(contentEnd, matchEnd)) {
      addSpan(contentEnd, matchEnd, ["md-dim"]);
    }
  }

  // Bold (**...**)
  const boldRe = /\*\*(.+?)\*\*/g;
  while ((m = boldRe.exec(markdown)) !== null) {
    const matchStart = m.index;
    const matchEnd = matchStart + m[0].length;
    if (isInCodeBlock(matchStart)) continue;
    if (claim(matchStart, matchStart + 2)) {
      addSpan(matchStart, matchStart + 2, ["md-dim"]);
    }
    const contentStart = matchStart + 2;
    const contentEnd = matchEnd - 2;
    if (claim(contentStart, contentEnd)) {
      addSpan(contentStart, contentEnd, ["md-bold"]);
    }
    if (claim(contentEnd, matchEnd)) {
      addSpan(contentEnd, matchEnd, ["md-dim"]);
    }
  }

  // Italic (*...*)
  const italicRe = /(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g;
  while ((m = italicRe.exec(markdown)) !== null) {
    const matchStart = m.index;
    const matchEnd = matchStart + m[0].length;
    if (isInCodeBlock(matchStart)) continue;
    if (claim(matchStart, matchStart + 1)) {
      addSpan(matchStart, matchStart + 1, ["md-dim"]);
    }
    const contentStart = matchStart + 1;
    const contentEnd = matchEnd - 1;
    if (claim(contentStart, contentEnd)) {
      addSpan(contentStart, contentEnd, ["md-italic"]);
    }
    if (claim(contentEnd, matchEnd)) {
      addSpan(contentEnd, matchEnd, ["md-dim"]);
    }
  }

  // Strikethrough (~~...~~)
  const strikeRe = /~~(.+?)~~/g;
  while ((m = strikeRe.exec(markdown)) !== null) {
    const matchStart = m.index;
    const matchEnd = matchStart + m[0].length;
    if (isInCodeBlock(matchStart)) continue;
    if (claim(matchStart, matchStart + 2)) {
      addSpan(matchStart, matchStart + 2, ["md-dim"]);
    }
    const contentStart = matchStart + 2;
    const contentEnd = matchEnd - 2;
    if (claim(contentStart, contentEnd)) {
      addSpan(contentStart, contentEnd, ["md-strikethrough"]);
    }
    if (claim(contentEnd, matchEnd)) {
      addSpan(contentEnd, matchEnd, ["md-dim"]);
    }
  }

  // Links [text](url)
  const linkRe = /\[([^\]]*)\]\(([^)]*)\)/g;
  while ((m = linkRe.exec(markdown)) !== null) {
    const matchStart = m.index;
    const matchEnd = matchStart + m[0].length;
    if (isInCodeBlock(matchStart)) continue;

    // Opening bracket [
    if (claim(matchStart, matchStart + 1)) {
      addSpan(matchStart, matchStart + 1, ["md-dim"]);
    }
    // Link text
    const textStart = matchStart + 1;
    const textEnd = textStart + m[1].length;
    if (claim(textStart, textEnd)) {
      addSpan(textStart, textEnd, ["md-link-text"]);
    }
    // ](
    const bracketParen = textEnd;
    if (claim(bracketParen, bracketParen + 2)) {
      addSpan(bracketParen, bracketParen + 2, ["md-dim"]);
    }
    // URL
    const urlStart = bracketParen + 2;
    const urlEnd = urlStart + m[2].length;
    if (claim(urlStart, urlEnd)) {
      addSpan(urlStart, urlEnd, ["md-link-url", "md-dim"]);
    }
    // Closing paren )
    if (claim(urlEnd, matchEnd)) {
      addSpan(urlEnd, matchEnd, ["md-dim"]);
    }
  }

  return spans;
}
