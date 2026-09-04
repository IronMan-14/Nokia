import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Deployed to https://ironman-14.github.io/Nokia/ , so assets must resolve
// under the /Nokia/ sub-path. Override with BASE_PATH for other hosts
// (e.g. BASE_PATH=/ for a custom domain or local `vite preview`).
const base = process.env.BASE_PATH ?? '/Nokia/'

const BUILD_ID = new Date().toISOString().slice(0, 16).replace('T', ' ')

export default defineConfig({
  base,
  define: { __BUILD_ID__: JSON.stringify(BUILD_ID) },
  plugins: [react()],
  server: { host: '0.0.0.0', port: 5173, allowedHosts: true },
  preview: { host: '0.0.0.0', port: 5173, allowedHosts: true },
})
