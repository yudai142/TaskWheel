#!/bin/sh
set -e

# Stale PID ファイルを削除
if [ -f /app/tmp/pids/server.pid ]; then
  rm /app/tmp/pids/server.pid
fi

# データベースマイグレーションを実行
echo "Running database migrations..."
bundle exec rails db:migrate

# Rails サーバーを起動（Render.com は PORT 環境変数を設定する）
echo "Starting Rails server..."
exec bundle exec rails server -b 0.0.0.0 -p "${PORT:-3000}"
