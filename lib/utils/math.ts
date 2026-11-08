export function roundCoord(val: number): number {
  return Math.round(val * 10000) / 10000;
}

export function dedupSorted(arr: number[], eps: number): number[] {
  if (arr.length === 0) return [];
  const out = [arr[0]];
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] - out[out.length - 1] > eps) {
      out.push(arr[i]);
    }
  }
  return out;
}
