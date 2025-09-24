import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from "vite-plugin-svgr";
import path from 'path';


export default defineConfig({
    plugins: [
      svgr(),
      react(),
    ],
    resolve: {
      alias: {
        '~~': path.resolve(__dirname, 'src'),
      },
    },
    define: {
      "window.global": {},
      'process.env': process.env,
      'process.version': JSON.stringify(process.version),
    },
    build: {
      outDir: 'dist',
    },
    server: { host: '0.0.0.0', port: 3001, allowedHosts: ['playsami.fun'] },
    preview:{ host: '0.0.0.0', port: 3001, allowedHosts: ['playsami.fun'] },
});