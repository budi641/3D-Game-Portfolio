import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  optimizeDeps: {
    include: ['@sanity/color-input'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('@sanity/color-input')) {
            return 'sanity-color-input'
          }
        },
      },
    },
  },
  resolve: {
    alias: [
      // Force exact 'sanity' import to use web's package (avoids studio's sanity 3.x)
      { find: /^sanity$/, replacement: path.resolve(__dirname, 'node_modules/sanity') },
    ],
  },
  server: {
    fs: {
      allow: [path.resolve(__dirname, '..')],
    },
  },
})
