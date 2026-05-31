import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { imagetools } from 'vite-imagetools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    imagetools({
      defaultDirectives: (url) => {
        if (url.searchParams.has('preset-portrait')) {
          return new URLSearchParams({
            format: 'avif;webp;jpg',
            w: '480;768;1200',
            quality: '72',
            as: 'picture',
          })
        }
        return new URLSearchParams()
      },
    }),
  ],
  server: {
    hmr: {
      overlay: false,
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      external: [/^api\//],
      output: {
        manualChunks(id) {
          // TipTap + ProseMirror — sadece Admin/editor kullanır, ayrı chunk
          if (id.includes('node_modules/@tiptap') || id.includes('node_modules/prosemirror') || id.includes('node_modules/@lezer')) {
            return 'vendor-tiptap';
          }
          if (id.includes('node_modules/framer-motion')) {
            return 'vendor-motion';
          }
          if (id.includes('node_modules/react-icons')) {
            return 'vendor-icons';
          }
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react-router-dom')) {
            return 'vendor-react';
          }
          // three.js / ogl — ağır WebGL kütüphaneleri
          if (id.includes('node_modules/three') || id.includes('node_modules/ogl')) {
            return 'vendor-3d';
          }
        },
      },
    },
  },
  optimizeDeps: {
    exclude: ['bcryptjs', 'jsonwebtoken', 'mongodb', 'nodemailer'],
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.js'],
    include: ['tests/**/*.test.{js,jsx}'],
  },
})
