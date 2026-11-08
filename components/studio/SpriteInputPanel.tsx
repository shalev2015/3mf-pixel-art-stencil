'use client';

import { useState } from 'react';
import type { ColorPalette, PaletteEntry, Theme } from '@/lib/types';
import type { SpriteEditor } from '@/hooks/useSpriteEditor';
import CodeEditor from '@/components/studio/CodeEditor';
import PaletteBar from '@/components/studio/PaletteBar';
import PixelEditor from '@/components/studio/PixelEditor';

interface SpriteInputPanelProps {
  sprite: SpriteEditor;
  palette: PaletteEntry[];
  paletteId: string;
  paletteName: string;
  customPalettes: ColorPalette[];
  theme: Theme;
  colorLayerCount: number;
  onSelectPalette: (id: string) => void;
  onEditPalette: () => void;
}

/** Left panel: sprite source code, 2D painter and palette. */
export default function SpriteInputPanel({
  sprite,
  palette,
  paletteId,
  paletteName,
  customPalettes,
  theme,
  colorLayerCount,
  onSelectPalette,
  onEditPalette
}: SpriteInputPanelProps) {
  const [brushColor, setBrushColor] = useState(2);
  const { grid } = sprite;
  const spriteH = grid.length;
  const spriteW = spriteH > 0 ? grid[0].length : 0;

  return (
    <section className="panel panel-code" aria-label="Sprite Input">
      <div className="panel-header">
        <h2>1. JS / Sprite Input</h2>
        <div className="badge-row">
          <span className="badge">{spriteW} × {spriteH} px</span>
          <span className="badge badge-accent">
            {colorLayerCount} color{colorLayerCount === 1 ? '' : 's'}
          </span>
        </div>
      </div>

      <div className="panel-body">
        {sprite.occurrences.length > 1 && (
          <div className="multi-sprite-bar">
            <label htmlFor="spriteOccurrenceSelect">Found multiple sprites in code:</label>
            <select
              id="spriteOccurrenceSelect"
              value={sprite.selectedOccurrenceIdx}
              onChange={e => sprite.selectOccurrence(parseInt(e.target.value, 10) || 0)}
            >
              {sprite.occurrences.map((occ, idx) => (
                <option key={idx} value={idx}>{occ.label}</option>
              ))}
            </select>
          </div>
        )}

        <CodeEditor
          codeText={sprite.codeText}
          grid={grid}
          onChange={sprite.applyCodeText}
          onFormat={sprite.formatCode}
          onClear={sprite.clearGrid}
        />

        <div className="pixel-editor-card">
          <PixelEditor
            grid={grid}
            palette={palette}
            theme={theme}
            brushColor={brushColor}
            onGridChange={sprite.updateGrid}
            onTrim={sprite.trim}
            onFlipH={sprite.flipH}
            onFlipV={sprite.flipV}
            onRotate={sprite.rotate}
          />

          <PaletteBar
            palette={palette}
            paletteId={paletteId}
            paletteName={paletteName}
            customPalettes={customPalettes}
            selectedColor={brushColor}
            onSelectColor={setBrushColor}
            onSelectPalette={onSelectPalette}
            onEditPalette={onEditPalette}
          />
        </div>
      </div>
    </section>
  );
}
