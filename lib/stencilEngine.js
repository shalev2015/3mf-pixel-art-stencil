/**
 * Pure Client-Side Engine for MakeCode Arcade .3MF Stenciler
 * Includes:
 * - MakeCode Arcade 16-color palette & sprite presets
 * - MakeCode `img`...`` / `hex`...`` / marquee parser & serializer
 * - Connected-component floating island detector & auto-bridge solver
 * - T-junction-free rectilinear heightfield -> watertight 2-manifold triangle mesh compiler
 * - Pure-JS CRC32 ZIP + 3MF XML archive generator & binary STL exporter
 */

export const STORAGE_KEY = 'makecode_arcade_3mf_stenciler_projects_v1';

export const DEFAULT_MAKECODE_PALETTE = [
  { index: 0, char: '.', hex: '#000000', name: 'Transparent', transparent: true },
  { index: 1, char: '1', hex: '#ffffff', name: 'White' },
  { index: 2, char: '2', hex: '#ff2121', name: 'Red' },
  { index: 3, char: '3', hex: '#ff93c4', name: 'Pink' },
  { index: 4, char: '4', hex: '#ff8135', name: 'Orange' },
  { index: 5, char: '5', hex: '#fff609', name: 'Yellow' },
  { index: 6, char: '6', hex: '#249ca3', name: 'Teal' },
  { index: 7, char: '7', hex: '#78dc52', name: 'Green' },
  { index: 8, char: '8', hex: '#003fad', name: 'Blue' },
  { index: 9, char: '9', hex: '#87f2ff', name: 'Light Blue' },
  { index: 10, char: 'a', hex: '#8e2ec4', name: 'Purple' },
  { index: 11, char: 'b', hex: '#a4839f', name: 'Light Purple' },
  { index: 12, char: 'c', hex: '#5c406c', name: 'Dark Purple' },
  { index: 13, char: 'd', hex: '#e5cdc4', name: 'Tan' },
  { index: 14, char: 'e', hex: '#91463d', name: 'Brown' },
  { index: 15, char: 'f', hex: '#000000', name: 'Black' }
];

