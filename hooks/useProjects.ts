'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Project } from '@/lib/types';
import { copyProject, createSeedProjects, parseImportedProjects } from '@/lib/projects/factory';
import { loadProjects, saveProjects } from '@/lib/projects/storage';

/** Saved projects list with per-user (or guest) localStorage persistence and CRUD helpers. */
export function useProjects(userId?: string | null) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(false);
    const loaded = loadProjects(userId);
    if (loaded) {
      setProjects(loaded);
      setIsLoaded(true);
      return;
    }
    const seed = createSeedProjects();
    setProjects(seed);
    saveProjects(seed, userId);
    setIsLoaded(true);
  }, [userId]);

  const saveList = useCallback(
    (next: Project[]) => {
      setProjects(next);
      saveProjects(next, userId);
    },
    [userId]
  );

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
  const patchProject = useCallback(
    (id: string, patch: Partial<Project>) => {
      setProjects(prev => {
        const idx = prev.findIndex(p => p.id === id);
        if (idx === -1) return prev;
        const next = [...prev];
        next[idx] = { ...prev[idx], ...patch, updatedAt: Date.now() };
        saveProjects(next, userId);
        return next;
      });
    },
    [userId]
  );

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
    isLoaded,
    addProject,
    duplicateProject,
    deleteProject,
    renameProject,
    patchProject,
    importProjects
  };
}
