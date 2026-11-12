'use client';

import { useCallback, useEffect, useState } from 'react';
import type { ColorPalette, Project, Screen } from '@/lib/types';
import { PRESET_PALETTES } from '@/lib/constants/palettes';
import { downloadProject3mf, downloadProjectsJson } from '@/lib/export/downloads';
import { createProject } from '@/lib/projects/factory';
import { useColorPalettes } from '@/hooks/useColorPalettes';
import { usePaletteEditor } from '@/hooks/usePaletteEditor';
import { useProjects } from '@/hooks/useProjects';
import { useStudioSession } from '@/hooks/useStudioSession';
import { useTheme } from '@/hooks/useTheme';
import MainMenu from '@/components/menu/MainMenu';
import ColorPaletteModal from '@/components/modals/ColorPaletteModal';
import HelpModal from '@/components/modals/HelpModal';
import NewProjectModal from '@/components/modals/NewProjectModal';
import StencilStudio from '@/components/studio/StencilStudio';

/** Root orchestrator connecting screens, project storage, color palettes, and modals. */
export default function StencilApp() {
  const { theme, updateTheme, toggleTheme } = useTheme();
  const { customPalettes, allPalettes, updateCustomPalettes, findPalette } = useColorPalettes();
  const {
    projects,
    addProject,
    duplicateProject,
    deleteProject,
    renameProject,
    patchProject,
    importProjects
  } = useProjects();

  const session = useStudioSession(allPalettes);
  const {
    projectId,
    projectName,
    palette,
    paletteId,
    settings,
    sprite,
    openProject: loadSessionProject,
    applyPalette
  } = session;

  const [screen, setScreen] = useState<Screen>('menu');
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [newModalState, setNewModalState] = useState<{
    isOpen: boolean;
    templateKey: string;
    name: string;
  }>({
    isOpen: false,
    templateKey: 'duck',
    name: 'Duck'
  });

  const activePalette = findPalette(paletteId);

  // Auto-save active project edits back into project storage
  useEffect(() => {
    if (screen !== 'editor' || !projectId) return;
    patchProject(projectId, {
      name: projectName || 'Untitled Project',
      code: sprite.codeText,
      paletteId,
      paletteHexes: palette.map(c => c.hex),
      settings
    });
  }, [screen, projectId, projectName, sprite.codeText, paletteId, palette, settings, patchProject]);

  const getInitialModalHexes = useCallback(() => {
    if (screen === 'editor') {
      return palette.map(c => c.hex.toUpperCase());
    }
    return [...(activePalette?.hexes || PRESET_PALETTES[0].hexes)];
  }, [screen, palette, activePalette]);

  const paletteEditor = usePaletteEditor({
    allPalettes,
    customPalettes,
    updateCustomPalettes,
    activePaletteId: paletteId,
    getInitialHexes: getInitialModalHexes,
    onApply: applyPalette
  });

  const handleOpenProject = useCallback(
    (project: Project) => {
      loadSessionProject(project);
      setScreen('editor');
    },
    [loadSessionProject]
  );

  const handlePromptNewProject = useCallback((templateKey: string, name: string) => {
    setNewModalState({ isOpen: true, templateKey, name });
  }, []);

  const handleCreateNewProject = useCallback(
    (name: string, templateKey: string, chosenPalette: ColorPalette) => {
      const created = createProject(name, templateKey, chosenPalette);
      addProject(created);
      setNewModalState(prev => ({ ...prev, isOpen: false }));
      handleOpenProject(created);
    },
    [addProject, handleOpenProject]
  );

  const handleRenameProjectCard = useCallback(
    (project: Project) => {
      const nextName = window.prompt('Rename project:', project.name);
      if (nextName && nextName.trim()) {
        renameProject(project.id, nextName.trim());
      }
    },
    [renameProject]
  );

  const handleDeleteProjectCard = useCallback(
    (id: string) => {
      const target = projects.find(p => p.id === id);
      if (!target) return;
      if (window.confirm(`Delete project "${target.name}"?`)) {
        deleteProject(id);
      }
    },
    [projects, deleteProject]
  );

  const handleQuickSelectPalette = useCallback(
    (id: string) => {
      const found = allPalettes.find(p => p.id === id);
      if (found) {
        applyPalette(found.id, found.hexes);
      }
    },
    [allPalettes, applyPalette]
  );

  const handleDuplicateInStudio = useCallback(() => {
    if (!projectId) return;
    const copy = duplicateProject(projectId);
    if (copy) {
      handleOpenProject(copy);
    }
  }, [projectId, duplicateProject, handleOpenProject]);

  return (
    <>
      {screen === 'menu' && (
        <MainMenu
          theme={theme}
          projects={projects}
          onToggleTheme={toggleTheme}
          onOpenPalettes={paletteEditor.open}
          onShowHelp={() => setShowHelpModal(true)}
          onNewProject={handlePromptNewProject}
          onOpenProject={handleOpenProject}
          onRenameProject={handleRenameProjectCard}
          onDuplicateProject={duplicateProject}
          onDeleteProject={handleDeleteProjectCard}
          onDownloadProject={downloadProject3mf}
          onImportProjects={importProjects}
          onBackupProjects={() => downloadProjectsJson(projects)}
        />
      )}

      {screen === 'editor' && (
        <StencilStudio
          session={session}
          paletteName={activePalette.name}
          customPalettes={customPalettes}
          theme={theme}
          onBackToMenu={() => setScreen('menu')}
          onDuplicateProject={handleDuplicateInStudio}
          onSelectPalette={handleQuickSelectPalette}
          onEditPalette={paletteEditor.open}
          onToggleTheme={toggleTheme}
          onOpenHelp={() => setShowHelpModal(true)}
        />
      )}

      <NewProjectModal
        isOpen={newModalState.isOpen}
        initialTemplate={newModalState.templateKey}
        initialName={newModalState.name}
        defaultPaletteId={paletteId}
        allPalettes={allPalettes}
        customPalettes={customPalettes}
        onClose={() => setNewModalState(prev => ({ ...prev, isOpen: false }))}
        onCreate={handleCreateNewProject}
      />

      <ColorPaletteModal editor={paletteEditor} allPalettes={allPalettes} />

      <HelpModal isOpen={showHelpModal} onClose={() => setShowHelpModal(false)} />
    </>
  );
}
