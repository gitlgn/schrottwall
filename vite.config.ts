import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './',
  server: { host: true, port: 5180, strictPort: true },
  build: {
    rollupOptions: { input: { main: 'index.html', test: 'test.html' } },
  },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      workbox: { globPatterns: ['**/*.{js,css,html,png,svg,webmanifest}'] },
      manifest: {
        name: 'Schrottwall',
        short_name: 'Schrottwall',
        description: 'Deckung, Sägeblatt an der Kette, Dämonen.',
        lang: 'de',
        start_url: '.',
        scope: '.',
        display: 'fullscreen',
        orientation: 'portrait',
        background_color: '#1a0f1c',
        theme_color: '#1a0f1c',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
});
