# 掃除タスク管理 - TaskWheel

Rails + React + PostgreSQL + Docker + Tailwind CSSで構築された、掃除タスク管理アプリケーション。

## 特徴

- **モダンなUI**: Tailwind CSSを使用したレスポンシブデザイン
- **SPA構成**: React Router による シングルページアプリケーション
- **RESTful API**: Rails API による マイクロサービスアーキテクチャ
- **Docker対応**: 簡単なセットアップと開発環境の構築
- **PostgreSQL**: スケーラブルなリレーショナルデータベース

## 機能

### メンバー管理

- メンバー情報の登録・編集・削除
- 苗字、名前、かな名の管理
- アーカイブ機能

### タスク管理

- タスク（掃除タスク）の登録・編集・削除
- 複数割り当て機能
- メンバーごとの担当タスク設定

### 自動シャッフル

- ワンクリックでタスクを自動割り当て
- 週間モード/日数間隔モードの切り替え
- リセット日付の自動管理

### 履歴管理

- タスク割り当ての履歴を記録
- 月ごとの履歴表示
- 履歴の検索・削除

### 設定

- リセット日付の設定
- シャッフルモードの設定
- データのエクスポート/インポート

## セットアップ

### 前提条件

- Docker & Docker Compose
- (オプション) Ruby 3.2+, Node.js 18+

### インストール

1. **プロジェクトのクローン**

```bash
cd TaskWheel
```

2. **.envファイルの設定**

```bash
cp .env.example .env
```

Googleログインを利用する場合は、`.env` に以下を設定してください。

```bash
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

Google Cloud Console 側では OAuth クライアント（Webアプリ）を作成し、承認済みリダイレクト URI に以下を登録してください。

```text
http://localhost:3000/users/auth/google_oauth2/callback
```

3. **Dockerコンテナの起動**

```bash
docker-compose up -d
```

4. **データベースの初期化**

```bash
docker-compose exec web rails db:create
docker-compose exec web rails db:migrate
```

5. **アプリケーションにアクセス**

ブラウザで `http://localhost:3000` を開く

6. **再設定メール確認（Gmail SMTP）**

`.env` に Gmail SMTP 設定を追加してください。

```bash
SMTP_ADDRESS=smtp.gmail.com
SMTP_PORT=587
SMTP_DOMAIN=gmail.com
SMTP_USER_NAME=your_gmail_address@gmail.com
SMTP_PASSWORD=your_google_app_password
SMTP_AUTHENTICATION=plain
SMTP_ENABLE_STARTTLS_AUTO=true
```

`SMTP_PASSWORD` には Google アカウントの通常パスワードではなく、2段階認証を有効化した上で発行した **アプリパスワード** を設定してください。

設定後に `docker compose up -d --build` で再起動し、「パスワードを忘れた場合」から送信したメールが Gmail 受信箱に届くことを確認してください。

## 開発

### ローカル開発（Docker不使用）

```bash
# Ruby環境の設定
bundle install

# Node環境の設定
npm install

# データベースの作成
rails db:create

# マイグレーションの実行
rails db:migrate

# 開発サーバーの起動
rails s -b 0.0.0.0
```

別のターミナルで以下を実行：

```bash
# Shakapacker の watch モード
npm run dev
```

### API エンドポイント

#### Members

```
GET    /api/v1/members           # 全メンバー取得
POST   /api/v1/members           # メンバー作成
GET    /api/v1/members/:id       # メンバー取得
PUT    /api/v1/members/:id       # メンバー更新
DELETE /api/v1/members/:id       # メンバー削除
POST   /api/v1/members/bulk_update # 複数メンバー更新
```

#### Works

```
GET    /api/v1/works             # 全タスク取得
POST   /api/v1/works             # タスク作成
GET    /api/v1/works/:id         # タスク取得
PUT    /api/v1/works/:id         # タスク更新
DELETE /api/v1/works/:id         # タスク削除
POST   /api/v1/works/shuffle     # シャッフル実行
```

#### Histories

```
GET    /api/v1/histories         # 履歴一覧取得
POST   /api/v1/histories         # 履歴作成
DELETE /api/v1/histories/:id     # 履歴削除
POST   /api/v1/histories/bulk_create # 複数履歴作成
```

## ディレクトリ構造

```
TaskWheel/
├── app/
│   ├── controllers/         # Rails コントローラー
│   ├── models/             # Rails モデル
│   ├── views/              # ERBビュー
│   └── javascript/
│       ├── components/     # React コンポーネント
│       ├── packs/          # JS エントリーポイント
│       └── stylesheets/    # CSS & Tailwind
├── config/                 # Rails 設定
├── db/
│   └── migrate/            # マイグレーションファイル
├── docker/                 # Docker 設定
├── public/                 # 静的ファイル
├── docker-compose.yml      # Docker Compose 設定
├── Dockerfile              # Dockerfile
├── Gemfile                 # Ruby 依存関係
├── package.json            # Node 依存関係
├── tailwind.config.js      # Tailwind 設定
└── postcss.config.js       # PostCSS 設定
```

## データベーススキーマ

### Members テーブル

- id (integer, PK)
- family_name (string, max: 30)
- given_name (string, max: 30)
- kana_name (string)
- archive (boolean, default: false)

### Works テーブル

- id (integer, PK)
- name (string)
- multiple (integer)
- archive (boolean, default: false)
- is_above (boolean, default: true)

### Histories テーブル

- id (integer, PK)
- work_id (integer, FK)
- member_id (integer, FK)
- date (date)

### MemberOptions テーブル

- id (integer, PK)
- work_id (integer, FK)
- member_id (integer, FK)
- status (integer) # 0: 除外, 1: 対象

### OffWorks テーブル

- id (integer, PK)
- work_id (integer, FK)
- date (date)

### ShuffleOptions テーブル

- id (integer, PK)
- reset_date (date)

### Worksheets テーブル

- id (integer, PK)
- interval (integer)
- week_use (boolean, default: false)
- week (integer, default: 0)

## トラブルシューティング

### ポートが既に使用されている場合

```bash
# ポート 3000 を使用しているプロセスを確認
lsof -i :3000

# 別のポートを使用する場合、docker-compose.ymlを編集
# ports: "3000:3000" → "3001:3000"
```

### データベース接続エラー

```bash
# コンテナのログを確認
docker-compose logs db

# コンテナを再起動
docker-compose restart db
```

### Node モジュールのエラー

```bash
# モジュールを再インストール
docker-compose exec web npm install

# キャッシュをクリア
docker-compose exec web npm cache clean --force
```

## ライセンス

MIT

## 作者

TaskWheel Development Team
