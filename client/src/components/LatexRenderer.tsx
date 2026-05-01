/**
 * LatexRenderer — renders HTML content that may contain LaTeX formulas.
 *
 * Supports two LaTeX delimiter styles:
 *   - Inline:  \( ... \)   or   $...$
 *   - Display: \[ ... \]   or   $$...$$
 *
 * The component first inserts the raw HTML, then finds all text nodes
 * and replaces LaTeX expressions with rendered KaTeX output.
 */

import { useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface LatexRendererProps {
  /** Raw HTML string that may contain LaTeX formulas */
  html: string;
  className?: string;
  'data-testid'?: string;
}

/**
 * Splits a text node into an array of plain strings and LaTeX tokens.
 * Each token: { text: string, display: boolean } means it is a LaTeX formula.
 * Plain strings are returned as bare strings.
 */
type Token = string | { latex: string; display: boolean };

function tokenize(text: string): Token[] {
  // Order matters: check $$ before $, and \[ before \(
  const pattern =
    /(\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\$[^$\n]+?\$|\\\([\s\S]+?\\\))/g;

  const tokens: Token[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    const before = text.slice(lastIndex, match.index);
    if (before) tokens.push(before);

    const raw = match[1];
    const isDisplay = raw.startsWith('$$') || raw.startsWith('\\[');
    let latex: string;
    if (raw.startsWith('$$')) {
      latex = raw.slice(2, -2);
    } else if (raw.startsWith('\\[')) {
      latex = raw.slice(2, -2);
    } else if (raw.startsWith('$')) {
      latex = raw.slice(1, -1);
    } else {
      // \( ... \)
      latex = raw.slice(2, -2);
    }

    tokens.push({ latex: latex.trim(), display: isDisplay });
    lastIndex = match.index + raw.length;
  }

  const tail = text.slice(lastIndex);
  if (tail) tokens.push(tail);

  return tokens;
}

/**
 * Renders a KaTeX token to an HTML string. Falls back to plain escaped text on error.
 */
function renderLatex(latex: string, display: boolean): string {
  try {
    return katex.renderToString(latex, {
      displayMode: display,
      throwOnError: false,
      output: 'html',
    });
  } catch {
    return `<span class="latex-error" title="LaTeX error">${latex}</span>`;
  }
}

/**
 * Walks all text nodes inside a DOM element and replaces LaTeX expressions
 * with rendered KaTeX HTML.
 */
function processTextNodes(root: HTMLElement) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];

  let node: Node | null;
  while ((node = walker.nextNode())) {
    textNodes.push(node as Text);
  }

  for (const textNode of textNodes) {
    const text = textNode.textContent ?? '';
    // Quick check – skip if no LaTeX delimiters present
    if (!text.includes('$') && !text.includes('\\(') && !text.includes('\\[')) {
      continue;
    }

    const tokens = tokenize(text);
    if (tokens.length === 1 && typeof tokens[0] === 'string') continue; // nothing to replace

    const frag = document.createDocumentFragment();
    for (const token of tokens) {
      if (typeof token === 'string') {
        frag.appendChild(document.createTextNode(token));
      } else {
        const span = document.createElement('span');
        span.innerHTML = renderLatex(token.latex, token.display);
        frag.appendChild(span);
      }
    }

    textNode.parentNode?.replaceChild(frag, textNode);
  }
}

export function LatexRenderer({ html, className, 'data-testid': testId }: LatexRendererProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      processTextNodes(ref.current);
    }
    // Re-run whenever html changes
  }, [html]);

  return (
    <div
      ref={ref}
      className={className}
      data-testid={testId}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/**
 * Renders a plain text string that may contain LaTeX formulas.
 * No HTML tags will be injected.
 */
export function LatexText({
  text,
  className,
  as: Tag = 'span',
  display = false,
}: {
  text: string;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
  display?: boolean;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (ref.current) {
      processTextNodes(ref.current);
    }
  }, [text]);

  return (
    // @ts-ignore – generic polymorphic ref
    <Tag ref={ref} className={className}>
      {text}
    </Tag>
  );
}
