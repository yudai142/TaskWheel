#!/bin/bash

set -e

echo "=========================================="
echo "TaskWheel セットアップスクリプト"
echo "=========================================="
echo ""

echo "1. Docker イメージをビルド中..."
docker-compose build

echo ""
echo "2. Docker コンテナを起動中..."
docker-compose up -d

echo ""
echo "3. データベースを作成中..."
docker-compose exec -T web rails db:create

echo ""
echo "4. マイグレーションを実行中..."
docker-compose exec -T web rails db:migrate

echo ""
echo "5. サンプルデータを作成中..."
docker-compose exec -T web rails db:seed

echo ""
echo "=========================================="
echo "セットアップが完了しました！"
echo "=========================================="
echo ""
echo "アプリケーションを起動するには以下を実行してください:"
echo "docker-compose up"
echo ""
echo "ブラウザで以下にアクセスしてください:"
echo "http://localhost:3000"
echo ""
echo "コンテナを停止するには:"
echo "docker-compose down"
echo ""
