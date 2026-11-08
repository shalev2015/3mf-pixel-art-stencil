'use client';

import { useCallback, useMemo, useState } from 'react';
import type { ColorPalette } from '@/lib/types';
import { PRESET_PALETTES } from '@/lib/constants/palettes';
import { sanitizePaletteHexes } from '@/lib/palette/utils';
import { generateId } from '@/lib/utils/id';

interface UsePaletteEditorOptions {
  allPalettes: ColorPalette[];
  customPalettes: ColorPalette[];
  updateCustomPalettes: (next: ColorPalette[]) => void;
  activePaletteId: string;
  /** Colors shown when the editor opens (the open project's colors, or the active palette). */
  getInitialHexes: () => string[];
  onApply: (paletteId: string, hexes: string[]) => void;
}

/** State and actions behind the Color Palette editor modal. */
export function usePaletteEditor({
  allPalettes,
  customPalettes,
  updateCustomPalettes,
  activePaletteId,
  getInitialHexes,
  onApply
}: UsePaletteEditorOptions) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedId, setSelectedId] = useState('arcade');
  const [hexes, setHexes] = useState<string[]>(() => [...PRESET_PALETTES[0].hexes]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameText, setRenameText] = useState('');

  const selectedPalette = useMemo(
    () => allPalettes.find(p => p.id === selectedId) || PRESET_PALETTES[0],
    [allPalettes, selectedId]
  );

  const open = useCallback(() => {
    setSelectedId(activePaletteId || 'arcade');
    setHexes(getInitialHexes().map(h => h.toUpperCase()));
    setDropdownOpen(false);
    setIsRenaming(false);
    setIsOpen(true);
  }, [activePaletteId, getInitialHexes]);

  const close = useCallback(() => {
    setIsOpen(false);
    setDropdownOpen(false);
    setIsRenaming(false);
  }, []);

  const toggleDropdown = useCallback(() => setDropdownOpen(prev => !prev), []);
  const closeDropdown = useCallback(() => setDropdownOpen(false), []);

  const selectPalette = useCallback((palette: ColorPalette) => {
    setSelectedId(palette.id);
    setHexes(palette.hexes.map(h => h.toUpperCase()));
    setDropdownOpen(false);
    setIsRenaming(false);
  }, []);

  /** Starts a new custom palette from the colors currently shown, then asks for its name. */
  const createCustomPalette = useCallback(() => {
    const created: ColorPalette = {
      id: `custom_${generateId()}`,
      name: `Custom ${customPalettes.length + 1}`,
      isPreset: false,
      hexes: hexes.map(h => h.toUpperCase())
    };
    updateCustomPalettes([...customPalettes, created]);
    setSelectedId(created.id);
    setRenameText(created.name);
    setIsRenaming(true);
    setDropdownOpen(false);
  }, [customPalettes, hexes, updateCustomPalettes]);

  /** Renames a custom palette; a preset is first forked into an editable custom copy. */
  const startRename = useCallback(() => {
    if (selectedPalette.isPreset) {
      const forked: ColorPalette = {
        id: `custom_${generateId()}`,
        name: `${selectedPalette.name} Custom`,
        isPreset: false,
        hexes: hexes.map(h => h.toUpperCase())
      };
      updateCustomPalettes([...customPalettes, forked]);
      setSelectedId(forked.id);
      setRenameText(forked.name);
    } else {
      setRenameText(selectedPalette.name);
    }
    setIsRenaming(true);
    setDropdownOpen(false);
  }, [customPalettes, hexes, selectedPalette, updateCustomPalettes]);

  const commitRename = useCallback(() => {
    const trimmed = renameText.trim();
    if (trimmed) {
      updateCustomPalettes(customPalettes.map(p => (p.id === selectedId ? { ...p, name: trimmed } : p)));
    }
    setIsRenaming(false);
  }, [customPalettes, renameText, selectedId, updateCustomPalettes]);

  const cancelRename = useCallback(() => setIsRenaming(false), []);

  const deleteSelected = useCallback(() => {
    if (selectedPalette.isPreset) return;
    updateCustomPalettes(customPalettes.filter(p => p.id !== selectedId));
    const fallback = PRESET_PALETTES[0];
    setSelectedId(fallback.id);
    setHexes([...fallback.hexes]);
    setIsRenaming(false);
  }, [customPalettes, selectedId, selectedPalette, updateCustomPalettes]);

  const setColor = useCallback((colorIdx: number, value: string) => {
    setHexes(prev => prev.map((h, i) => (i === colorIdx ? value : h)));
  }, []);

  const swapColors = useCallback((a: number, b: number) => {
    if (a < 1 || a > 15 || b < 1 || b > 15) return;
    setHexes(prev => {
      const next = [...prev];
      [next[a], next[b]] = [next[b], next[a]];
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setHexes(selectedPalette.hexes.map(h => h.toUpperCase()));
  }, [selectedPalette]);

  /** Saves edits into the chosen custom palette (or a new copy of an edited preset) and applies it. */
  const apply = useCallback(() => {
    const clean = sanitizePaletteHexes(hexes);
    let targetId = selectedPalette.id;

    if (!selectedPalette.isPreset) {
      updateCustomPalettes(customPalettes.map(p => (p.id === selectedPalette.id ? { ...p, hexes: clean } : p)));
    } else {
      const modified = selectedPalette.hexes
        .slice(1, 16)
        .some((h, idx) => h.toUpperCase() !== clean[idx + 1].toUpperCase());
      if (modified) {
        const created: ColorPalette = {
          id: `custom_${generateId()}`,
          name: `${selectedPalette.name} Custom`,
          isPreset: false,
          hexes: clean
        };
        updateCustomPalettes([...customPalettes, created]);
        targetId = created.id;
      }
    }

    onApply(targetId, clean);
    close();
  }, [close, customPalettes, hexes, onApply, selectedPalette, updateCustomPalettes]);

  return {
    isOpen,
    selectedPalette,
    hexes,
    dropdownOpen,
    isRenaming,
    renameText,
    setRenameText,
    open,
    close,
    toggleDropdown,
    closeDropdown,
    selectPalette,
    createCustomPalette,
    startRename,
    commitRename,
    cancelRename,
    deleteSelected,
    setColor,
    swapColors,
    reset,
    apply
  };
}

export type PaletteEditor = ReturnType<typeof usePaletteEditor>;
