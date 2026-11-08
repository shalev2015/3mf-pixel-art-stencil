'use client';

import { useCallback, useState } from 'react';
import type { Grid, PaletteEntry, SpriteOccurrence } from '@/lib/types';
import { PRESET_SPRITES } from '@/lib/constants/sprites';
import { createBlankGrid } from '@/lib/sprite/grid';
import { importImageFile } from '@/lib/sprite/imageImport';
import { parseSpriteInput } from '@/lib/sprite/parser';
import { gridToSpriteString } from '@/lib/sprite/serialize';
import { flipHorizontal, flipVertical, rotate90, trimGrid } from '@/lib/sprite/transform';

/** Sprite source text, the parsed pixel grid and the edits that keep both in sync. */
export function useSpriteEditor() {
  const [codeText, setCodeText] = useState(PRESET_SPRITES.duck.code);
  const [occurrences, setOccurrences] = useState<SpriteOccurrence[]>([]);
  const [selectedOccurrenceIdx, setSelectedOccurrenceIdx] = useState(0);
  const [grid, setGrid] = useState<Grid>(
    () => parseSpriteInput(PRESET_SPRITES.duck.code).occurrences[0].grid
  );

  /** Replaces the source text and re-parses every sprite it contains. */
  const applyCodeText = useCallback((rawCode: string) => {
    setCodeText(rawCode);
    const parsed = parseSpriteInput(rawCode);
    setOccurrences(parsed.occurrences);
    setSelectedOccurrenceIdx(0);
    setGrid(parsed.occurrences[0].grid);
  }, []);

  /** Sets the grid (after a paint / transform) and rewrites the source text from it. */
  const updateGrid = useCallback((nextGrid: Grid) => {
    setGrid(nextGrid);
    setCodeText(gridToSpriteString(nextGrid));
    setOccurrences([
      { label: `Sprite (${nextGrid[0]?.length || 0}×${nextGrid.length})`, grid: nextGrid }
    ]);
  }, []);

  const selectOccurrence = useCallback(
    (idx: number) => {
      if (!occurrences[idx]) return;
      setSelectedOccurrenceIdx(idx);
      setGrid(occurrences[idx].grid.map(r => [...r]));
    },
    [occurrences]
  );

  const formatCode = useCallback(() => setCodeText(gridToSpriteString(grid)), [grid]);

  const clearGrid = useCallback(() => {
    updateGrid(createBlankGrid(grid[0]?.length || 16, grid.length || 16));
  }, [grid, updateGrid]);

  const trim = useCallback(() => updateGrid(trimGrid(grid)), [grid, updateGrid]);
  const flipH = useCallback(() => updateGrid(flipHorizontal(grid)), [grid, updateGrid]);
  const flipV = useCallback(() => updateGrid(flipVertical(grid)), [grid, updateGrid]);
  const rotate = useCallback(() => updateGrid(rotate90(grid)), [grid, updateGrid]);

  const importImage = useCallback(
    async (file: File, palette: PaletteEntry[]) => {
      const imported = await importImageFile(file, palette);
      if (imported) updateGrid(imported);
    },
    [updateGrid]
  );

  return {
    codeText,
    grid,
    occurrences,
    selectedOccurrenceIdx,
    applyCodeText,
    updateGrid,
    selectOccurrence,
    formatCode,
    clearGrid,
    trim,
    flipH,
    flipV,
    rotate,
    importImage
  };
}

export type SpriteEditor = ReturnType<typeof useSpriteEditor>;
