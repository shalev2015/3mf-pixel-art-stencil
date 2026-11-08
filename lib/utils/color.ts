export function hexToRgbNormalized(hexStr: string | null | undefined): [number, number, number] {
  const clean = (hexStr || '#3b82f6').replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  return [
    Math.max(0.14, isNaN(r) ? 0.5 : r),
    Math.max(0.14, isNaN(g) ? 0.5 : g),
    Math.max(0.14, isNaN(b) ? 0.5 : b)
  ];
}
