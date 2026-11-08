'use client';

import { useCallback, useMemo, useState } from 'react';
import type { PaletteEntry, Grid, StencilSettings } from '@/lib/types';
import { buildStencilLayers } from '@/lib/stencil/layers';

/** Generates all stencil layers for the sprite and tracks which one is inspected. */
export function useStencilBuild(
  grid: Grid,
  settings: StencilSettings,
  palette: PaletteEntry[],
  projectName: string
) {
  const [activeLayerKey, setActiveLayerKey] = useState<string | null>(null);

  const { layers, plaqueMeshes } = useMemo(
    () => buildStencilLayers(grid, settings, palette, projectName),
    [grid, settings, palette, projectName]
  );

  const resolvedActiveLayerKey = useMemo(() => {
    if (activeLayerKey && layers.some(l => l.key === activeLayerKey)) return activeLayerKey;
    const firstColor = layers.find(l => l.key.startsWith('color_')) || layers[0];
    return firstColor ? firstColor.key : null;
  }, [activeLayerKey, layers]);

  const activeLayer = useMemo(
    () => layers.find(l => l.key === resolvedActiveLayerKey) || layers[0],
    [layers, resolvedActiveLayerKey]
  );

  const selectLayer = useCallback((key: string) => setActiveLayerKey(key), []);

  return { layers, plaqueMeshes, activeLayer, activeLayerKey: resolvedActiveLayerKey, selectLayer };
}