export const PRESET_SPRITES = {
  duck: {
    title: 'Duck',
    subtitle: '16×16 · 6 colors',
    code: `let mySprite = sprites.create(img\`
    . . . . . . . . . . b 5 b . . .
    . . . . . . . . . b 5 b . . . .
    . . . . . . b b b b b b . . . .
    . . . . . b b 5 5 5 5 5 b . . .
    . . . . b b 5 d 1 f 5 d 4 c . .
    . . . . b 5 5 1 f f d d 4 4 4 b
    . . . . b 5 5 d f b 4 4 4 4 b .
    . . . b d 5 5 5 5 4 4 4 4 b . .
    . . b d d 5 5 5 5 5 5 5 5 b . .
    . b d d d d 5 5 5 5 5 5 5 5 b .
    b d d d b b b 5 5 5 5 5 5 5 b .
    c d d b 5 5 d c 5 5 5 5 5 5 b .
    c b b d 5 d c d 5 5 5 5 5 5 b .
    . b 5 5 b c d d 5 5 5 5 5 d b .
    b b c c c d d d d 5 5 5 b b . .
    . . . c c c c c c c c b b . . .
\`, SpriteKind.Player)`
  },

  burger: {
    title: 'Burger',
    subtitle: '16×16 · 7 colors',
    code: `let burger = sprites.create(img\`
    . . . . c c c b b b b b . . . .
    . . c c b 4 4 4 4 4 4 b b b . .
    . c b 4 4 4 4 d 4 4 4 4 4 b c .
    . c 4 4 4 4 4 4 4 4 4 4 d 4 c .
    c b 4 4 4 4 4 4 4 4 4 4 4 4 b c
    c b 4 4 4 4 d 4 4 4 4 4 4 4 b c
    c b b 4 4 4 4 4 4 4 4 4 4 b b c
    c c b b b b b b b b b b b b c c
    7 7 7 7 7 7 7 7 7 7 7 7 7 7 7 7
    . 7 7 7 2 2 2 7 7 7 2 2 2 7 7 .
    . c 5 5 5 5 5 5 5 5 5 5 5 5 c .
    c e e e e 5 5 5 e e e e e e e c
    c e e e e e 5 e e e e e e e e c
    . c e e e e e e e e e e e e c .
    . c b 4 4 4 4 4 4 4 4 4 4 b c .
    . . c c c c c c c c c c c c . .
\`, SpriteKind.Food)`
  },

  invader: {
    title: 'Alien',
    subtitle: '16×10 · 3 colors',
    code: `img\`
    . . . 7 7 . . . . . . 7 7 . . .
    . . . . 7 7 . . . . 7 7 . . . .
    . . . 7 7 7 7 7 7 7 7 7 7 . . .
    . . 7 7 1 1 7 7 7 7 1 1 7 7 . .
    . 7 7 7 1 f 7 7 7 7 1 f 7 7 7 .
    . 7 7 7 7 7 7 7 7 7 7 7 7 7 7 .
    . 7 . 7 7 7 7 7 7 7 7 7 7 . 7 .
    . 7 . 7 . . . . . . . . 7 . 7 .
    . . . . 7 7 7 . . 7 7 7 . . . .
    . . . 7 7 . . . . . . 7 7 . . .
\``
  },

  heart: {
    title: 'Heart',
    subtitle: '16×15 · 2 colors',
    code: `img\`
    . . . . . . . . . . . . . . . .
    . . 2 2 2 2 . . . . 2 2 2 2 . .
    . 2 2 2 2 2 2 . . 2 2 2 2 2 2 .
    2 2 1 1 2 2 2 2 2 2 2 2 2 2 2 2
    2 2 1 2 2 2 2 2 2 2 2 2 2 2 2 2
    2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2
    2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2
    . 2 2 2 2 2 2 2 2 2 2 2 2 2 2 .
    . . 2 2 2 2 2 2 2 2 2 2 2 2 . .
    . . . 2 2 2 2 2 2 2 2 2 2 . . .
    . . . . 2 2 2 2 2 2 2 2 . . . .
    . . . . . 2 2 2 2 2 2 . . . . .
    . . . . . . 2 2 2 2 . . . . . .
    . . . . . . . 2 2 . . . . . . .
    . . . . . . . . . . . . . . . .
\``
  },

  sword: {
    title: 'Sword',
    subtitle: '16×16 · 4 colors',
    code: `img\`
    . . . . . . . . . . . . . 9 9 9
    . . . . . . . . . . . . 9 9 1 9
    . . . . . . . . . . . 9 9 1 9 9
    . . . . . . . . . . 9 9 1 9 9 .
    . . . . . . . . . 9 9 1 9 9 . .
    . . . . . . . . 9 9 1 9 9 . . .
    . . . 5 5 . . 9 9 1 9 9 . . . .
    . . . 5 5 5 9 9 1 9 9 . . . . .
    . . . . 5 5 5 1 9 9 . . . . . .
    . . . . . 5 5 5 9 . . . . . . .
    . . . . e e 5 5 5 5 . . . . . .
    . . . e e e . 5 5 5 . . . . . .
    . . e e e . . . . . . . . . . .
    . 5 5 e . . . . . . . . . . . .
    . 5 5 . . . . . . . . . . . . .
    . . . . . . . . . . . . . . . .
\``
  },

  ghost: {
    title: 'Ghost',
    subtitle: '16×14 · 5 colors',
    code: `img\`
    . . . . . 9 9 9 9 9 9 . . . . .
    . . . 9 9 9 1 1 1 1 9 9 9 . . .
    . . 9 9 1 1 1 1 1 1 1 1 9 9 . .
    . 9 9 1 1 f f 1 1 f f 1 1 9 9 .
    . 9 1 1 1 f 8 1 1 f 8 1 1 1 9 .
    . 9 1 1 1 1 1 1 1 1 1 1 1 1 9 .
    9 9 1 1 3 3 1 1 1 1 3 3 1 1 9 9
    9 1 1 1 1 1 1 f f 1 1 1 1 1 1 9
    9 1 1 1 1 1 1 1 1 1 1 1 1 1 1 9
    9 9 1 1 1 1 1 1 1 1 1 1 1 1 9 9
    . 9 9 1 1 1 1 1 1 1 1 1 1 9 9 .
    . 9 9 9 1 1 1 1 1 1 1 1 9 9 9 .
    . 9 9 . 9 9 1 1 1 1 9 9 . 9 9 .
    . 9 . . . 9 9 . . 9 9 . . . 9 .
\``
  },

  cat: {
    title: 'Cat',
    subtitle: '16×15 · 6 colors',
    code: `img\`
    . . e e . . . . . . . . e e . .
    . e 4 4 e . . . . . . e 4 4 e .
    . e 4 3 4 e e e e e e 4 3 4 e .
    . e 4 4 4 4 4 4 4 4 4 4 4 4 e .
    e 4 4 4 4 e 4 4 4 4 e 4 4 4 4 e
    e 4 4 1 f 4 4 4 4 4 4 1 f 4 4 e
    e 4 4 1 f 4 4 4 4 4 4 1 f 4 4 e
    e 4 4 4 4 4 4 3 3 4 4 4 4 4 4 e
    d 4 4 4 4 4 f 4 4 f 4 4 4 4 4 d
    . e d d d d d d d d d d d d e .
    . . e e e d d d d d d e e e . .
    . . . d 4 4 d d d d 4 4 d . . .
    . . . d 4 4 d d d d 4 4 d . . .
    . . . d 4 4 d d d d 4 4 d . . .
    . . . c d d c . . c d d c . . .
\``
  }
};

