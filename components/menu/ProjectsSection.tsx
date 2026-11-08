'use client';

import { useMemo, useState } from 'react';
import type { Grid, Project } from '@/lib/types';
import ProjectCard from '@/components/menu/ProjectCard';

interface ProjectsSectionProps {
  projects: Project[];
  onNewProject: () => void;
  onOpen: (project: Project) => void;
  onRename: (project: Project) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onDownload: (project: Project, grid: Grid) => void;
}

export default function ProjectsSection({
  projects,
  onNewProject,
  onOpen,
  onRename,
  onDuplicate,
  onDelete,
  onDownload
}: ProjectsSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProjects = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return [...projects]
      .filter(p => !q || p.name.toLowerCase().includes(q))
      .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  }, [projects, searchQuery]);

  return (
    <section className="menu-section">
      <div className="menu-section-header">
        <div>
          <h2>My Projects</h2>
          <p className="menu-section-sub">Your saved stencil projects are stored automatically in your browser</p>
        </div>
        <div className="menu-search-wrap">
          <input
            type="search"
            id="projectSearchInput"
            placeholder="Search projects by name..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          <button type="button" className="btn btn-primary" onClick={onNewProject}>
            + New Stencil Project
          </button>
        </div>
      </div>

      <div className="projects-grid">
        <button type="button" className="new-project-card" onClick={onNewProject}>
          <div className="new-project-plus">+</div>
          <strong>New Stencil Project</strong>
          <span>Create a named project from JS code, templates, or a blank grid</span>
        </button>

        {filteredProjects.map(project => (
          <ProjectCard
            key={project.id}
            project={project}
            onOpen={onOpen}
            onRename={onRename}
            onDuplicate={onDuplicate}
            onDelete={onDelete}
            onDownload={onDownload}
          />
        ))}
      </div>
    </section>
  );
}
