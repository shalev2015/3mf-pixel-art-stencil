import type { Grid } from '@/lib/types';

export function charToColorIndex(ch: string | null | undefined): number | null {
  if (!ch || ch === '.') return 0;
  const lower = ch.toLowerCase();
  if (lower >= '0' && lower <= '9') return lower.charCodeAt(0) - 48;
  if (lower >= 'a' && lower <= 'f') return lower.charCodeAt(0) - 87;
  return null;
}

export function colorIndexToChar(idx: number): string {
  if (!idx || idx <= 0) return '.';
  return idx.toString(16);
}

export function createBlankGrid(width: number, height: number): Grid {
  return Array.from({ length: height }, () => new Array(width).fill(0));
}
