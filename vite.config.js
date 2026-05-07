import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',        // output folder
  },
  preview: {
    host: '0.0.0.0',       // Docker ke liye zaroori
    port: 3000,
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
  }
})