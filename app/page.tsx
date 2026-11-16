'use client';

import { Suspense } from 'react';
import StencilApp from '@/components/StencilApp';

export default function Page() {
  return (
    <Suspense fallback={null}>
      <StencilApp screen="menu" />
    </Suspense>
  );
}
