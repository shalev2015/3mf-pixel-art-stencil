'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ColorPalette } from '@/lib/types';
import { PRESET_PALETTES } from '@/lib/constants/palettes';
import { loadCustomPalettes, saveCustomPalettes } from '@/lib/projects/storage';

/** Preset + user-created palettes. Custom palettes persist and are shared by all projects. */
export function useColorPalettes() {
  const [customPalettes, setCustomPalettes] = useState<ColorPalette[]>([]);

  useEffect(() => {
    setCustomPalettes(loadCustomPalettes());
  }, []);

  const updateCustomPalettes = useCallback((next: ColorPalette[]) => {
    setCustomPalettes(next);
    saveCustomPalettes(next);
  }, []);

  const allPalettes = useMemo(() => [...PRESET_PALETTES, ...customPalettes], [customPalettes]);

  const findPalette = useCallback(
    (id: string): ColorPalette => allPalettes.find(p => p.id === id) || PRESET_PALETTES[0],
    [allPalettes]
  );

  return { customPalettes, allPalettes, updateCustomPalettes, findPalette };
}
