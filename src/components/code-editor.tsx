'use client';

import { useEffect, useRef, useState } from 'react';

interface CodeEditorProps {
  code: string;
  onChange: (code: string) => void;
  readOnly?: boolean;
}

export function CodeEditor({ code, onChange, readOnly = false }: CodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [lineCount, setLineCount] = useState(1);
  const [editorId] = useState(() => `editor-${Math.random()}`);

  useEffect(() => {
    const lines = code.split('\n').length;
    setLineCount(lines);
  }, [code]);

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    const lineNumbers = document.querySelector(`[data-editor-id="${textarea.id}"]`);
    if (lineNumbers) {
      lineNumbers.scrollTop = textarea.scrollTop;
    }
  };

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-secondary/30 font-mono text-sm h-96">
      <div className="flex h-full overflow-hidden">
        {/* Line Numbers */}
        <div
          data-editor-id={editorId}
          className="select-none bg-secondary/50 text-muted-foreground px-3 py-3 text-right w-12 overflow-hidden border-r border-border"
        >
          {Array.from({ length: lineCount }).map((_, i) => (
            <div key={i} className="h-6">
              {i + 1}
            </div>
          ))}
        </div>

        {/* Editor */}
        <textarea
          ref={textareaRef}
          id={editorId}
          value={code}
          onChange={(e) => onChange(e.target.value)}
          onScroll={handleScroll}
          readOnly={readOnly}
          className="flex-1 p-3 bg-transparent text-foreground resize-none outline-none focus:ring-0 overflow-hidden"
          spellCheck="false"
        />
      </div>
    </div>
  );
}
