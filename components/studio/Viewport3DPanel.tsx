'use client';

import { useState } from 'react';
import type { PlaqueMeshEntry, StencilLayer, StencilSettings, Theme, ViewMode } from '@/lib/types';
import {
  downloadAllStencils3mf,
  downloadMultiColorPlaque3mf,
  downloadSingleLayer3mf
} from '@/lib/export/downloads';
import { sanitizeFilename } from '@/lib/utils/filename';
import { useStencilViewer } from '@/hooks/useStencilViewer';

interface Viewport3DPanelProps {
  projectName: string;
  viewMode: ViewMode;
  onChangeViewMode: (mode: ViewMode) => void;
  layers: StencilLayer[];
  plaqueMeshes: PlaqueMeshEntry[];
  activeLayer: StencilLayer | undefined;
  activeLayerKey: string | null;
  onSelectLayer: (key: string) => void;
  settings: StencilSettings;
  theme: Theme;
}

const VIEW_TABS: { id: ViewMode; label: string }[] = [
  { id: 'single', label: 'Single Stencil' },
  { id: 'bed', label: 'Print Bed (All Layers)' },
  { id: 'stack', label: 'Stacked Alignment' },
  { id: 'plaque', label: 'Multi-Color Plaque' }
];

/** Center panel: interactive WebGL 3D preview, camera toolbar, mesh diagnostics, and primary 3MF exports. */
export default function Viewport3DPanel({
  projectName,
  viewMode,
  onChangeViewMode,
  layers,
  plaqueMeshes,
  activeLayer,
  activeLayerKey,
  onSelectLayer,
  settings,
  theme
}: Viewport3DPanelProps) {
  const [explodeSpacing, setExplodeSpacing] = useState(5.0);
  const [showEdges, setShowEdges] = useState(true);

  const { canvasRef, setCamera, beginDrag } = useStencilViewer({
    theme,
    showEdges,
    viewMode,
    layers,
    plaqueMeshes,
    activeLayer,
    settings,
    explodeSpacing
  });

  const allManifold = layers.every(l => l.mesh.isManifold);
  const inspectedLayers = viewMode === 'single' && activeLayer ? [activeLayer] : layers;
  const unbridgedCount = inspectedLayers.reduce(
    (s, l) => s + l.mesh.islandInfo.remainingIslandCount,
    0
  );
  const bridgedCount = inspectedLayers.reduce(
    (s, l) => s + l.mesh.islandInfo.addedBridgeCells,
    0
  );
  const projPrefix = sanitizeFilename(projectName);

  return (
    <section className="panel panel-3d" aria-label="3D Stencil Preview">
      <div className="panel-header">
        <h2>
          2. Interactive 3D <code>.3MF</code> Preview
        </h2>
        <div className="view-mode-tabs" role="tablist">
          {VIEW_TABS.map(tab => (
            <button
              key={tab.id}
              type="button"
              className={`tab-btn${viewMode === tab.id ? ' active' : ''}`}
              onClick={() => onChangeViewMode(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="panel-body preview-3d-body">
        <div className="viewport-toolbar">
          {viewMode === 'single' && (
            <div className="layer-selector-wrap">
              <label htmlFor="activeLayerSelect">Inspecting Stencil:</label>
              <select
                id="activeLayerSelect"
                value={activeLayerKey || ''}
                onChange={e => onSelectLayer(e.target.value)}
              >
                {layers.map(l => (
                  <option key={l.key} value={l.key}>
                    {l.title} ({l.pixelCount} px)
                  </option>
                ))}
              </select>
            </div>
          )}

          {viewMode === 'stack' && (
            <div className="explode-slider-wrap">
              <label htmlFor="explodeSlider">Stack Z-Spacing:</label>
              <input
                type="range"
                id="explodeSlider"
                min="0"
                max="25"
                step="0.5"
                value={explodeSpacing}
                onChange={e => setExplodeSpacing(parseFloat(e.target.value) || 0)}
              />
              <span>{explodeSpacing.toFixed(1)} mm</span>
            </div>
          )}

          <div className="camera-btns">
            <button type="button" className="btn-xs" onClick={() => setCamera(-0.55, 0.72)}>
              Iso View
            </button>
            <button type="button" className="btn-xs" onClick={() => setCamera(0, 1.52)}>
              Top (2D Plan)
            </button>
            <button type="button" className="btn-xs" onClick={() => setCamera(0, 0.12)}>
              Front
            </button>
            <button
              type="button"
              className="btn-xs"
              onClick={() => setShowEdges(prev => !prev)}
            >
              Edges: {showEdges ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        <div className="viewport-container">
          <canvas
            ref={canvasRef}
            id="viewport3dCanvas"
            onContextMenu={e => e.preventDefault()}
            onMouseDown={beginDrag}
          />

          <div className="viewport-hud-top">
            <span className="hud-pill">
              {viewMode === 'single' && activeLayer
                ? `${projectName} — ${activeLayer.title}`
                : viewMode === 'bed'
                ? `${projectName} — Print Bed (${layers.length} Plates)`
                : viewMode === 'stack'
                ? `${projectName} — Stacked Alignment`
                : `${projectName} — Multi-Color Plaque (${plaqueMeshes.length} parts)`}
            </span>
            {activeLayer && (
              <span className="hud-pill">
                {activeLayer.mesh.plateW.toFixed(1)} × {activeLayer.mesh.plateH.toFixed(1)} ×{' '}
                {activeLayer.mesh.thickness.toFixed(1)} mm
              </span>
            )}
          </div>

          <div className="viewport-hud-bottom">
            <div className="hud-stats">
              <span>
                {viewMode === 'single' && activeLayer
                  ? `${activeLayer.mesh.vertices.length.toLocaleString()} vertices · ${activeLayer.mesh.triangles.length.toLocaleString()} triangles`
                  : `${layers
                      .reduce((s, l) => s + l.mesh.triangles.length, 0)
                      .toLocaleString()} total triangles`}
              </span>
              <span className={allManifold ? 'status-ok' : 'status-warn'}>
                {allManifold ? '✓ Watertight 2-Manifold' : '⚠ Check Mesh Topology'}
              </span>
              <span className={unbridgedCount > 0 ? 'status-warn' : 'status-ok'}>
                {unbridgedCount > 0
                  ? `⚠ ${unbridgedCount} Floating Island${
                      unbridgedCount === 1 ? '' : 's'
                    } (Enable Bridges)`
                  : bridgedCount > 0
                  ? `✓ Auto-Bridged (${bridgedCount} bridge rib${bridgedCount === 1 ? '' : 's'})`
                  : '✓ All Solid Regions Connected'}
              </span>
            </div>
            <div className="hud-controls-hint">
              Left-drag: Orbit · Right-drag / Shift+drag: Pan · Scroll: Zoom
            </div>
          </div>
        </div>

        <div className="primary-export-bar">
          <button
            type="button"
            className="btn btn-primary btn-lg"
            onClick={() => downloadAllStencils3mf(layers, projectName)}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <div>
              <strong>Download All Stencil Plates (.3mf)</strong>
              <small>
                {projPrefix}_All_Stencils.3mf ({layers.length} plates)
              </small>
            </div>
          </button>

          <button
            type="button"
            className="btn btn-accent btn-lg"
            onClick={() => {
              if (viewMode === 'plaque') {
                downloadMultiColorPlaque3mf(plaqueMeshes, projectName);
              } else if (activeLayer) {
                downloadSingleLayer3mf(activeLayer, projectName);
              }
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <div>
              <strong>Download Selected (.3mf)</strong>
              <small>
                {viewMode === 'plaque'
                  ? `${projPrefix}_MultiColor_Plaque.3mf (${plaqueMeshes.length} materials)`
                  : activeLayer
                  ? `${activeLayer.shortName}.3mf`
                  : 'Selected stencil'}
              </small>
            </div>
          </button>
        </div>
      </div>
    </section>
  );
}
