import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  fallbacks: {
    document: "/offline", // Página de fallback corregida
  },
  additionalManifestEntries: [
    { url: '/home', revision: '2' },
    { url: '/reportes', revision: '2' },
    { url: '/mapa', revision: '2' },
    { url: '/mis-reportes', revision: '2' },
    { url: '/reportar', revision: '2' },
    { url: '/estadisticas', revision: '2' },
    { url: '/auth/login', revision: '2' },
    { url: '/auth/register', revision: '2' },
    { url: '/admin', revision: '2' },
    { url: '/offline', revision: '2' },
  ],
  runtimeCaching: [
    {
      urlPattern: ({ url }) => url.origin === self.location.origin,
      handler: "NetworkFirst", // Cambiado de CacheFirst a NetworkFirst para asegurar datos frescos
      options: {
        cacheName: "pages-cache",
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 86400,
        },
      },
    },
    {
      urlPattern: /^https?:\/\//,
      handler: "NetworkFirst",
      options: {
        cacheName: "offline-cache",
        networkTimeoutSeconds: 10,
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 24 * 60 * 60,
        },
      },
    },
  ],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

export default withPWA(nextConfig);
