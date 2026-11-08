'use client';

import { useEffect, useRef } from 'react';
import type { Grid } from '@/lib/types';
import { DEFAULT_PALETTE } from '@/lib/constants/palettes';

interface PixelThumbnailCanvasProps {
  grid: Grid;
  paletteHexes?: string[];
  width?: number;
  height?: number;
  className?: string;
}

/** Renders a pixel grid, scaled to fit and centered, on a `<canvas>`. */
export default function PixelThumbnailCanvas({
  grid,
  paletteHexes,
  width = 128,
  height = 128,
  className = ''
}: PixelThumbnailCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !grid) return;

    const H = grid.length;
    const W = H > 0 ? grid[0].length : 0;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!W || !H) return;

    const scale = Math.min(canvas.width / W, canvas.height / H);
    const offsetX = (canvas.width - W * scale) * 0.5;
    const offsetY = (canvas.height - H * scale) * 0.5;

    for (let r = 0; r < H; r++) {
      for (let c = 0; c < W; c++) {
        const idx = grid[r][c];
        if (idx > 0 && idx <= 15) {
          ctx.fillStyle = paletteHexes?.[idx] || DEFAULT_PALETTE[idx].hex;
          ctx.fillRect(
            Math.floor(offsetX + c * scale),
            Math.floor(offsetY + r * scale),
            Math.ceil(scale),
            Math.ceil(scale)
          );
        }
      }
    }
  }, [grid, paletteHexes, width, height]);

  return <canvas ref={canvasRef} width={width} height={height} className={className} />;
}
