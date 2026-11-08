import type { Grid, PaletteEntry, PlaqueMeshEntry, StencilLayer, StencilSettings } from '@/lib/types';
import { DEFAULT_PALETTE } from '@/lib/constants/palettes';
import { sanitizeFilename } from '@/lib/utils/filename';
import { buildStencilMesh } from '@/lib/stencil/buildStencilMesh';
import { buildMultiColorPlaqueMeshes } from '@/lib/stencil/plaque';

export interface StencilBuild {
  layers: StencilLayer[];
  plaqueMeshes: PlaqueMeshEntry[];
}

/** Counts non-transparent pixels per palette index (1..15). */
function countColors(grid: Grid): { colorCounts: Map<number, number>; total: number } {
  const colorCounts = new Map<number, number>();
  let total = 0;
  for (const row of grid) {
    for (const idx of row) {
      if (idx > 0 && idx <= 15) {
        colorCounts.set(idx, (colorCounts.get(idx) || 0) + 1);
        total++;
      }
    }
  }
  return { colorCounts, total };
}

/**
 * Generates every stencil layer (silhouette + one per used color) plus the
 * multi-color plaque parts for a sprite grid.
 */
export function buildStencilLayers(
  grid: Grid,
  settings: StencilSettings,
  palette: PaletteEntry[],
  projectName: string
): StencilBuild {
  const { colorCounts, total } = countColors(grid);
  const projPrefix = sanitizeFilename(projectName);
  const layers: StencilLayer[] = [];
  let orderCounter = 1;

  if (settings.includeSilhouette && total > 0) {
    const isHole = grid.map(row => row.map(c => c > 0));
    layers.push({
      key: 'silhouette',
      title: 'Base Silhouette (All Pixels)',
      shortName: `${projPrefix}_Stencil_00_Silhouette`,
      colorIndex: 0,
      colorChar: 'ALL',
      colorHex: '#64748b',
      pixelCount: total,
      mesh: buildStencilMesh(grid, isHole, settings, orderCounter++)
    });
  }

  const sortedColors = Array.from(colorCounts.keys()).sort((a, b) => a - b);
  for (const colorIdx of sortedColors) {
    const pEntry = palette[colorIdx] || DEFAULT_PALETTE[colorIdx];
    const isHole = grid.map(row => row.map(c => c === colorIdx));
    layers.push({
      key: `color_${colorIdx}`,
      title: `Color ${pEntry.char.toUpperCase()} — ${pEntry.name}`,
      shortName: `${projPrefix}_Stencil_${pEntry.char.toUpperCase()}_${pEntry.name.replace(/\s+/g, '')}`,
      colorIndex: colorIdx,
      colorChar: pEntry.char.toUpperCase(),
      colorHex: pEntry.hex,
      pixelCount: colorCounts.get(colorIdx) || 0,
      mesh: buildStencilMesh(grid, isHole, settings, orderCounter++)
    });
  }

  if (layers.length === 0) {
    const isHole = grid.map(row => row.map(() => false));
    layers.push({
      key: 'blank',
      title: 'Blank Plate (No Pixels Painted)',
      shortName: `${projPrefix}_Stencil_Blank`,
      colorIndex: 1,
      colorChar: '-',
      colorHex: '#64748b',
      pixelCount: 0,
      mesh: buildStencilMesh(grid, isHole, settings, 1)
    });
  }

  return { layers, plaqueMeshes: buildMultiColorPlaqueMeshes(grid, settings, palette) };
}
