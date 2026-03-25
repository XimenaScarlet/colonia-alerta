import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  fallbacks: {
    document: "/offline",
  },
  additionalManifestEntries: [
    { url: "/", revision: "6" },
    { url: "/home", revision: "6" },
    { url: "/offline", revision: "6" },
    { url: "/manifest.json", revision: "6" },
  ],
  runtimeCaching: [
    {
      // Páginas esenciales: Intentar red pero servir caché inmediatamente si falla o tarda
      urlPattern: ({ url }) => url.origin === self.location.origin && (url.pathname === "/" || url.pathname === "/home" || url.pathname === "/offline"),
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "essential-pages",
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 86400,
        },
      },
    },
    {
      // Resto de páginas internas: StaleWhileRevalidate es mejor para PWA
      urlPattern: ({ url }) => url.origin === self.location.origin && !url.pathname.startsWith('/api'),
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "pages-cache",
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 86400,
        },
      },
    },
    {
      // APIs: NetworkOnly o NetworkFirst (nunca Stale para datos vivos)
      urlPattern: ({ url }) => url.origin === self.location.origin && url.pathname.startsWith('/api'),
      handler: "NetworkFirst",
      options: {
        cacheName: "api-cache",
        networkTimeoutSeconds: 5,
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 3600,
        },
      },
    },
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
      handler: "CacheFirst",
      options: {
        cacheName: "images-cache",
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 30 * 24 * 60 * 60,
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
