'use client';

import type { Dispatch, SetStateAction } from 'react';
import type {
  CutoutMode,
  RegistrationHoleMode,
  StencilLayer,
  StencilSettings
} from '@/lib/types';
import LayerList from '@/components/studio/LayerList';

interface SettingsPanelProps {
  settings: StencilSettings;
  onChangeSettings: Dispatch<SetStateAction<StencilSettings>>;
  onResetSettings: () => void;
  layers: StencilLayer[];
  activeLayerKey: string | null;
  projectName: string;
  onSelectLayer: (key: string) => void;
}

/** Right panel: physical dimensions, cutout/bridge style, registration holes, and layer list. */
export default function SettingsPanel({
  settings,
  onChangeSettings,
  onResetSettings,
  layers,
  activeLayerKey,
  projectName,
  onSelectLayer
}: SettingsPanelProps) {
  return (
    <section className="panel panel-settings" aria-label="Stencil Geometry and Layer Exports">
      <div className="panel-header">
        <h2>3. Stencil Settings &amp; Layers</h2>
        <button type="button" className="btn-xs" onClick={onResetSettings}>
          Reset Defaults
        </button>
      </div>

      <div className="panel-body settings-scroll">
        <div className="settings-group">
          <h3>Physical Dimensions</h3>
          <div className="control-row">
            <label>
              <span>Pixel Size (mm)</span>
              <span className="val-badge">{settings.pixelSize.toFixed(1)} mm</span>
            </label>
            <div className="input-with-number">
              <input
                type="range"
                min="1.0"
                max="15.0"
                step="0.5"
                value={settings.pixelSize}
                onChange={e =>
                  onChangeSettings(s => ({ ...s, pixelSize: parseFloat(e.target.value) || 4.0 }))
                }
              />
              <input
                type="number"
                min="0.5"
                max="50"
                step="0.5"
                value={settings.pixelSize}
                onChange={e =>
                  onChangeSettings(s => ({ ...s, pixelSize: parseFloat(e.target.value) || 4.0 }))
                }
              />
            </div>
          </div>

          <div className="control-row">
            <label>
              <span>Stencil Thickness (mm)</span>
              <span className="val-badge">{settings.thickness.toFixed(1)} mm</span>
            </label>
            <div className="input-with-number">
              <input
                type="range"
                min="0.4"
                max="5.0"
                step="0.2"
                value={settings.thickness}
                onChange={e =>
                  onChangeSettings(s => ({ ...s, thickness: parseFloat(e.target.value) || 1.2 }))
                }
              />
              <input
                type="number"
                min="0.2"
                max="20"
                step="0.1"
                value={settings.thickness}
                onChange={e =>
                  onChangeSettings(s => ({ ...s, thickness: parseFloat(e.target.value) || 1.2 }))
                }
              />
            </div>
          </div>

          <div className="control-row">
            <label>
              <span>Outer Frame Margin (mm)</span>
              <span className="val-badge">{settings.margin.toFixed(1)} mm</span>
            </label>
            <div className="input-with-number">
              <input
                type="range"
                min="2.0"
                max="30.0"
                step="1.0"
                value={settings.margin}
                onChange={e =>
                  onChangeSettings(s => ({ ...s, margin: parseFloat(e.target.value) || 8.0 }))
                }
              />
              <input
                type="number"
                min="1.0"
                max="100"
                step="0.5"
                value={settings.margin}
                onChange={e =>
                  onChangeSettings(s => ({ ...s, margin: parseFloat(e.target.value) || 8.0 }))
                }
              />
            </div>
          </div>
        </div>

        <div className="settings-group">
          <h3>Cutout &amp; Bridge Mode</h3>
          <div className="control-row">
            <label htmlFor="cutoutModeSelect">Pixel Cutout Style</label>
            <select
              id="cutoutModeSelect"
              value={settings.cutoutMode}
              onChange={e =>
                onChangeSettings(s => ({ ...s, cutoutMode: e.target.value as CutoutMode }))
              }
            >
              <option value="grid">Bridged Pixel Grid (Ribs between every pixel)</option>
              <option value="merged-bridged">Merged Contiguous + Auto-Bridge Islands</option>
              <option value="merged-raw">Merged Contiguous (Raw / Unbridged)</option>
            </select>
            <p className="setting-hint">
              {settings.cutoutMode === 'grid'
                ? 'Adds structural grid ribs between pixels so every pixel stays crisp and inner islands never fall out.'
                : settings.cutoutMode === 'merged-bridged'
                ? 'Merges adjacent same-color pixels into continuous cutouts and automatically bridges any enclosed solid islands.'
                : 'Merges adjacent same-color pixels without adding bridges. Watch for floating island warnings.'}
            </p>
          </div>

          {settings.cutoutMode !== 'merged-raw' && (
            <div className="control-row">
              <label>
                <span>Bridge / Grid Rib Width (mm)</span>
                <span className="val-badge">{settings.bridgeWidth.toFixed(1)} mm</span>
              </label>
              <div className="input-with-number">
                <input
                  type="range"
                  min="0.4"
                  max="3.0"
                  step="0.1"
                  value={settings.bridgeWidth}
                  onChange={e =>
                    onChangeSettings(s => ({
                      ...s,
                      bridgeWidth: parseFloat(e.target.value) || 0.8
                    }))
                  }
                />
                <input
                  type="number"
                  min="0.2"
                  max="10.0"
                  step="0.1"
                  value={settings.bridgeWidth}
                  onChange={e =>
                    onChangeSettings(s => ({
                      ...s,
                      bridgeWidth: parseFloat(e.target.value) || 0.8
                    }))
                  }
                />
              </div>
            </div>
          )}
        </div>

        <div className="settings-group">
          <h3>Alignment &amp; Layer Identification</h3>
          <div className="control-row">
            <label htmlFor="regHolesSelect">Multi-Layer Registration Holes</label>
            <select
              id="regHolesSelect"
              value={settings.regHoles}
              onChange={e =>
                onChangeSettings(s => ({
                  ...s,
                  regHoles: e.target.value as RegistrationHoleMode
                }))
              }
            >
              <option value="asymmetric3">
                3 Asymmetric Corner Holes (Foolproof Orientation)
              </option>
              <option value="corners4">4 Symmetric Corner Holes</option>
              <option value="none">None</option>
            </select>
          </div>

          {settings.regHoles !== 'none' && (
            <div className="control-row">
              <label>
                <span>Alignment Hole Size (mm)</span>
                <span className="val-badge">{settings.regHoleSize.toFixed(1)} mm</span>
              </label>
              <div className="input-with-number">
                <input
                  type="range"
                  min="1.5"
                  max="8.0"
                  step="0.2"
                  value={settings.regHoleSize}
                  onChange={e =>
                    onChangeSettings(s => ({
                      ...s,
                      regHoleSize: parseFloat(e.target.value) || 3.2
                    }))
                  }
                />
                <input
                  type="number"
                  min="1.0"
                  max="15.0"
                  step="0.2"
                  value={settings.regHoleSize}
                  onChange={e =>
                    onChangeSettings(s => ({
                      ...s,
                      regHoleSize: parseFloat(e.target.value) || 3.2
                    }))
                  }
                />
              </div>
            </div>
          )}

          <div className="checkbox-row">
            <label>
              <input
                type="checkbox"
                checked={settings.embossId}
                onChange={e => onChangeSettings(s => ({ ...s, embossId: e.target.checked }))}
              />
              <span>Emboss tactile layer index markers on top border</span>
            </label>
          </div>

          <div className="checkbox-row">
            <label>
              <input
                type="checkbox"
                checked={settings.includeSilhouette}
                onChange={e =>
                  onChangeSettings(s => ({ ...s, includeSilhouette: e.target.checked }))
                }
              />
              <span>Include full-sprite silhouette base stencil layer</span>
            </label>
          </div>
        </div>

        <LayerList
          layers={layers}
          activeLayerKey={activeLayerKey}
          projectName={projectName}
          onSelectLayer={onSelectLayer}
        />
      </div>
    </section>
  );
}
