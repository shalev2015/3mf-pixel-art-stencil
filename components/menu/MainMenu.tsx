import type { Grid, Project, Theme } from '@/lib/types';
import MenuHeader from '@/components/menu/MenuHeader';
import ProjectsSection from '@/components/menu/ProjectsSection';
import TemplatesSection from '@/components/menu/TemplatesSection';

interface MainMenuProps {
  theme: Theme;
  projects: Project[];
  onToggleTheme: () => void;
  onOpenPalettes: () => void;
  onShowHelp: () => void;
  onNewProject: (templateKey: string, name: string) => void;
  onOpenProject: (project: Project) => void;
  onRenameProject: (project: Project) => void;
  onDuplicateProject: (id: string) => void;
  onDeleteProject: (id: string) => void;
  onDownloadProject: (project: Project, grid: Grid) => void;
  onImportProjects: (file: File) => void;
  onBackupProjects: () => void;
}

/** Home screen: saved projects and starter templates. */
export default function MainMenu({
  theme,
  projects,
  onToggleTheme,
  onOpenPalettes,
  onShowHelp,
  onNewProject,
  onOpenProject,
  onRenameProject,
  onDuplicateProject,
  onDeleteProject,
  onDownloadProject,
  onImportProjects,
  onBackupProjects
}: MainMenuProps) {
  return (
    <div className="main-menu-view">
      <MenuHeader
        theme={theme}
        onToggleTheme={onToggleTheme}
        onOpenPalettes={onOpenPalettes}
        onImportProjects={onImportProjects}
        onBackupProjects={onBackupProjects}
        onShowHelp={onShowHelp}
      />
      <main className="menu-content">
        <ProjectsSection
          projects={projects}
          onNewProject={() => onNewProject('duck', 'Duck')}
          onOpen={onOpenProject}
          onRename={onRenameProject}
          onDuplicate={onDuplicateProject}
          onDelete={onDeleteProject}
          onDownload={onDownloadProject}
        />
        <TemplatesSection onSelectTemplate={onNewProject} />
      </main>
    </div>
  );
}
