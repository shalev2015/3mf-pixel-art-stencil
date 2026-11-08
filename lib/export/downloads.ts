import type { Grid, PlaqueMeshEntry, Project, StencilLayer } from '@/lib/types';
import { generate3mfArchive } from '@/lib/export/threeMf';
import { generateBinaryStl } from '@/lib/export/stl';
import { paletteFromHexes } from '@/lib/palette/utils';
import { computeBuildPlateLayout } from '@/lib/stencil/layout';
import { buildStencilLayers } from '@/lib/stencil/layers';
import { triggerFileDownload } from '@/lib/utils/download';
import { sanitizeFilename } from '@/lib/utils/filename';
import { getDefaultSettings } from '@/lib/constants/settings';

const MIME_3MF = 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml';

export function downloadSingleLayer3mf(layer: StencilLayer, projectName: string): void {
  const bytes = generate3mfArchive(
    [
      {
        name: layer.shortName,
        colorHex: layer.colorHex,
        mesh: layer.mesh,
        offsetX: 0,
        offsetY: 0,
        offsetZ: 0
      }
    ],
    `${projectName} - ${layer.title}`
  );
  triggerFileDownload(bytes, `${layer.shortName}.3mf`, MIME_3MF);
}

export function downloadLayerStl(layer: StencilLayer): void {
  triggerFileDownload(generateBinaryStl(layer.mesh, layer.shortName), `${layer.shortName}.stl`, 'model/stl');
}

/** Exports every layer arranged on a single build plate. */
export function downloadAllStencils3mf(layers: StencilLayer[], projectName: string): void {
  const items = computeBuildPlateLayout(layers, 8.0).map(entry => ({
    name: entry.layer.shortName,
    colorHex: entry.layer.colorHex,
    mesh: entry.layer.mesh,
    offsetX: entry.offsetX,
    offsetY: entry.offsetY,
    offsetZ: entry.offsetZ
  }));
  const bytes = generate3mfArchive(items, `${projectName} - Stencil Build Plate`);
  triggerFileDownload(bytes, `${sanitizeFilename(projectName)}_All_Stencils.3mf`, MIME_3MF);
}

export function downloadMultiColorPlaque3mf(plaqueMeshes: PlaqueMeshEntry[], projectName: string): void {
  const prefix = sanitizeFilename(projectName);
  const items = plaqueMeshes.map(pm => ({
    name: `${prefix}_${pm.name}`,
    colorHex: pm.colorHex,
    mesh: pm.mesh,
    offsetX: 0,
    offsetY: 0,
    offsetZ: 0
  }));
  const bytes = generate3mfArchive(items, `${projectName} - Multi-Color Plaque`);
  triggerFileDownload(bytes, `${prefix}_MultiColor_Plaque.3mf`, MIME_3MF);
}

/** One-click export of a saved project (used from the Main Menu cards). */
export function downloadProject3mf(project: Project, spriteGrid: Grid): void {
  const settings = { ...getDefaultSettings(), ...(project.settings || {}) };
  const { layers } = buildStencilLayers(spriteGrid, settings, paletteFromHexes(project.paletteHexes), project.name);
  if (layers.length === 0 || layers[0].key === 'blank') return;
  downloadAllStencils3mf(layers, project.name);
}

export function downloadProjectsJson(projects: Project[]): void {
  const jsonBytes = new TextEncoder().encode(JSON.stringify(projects, null, 2));
  triggerFileDownload(jsonBytes, 'arcade-3mf-stencil-projects.json', 'application/json');
}
