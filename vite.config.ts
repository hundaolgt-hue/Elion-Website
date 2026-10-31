import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': resolve(__dirname, 'src') } },
  build: {
    target: 'es2022',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        notfound: resolve(__dirname, '404.html'),
      },
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules/three/')) return 'three'
          if (id.includes('@react-three/') || id.includes('three-stdlib') || id.includes('node_modules/maath')) return 'r3f'
          if (id.includes('postprocessing')) return 'post'
          if (id.includes('node_modules/gsap') || id.includes('node_modules/lenis')) return 'gsap'
        },
      },
    },
    chunkSizeWarningLimit: 900,
  },
  server: { host: true, port: 5173 },
})
