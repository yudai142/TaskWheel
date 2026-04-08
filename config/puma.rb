# frozen_string_literal: true

# Puma Performance Configuration
# Production optimized settings

if ENV['RAILS_ENV'] == 'production'
  # ワーカープロセス数（CPU コア数）
  workers ENV.fetch('WEB_CONCURRENCY', 4)

  # スレッド数
  threads_count = ENV.fetch('RAILS_MAX_THREADS', 5)
  threads threads_count, threads_count

  # ポート
  port ENV.fetch('PORT', 3000)

  # API サーバーモード
  app_env = ENV.fetch('RACK_ENV', 'production')
  environment app_env

  # プリロード アプリケーション
  preload_app!

  # タイムアウト设定
  worker_timeout 60
  worker_shutdown_timeout 30

  # リクエスト スレッド
  on_worker_boot do
    ActiveRecord::Base.establish_connection
  end

  on_worker_shutdown do
    ActiveRecord::Base.close_connections
  end
else
  # Development
  threads_count = ENV.fetch('RAILS_MAX_THREADS', 5)
  threads threads_count, threads_count
  port ENV.fetch('PORT', 3000)
  environment 'development'
end
