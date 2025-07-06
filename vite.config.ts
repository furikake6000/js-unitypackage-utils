import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'UnityPackageUtils',
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format === 'es' ? 'js' : 'cjs'}`
    },
    rollupOptions: {
      external: ['js-yaml', 'nanotar'],
      output: {
        globals: {
          'js-yaml': 'jsYaml',
          'nanotar': 'nanotar'
        }
      }
    },
    sourcemap: true,
    minify: false
  },
  test: {
    environment: 'jsdom'
  }
})