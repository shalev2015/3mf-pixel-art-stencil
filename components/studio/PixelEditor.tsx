'use client';

import { useEffect, useRef, useState } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import type { Grid, PaletteEntry, Theme } from '@/lib/types';
import { DEFAULT_PALETTE } from '@/lib/constants/palettes';
import { setPixel } from '@/lib/sprite/transform';

const CANVAS_SIZE = 320;
const GRID_LINE_MAX_CELLS = 48;
const IDLE_HINT = 'Click or drag on grid to paint pixels';

function drawGrid(canvas: HTMLCanvasElement, grid: Grid, palette: PaletteEntry[], theme: Theme): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const H = grid.length;
  const W = H > 0 ? grid[0].length : 0;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!W || !H) return;

  const cellW = canvas.width / W;
  const cellH = canvas.height / H;

  for (let r = 0; r < H; r++) {
    for (let c = 0; c < W; c++) {
      const idx = grid[r][c];
      if (idx > 0 && idx <= 15) {
        ctx.fillStyle = palette[idx].hex;
        ctx.fillRect(Math.floor(c * cellW), Math.floor(r * cellH), Math.ceil(cellW), Math.ceil(cellH));
      }
    }
  }

  if (W <= GRID_LINE_MAX_CELLS && H <= GRID_LINE_MAX_CELLS) {
    ctx.strokeStyle = theme === 'light' ? 'rgba(15, 23, 42, 0.16)' : 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1;
    for (let c = 1; c < W; c++) {
      const x = Math.floor(c * cellW) + 0.5;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let r = 1; r < H; r++) {
      const y = Math.floor(r * cellH) + 0.5;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
  }
}

interface PixelEditorProps {
  grid: Grid;
  palette: PaletteEntry[];
  theme: Theme;
  brushColor: number;
  onGridChange: (grid: Grid) => void;
  onTrim: () => void;
  onFlipH: () => void;
  onFlipV: () => void;
  onRotate: () => void;
}

/** Interactive 2D sprite canvas: left-drag paints, right-drag erases. */
export default function PixelEditor({
  grid,
  palette,
  theme,
  brushColor,
  onGridChange,
  onTrim,
  onFlipH,
  onFlipV,
  onRotate
}: PixelEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isPaintingRef = useRef(false);
  const [hoverInfo, setHoverInfo] = useState(IDLE_HINT);

  useEffect(() => {
    if (canvasRef.current) drawGrid(canvasRef.current, grid, palette, theme);
  }, [grid, palette, theme]);

  const handlePaint = (e: ReactMouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const H = grid.length;
    const W = H > 0 ? grid[0].length : 0;
    if (!W || !H) return;

    const rect = canvas.getBoundingClientRect();
    const col = Math.floor(((e.clientX - rect.left) / rect.width) * W);
    const row = Math.floor(((e.clientY - rect.top) / rect.height) * H);
    if (row < 0 || row >= H || col < 0 || col >= W) return;

    const entry = palette[grid[row][col]] || DEFAULT_PALETTE[0];
    setHoverInfo(`Pixel (${col}, ${row}) · Color ${entry.char.toUpperCase()} (${entry.name})`);

    if (isPaintingRef.current) {
      const target = e.buttons === 2 ? 0 : brushColor;
      if (grid[row][col] !== target) onGridChange(setPixel(grid, row, col, target));
    }
  };

  return (
    <>
      <div className="pixel-editor-header">
        <span className="section-label">Interactive 2D Sprite Preview &amp; Paint</span>
        <div className="transform-btns">
          <button type="button" className="btn-xs" onClick={onTrim}>Trim Borders</button>
          <button type="button" className="btn-xs" onClick={onFlipH}>Flip H</button>
          <button type="button" className="btn-xs" onClick={onFlipV}>Flip V</button>
          <button type="button" className="btn-xs" onClick={onRotate}>Rot 90°</button>
        </div>
      </div>

      <div className="canvas-2d-container">
        <canvas
          ref={canvasRef}
          id="sprite2dCanvas"
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          onContextMenu={e => e.preventDefault()}
          onMouseDown={e => {
            isPaintingRef.current = true;
            handlePaint(e);
          }}
          onMouseUp={() => {
            isPaintingRef.current = false;
          }}
          onMouseMove={handlePaint}
        />
        <div className="pixel-hover-info">{hoverInfo}</div>
      </div>
    </>
  );
}
