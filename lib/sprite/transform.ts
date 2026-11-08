import type { Grid } from '@/lib/types';

/** Crops transparent borders. Returns the original grid if it has no pixels. */
export function trimGrid(grid: Grid): Grid {
  const H = grid.length;
  const W = H > 0 ? grid[0].length : 0;
  let rMin = H, rMax = -1, cMin = W, cMax = -1;
  for (let r = 0; r < H; r++) {
    for (let c = 0; c < W; c++) {
      if (grid[r][c] > 0) {
        rMin = Math.min(rMin, r);
        rMax = Math.max(rMax, r);
        cMin = Math.min(cMin, c);
        cMax = Math.max(cMax, c);
      }
    }
  }
  if (rMax < rMin || cMax < cMin) return grid;
  return grid.slice(rMin, rMax + 1).map(row => row.slice(cMin, cMax + 1));
}

export function flipHorizontal(grid: Grid): Grid {
  return grid.map(row => [...row].reverse());
}

export function flipVertical(grid: Grid): Grid {
  return [...grid].reverse();
}

/** Rotates the grid 90° clockwise. */
export function rotate90(grid: Grid): Grid {
  const H = grid.length;
  const W = H > 0 ? grid[0].length : 0;
  return Array.from({ length: W }, (_, c) => Array.from({ length: H }, (__, r) => grid[H - 1 - r][c]));
}

/** Returns a copy of `grid` with one pixel replaced. */
export function setPixel(grid: Grid, row: number, col: number, value: number): Grid {
  return grid.map((r, rIdx) => (rIdx === row ? r.map((c, cIdx) => (cIdx === col ? value : c)) : r));
}
