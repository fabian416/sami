import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill';
import { NodeModulesPolyfillPlugin } from '@esbuild-plugins/node-modules-polyfill';
import nodePolyfills from 'rollup-plugin-polyfill-node';
import cjs from '@rollup/plugin-commonjs';
import svgr from "vite-plugin-svgr";
import path from 'path';


// https://vitejs.dev/config/
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
      // minify: false,
      //target: "es2015",
      outDir: 'dist',
    },
    server: { host: '0.0.0.0', port: 3000, allowedHosts: ['playsami.fun'] },
    preview:{ host: '0.0.0.0', port: 3000, allowedHosts: ['playsami.fun'] },
});