import { ReactNode } from 'react';
export default function HomeLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div>
      <section className="p-4 max-w-lg mx-auto space-y-6">
        {children}
      </section>
    </div>
  );
}
