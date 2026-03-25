#!/bin/bash
set -e

# データベース初期化
echo "Setting up database..."
bundle exec rails db:create || true
bundle exec rails db:migrate || true

# Rails サーバー起動
echo "Starting Rails server..."
exec bundle exec rails server -b 0.0.0.0