export function getDefaultSettings() {
  return {
    pixelSize: 4.0,
    thickness: 1.2,
    margin: 8.0,
    cutoutMode: 'grid',
    bridgeWidth: 0.8,
    regHoles: 'asymmetric3',
    regHoleSize: 3.2,
    embossId: true,
    includeSilhouette: true
  };
}

export function generateId() {
  return 'proj_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
}

export function sanitizeFilename(name) {
  const clean = (name || 'Arcade_Stencil')
    .trim()
    .replace(/[^a-zA-Z0-9_\-]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return clean || 'Arcade_Stencil';
}

export function charToColorIndex(ch) {
  if (!ch || ch === '.') return 0;
  const lower = ch.toLowerCase();
  if (lower >= '0' && lower <= '9') return lower.charCodeAt(0) - 48;
  if (lower >= 'a' && lower <= 'f') return lower.charCodeAt(0) - 87;
  return null;
}

export function colorIndexToChar(idx) {
  if (!idx || idx <= 0) return '.';
  return idx.toString(16);
}

export function createBlankGrid(width, height) {
  return Array.from({ length: height }, () => new Array(width).fill(0));
}

export function gridToMakeCodeString(grid) {
  const lines = grid.map(row => '    ' + row.map(c => colorIndexToChar(c)).join(' '));
  return `img\`\n${lines.join('\n')}\n\``;
}

export function parseMakeCodeInput(rawText) {
  const text = (rawText || '').trim();
  if (!text) {
    return { occurrences: [{ label: 'Empty (8×8)', grid: createBlankGrid(8, 8) }] };
  }

  const regex = /(?:img|assets\.image|image)\s*`([\s\S]*?)`/gi;
  const occurrences = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    const inner = match[1];
    const grid = parseGridBody(inner);
    if (grid.length > 0 && grid[0].length > 0) {
      occurrences.push({
        label: `Sprite #${occurrences.length + 1} (${grid[0].length}×${grid.length})`,
        grid
      });
    }
  }

  if (occurrences.length > 0) {
    return { occurrences };
  }

  const hexMatch = /hex\s*`([0-9a-fA-F\s]+)`/.exec(text);
  if (hexMatch) {
    const hexGrid = parseMakeCodeHexBuffer(hexMatch[1]);
    if (hexGrid) {
      return {
        occurrences: [{
          label: `Hex Buffer Sprite (${hexGrid[0].length}×${hexGrid.length})`,
          grid: hexGrid
        }]
      };
    }
  }

  const fallbackGrid = parseGridBody(text);
  if (fallbackGrid.length > 0 && fallbackGrid[0].length > 0) {
    return {
      occurrences: [{
        label: `Sprite (${fallbackGrid[0].length}×${fallbackGrid.length})`,
        grid: fallbackGrid
      }]
    };
  }

  return { occurrences: [{ label: 'Default (8×8)', grid: createBlankGrid(8, 8) }] };
}

function parseGridBody(bodyText) {
  const rawLines = bodyText.split(/\r?\n/);
  const parsedRows = [];

  for (const rawLine of rawLines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('//') || line.startsWith('#')) continue;

    const tokens = line.split(/\s+/);
    let row = [];

    if (tokens.length > 1 && tokens.every(t => t.length === 1 && charToColorIndex(t) !== null)) {
      row = tokens.map(t => charToColorIndex(t));
    } else {
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === ' ' || ch === '\t') continue;
        const cIdx = charToColorIndex(ch);
        if (cIdx !== null) {
          row.push(cIdx);
        }
      }
    }

    if (row.length > 0) {
      parsedRows.push(row);
    }
  }

  if (parsedRows.length === 0) return [];

  const maxCols = Math.max(...parsedRows.map(r => r.length));
  return parsedRows.map(r => {
    if (r.length < maxCols) {
      return r.concat(new Array(maxCols - r.length).fill(0));
    }
    return r;
  });
}

