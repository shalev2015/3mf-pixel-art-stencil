import type { ColorPalette, Project } from '@/lib/types';
import { DEFAULT_PALETTE, PRESET_PALETTES } from '@/lib/constants/palettes';
import { PRESET_SPRITES } from '@/lib/constants/sprites';
import { getDefaultSettings } from '@/lib/constants/settings';
import { generateId } from '@/lib/utils/id';

const DEFAULT_HEXES = DEFAULT_PALETTE.map(c => c.hex);

/** The three starter projects shown on first launch. */
export function createSeedProjects(): Project[] {
  const now = Date.now();
  return [
    {
      id: generateId(),
      name: 'Duck',
      updatedAt: now - 120000,
      code: PRESET_SPRITES.duck.code,
      paletteHexes: DEFAULT_HEXES,
      settings: getDefaultSettings()
    },
    {
      id: generateId(),
      name: 'Alien',
      updatedAt: now - 60000,
      code: PRESET_SPRITES.invader.code,
      paletteHexes: DEFAULT_HEXES,
      settings: { ...getDefaultSettings(), pixelSize: 5.0 }
    },
    {
      id: generateId(),
      name: 'Burger',
      updatedAt: now - 10000,
      code: PRESET_SPRITES.burger.code,
      paletteHexes: DEFAULT_HEXES,
      settings: getDefaultSettings()
    }
  ];
}

export function createProject(name: string, code: string, palette: ColorPalette = PRESET_PALETTES[0]): Project {
  const trimmed = name.trim();
  return {
    id: generateId(),
    name: trimmed || 'Untitled Stencil Project',
    updatedAt: Date.now(),
    code,
    paletteId: palette.id,
    paletteHexes: [...palette.hexes],
    settings: getDefaultSettings()
  };
}

export function copyProject(original: Project): Project {
  return {
    id: generateId(),
    name: `${original.name} (Copy)`,
    updatedAt: Date.now(),
    code: original.code,
    paletteId: original.paletteId || 'arcade',
    paletteHexes: [...(original.paletteHexes || DEFAULT_HEXES)],
    settings: { ...getDefaultSettings(), ...(original.settings || {}) }
  };
}

/** Validates the parsed contents of an exported projects JSON file. */
export function parseImportedProjects(data: unknown): Project[] {
  if (!Array.isArray(data)) return [];
  return data
    .filter(item => item && item.name && item.code)
    .map(item => ({
      id: generateId(),
      name: String(item.name),
      updatedAt: item.updatedAt || Date.now(),
      code: String(item.code),
      paletteId: typeof item.paletteId === 'string' ? item.paletteId : undefined,
      paletteHexes: Array.isArray(item.paletteHexes) ? item.paletteHexes : DEFAULT_HEXES,
      settings: { ...getDefaultSettings(), ...(item.settings || {}) }
    }));
}
