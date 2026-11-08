import type { ColorPalette, PaletteEntry } from '@/lib/types';
import { DEFAULT_PALETTE, PRESET_PALETTES } from '@/lib/constants/palettes';

const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;

export function isValidHex(value: string): boolean {
  return HEX_COLOR.test(value);
}

/** Builds the 16 palette entries for a hex list, falling back to the default colors. */
export function paletteFromHexes(hexes?: string[]): PaletteEntry[] {
  return DEFAULT_PALETTE.map((entry, idx) => ({
    ...entry,
    hex: hexes && hexes[idx] ? hexes[idx] : entry.hex
  }));
}

/** Returns the first palette whose colors 1..15 match `hexes`, if any. */
export function findMatchingPalette(palettes: ColorPalette[], hexes: string[]): ColorPalette | undefined {
  return palettes.find(p =>
    p.hexes.slice(1, 16).every((h, i) => h.toLowerCase() === (hexes[i + 1] || '').toLowerCase())
  );
}

/** Replaces invalid colors with the Arcade palette equivalents; slot 0 stays transparent black. */
export function sanitizePaletteHexes(hexes: string[]): string[] {
  return hexes.map((h, i) => {
    if (i === 0) return '#000000';
    const clean = String(h || '').trim();
    return isValidHex(clean) ? clean.toUpperCase() : PRESET_PALETTES[0].hexes[i];
  });
}
