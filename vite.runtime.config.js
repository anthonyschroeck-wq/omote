import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: 'src/runtime-entry.js',
      name: 'OmoteRuntime',
      fileName: 'omote-runtime',
      formats: ['iife'],
    },
    outDir: 'public',
    emptyOutDir: false,
    rollupOptions: {
      output: {
        entryFileNames: 'omote-runtime.js',
      },
    },
  },
})
