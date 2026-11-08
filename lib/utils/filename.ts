export function sanitizeFilename(name: string | null | undefined): string {
  const clean = (name || 'Arcade_Stencil')
    .trim()
    .replace(/[^a-zA-Z0-9_\-]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return clean || 'Arcade_Stencil';
}