function parseMakeCodeHexBuffer(hexStr) {
  const clean = hexStr.replace(/\s+/g, '');
  if (clean.length < 10) return null;
  const header = parseInt(clean.slice(0, 2), 16);
  if (header !== 0xe4 && header !== 0xe1) return null;
  const width = parseInt(clean.slice(2, 4), 16) | (parseInt(clean.slice(4, 6), 16) << 8);
  const height = parseInt(clean.slice(6, 8), 16) | (parseInt(clean.slice(8, 10), 16) << 8);
  if (width <= 0 || height <= 0 || width > 256 || height > 256) return null;

  const grid = createBlankGrid(width, height);
  const paddedH = (height + 1) & ~1;
  let nibbleIdx = 10;
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < paddedH; y += 2) {
      if (nibbleIdx + 1 >= clean.length) break;
      const byteVal = parseInt(clean.slice(nibbleIdx, nibbleIdx + 2), 16);
      nibbleIdx += 2;
      const low = byteVal & 0x0f;
      const high = (byteVal >> 4) & 0x0f;
      if (y < height) grid[y][x] = low;
      if (y + 1 < height) grid[y + 1][x] = high;
    }
  }
  return grid;
}

export function roundCoord(val) {
  return Math.round(val * 10000) / 10000;
}

function dedupSorted(arr, eps) {
  if (arr.length === 0) return [];
  const out = [arr[0]];
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] - out[out.length - 1] > eps) {
      out.push(arr[i]);
    }
  }
  return out;
}

