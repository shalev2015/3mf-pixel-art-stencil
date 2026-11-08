import type { Grid, PaletteEntry } from '@/lib/types';
import { createBlankGrid } from '@/lib/sprite/grid';

const MAX_DIMENSION = 32;
const ALPHA_THRESHOLD = 96;

function hexToRgb(hex: string): [number, number, number] {
  const c = hex.replace('#', '');
  return [parseInt(c.slice(0, 2), 16), parseInt(c.slice(2, 4), 16), parseInt(c.slice(4, 6), 16)];
}

/** Downsamples an image to at most 32px and maps each pixel to the nearest palette color. */
export function quantizeImageToGrid(img: HTMLImageElement, palette: PaletteEntry[]): Grid | null {
  let targetW = img.width;
  let targetH = img.height;
  if (targetW > MAX_DIMENSION || targetH > MAX_DIMENSION) {
    const scale = MAX_DIMENSION / Math.max(targetW, targetH);
    targetW = Math.max(1, Math.round(targetW * scale));
    targetH = Math.max(1, Math.round(targetH * scale));
  }

  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, 0, 0, targetW, targetH);
  const data = ctx.getImageData(0, 0, targetW, targetH).data;

  const palRgb = palette.map(p => hexToRgb(p.hex));
  const grid = createBlankGrid(targetW, targetH);

  for (let r = 0; r < targetH; r++) {
    for (let c = 0; c < targetW; c++) {
      const i = (r * targetW + c) * 4;
      if (data[i + 3] < ALPHA_THRESHOLD) continue;

      const pr = data[i], pg = data[i + 1], pb = data[i + 2];
      let bestIdx = 1;
      let bestDist = Infinity;
      for (let pIdx = 1; pIdx <= 15; pIdx++) {
        const [cr, cg, cb] = palRgb[pIdx];
        const dist = (pr - cr) ** 2 * 0.3 + (pg - cg) ** 2 * 0.59 + (pb - cb) ** 2 * 0.11;
        if (dist < bestDist) {
          bestDist = dist;
          bestIdx = pIdx;
        }
      }
      grid[r][c] = bestIdx;
    }
  }
  return grid;
}

/** Reads an image file and resolves with the quantized sprite grid. */
export function importImageFile(file: File, palette: PaletteEntry[]): Promise<Grid | null> {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => resolve(quantizeImageToGrid(img, palette));
      img.onerror = () => resolve(null);
      img.src = String(reader.result);
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}
