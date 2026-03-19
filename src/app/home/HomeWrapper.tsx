'use client';

import { ReactNode } from 'react';
import { InstallBanner } from '@/components/InstallBanner';

export function HomeWrapper({ children }: { children: ReactNode }) {
  return (
    <div className="p-4 space-y-6 max-w-lg mx-auto">
      <InstallBanner />
      {children}
    </div>
  );
}
