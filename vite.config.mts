import { defineConfig } from 'vite'
import RubyPlugin from 'vite-plugin-ruby'

export default defineConfig({
  plugins: [
    RubyPlugin(),
  ],
  server: {
    host: '0.0.0.0', // コンテナ外からのアクセスを許可
    hmr: {
      host: 'localhost', // ブラウザが接続しにいくホスト名
    },
    watch: {
      usePolling: true, // Docker環境でのファイル変更検知を確実にする
    },
  },
})