import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue()
  ],
  // Use relative base path for Electron (file:// protocol)
  base: './',
  publicDir: 'public',
  server: {
    port: 5185,
    strictPort: false // Allow Vite to try the next port if 5185 is in use
  }
})
