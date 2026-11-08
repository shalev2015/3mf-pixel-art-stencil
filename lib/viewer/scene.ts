import type { PlaqueMeshEntry, StencilLayer, StencilSettings, ViewMode } from '@/lib/types';
import { computeBuildPlateLayout } from '@/lib/stencil/layout';
import { hexToRgbNormalized } from '@/lib/utils/color';
import type { SceneBounds, SceneItem } from '@/lib/viewer/types';

export interface Scene {
  items: SceneItem[];
  bounds: SceneBounds;
}

export interface SceneInput {
  viewMode: ViewMode;
  layers: StencilLayer[];
  plaqueMeshes: PlaqueMeshEntry[];
  activeLayer: StencilLayer | undefined;
  settings: StencilSettings;
  explodeSpacing: number;
}

/** Builds the list of meshes (with offsets) shown for the selected 3D view mode. */
export function buildScene({
  viewMode,
  layers,
  plaqueMeshes,
  activeLayer,
  settings,
  explodeSpacing
}: SceneInput): Scene {
  const items: SceneItem[] = [];
  const bounds: SceneBounds = {
    minX: Infinity,
    maxX: -Infinity,
    minY: Infinity,
    maxY: -Infinity,
    maxZ: 0
  };

  if (viewMode === 'single') {
    if (activeLayer) {
      items.push({
        mesh: activeLayer.mesh,
        color: hexToRgbNormalized(activeLayer.colorHex),
        offset: [0, 0, 0]
      });
      bounds.minX = 0;
      bounds.maxX = activeLayer.mesh.plateW;
      bounds.minY = 0;
      bounds.maxY = activeLayer.mesh.plateH;
      bounds.maxZ = activeLayer.mesh.thickness;
    }
  } else if (viewMode === 'bed') {
    for (const entry of computeBuildPlateLayout(layers, 8.0)) {
      items.push({
        mesh: entry.layer.mesh,
        color: hexToRgbNormalized(entry.layer.colorHex),
        offset: [entry.offsetX, entry.offsetY, entry.offsetZ]
      });
      bounds.minX = Math.min(bounds.minX, entry.offsetX);
      bounds.maxX = Math.max(bounds.maxX, entry.offsetX + entry.layer.mesh.plateW);
      bounds.minY = Math.min(bounds.minY, entry.offsetY);
      bounds.maxY = Math.max(bounds.maxY, entry.offsetY + entry.layer.mesh.plateH);
      bounds.maxZ = Math.max(bounds.maxZ, entry.layer.mesh.thickness);
    }
  } else if (viewMode === 'stack') {
    const colorLayers = layers.filter(l => l.key !== 'silhouette');
    const stackList = colorLayers.length > 0 ? colorLayers : layers;
    stackList.forEach((layer, idx) => {
      const zOff = idx * (settings.thickness + explodeSpacing);
      items.push({
        mesh: layer.mesh,
        color: hexToRgbNormalized(layer.colorHex),
        offset: [0, 0, zOff]
      });
      bounds.minX = Math.min(bounds.minX, 0);
      bounds.maxX = Math.max(bounds.maxX, layer.mesh.plateW);
      bounds.minY = Math.min(bounds.minY, 0);
      bounds.maxY = Math.max(bounds.maxY, layer.mesh.plateH);
      bounds.maxZ = Math.max(bounds.maxZ, zOff + layer.mesh.thickness);
    });
  } else if (viewMode === 'plaque') {
    for (const pm of plaqueMeshes) {
      items.push({
        mesh: pm.mesh,
        color: hexToRgbNormalized(pm.colorHex),
        offset: [0, 0, 0]
      });
      bounds.minX = 0;
      bounds.maxX = pm.mesh.plateW;
      bounds.minY = 0;
      bounds.maxY = pm.mesh.plateH;
      bounds.maxZ = settings.thickness * 1.8;
    }
  }

  return { items, bounds };
}
