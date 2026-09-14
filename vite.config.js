import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // 'autoUpdate' silently fetches the new service worker in the background;
      // it takes over on the *next* full navigation, so it never yanks the UI
      // out from under someone mid-sale.
      registerType: 'autoUpdate',
      injectRegister: 'auto',

      // Static files already in /public that aren't referenced from JS/CSS
      // still need to be precached explicitly.
      includeAssets: ['favicon.svg', 'icons.svg', 'stocks.jpg', 'apple-touch-icon.png'],

      manifest: {
        name: 'Ousman ERP',
        short_name: 'Ousman ERP',
        description: 'Inventory, sales, and finance management for Ousman ERP',
        theme_color: '#0F1F04',
        background_color: '#F0F7E2',
        display: 'standalone',
        // orientation intentionally omitted — locking to 'portrait' here would
        // force portrait even when the phone's own auto-rotate is on. Omitting
        // the property lets the installed app inherit normal system rotation
        // behavior: it follows the device's auto-rotate toggle rather than
        // overriding it.
        start_url: '/',
        scope: '/',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },

      workbox: {
        // App shell (JS/CSS/HTML/icons) is precached automatically by Workbox.
        // API calls are NOT precached — they're handled by runtimeCaching below
        // so the SPA fallback never serves an API URL as if it were a page.
        navigateFallbackDenylist: [/^\/api\//],

        runtimeCaching: [
          {
            // Matches both the same-origin Nginx-proxied path (/api/...)
            // and the direct-to-Render URL used when VITE_API_URL points
            // straight at https://ousman-backend.onrender.com.
            urlPattern: ({ url }) =>
              url.pathname.startsWith('/api/') || url.hostname.endsWith('onrender.com'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'ousman-api-cache',
              networkTimeoutSeconds: 8,
              expiration: { maxEntries: 150, maxAgeSeconds: 60 * 60 * 24 }, // 1 day
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },

      devOptions: {
        // Keep the SW out of `npm run dev` — test PWA behavior with
        // `npm run build && npm run preview` instead.
        enabled: false,
      },
    }),
  ],
})