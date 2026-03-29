#!/bin/sh
set -e

# 依存関係のインストールを確実に行う
bundle install
npm install

# Railsのサーバーが異常終了した際に残る可能性があるPIDファイルを削除します
if [ -f /app/tmp/pids/server.pid ]; then
  rm /app/tmp/pids/server.pid
fi

# Viteデブサーバーをバックグラウンドで起動します
echo "Starting Vite development server..."
bundle exec vite dev &

# DB setup
bundle exec rails db:create db:migrate 2>/dev/null || true

# Railsサーバーを起動します（これがメインプロセスとなります）
echo "Starting Rails server..."
exec bundle exec rails s -b '0.0.0.0'
