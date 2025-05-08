
import React, { useEffect, useRef } from "react";

interface CodeViewerProps {
  code: string;
  language?: string;
  title?: string;
  showLineNumbers?: boolean;
  className?: string;
}

export default function CodeViewer({
  code,
  language = "typescript",
  title,
  showLineNumbers = true,
  className,
}: CodeViewerProps) {
  const codeRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    // Simple syntax highlighting - in a real app, use a library like Prism.js or highlight.js
    const highlightCode = () => {
      if (!codeRef.current) return;
      
      // Basic highlighting for TypeScript/JavaScript
      let highlightedCode = code
        .replace(/\/\/(.*)/g, '<span style="color: #6a9955;">$&</span>') // Comments
        .replace(/(['"`])(.*?)\1/g, '<span style="color: #ce9178;">$&</span>') // Strings
        .replace(/\b(const|let|var|function|class|interface|import|export|from|async|await)\b/g, '<span style="color: #569cd6;">$&</span>') // Keywords
        .replace(/\b(true|false|null|undefined|this)\b/g, '<span style="color: #569cd6;">$&</span>') // Reserved words
        .replace(/\b([A-Z][a-zA-Z0-9_]*)\b/g, '<span style="color: #4EC9B0;">$&</span>') // Types/Classes
        .replace(/\b(page|expect)\b/g, '<span style="color: #C586C0;">$&</span>'); // Playwright-specific

      if (showLineNumbers) {
        const lines = highlightedCode.split('\n');
        const numberedLines = lines.map((line, i) => {
          return `<span class="line-number">${i + 1}</span> ${line}`;
        });
        highlightedCode = numberedLines.join('\n');
      }

      codeRef.current.innerHTML = highlightedCode;
    };

    highlightCode();
  }, [code, showLineNumbers]);

  return (
    <div className={`bg-[#1e1e1e] rounded-lg overflow-hidden shadow-lg ${className}`}>
      {title && (
        <div className="bg-[#252526] px-4 py-2 text-gray-300 font-mono text-sm flex items-center justify-between">
          <span>{title}</span>
          <div className="flex gap-1">
            <button
              className="p-1 hover:bg-[#333] rounded-sm"
              title="Copy code"
              onClick={() => navigator.clipboard.writeText(code)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
            </button>
          </div>
        </div>
      )}
      <div className="p-4 overflow-auto max-h-[500px] code-viewer">
        <pre
          ref={codeRef}
          className="font-mono text-sm text-gray-300 whitespace-pre-wrap"
          style={{
            fontFamily: "Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace",
          }}
        >
          {code}
        </pre>
      </div>
      <style>{`
        .line-number {
          display: inline-block;
          width: 2em;
          color: #5a5a5a;
          text-align: right;
          padding-right: 1em;
          user-select: none;
        }
      `}</style>
    </div>
  );
}
