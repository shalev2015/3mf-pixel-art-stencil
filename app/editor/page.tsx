'use client';

import { Suspense } from 'react';
import StencilApp from '@/components/StencilApp';

export default function EditorPage() {
  return (
    <Suspense fallback={null}>
      <StencilApp screen="editor" />
    </Suspense>
  );
}
