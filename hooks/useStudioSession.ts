'use client';

import { useCallback, useState } from 'react';
import type { ColorPalette, PaletteEntry, Project, StencilSettings } from '@/lib/types';
import { getDefaultSettings } from '@/lib/constants/settings';
import { PRESET_SPRITES } from '@/lib/constants/sprites';
import { findMatchingPalette, paletteFromHexes } from '@/lib/palette/utils';
import { useSpriteEditor } from '@/hooks/useSpriteEditor';

/** State of the project currently open in the Studio (sprite, palette, settings, name). */
export function useStudioSession(allPalettes: ColorPalette[]) {
  const sprite = useSpriteEditor();
  const { applyCodeText } = sprite;

  const [projectId, setProjectId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState('Untitled Project');
  const [palette, setPalette] = useState<PaletteEntry[]>(() => paletteFromHexes());
  const [paletteId, setPaletteId] = useState('arcade');
  const [settings, setSettings] = useState<StencilSettings>(getDefaultSettings);

  const openProject = useCallback(
    (project: Project) => {
      const resolved = paletteFromHexes(project.paletteHexes);
      setProjectId(project.id);
      setProjectName(project.name);
      setPalette(resolved);

      if (project.paletteId && allPalettes.some(p => p.id === project.paletteId)) {
        setPaletteId(project.paletteId);
      } else {
        const matched = findMatchingPalette(allPalettes, resolved.map(c => c.hex));
        setPaletteId(matched ? matched.id : 'arcade');
      }

      setSettings({ ...getDefaultSettings(), ...(project.settings || {}) });
      applyCodeText(project.code || PRESET_SPRITES.duck.code);
    },
    [allPalettes, applyCodeText]
  );

  /** Switches to a palette, replacing every color slot. */
  const applyPalette = useCallback((id: string, hexes: string[]) => {
    setPaletteId(id);
    setPalette(paletteFromHexes(hexes));
  }, []);

  const resetSettings = useCallback(() => setSettings(getDefaultSettings()), []);

  return {
    sprite,
    projectId,
    projectName,
    setProjectName,
    palette,
    paletteId,
    settings,
    setSettings,
    resetSettings,
    openProject,
    applyPalette
  };
}

export type StudioSession = ReturnType<typeof useStudioSession>;
