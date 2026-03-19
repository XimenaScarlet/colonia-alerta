import { ReactNode } from 'react';
import { InstallBanner } from '@/components/InstallBanner';

export default function HomeLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div>
      <div className="p-4 max-w-lg mx-auto">
        <InstallBanner />
      </div>
      <section className="p-4 max-w-lg mx-auto space-y-6">
        {children}
      </section>
    </div>
  );
}
