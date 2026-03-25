import type { Metadata } from "next";
// import localFont from "next/font/local";
import "./globals.css";
import { BottomNav } from "@/components/BottomNav";
import { Header } from "@/components/Header";
import { SyncInitializer } from "@/components/SyncInitializer";
import { AuthProvider } from "@/components/AuthProvider";

// Import system fonts as fallbacks, or omit them

export const metadata: Metadata = {
  title: "Colonia Alerta",
  description: "Reporte ciudadano de incidencias en Saltillo y Ramos Arizpe",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Colonia Alerta",
  },
};

export const viewport = {
  themeColor: "#0ea5e9",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(function(registration) {
                    console.log('ServiceWorker registration successful with scope: ', registration.scope);
                  }, function(err) {
                    console.log('ServiceWorker registration failed: ', err);
                  });
                });
              }
            `,
          }}
        />
      </head>
      <body
        className={`antialiased bg-white text-gray-900 pb-16 pt-14 min-h-screen`}
      >
        <AuthProvider>
          <SyncInitializer />
          <Header />
          <main className="min-h-[calc(100vh-7.5rem)]">{children}</main>
          <BottomNav />
        </AuthProvider>
      </body>
    </html>
  );
}
