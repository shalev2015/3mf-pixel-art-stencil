import type { CellMode, IslandAnalysis } from '@/lib/types';

type Cell = [number, number];

export function analyzeAndBridgeIslands(isHoleGrid: boolean[][], autoBridge: boolean): IslandAnalysis {
  const H = isHoleGrid.length;
  const W = H > 0 ? isHoleGrid[0].length : 0;

  const cellMode: CellMode[][] = Array.from({ length: H }, (_, r) =>
    Array.from({ length: W }, (_, c): CellMode => (isHoleGrid[r][c] ? 'hole' : 'solid'))
  );

  function computeAnchoredAndIslands() {
    const anchored = Array.from({ length: H }, () => new Array(W).fill(false));
    const queue: Cell[] = [];

    const isPassable = (r: number, c: number): boolean => cellMode[r][c] !== 'hole';

    for (let r = 0; r < H; r++) {
      for (let c = 0; c < W; c++) {
        if ((r === 0 || r === H - 1 || c === 0 || c === W - 1) && isPassable(r, c)) {
          anchored[r][c] = true;
          queue.push([r, c]);
        }
      }
    }

    const dirs: Cell[] = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    let head = 0;
    while (head < queue.length) {
      const [r, c] = queue[head++];
      for (const [dr, dc] of dirs) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < H && nc >= 0 && nc < W && !anchored[nr][nc] && isPassable(nr, nc)) {
          anchored[nr][nc] = true;
          queue.push([nr, nc]);
        }
      }
    }

    const visitedIsland = Array.from({ length: H }, () => new Array(W).fill(false));
    const islands: Cell[][] = [];

    for (let r = 0; r < H; r++) {
      for (let c = 0; c < W; c++) {
        if (cellMode[r][c] === 'solid' && !anchored[r][c] && !visitedIsland[r][c]) {
          const comp: Cell[] = [];
          const q: Cell[] = [[r, c]];
          visitedIsland[r][c] = true;
          while (q.length > 0) {
            const [cr, cc] = q.pop() as Cell;
            comp.push([cr, cc]);
            for (const [dr, dc] of dirs) {
              const nr = cr + dr;
              const nc = cc + dc;
              if (
                nr >= 0 && nr < H && nc >= 0 && nc < W &&
                cellMode[nr][nc] === 'solid' && !anchored[nr][nc] && !visitedIsland[nr][nc]
              ) {
                visitedIsland[nr][nc] = true;
                q.push([nr, nc]);
              }
            }
          }
          islands.push(comp);
        }
      }
    }

    return { anchored, islands };
  }

  let { anchored, islands } = computeAnchoredAndIslands();
  const initialIslandCount = islands.length;
  let addedBridgeCells = 0;

  if (autoBridge && islands.length > 0) {
    let safety = 0;
    while (islands.length > 0 && safety++ < 256) {
      const island = islands[0];
      let bestRay: { cells: Cell[]; bridgeType: CellMode } | null = null;

      for (const [ir, ic] of island) {
        const directions: { dr: number; dc: number; bridgeType: CellMode }[] = [
          { dr: -1, dc: 0, bridgeType: 'bridgeV' },
          { dr: 1, dc: 0, bridgeType: 'bridgeV' },
          { dr: 0, dc: -1, bridgeType: 'bridgeH' },
          { dr: 0, dc: 1, bridgeType: 'bridgeH' }
        ];

        for (const { dr, dc, bridgeType } of directions) {
          const cellsToBridge: Cell[] = [];
          let r = ir + dr;
          let c = ic + dc;
          let reachedAnchor = false;

          while (r >= 0 && r < H && c >= 0 && c < W) {
            if (anchored[r][c]) {
              reachedAnchor = true;
              break;
            }
            if (cellMode[r][c] === 'hole') {
              cellsToBridge.push([r, c]);
            }
            r += dr;
            c += dc;
          }

          if (r < 0 || r >= H || c < 0 || c >= W) {
            reachedAnchor = true;
          }

          if (reachedAnchor && cellsToBridge.length > 0) {
            if (!bestRay || cellsToBridge.length < bestRay.cells.length) {
              bestRay = { cells: cellsToBridge, bridgeType };
            }
          }
        }
      }

      if (!bestRay) break;

      for (const [br, bc] of bestRay.cells) {
        cellMode[br][bc] = bestRay.bridgeType;
        addedBridgeCells++;
      }

      const updated = computeAnchoredAndIslands();
      anchored = updated.anchored;
      islands = updated.islands;
    }
  }

  return {
    cellMode,
    initialIslandCount,
    remainingIslandCount: islands.length,
    addedBridgeCells
  };
}
