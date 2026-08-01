import React, { useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { autoWrapUnwrappedLatex } from '../services/exportDocx';

interface MathTextProps {
  content?: string;
  text?: string;
  className?: string;
}

export const MathText: React.FC<MathTextProps> = ({ content, text, className = '' }) => {
  const containerRef = useRef<HTMLSpanElement>(null);
  const actualText = content ?? text ?? '';

  useEffect(() => {
    if (!containerRef.current) return;

    const el = containerRef.current;
    el.innerHTML = '';

    if (!actualText) return;

    const formattedContent = autoWrapUnwrappedLatex(actualText);

    // Regex tách các thẻ $...$ hoặc $$...$$
    const mathRegex = /(\$\$.*?\$\$|\$.*?\$)/gs;
    const parts = formattedContent.split(mathRegex);

    parts.forEach((part) => {
      if (!part) return;

      if (part.startsWith('$$') && part.endsWith('$$')) {
        // Display Math Block
        const mathStr = part.slice(2, -2);
        const span = document.createElement('span');
        span.className = 'my-2 block text-center overflow-x-auto py-1 font-sans';
        try {
          katex.render(mathStr, span, { displayMode: true, throwOnError: false });
        } catch (e) {
          span.textContent = part;
        }
        el.appendChild(span);
      } else if (part.startsWith('$') && part.endsWith('$')) {
        // Inline Math
        const mathStr = part.slice(1, -1);
        const span = document.createElement('span');
        span.className = 'inline-block px-0.5 align-middle';
        try {
          katex.render(mathStr, span, { displayMode: false, throwOnError: false });
        } catch (e) {
          span.textContent = part;
        }
        el.appendChild(span);
      } else {
        // Text thường: Hỗ trợ ngắt dòng \n
        const lines = part.split('\n');
        lines.forEach((line, index) => {
          if (line) {
            el.appendChild(document.createTextNode(line));
          }
          if (index < lines.length - 1) {
            el.appendChild(document.createElement('br'));
          }
        });
      }
    });
  }, [actualText]);

  return <span ref={containerRef} className={`math-rendered inline ${className}`} />;
};