export function analyzeAndBridgeIslands(isHoleGrid, autoBridge) {
  const H = isHoleGrid.length;
  const W = H > 0 ? isHoleGrid[0].length : 0;

  const cellMode = Array.from({ length: H }, (_, r) =>
    Array.from({ length: W }, (_, c) => (isHoleGrid[r][c] ? 'hole' : 'solid'))
  );

  function computeAnchoredAndIslands() {
    const anchored = Array.from({ length: H }, () => new Array(W).fill(false));
    const queue = [];

    const isPassable = (r, c) => cellMode[r][c] !== 'hole';

    for (let r = 0; r < H; r++) {
      for (let c = 0; c < W; c++) {
        if ((r === 0 || r === H - 1 || c === 0 || c === W - 1) && isPassable(r, c)) {
          anchored[r][c] = true;
          queue.push([r, c]);
        }
      }
    }

    const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
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
    const islands = [];

    for (let r = 0; r < H; r++) {
      for (let c = 0; c < W; c++) {
        if (cellMode[r][c] === 'solid' && !anchored[r][c] && !visitedIsland[r][c]) {
          const comp = [];
          const q = [[r, c]];
          visitedIsland[r][c] = true;
          while (q.length > 0) {
            const [cr, cc] = q.pop();
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
      let bestRay = null;

      for (const [ir, ic] of island) {
        const directions = [
          { dr: -1, dc: 0, bridgeType: 'bridgeV' },
          { dr: 1, dc: 0, bridgeType: 'bridgeV' },
          { dr: 0, dc: -1, bridgeType: 'bridgeH' },
          { dr: 0, dc: 1, bridgeType: 'bridgeH' }
        ];

        for (const { dr, dc, bridgeType } of directions) {
          const cellsToBridge = [];
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

export function buildStencilMesh(grid, isHoleGrid, options, layerOrderIndex = 1) {
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

  const regHoles = [];
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

  const embossRects = [];
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
  mesh.plateW = plateW;
  mesh.plateH = plateH;
  mesh.thickness = thickness;
  mesh.islandInfo = {
    initialIslandCount: cutoutMode === 'grid' ? 0 : islandInfo.initialIslandCount,
    remainingIslandCount: cutoutMode === 'grid' ? 0 : islandInfo.remainingIslandCount,
    addedBridgeCells: cutoutMode === 'grid' ? 0 : islandInfo.addedBridgeCells
  };

  return mesh;
}

function compressRectilinearGrid(X, Y, cellZ) {
  const nx = X.length - 1;
  const ny = Y.length - 1;

  const keepXIndices = [0];
  const keptCols = [cellZ[0]];

  for (let ix = 1; ix < nx; ix++) {
    const prevCol = keptCols[keptCols.length - 1];
    const currCol = cellZ[ix];
    let identical = true;
    for (let iy = 0; iy < ny; iy++) {
      if (prevCol[iy] !== currCol[iy]) {
        identical = false;
        break;
      }
    }
    if (!identical) {
      keepXIndices.push(ix);
      keptCols.push(currCol);
    }
  }
  keepXIndices.push(nx);

  const newX = keepXIndices.map(i => X[i]);
  const newNx = keptCols.length;

  const keepYIndices = [0];
  for (let iy = 1; iy < ny; iy++) {
    let identical = true;
    for (let ix = 0; ix < newNx; ix++) {
      if (keptCols[ix][iy - 1] !== keptCols[ix][iy]) {
        identical = false;
        break;
      }
    }
    if (!identical) {
      keepYIndices.push(iy);
    }
  }
  keepYIndices.push(ny);

  const newY = keepYIndices.map(j => Y[j]);
  const newNy = newY.length - 1;

  const newCellZ = Array.from({ length: newNx }, (_, ix) =>
    Array.from({ length: newNy }, (__, iy) => keptCols[ix][keepYIndices[iy]])
  );

  return { X: newX, Y: newY, cellZ: newCellZ };
}

function compileHeightfieldToManifoldMesh(X, Y, cellZ, zBottomValue = 0) {
  const nx = X.length - 1;
  const ny = Y.length - 1;

  const vertices = [];
  const vertexMap = new Map();
  const triangles = [];

  function getVertexIndex(ix, iy, zVal) {
    const zRound = roundCoord(zVal);
    const key = `${ix}_${iy}_${zRound}`;
    let idx = vertexMap.get(key);
    if (idx === undefined) {
      idx = vertices.length;
      vertices.push([X[ix], Y[iy], zRound]);
      vertexMap.set(key, idx);
    }
    return idx;
  }

  const zLevelsSet = new Set([roundCoord(zBottomValue)]);
  for (let ix = 0; ix < nx; ix++) {
    for (let iy = 0; iy < ny; iy++) {
      if (cellZ[ix][iy] > zBottomValue) {
        zLevelsSet.add(roundCoord(cellZ[ix][iy]));
      }
    }
  }
  const zLevels = Array.from(zLevelsSet).sort((a, b) => a - b);

  for (let ix = 0; ix < nx; ix++) {
    for (let iy = 0; iy < ny; iy++) {
      const h = cellZ[ix][iy];
      if (h <= zBottomValue) continue;

      const t00 = getVertexIndex(ix, iy, h);
      const t10 = getVertexIndex(ix + 1, iy, h);
      const t11 = getVertexIndex(ix + 1, iy + 1, h);
      const t01 = getVertexIndex(ix, iy + 1, h);
      triangles.push([t00, t10, t11]);
      triangles.push([t00, t11, t01]);

      const b00 = getVertexIndex(ix, iy, zBottomValue);
      const b10 = getVertexIndex(ix + 1, iy, zBottomValue);
      const b11 = getVertexIndex(ix + 1, iy + 1, zBottomValue);
      const b01 = getVertexIndex(ix, iy + 1, zBottomValue);
      triangles.push([b00, b11, b10]);
      triangles.push([b00, b01, b11]);
    }
  }

  function emitWallX(ix, iy, zLow, zHigh, normalPositiveX) {
    for (let k = 0; k < zLevels.length - 1; k++) {
      const z0 = zLevels[k];
      const z1 = zLevels[k + 1];
      if (z0 >= roundCoord(zLow) - 1e-5 && z1 <= roundCoord(zHigh) + 1e-5) {
        const p00 = getVertexIndex(ix, iy, z0);
        const p10 = getVertexIndex(ix, iy + 1, z0);
        const p11 = getVertexIndex(ix, iy + 1, z1);
        const p01 = getVertexIndex(ix, iy, z1);
        if (normalPositiveX) {
          triangles.push([p00, p10, p11]);
          triangles.push([p00, p11, p01]);
        } else {
          triangles.push([p00, p11, p10]);
          triangles.push([p00, p01, p11]);
        }
      }
    }
  }

  function emitWallY(ix, iy, zLow, zHigh, normalPositiveY) {
    for (let k = 0; k < zLevels.length - 1; k++) {
      const z0 = zLevels[k];
      const z1 = zLevels[k + 1];
      if (z0 >= roundCoord(zLow) - 1e-5 && z1 <= roundCoord(zHigh) + 1e-5) {
        const q00 = getVertexIndex(ix, iy, z0);
        const q10 = getVertexIndex(ix + 1, iy, z0);
        const q11 = getVertexIndex(ix + 1, iy, z1);
        const q01 = getVertexIndex(ix, iy, z1);
        if (normalPositiveY) {
          triangles.push([q00, q11, q10]);
          triangles.push([q00, q01, q11]);
        } else {
          triangles.push([q00, q10, q11]);
          triangles.push([q00, q11, q01]);
        }
      }
    }
  }

  for (let ix = 0; ix <= nx; ix++) {
    for (let iy = 0; iy < ny; iy++) {
      const hLeft = ix > 0 ? cellZ[ix - 1][iy] : zBottomValue;
      const hRight = ix < nx ? cellZ[ix][iy] : zBottomValue;
      if (hLeft > hRight) {
        emitWallX(ix, iy, hRight, hLeft, true);
      } else if (hRight > hLeft) {
        emitWallX(ix, iy, hLeft, hRight, false);
      }
    }
  }

  for (let iy = 0; iy <= ny; iy++) {
    for (let ix = 0; ix < nx; ix++) {
      const hBot = iy > 0 ? cellZ[ix][iy - 1] : zBottomValue;
      const hTop = iy < ny ? cellZ[ix][iy] : zBottomValue;
      if (hBot > hTop) {
        emitWallY(ix, iy, hTop, hBot, true);
      } else if (hTop > hBot) {
        emitWallY(ix, iy, hBot, hTop, false);
      }
    }
  }

  const manifoldCheck = verifyManifoldMesh(vertices, triangles);

  return {
    vertices,
    triangles,
    isManifold: manifoldCheck.isManifold,
    openEdges: manifoldCheck.openEdges,
    volumeMm3: manifoldCheck.volumeMm3
  };
}

export function verifyManifoldMesh(vertices, triangles) {
  const halfEdges = new Set();
  let duplicateHalfEdges = 0;
  let signedVol6 = 0;

  for (let i = 0; i < triangles.length; i++) {
    const [a, b, c] = triangles[i];
    const edges = [[a, b], [b, c], [c, a]];
    for (const [u, v] of edges) {
      const key = `${u}_${v}`;
      if (halfEdges.has(key)) duplicateHalfEdges++;
      halfEdges.add(key);
    }

    const va = vertices[a];
    const vb = vertices[b];
    const vc = vertices[c];
    signedVol6 +=
      va[0] * (vb[1] * vc[2] - vb[2] * vc[1]) -
      va[1] * (vb[0] * vc[2] - vb[2] * vc[0]) +
      va[2] * (vb[0] * vc[1] - vb[1] * vc[0]);
  }

  let unmatchedHalfEdges = 0;
  for (const key of halfEdges) {
    const sep = key.indexOf('_');
    const u = key.slice(0, sep);
    const v = key.slice(sep + 1);
    if (!halfEdges.has(`${v}_${u}`)) unmatchedHalfEdges++;
  }

  return {
    isManifold: duplicateHalfEdges === 0 && unmatchedHalfEdges === 0 && signedVol6 > 0,
    openEdges: unmatchedHalfEdges,
    volumeMm3: signedVol6 / 6.0
  };
}

export function buildMultiColorPlaqueMeshes(grid, options, palette) {
  const H = grid.length;
  const W = H > 0 ? grid[0].length : 0;
  const pixelSize = Math.max(0.5, Number(options.pixelSize) || 4.0);
  const baseThickness = Math.max(0.4, Number(options.thickness) || 1.2);
  const reliefHeight = Math.max(0.6, baseThickness * 0.8);
  const margin = Math.max(1.0, Number(options.margin) || 8.0);

  const plateW = W * pixelSize + 2 * margin;
  const plateH = H * pixelSize + 2 * margin;

  const meshes = [];

  const baseX = [0, plateW];
  const baseY = [0, plateH];
  const baseCellZ = [[baseThickness]];
  const baseMesh = compileHeightfieldToManifoldMesh(baseX, baseY, baseCellZ, 0);
  baseMesh.plateW = plateW;
  baseMesh.plateH = plateH;
  meshes.push({
    key: 'plaque_base',
    name: 'Backing_Plate',
    colorHex: '#24292f',
    colorIndex: 15,
    mesh: baseMesh
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
      colorMesh.plateW = plateW;
      colorMesh.plateH = plateH;
      const pEntry = (palette && palette[colorIdx]) || DEFAULT_MAKECODE_PALETTE[colorIdx];
      meshes.push({
        key: `plaque_color_${colorIdx}`,
        name: `Pixels_${pEntry.char.toUpperCase()}_${pEntry.name.replace(/\s+/g, '')}`,
        colorHex: pEntry.hex,
        colorIndex: colorIdx,
        pixelCount: count,
        mesh: colorMesh
      });
    }
  }

  return meshes;
}

export function computeBuildPlateLayout(layers, gapMm = 8.0) {
  const count = layers.length;
  const cols = Math.ceil(Math.sqrt(count));
  const plateW = layers[0]?.mesh.plateW || 60;
  const plateH = layers[0]?.mesh.plateH || 60;

  return layers.map((layer, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    return {
      layer,
      offsetX: roundCoord(col * (plateW + gapMm)),
      offsetY: roundCoord(row * (plateH + gapMm)),
      offsetZ: 0
    };
  });
}

// ============================================================================
// ZIP + 3MF & BINARY STL EXPORTERS
// ============================================================================

const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(uint8Arr) {
  let crc = 0xffffffff;
  for (let i = 0; i < uint8Arr.length; i++) {
    crc = CRC32_TABLE[(crc ^ uint8Arr[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createZipArchive(files) {
  const encoder = new TextEncoder();
  const localFileHeaders = [];
  const centralDirHeaders = [];
  let offset = 0;

  for (const file of files) {
    const nameBytes = encoder.encode(file.path);
    const dataBytes = file.data instanceof Uint8Array ? file.data : encoder.encode(file.data);
    const fileCrc = crc32(dataBytes);
    const size = dataBytes.length;

    const localHeader = new Uint8Array(30 + nameBytes.length);
    const lv = new DataView(localHeader.buffer);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(4, 20, true);
    lv.setUint16(6, 0x0800, true);
    lv.setUint16(8, 0, true);
    lv.setUint16(10, 0, true);
    lv.setUint16(12, 0x5821, true);
    lv.setUint32(14, fileCrc, true);
    lv.setUint32(18, size, true);
    lv.setUint32(22, size, true);
    lv.setUint16(26, nameBytes.length, true);
    lv.setUint16(28, 0, true);
    localHeader.set(nameBytes, 30);

    const centralHeader = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(centralHeader.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint16(8, 0x0800, true);
    cv.setUint16(10, 0, true);
    cv.setUint16(12, 0, true);
    cv.setUint16(14, 0x5821, true);
    cv.setUint32(16, fileCrc, true);
    cv.setUint32(20, size, true);
    cv.setUint32(24, size, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint16(30, 0, true);
    cv.setUint16(32, 0, true);
    cv.setUint16(34, 0, true);
    cv.setUint16(36, 0, true);
    cv.setUint32(38, 0, true);
    cv.setUint32(42, offset, true);
    centralHeader.set(nameBytes, 46);

    localFileHeaders.push(localHeader, dataBytes);
    centralDirHeaders.push(centralHeader);
    offset += localHeader.length + dataBytes.length;
  }

  let centralDirSize = 0;
  for (const ch of centralDirHeaders) centralDirSize += ch.length;

  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(4, 0, true);
  ev.setUint16(6, 0, true);
  ev.setUint16(8, files.length, true);
  ev.setUint16(10, files.length, true);
  ev.setUint32(12, centralDirSize, true);
  ev.setUint32(16, offset, true);
  ev.setUint16(20, 0, true);

  const totalSize = offset + centralDirSize + eocd.length;
  const out = new Uint8Array(totalSize);
  let pos = 0;
  for (const chunk of localFileHeaders) {
    out.set(chunk, pos);
    pos += chunk.length;
  }
  for (const chunk of centralDirHeaders) {
    out.set(chunk, pos);
    pos += chunk.length;
  }
  out.set(eocd, pos);
  return out;
}

export function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function generate3mfArchive(items, title = 'MakeCode Arcade Stencil') {
  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>
</Types>`;

  const relsXml = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/>
</Relationships>`;

  const materialEntries = items.map((item, idx) => {
    const cleanHex = (item.colorHex || '#3b82f6').replace('#', '').toUpperCase();
    const displayColor = `#${cleanHex.padEnd(6, '0')}FF`;
    return `      <base name="${escapeXml(item.name || `Material_${idx}`)}" displaycolor="${displayColor}"/>`;
  });

  const objectBlocks = [];
  const buildBlocks = [];

  items.forEach((item, idx) => {
    const objectId = idx + 2;
    const m = item.mesh;
    const vLines = new Array(m.vertices.length);
    for (let i = 0; i < m.vertices.length; i++) {
      const [vx, vy, vz] = m.vertices[i];
      vLines[i] = `          <vertex x="${vx}" y="${vy}" z="${vz}"/>`;
    }

    const tLines = new Array(m.triangles.length);
    for (let i = 0; i < m.triangles.length; i++) {
      const [v1, v2, v3] = m.triangles[i];
      tLines[i] = `          <triangle v1="${v1}" v2="${v2}" v3="${v3}"/>`;
    }

    objectBlocks.push(`    <object id="${objectId}" name="${escapeXml(item.name)}" type="model" pid="1" pindex="${idx}">
      <mesh>
        <vertices>
${vLines.join('\n')}
        </vertices>
        <triangles>
${tLines.join('\n')}
        </triangles>
      </mesh>
    </object>`);

    const tx = roundCoord(item.offsetX || 0);
    const ty = roundCoord(item.offsetY || 0);
    const tz = roundCoord(item.offsetZ || 0);
    buildBlocks.push(`    <item objectid="${objectId}" transform="1 0 0 0 1 0 0 0 1 ${tx} ${ty} ${tz}"/>`);
  });

  const modelXml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:m="http://schemas.microsoft.com/3dmanufacturing/material/2015/02">
  <metadata name="Title">${escapeXml(title)}</metadata>
  <metadata name="Application">MakeCode Arcade 3MF Stenciler</metadata>
  <resources>
    <basematerials id="1">
${materialEntries.join('\n')}
    </basematerials>
${objectBlocks.join('\n')}
  </resources>
  <build>
${buildBlocks.join('\n')}
  </build>
</model>`;

  return createZipArchive([
    { path: '[Content_Types].xml', data: contentTypesXml },
    { path: '_rels/.rels', data: relsXml },
    { path: '3D/3dmodel.model', data: modelXml }
  ]);
}

export function generateBinaryStl(mesh, headerTitle = 'MakeCode Arcade Stencil') {
  const triCount = mesh.triangles.length;
  const buf = new ArrayBuffer(84 + triCount * 50);
  const view = new DataView(buf);
  const headerBytes = new TextEncoder().encode(headerTitle.slice(0, 79));
  new Uint8Array(buf, 0, headerBytes.length).set(headerBytes);
  view.setUint32(80, triCount, true);

  let offset = 84;
  for (let i = 0; i < triCount; i++) {
    const [i0, i1, i2] = mesh.triangles[i];
    const v0 = mesh.vertices[i0];
    const v1 = mesh.vertices[i1];
    const v2 = mesh.vertices[i2];

    const ux = v1[0] - v0[0], uy = v1[1] - v0[1], uz = v1[2] - v0[2];
    const vx = v2[0] - v0[0], vy = v2[1] - v0[1], vz = v2[2] - v0[2];
    let nx = uy * vz - uz * vy;
    let ny = uz * vx - ux * vz;
    let nz = ux * vy - uy * vx;
    const len = Math.hypot(nx, ny, nz) || 1;
    nx /= len; ny /= len; nz /= len;

    view.setFloat32(offset, nx, true);
    view.setFloat32(offset + 4, ny, true);
    view.setFloat32(offset + 8, nz, true);

    view.setFloat32(offset + 12, v0[0], true);
    view.setFloat32(offset + 16, v0[1], true);
    view.setFloat32(offset + 20, v0[2], true);

    view.setFloat32(offset + 24, v1[0], true);
    view.setFloat32(offset + 28, v1[1], true);
    view.setFloat32(offset + 32, v1[2], true);

    view.setFloat32(offset + 36, v2[0], true);
    view.setFloat32(offset + 40, v2[1], true);
    view.setFloat32(offset + 44, v2[2], true);

    view.setUint16(offset + 48, 0, true);
    offset += 50;
  }

  return new Uint8Array(buf);
}

export function triggerFileDownload(uint8Array, filename, mimeType = 'application/octet-stream') {
  const blob = new Blob([uint8Array], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 200);
}

export function hexToRgbNormalized(hexStr) {
  const clean = (hexStr || '#3b82f6').replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  return [
    Math.max(0.14, isNaN(r) ? 0.5 : r),
    Math.max(0.14, isNaN(g) ? 0.5 : g),
    Math.max(0.14, isNaN(b) ? 0.5 : b)
  ];
}

export function formatRelativeTime(timestamp) {
  const diffSec = Math.max(0, Math.floor((Date.now() - (timestamp || Date.now())) / 1000));
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  return `${diffDays}d ago`;
}

// 4x4 Matrix Math for WebGL 3D Viewport
export function mat4Perspective(fovy, aspect, near, far) {
  const f = 1.0 / Math.tan(fovy / 2);
  const nf = 1 / (near - far);
  return new Float32Array([
    f / aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (far + near) * nf, -1,
    0, 0, (2 * far * near) * nf, 0
  ]);
}

export function mat4LookAt(eye, center, up) {
  let zx = eye[0] - center[0], zy = eye[1] - center[1], zz = eye[2] - center[2];
  let len = Math.hypot(zx, zy, zz) || 1;
  zx /= len; zy /= len; zz /= len;

  let xx = up[1] * zz - up[2] * zy;
  let xy = up[2] * zx - up[0] * zz;
  let xz = up[0] * zy - up[1] * zx;
  len = Math.hypot(xx, xy, xz);
  if (!len) {
    xx = 1; xy = 0; xz = 0;
  } else {
    xx /= len; xy /= len; xz /= len;
  }

  const yx = zy * xz - zz * xy;
  const yy = zz * xx - zx * xz;
  const yz = zx * xy - zy * xx;

  return new Float32Array([
    xx, yx, zx, 0,
    xy, yy, zy, 0,
    xz, yz, zz, 0,
    -(xx * eye[0] + xy * eye[1] + xz * eye[2]),
    -(yx * eye[0] + yy * eye[1] + yz * eye[2]),
    -(zx * eye[0] + zy * eye[1] + zz * eye[2]),
    1
  ]);
}

export function mat4Multiply(a, b) {
  const out = new Float32Array(16);
  for (let col = 0; col < 4; col++) {
    for (let row = 0; row < 4; row++) {
      out[col * 4 + row] =
        a[0 * 4 + row] * b[col * 4 + 0] +
        a[1 * 4 + row] * b[col * 4 + 1] +
        a[2 * 4 + row] * b[col * 4 + 2] +
        a[3 * 4 + row] * b[col * 4 + 3];
    }
  }
  return out;
}
