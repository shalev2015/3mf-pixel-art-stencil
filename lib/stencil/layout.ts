import type { BuildPlateEntry, PlateMesh } from '@/lib/types';
import { roundCoord } from '@/lib/utils/math';

export function computeBuildPlateLayout<L extends { mesh: PlateMesh }>(
  layers: L[],
  gapMm = 8.0
): BuildPlateEntry<L>[] {
  const count = layers.length;
  const cols = Math.ceil(Math.sqrt(count));
  const plateW = layers[0]?.mesh.plateW || 60;
  const plateH = layers[0]?.mesh.plateH || 60;

  return layers.map((layer, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    return {
      layer,
      offsetX: roundCoord(col * (plateW + gapMm)),
      offsetY: roundCoord(row * (plateH + gapMm)),
      offsetZ: 0
    };
  });
}
