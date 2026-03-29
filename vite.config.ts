import { defineConfig, transformWithEsbuild } from 'vite'
import RubyPlugin from 'vite-plugin-ruby'

export default defineConfig({
  plugins: [
    {
      name: 'treat-js-as-jsx',
      async transform(code, id) {
        if (!id.match(/app\/javascript\/.*\.js$/)) return null
        return transformWithEsbuild(code, id.replace(/\.js$/, '.jsx'), {
          loader: 'jsx',
          jsx: 'automatic',
          jsxImportSource: 'react',
        })
      },
    },
    RubyPlugin(),
  ],
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: 'react',
  },
  optimizeDeps: {
    esbuildOptions: {
      jsx: 'automatic',
      jsxImportSource: 'react',
      loader: {
        '.js': 'jsx',
      },
    },
  },
  server: {
    host: '0.0.0.0',
    hmr: {
      host: 'localhost',
    },
    watch: {
      usePolling: true,
    },
  },
})
