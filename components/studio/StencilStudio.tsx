'use client';

import { useState } from 'react';
import type { ColorPalette, Theme, ViewMode } from '@/lib/types';
import type { StudioSession } from '@/hooks/useStudioSession';
import { useStencilBuild } from '@/hooks/useStencilBuild';
import SettingsPanel from '@/components/studio/SettingsPanel';
import SpriteInputPanel from '@/components/studio/SpriteInputPanel';
import StudioHeader from '@/components/studio/StudioHeader';
import Viewport3DPanel from '@/components/studio/Viewport3DPanel';

interface StencilStudioProps {
  session: StudioSession;
  paletteName: string;
  customPalettes: ColorPalette[];
  theme: Theme;
  onBackToMenu: () => void;
  onDuplicateProject: () => void;
  onSelectPalette: (id: string) => void;
  onEditPalette: () => void;
  onToggleTheme: () => void;
  onOpenHelp: () => void;
}

/** Full 3-column Stencil Studio workspace view. */
export default function StencilStudio({
  session,
  paletteName,
  customPalettes,
  theme,
  onBackToMenu,
  onDuplicateProject,
  onSelectPalette,
  onEditPalette,
  onToggleTheme,
  onOpenHelp
}: StencilStudioProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('single');

  const { layers, plaqueMeshes, activeLayer, activeLayerKey, selectLayer } = useStencilBuild(
    session.sprite.grid,
    session.settings,
    session.palette,
    session.projectName
  );

  const colorLayerCount = layers.filter(l => l.key.startsWith('color_')).length;

  const handleSelectLayerFromList = (key: string) => {
    selectLayer(key);
    if (viewMode !== 'single') {
      setViewMode('single');
    }
  };

  return (
    <div className="editor-view">
      <StudioHeader
        projectName={session.projectName}
        palette={session.palette}
        theme={theme}
        onBackToMenu={onBackToMenu}
        onRenameProject={session.setProjectName}
        onLoadPresetCode={session.sprite.applyCodeText}
        onImportGrid={session.sprite.updateGrid}
        onDuplicateProject={onDuplicateProject}
        onToggleTheme={onToggleTheme}
        onOpenHelp={onOpenHelp}
      />

      <main className="workspace-grid">
        <SpriteInputPanel
          sprite={session.sprite}
          palette={session.palette}
          paletteId={session.paletteId}
          paletteName={paletteName}
          customPalettes={customPalettes}
          theme={theme}
          colorLayerCount={colorLayerCount}
          onSelectPalette={onSelectPalette}
          onEditPalette={onEditPalette}
        />

        <Viewport3DPanel
          projectName={session.projectName}
          viewMode={viewMode}
          onChangeViewMode={setViewMode}
          layers={layers}
          plaqueMeshes={plaqueMeshes}
          activeLayer={activeLayer}
          activeLayerKey={activeLayerKey}
          onSelectLayer={selectLayer}
          settings={session.settings}
          theme={theme}
        />

        <SettingsPanel
          settings={session.settings}
          onChangeSettings={session.setSettings}
          onResetSettings={session.resetSettings}
          layers={layers}
          activeLayerKey={activeLayerKey}
          projectName={session.projectName}
          onSelectLayer={handleSelectLayerFromList}
        />
      </main>
    </div>
  );
}
