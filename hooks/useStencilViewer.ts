'use client';

import { useCallback, useEffect, useRef } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import type { Theme } from '@/lib/types';
import { attachViewerControls, drawViewerFrame, initViewerGl, uploadScene } from '@/lib/viewer/renderer';
import { buildScene, type SceneInput } from '@/lib/viewer/scene';
import { createViewerState } from '@/lib/viewer/types';

interface UseStencilViewerOptions extends SceneInput {
  theme: Theme;
  showEdges: boolean;
}

/** Owns the WebGL canvas: context setup, camera controls and scene uploads. */
export function useStencilViewer({
  theme,
  showEdges,
  viewMode,
  layers,
  plaqueMeshes,
  activeLayer,
  settings,
  explodeSpacing
}: UseStencilViewerOptions) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewerRef = useRef(createViewerState());

  const redraw = useCallback(() => drawViewerFrame(viewerRef.current), []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!initViewerGl(canvas, viewerRef.current)) return;
    return attachViewerControls(canvas, viewerRef.current, redraw);
  }, [redraw]);

  useEffect(() => {
    const v = viewerRef.current;
    v.showEdges = showEdges;
    v.theme = theme;
    if (!v.gl || !v.program) return;

    const { items, bounds } = buildScene({
      viewMode,
      layers,
      plaqueMeshes,
      activeLayer,
      settings,
      explodeSpacing
    });
    uploadScene(v, items, bounds);
    redraw();
  }, [viewMode, layers, plaqueMeshes, activeLayer, settings, explodeSpacing, showEdges, theme, redraw]);

  const setCamera = useCallback(
    (yaw: number, pitch: number) => {
      viewerRef.current.yaw = yaw;
      viewerRef.current.pitch = pitch;
      redraw();
    },
    [redraw]
  );

  const beginDrag = useCallback((e: ReactMouseEvent<HTMLCanvasElement>) => {
    const v = viewerRef.current;
    v.isDragging = true;
    v.dragButton = e.button;
    v.lastMouse = [e.clientX, e.clientY];
  }, []);

  return { canvasRef, setCamera, beginDrag };
}
