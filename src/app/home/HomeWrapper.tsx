'use client';

import { ReactNode } from 'react';
export function HomeWrapper({ children }: { children: ReactNode }) {
  return (
    <div className="p-4 space-y-6 max-w-lg mx-auto">
      {children}
    </div>
  );
}
