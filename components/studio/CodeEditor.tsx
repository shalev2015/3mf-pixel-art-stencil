'use client';

import { useEffect, useRef, useState } from 'react';
import { gridToSpriteString } from '@/lib/sprite/serialize';
import type { Grid } from '@/lib/types';

interface CodeEditorProps {
  codeText: string;
  grid: Grid;
  onChange: (code: string) => void;
  onFormat: () => void;
  onClear: () => void;
}

/** Textarea for pasting `img\`...\`` sprite code, with format / copy / clear actions. */
export default function CodeEditor({ codeText, grid, onChange, onFormat, onClear }: CodeEditorProps) {
  const [copyLabel, setCopyLabel] = useState('Copy JS');
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (resetTimer.current) clearTimeout(resetTimer.current);
  }, []);

  const handleCopy = () => {
    navigator.clipboard?.writeText(gridToSpriteString(grid));
    setCopyLabel('Copied!');
    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setCopyLabel('Copy JS'), 1200);
  };

  return (
    <div className="code-editor-wrap">
      <div className="code-toolbar">
        <span>Paste <code>img`...`</code> code or marquee selection:</span>
        <div className="code-toolbar-actions">
          <button type="button" className="btn-xs" onClick={onFormat}>
            Format <code>img` `</code>
          </button>
          <button type="button" className="btn-xs" onClick={handleCopy}>
            {copyLabel}
          </button>
          <button type="button" className="btn-xs" onClick={onClear}>
            Clear
          </button>
        </div>
      </div>

      <textarea
        id="codeInput"
        spellCheck={false}
        value={codeText}
        onChange={e => onChange(e.target.value)}
        placeholder="Paste Arcade img`...` JS code here..."
      />
    </div>
  );
}
