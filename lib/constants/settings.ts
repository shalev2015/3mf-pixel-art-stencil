import type { StencilSettings } from '@/lib/types';

export function getDefaultSettings(): StencilSettings {
  return {
    pixelSize: 4.0,
    thickness: 1.2,
    margin: 8.0,
    cutoutMode: 'grid',
    bridgeWidth: 0.8,
    regHoles: 'asymmetric3',
    regHoleSize: 3.2,
    embossId: true,
    includeSilhouette: true
  };
}
