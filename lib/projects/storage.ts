import type { ColorPalette, Project, Theme } from '@/lib/types';
import { CUSTOM_PALETTES_STORAGE_KEY, STORAGE_KEY, THEME_STORAGE_KEY } from '@/lib/constants/storage';
import { PRESET_SPRITES } from '@/lib/constants/sprites';
import { resolveTemplateCode } from '@/lib/projects/factory';

const TITLE_TO_TEMPLATE_KEY: Record<string, string> = Object.fromEntries(
  Object.entries(PRESET_SPRITES).map(([k, v]) => [v.title.toLowerCase(), k])
);

/** Old default project names, mapped to the short names used today. */
const LEGACY_NAME_MAP: Record<string, string> = {
  'MakeCode Duck Stencil': 'Duck',
  'MakeCode Duck': 'Duck',
  'Space Alien Cabinet Art': 'Alien',
  'Space Alien Stencil': 'Alien',
  'Space Alien': 'Alien',
  'Arcade Burger Coaster': 'Burger',
  'Arcade Burger Stencil': 'Burger',
  'Arcade Burger': 'Burger',
  'Arcade Ghost Stencil': 'Ghost',
  'Arcade Ghost': 'Ghost',
  'Hero Sword Stencil': 'Sword',
  'Hero Sword': 'Sword',
  'Orange Cat Stencil': 'Cat',
  'Orange Cat': 'Cat',
  '8-Bit Heart Stencil': 'Heart',
  '8-Bit Heart': 'Heart'
};

function readJson(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.warn(`Failed to read "${key}" from localStorage:`, e);
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`Could not save "${key}" to localStorage:`, e);
  }
}

function projectsKeyForUser(userId?: string | null): string {
  return userId ? `${STORAGE_KEY}_user_${userId}` : STORAGE_KEY;
}

/** Loads saved projects, renaming legacy defaults. Returns null when nothing is stored. */
export function loadProjects(userId?: string | null): Project[] | null {
  const parsed = readJson(projectsKeyForUser(userId));
  if (!Array.isArray(parsed) || parsed.length === 0) return null;

  let didMigrate = false;
  const migrated = (parsed as Project[]).map(p => {
    if (!p) return p;
    let next = p;
    if (LEGACY_NAME_MAP[next.name]) {
      didMigrate = true;
      next = { ...next, name: LEGACY_NAME_MAP[next.name] };
    }
    let resolvedCode = resolveTemplateCode(next.code || '');
    // Heal projects saved with a 1x2/1x3 fragment from an unexpanded template key
    const compact = resolvedCode.replace(/img\s*`|`|\s+/g, '');
    if (compact.length > 0 && compact.length <= 3) {
      const matchedKey =
        TITLE_TO_TEMPLATE_KEY[next.name.trim().toLowerCase()] || 'duck';
      resolvedCode = PRESET_SPRITES[matchedKey].code;
    }
    if (resolvedCode !== next.code) {
      didMigrate = true;
      next = { ...next, code: resolvedCode };
    }
    return next;
  });
  if (didMigrate) saveProjects(migrated, userId);
  return migrated;
}

export function saveProjects(projects: Project[], userId?: string | null): void {
  writeJson(projectsKeyForUser(userId), projects);
}

export function loadCustomPalettes(): ColorPalette[] {
  const parsed = readJson(CUSTOM_PALETTES_STORAGE_KEY);
  if (!Array.isArray(parsed)) return [];
  return (parsed as ColorPalette[]).filter(
    cp => cp && cp.id && cp.name && Array.isArray(cp.hexes) && cp.hexes.length === 16
  );
}

export function saveCustomPalettes(palettes: ColorPalette[]): void {
  writeJson(CUSTOM_PALETTES_STORAGE_KEY, palettes);
}

export function loadTheme(): Theme | null {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    return saved === 'light' || saved === 'dark' ? saved : null;
  } catch {
    return null;
  }
}

export function saveTheme(theme: Theme): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* storage unavailable */
  }
}
