import type { Grid, StencilMesh, StencilSettings } from '@/lib/types';
import { roundCoord, dedupSorted } from '@/lib/utils/math';
import { analyzeAndBridgeIslands } from '@/lib/stencil/islands';
import { compressRectilinearGrid, compileHeightfieldToManifoldMesh } from '@/lib/stencil/heightfield';

interface Rect {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

export function buildStencilMesh(
  grid: Grid,
  isHoleGrid: boolean[][],
  options: StencilSettings,
  layerOrderIndex = 1
): StencilMesh {
  const H = grid.length;
  const W = H > 0 ? grid[0].length : 0;

  const pixelSize = Math.max(0.5, Number(options.pixelSize) || 4.0);
  const thickness = Math.max(0.2, Number(options.thickness) || 1.2);
  const margin = Math.max(1.0, Number(options.margin) || 8.0);
  const cutoutMode = options.cutoutMode || 'grid';
  const rawBridgeW = Math.max(0.2, Number(options.bridgeWidth) || 0.8);
  const bridgeW = Math.min(rawBridgeW, pixelSize * 0.65);

  const plateW = W * pixelSize + 2 * margin;
  const plateH = H * pixelSize + 2 * margin;

  const autoBridge = cutoutMode === 'merged-bridged';
  const islandInfo = analyzeAndBridgeIslands(isHoleGrid, autoBridge);

  const xCoords = new Set([0, margin, plateW - margin, plateW]);
  const yCoords = new Set([0, margin, plateH - margin, plateH]);

  const halfBridge = bridgeW * 0.5;

  for (let c = 0; c <= W; c++) {
    const xBase = margin + c * pixelSize;
    xCoords.add(roundCoord(xBase));
    if (c < W) {
      if (cutoutMode === 'grid') {
        xCoords.add(roundCoord(xBase + halfBridge));
        xCoords.add(roundCoord(xBase + pixelSize - halfBridge));
      } else {
        const midX = xBase + pixelSize * 0.5;
        xCoords.add(roundCoord(midX - halfBridge));
        xCoords.add(roundCoord(midX + halfBridge));
      }
    }
  }

  for (let r = 0; r <= H; r++) {
    const yBase = margin + r * pixelSize;
    yCoords.add(roundCoord(yBase));
    if (r < H) {
      if (cutoutMode === 'grid') {
        yCoords.add(roundCoord(yBase + halfBridge));
        yCoords.add(roundCoord(yBase + pixelSize - halfBridge));
      } else {
        const midY = yBase + pixelSize * 0.5;
        yCoords.add(roundCoord(midY - halfBridge));
        yCoords.add(roundCoord(midY + halfBridge));
      }
    }
  }

  const regHoles: Rect[] = [];
  if (options.regHoles && options.regHoles !== 'none') {
    const holeSize = Math.min(margin * 0.6, Math.max(1.0, Number(options.regHoleSize) || 3.2));
    const hHalf = holeSize * 0.5;
    const cOffset = margin * 0.5;

    const centers = [
      [cOffset, cOffset],
      [plateW - cOffset, cOffset],
      [cOffset, plateH - cOffset]
    ];
    if (options.regHoles === 'corners4') {
      centers.push([plateW - cOffset, plateH - cOffset]);
    }

    for (const [cx, cy] of centers) {
      const hx0 = roundCoord(cx - hHalf);
      const hx1 = roundCoord(cx + hHalf);
      const hy0 = roundCoord(cy - hHalf);
      const hy1 = roundCoord(cy + hHalf);
      xCoords.add(hx0);
      xCoords.add(hx1);
      yCoords.add(hy0);
      yCoords.add(hy1);
      regHoles.push({ x0: hx0, x1: hx1, y0: hy0, y1: hy1 });
    }
  }

  const embossRects: Rect[] = [];
  const embossHeight = 0.6;
  if (options.embossId && layerOrderIndex > 0 && margin >= 3.0) {
    const pipCount = Math.min(16, layerOrderIndex);
    const pipW = Math.min(2.2, Math.max(1.2, (plateW - 2 * margin) / 24));
    const pipH = Math.min(margin * 0.45, 2.8);
    const pipGap = pipW * 0.75;
    const startX = margin + 1.0;
    const py0 = roundCoord(plateH - margin * 0.5 - pipH * 0.5);
    const py1 = roundCoord(plateH - margin * 0.5 + pipH * 0.5);
    yCoords.add(py0);
    yCoords.add(py1);

    for (let i = 0; i < pipCount; i++) {
      const px0 = roundCoord(startX + i * (pipW + pipGap));
      const px1 = roundCoord(px0 + pipW);
      if (px1 < plateW - margin) {
        xCoords.add(px0);
        xCoords.add(px1);
        embossRects.push({ x0: px0, x1: px1, y0: py0, y1: py1 });
      }
    }
  }

  let X = Array.from(xCoords).filter(v => v >= 0 && v <= plateW).sort((a, b) => a - b);
  let Y = Array.from(yCoords).filter(v => v >= 0 && v <= plateH).sort((a, b) => a - b);

  X = dedupSorted(X, 1e-3);
  Y = dedupSorted(Y, 1e-3);

  const nx = X.length - 1;
  const ny = Y.length - 1;

  const cellZ = Array.from({ length: nx }, (_, ix) => {
    const mx = 0.5 * (X[ix] + X[ix + 1]);
    return Array.from({ length: ny }, (__, iy) => {
      const my = 0.5 * (Y[iy] + Y[iy + 1]);

      for (const rh of regHoles) {
        if (mx > rh.x0 && mx < rh.x1 && my > rh.y0 && my < rh.y1) {
          return 0;
        }
      }

      if (mx > margin && mx < plateW - margin && my > margin && my < plateH - margin) {
        const col = Math.floor((mx - margin) / pixelSize);
        const rowFromBottom = Math.floor((my - margin) / pixelSize);
        const row = H - 1 - rowFromBottom;

        if (row >= 0 && row < H && col >= 0 && col < W) {
          const localX = (mx - margin) - col * pixelSize;
          const localY = (my - margin) - rowFromBottom * pixelSize;

          if (cutoutMode === 'grid') {
            if (isHoleGrid[row][col]) {
              if (
                localX > halfBridge &&
                localX < pixelSize - halfBridge &&
                localY > halfBridge &&
                localY < pixelSize - halfBridge
              ) {
                return 0;
              }
            }
            return thickness;
          } else {
            const mode = islandInfo.cellMode[row][col];
            if (mode === 'hole') return 0;
            if (mode === 'bridgeV') {
              const midX = pixelSize * 0.5;
              return (localX > midX - halfBridge && localX < midX + halfBridge) ? thickness : 0;
            }
            if (mode === 'bridgeH') {
              const midY = pixelSize * 0.5;
              return (localY > midY - halfBridge && localY < midY + halfBridge) ? thickness : 0;
            }
            return thickness;
          }
        }
      }

      for (const er of embossRects) {
        if (mx > er.x0 && mx < er.x1 && my > er.y0 && my < er.y1) {
          return roundCoord(thickness + embossHeight);
        }
      }

      return thickness;
    });
  });

  const compressed = compressRectilinearGrid(X, Y, cellZ);
  const mesh = compileHeightfieldToManifoldMesh(compressed.X, compressed.Y, compressed.cellZ);

  return {
    ...mesh,
    plateW,
    plateH,
    thickness,
    islandInfo: {
      initialIslandCount: cutoutMode === 'grid' ? 0 : islandInfo.initialIslandCount,
      remainingIslandCount: cutoutMode === 'grid' ? 0 : islandInfo.remainingIslandCount,
      addedBridgeCells: cutoutMode === 'grid' ? 0 : islandInfo.addedBridgeCells
    }
  };
}
