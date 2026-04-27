import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: './src/index.js',
      formats: ['es'],
    },
    rollupOptions: {
      output: {
        preserveModules: true,
        preserveModulesRoot: 'src',
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        manualChunks: undefined,
      },
    },
    minify: 'esbuild',
    sourcemap: true,
    emptyOutDir: true,
    target: 'es2022',
  },
});
