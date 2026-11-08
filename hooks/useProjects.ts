'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Project } from '@/lib/types';
import { copyProject, createSeedProjects, parseImportedProjects } from '@/lib/projects/factory';
import { loadProjects, saveProjects } from '@/lib/projects/storage';

/** Saved projects list with localStorage persistence and CRUD helpers. */
export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    const loaded = loadProjects();
    if (loaded) {
      setProjects(loaded);
      return;
    }
    const seed = createSeedProjects();
    setProjects(seed);
    saveProjects(seed);
  }, []);

  const saveList = useCallback((next: Project[]) => {
    setProjects(next);
    saveProjects(next);
  }, []);

  const addProject = useCallback(
    (project: Project) => saveList([project, ...projects]),
    [projects, saveList]
  );

  const duplicateProject = useCallback(
    (id: string): Project | null => {
      const original = projects.find(p => p.id === id);
      if (!original) return null;
      const copy = copyProject(original);
      saveList([copy, ...projects]);
      return copy;
    },
    [projects, saveList]
  );

  const deleteProject = useCallback(
    (id: string) => saveList(projects.filter(p => p.id !== id)),
    [projects, saveList]
  );

  const renameProject = useCallback(
    (id: string, name: string) =>
      saveList(projects.map(p => (p.id === id ? { ...p, name, updatedAt: Date.now() } : p))),
    [projects, saveList]
  );

  /** Merges `patch` into a project and persists it (used by the Studio auto-save). */
  const patchProject = useCallback((id: string, patch: Partial<Project>) => {
    setProjects(prev => {
      const idx = prev.findIndex(p => p.id === id);
      if (idx === -1) return prev;
      const next = [...prev];
      next[idx] = { ...prev[idx], ...patch, updatedAt: Date.now() };
      saveProjects(next);
      return next;
    });
  }, []);

  /** Reads an exported `.json` file and prepends its projects. */
  const importProjects = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const valid = parseImportedProjects(JSON.parse(String(reader.result)));
          if (valid.length > 0) saveList([...valid, ...projects]);
        } catch {
          window.alert('Could not parse projects JSON file.');
        }
      };
      reader.readAsText(file);
    },
    [projects, saveList]
  );

  return {
    projects,
    addProject,
    duplicateProject,
    deleteProject,
    renameProject,
    patchProject,
    importProjects
  };
}
