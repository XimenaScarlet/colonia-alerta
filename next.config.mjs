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
    { url: "/", revision: "4" },
    { url: "/home", revision: "4" },
    { url: "/reportes", revision: "4" },
    { url: "/mapa", revision: "4" },
    { url: "/mis-reportes", revision: "4" },
    { url: "/reportar", revision: "4" },
    { url: "/estadisticas", revision: "4" },
    { url: "/auth/login", revision: "4" },
    { url: "/auth/register", revision: "4" },
    { url: "/offline", revision: "4" },
  ],
  runtimeCaching: [
    {
      urlPattern: ({ url }) => url.origin === self.location.origin && (url.pathname === "/" || url.pathname === "/home" || url.pathname === "/offline"),
      handler: "CacheFirst", // Forzar cache para las páginas esenciales en el arranque
      options: {
        cacheName: "essential-pages",
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 86400,
        },
      },
    },
    {
      urlPattern: ({ url }) => url.origin === self.location.origin,
      handler: "NetworkFirst",
      options: {
        cacheName: "pages-cache",
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 86400,
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
    {
      urlPattern: /^https?:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "google-fonts",
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 365 * 24 * 60 * 60,
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
