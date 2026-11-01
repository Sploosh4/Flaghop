import { defineConfig } from 'vitest/config';

export default defineConfig(({command}) => ({
  define: command === "build" ? {"process.env.NODE_ENV": JSON.stringify("production")} : {},
  build: {
    outDir: '../app/web/static/bundles',
    emptyOutDir: true,
    lib: {entry: 'src/main.tsx', formats: ['es'], fileName: () => 'workspace.js'},
    target: 'es2022',
    minify: true,
  },
  test: {environment: 'happy-dom', include: ['src/**/*.test.ts', 'src/**/*.test.tsx'], restoreMocks: true},
}));
