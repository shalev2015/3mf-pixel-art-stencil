export function triggerFileDownload(
  uint8Array: Uint8Array,
  filename: string,
  mimeType = 'application/octet-stream'
): void {
  const blob = new Blob([uint8Array as BlobPart], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 200);
}
