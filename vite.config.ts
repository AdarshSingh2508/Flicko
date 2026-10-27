import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' keeps asset paths relative so the build works on Vercel,
// GitHub Pages (project sites), or any static host.
export default defineConfig({
  base: './',
  plugins: [react()],
})
