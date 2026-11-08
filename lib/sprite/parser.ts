import type { Grid, ParsedSprites, SpriteOccurrence } from '@/lib/types';
import { charToColorIndex, createBlankGrid } from '@/lib/sprite/grid';

export function parseSpriteInput(rawText: string | null | undefined): ParsedSprites {
  const text = (rawText || '').trim();
  if (!text) {
    return { occurrences: [{ label: 'Empty (8×8)', grid: createBlankGrid(8, 8) }] };
  }

  const regex = /(?:img|assets\.image|image)\s*`([\s\S]*?)`/gi;
  const occurrences: SpriteOccurrence[] = [];
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
    const hexGrid = parseHexBuffer(hexMatch[1]);
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

function parseGridBody(bodyText: string): Grid {
  const rawLines = bodyText.split(/\r?\n/);
  const parsedRows: number[][] = [];

  for (const rawLine of rawLines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('//') || line.startsWith('#')) continue;

    const tokens = line.split(/\s+/);
    let row: number[] = [];

    if (tokens.length > 1 && tokens.every((t: string) => t.length === 1 && charToColorIndex(t) !== null)) {
      row = tokens.map((t: string) => charToColorIndex(t) as number);
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

function parseHexBuffer(hexStr: string): Grid | null {
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
