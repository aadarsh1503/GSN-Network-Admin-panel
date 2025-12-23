import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),tailwindcss()],
  build: {
    outDir: 'build', 
    sourcemap: true, 
    minify: 'esbuild',
  },
  // server: {
  //   proxy: {
  //     '/api': {
  //       target: 'http://localhost:5000',
  //       changeOrigin: true, // Needed for virtual hosted sites
  //       secure: false,      // Set to false if your backend is not using HTTPS
  //     },
  //   },
  // },
});
