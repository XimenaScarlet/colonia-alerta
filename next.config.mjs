import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  additionalManifestEntries: [
    { url: '/home', revision: '1' },
    { url: '/reportes', revision: '1' },
    { url: '/mapa', revision: '1' },
    { url: '/mis-reportes', revision: '1' },
    { url: '/reportar', revision: '1' },
    { url: '/estadisticas', revision: '1' },
    { url: '/auth/login', revision: '1' },
    { url: '/auth/register', revision: '1' },
    { url: '/admin', revision: '1' },
  ],
  runtimeCaching: [
    {
      urlPattern: ({ url }) => url.origin === self.location.origin,
      handler: "CacheFirst",
      options: {
        cacheName: "pages-cache",
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 86400,
        },
        plugins: [
          {
            handlerDidError: async ({ request }) => self.fallback(request),
          },
        ],
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
        plugins: [
          {
            handlerDidError: async ({ request }) => self.fallback(request),
          },
        ],
      },
    },
  ],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

export default withPWA(nextConfig);
