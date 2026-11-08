import type { Grid, PaletteEntry, PlaqueMeshEntry, StencilSettings } from '@/lib/types';
import { DEFAULT_PALETTE } from '@/lib/constants/palettes';
import { roundCoord } from '@/lib/utils/math';
import { compressRectilinearGrid, compileHeightfieldToManifoldMesh } from '@/lib/stencil/heightfield';

export function buildMultiColorPlaqueMeshes(
  grid: Grid,
  options: StencilSettings,
  palette?: PaletteEntry[]
): PlaqueMeshEntry[] {
  const H = grid.length;
  const W = H > 0 ? grid[0].length : 0;
  const pixelSize = Math.max(0.5, Number(options.pixelSize) || 4.0);
  const baseThickness = Math.max(0.4, Number(options.thickness) || 1.2);
  const reliefHeight = Math.max(0.6, baseThickness * 0.8);
  const margin = Math.max(1.0, Number(options.margin) || 8.0);

  const plateW = W * pixelSize + 2 * margin;
  const plateH = H * pixelSize + 2 * margin;

  const meshes: PlaqueMeshEntry[] = [];

  const baseX = [0, plateW];
  const baseY = [0, plateH];
  const baseCellZ = [[baseThickness]];
  const baseMesh = compileHeightfieldToManifoldMesh(baseX, baseY, baseCellZ, 0);
  meshes.push({
    key: 'plaque_base',
    name: 'Backing_Plate',
    colorHex: '#24292f',
    colorIndex: 15,
    mesh: { ...baseMesh, plateW, plateH }
  });

  const X = Array.from({ length: W + 1 }, (_, c) => roundCoord(margin + c * pixelSize));
  const Y = Array.from({ length: H + 1 }, (_, r) => roundCoord(margin + r * pixelSize));

  for (let colorIdx = 1; colorIdx <= 15; colorIdx++) {
    let count = 0;
    const cellZ = Array.from({ length: W }, (_, col) =>
      Array.from({ length: H }, (__, rowFromBottom) => {
        const row = H - 1 - rowFromBottom;
        if (grid[row][col] === colorIdx) {
          count++;
          return roundCoord(baseThickness + reliefHeight);
        }
        return roundCoord(baseThickness);
      })
    );

    if (count > 0) {
      const comp = compressRectilinearGrid(X, Y, cellZ);
      const colorMesh = compileHeightfieldToManifoldMesh(
        comp.X,
        comp.Y,
        comp.cellZ,
        roundCoord(baseThickness)
      );
      const pEntry = (palette && palette[colorIdx]) || DEFAULT_PALETTE[colorIdx];
      meshes.push({
        key: `plaque_color_${colorIdx}`,
        name: `Pixels_${pEntry.char.toUpperCase()}_${pEntry.name.replace(/\s+/g, '')}`,
        colorHex: pEntry.hex,
        colorIndex: colorIdx,
        pixelCount: count,
        mesh: { ...colorMesh, plateW, plateH }
      });
    }
  }

  return meshes;
}
