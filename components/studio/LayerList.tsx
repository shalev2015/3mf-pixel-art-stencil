'use client';

import type { StencilLayer } from '@/lib/types';
import { downloadLayerStl, downloadSingleLayer3mf } from '@/lib/export/downloads';
import { hexToRgbNormalized } from '@/lib/utils/color';

interface LayerListProps {
  layers: StencilLayer[];
  activeLayerKey: string | null;
  projectName: string;
  onSelectLayer: (key: string) => void;
}

/** Per-color generated stencil layers list with individual .3MF and .STL export actions. */
export default function LayerList({
  layers,
  activeLayerKey,
  projectName,
  onSelectLayer
}: LayerListProps) {
  return (
    <div className="settings-group">
      <div className="layers-list-header">
        <h3>Generated Stencil Layers</h3>
        <span className="badge">
          {layers.length} stencil{layers.length === 1 ? '' : 's'}
        </span>
      </div>
      <p className="setting-hint">
        Click a layer to inspect in 3D, or download individual <code>.3mf</code> /{' '}
        <code>.stl</code> files:
      </p>
      <div className="layers-list">
        {layers.map(layer => {
          const rgb = hexToRgbNormalized(layer.colorHex);
          const lum = 0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2];
          const textCol = lum > 0.6 ? '#0d1117' : '#ffffff';
          const bridgeNote =
            layer.mesh.islandInfo.addedBridgeCells > 0
              ? ` · +${layer.mesh.islandInfo.addedBridgeCells} bridge${
                  layer.mesh.islandInfo.addedBridgeCells === 1 ? '' : 's'
                }`
              : layer.mesh.islandInfo.remainingIslandCount > 0
              ? ` · ⚠ ${layer.mesh.islandInfo.remainingIslandCount} island`
              : '';

          return (
            <div
              key={layer.key}
              className={`layer-card${layer.key === activeLayerKey ? ' active' : ''}`}
              onClick={() => onSelectLayer(layer.key)}
            >
              <div className="layer-info">
                <div
                  className="layer-swatch"
                  style={{ background: layer.colorHex, color: textCol }}
                >
                  {layer.colorChar}
                </div>
                <div className="layer-meta">
                  <span className="layer-title">{layer.title}</span>
                  <span className="layer-sub">
                    {layer.pixelCount} cutouts · {layer.mesh.triangles.length} tris
                    {bridgeNote}
                  </span>
                </div>
              </div>

              <div className="layer-actions">
                <button
                  type="button"
                  className="layer-dl-btn"
                  title="Download this stencil layer as .3mf"
                  onClick={e => {
                    e.stopPropagation();
                    downloadSingleLayer3mf(layer, projectName);
                  }}
                >
                  .3MF
                </button>
                <button
                  type="button"
                  className="layer-dl-btn stl-btn"
                  title="Download this stencil layer as binary .stl"
                  onClick={e => {
                    e.stopPropagation();
                    downloadLayerStl(layer);
                  }}
                >
                  .STL
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
