# frozen_string_literal: true

# セッションを使ったログイン/ログアウト/現在のユーザー情報APIコントローラー
module Api
  module V1
    class SessionsController < ActionController::API
      include ActionController::Cookies

      # GET /api/v1/auth/me
      # 現在のログイン状態とユーザー情報を返す
      def me
        user = User.find_by(id: session[:user_id])
        if user
          worksheet = current_worksheet_for(user)
          render json: {
            authenticated: true,
            user: serialize_user(user),
            current_worksheet: worksheet ? serialize_worksheet(worksheet) : nil
          }
        else
          render json: { authenticated: false, user: nil, current_worksheet: nil }
        end
      end

      # POST /api/v1/auth/login
      # メール/パスワードでログイン
      def login
        # ユーザーが登録されていない場合、デモアカウントを自動生成
        User.seed_demo_user!

        user = User.find_by(email: params[:email].to_s.strip.downcase)
        if user&.valid_password?(params[:password])
          session[:user_id] = user.id
          worksheet = current_worksheet_for(user)
          render json: {
            authenticated: true,
            user: serialize_user(user),
            current_worksheet: worksheet ? serialize_worksheet(worksheet) : nil
          }
        else
          render json: { error: 'メールアドレスまたはパスワードが正しくありません' }, status: :unauthorized
        end
      end

      # POST /api/v1/auth/logout
      # ログアウト
      def logout
        session.delete(:user_id)
        session.delete(:current_worksheet_id)
        render json: { authenticated: false }
      end

      # POST /api/v1/auth/register
      # 新規ユーザー登録
      def register
        user = User.new(
          email: params[:email].to_s.strip.downcase,
          password: params[:password],
          password_confirmation: params[:password_confirmation],
          name: params[:name].to_s.strip
        )
        if user.save
          # デフォルトワークシートを作成
          worksheet = user.worksheets.create!(
            name: 'マイワークシート',
            interval: 1,
            week_use: false,
            week: 0
          )
          session[:user_id] = user.id
          session[:current_worksheet_id] = worksheet.id
          render json: {
            authenticated: true,
            user: serialize_user(user),
            current_worksheet: serialize_worksheet(worksheet)
          }, status: :created
        else
          render json: { errors: user.errors.full_messages }, status: :unprocessable_content
        end
      end

      # PATCH /api/v1/auth/switch_worksheet
      # 使用するワークシートを切り替える
      def switch_worksheet
        user = User.find_by(id: session[:user_id])
        return render json: { error: '認証が必要です' }, status: :unauthorized unless user

        worksheet = user.worksheets.find_by(id: params[:worksheet_id])
        return render json: { error: 'ワークシートが見つかりません' }, status: :not_found unless worksheet

        session[:current_worksheet_id] = worksheet.id
        render json: { current_worksheet: serialize_worksheet(worksheet) }
      end

      private

      def current_worksheet_for(user)
        ws = user.worksheets.find_by(id: session[:current_worksheet_id])
        ws ||= user.worksheets.order(:created_at).first
        ws
      end

      def serialize_user(user)
        {
          id: user.id,
          email: user.email,
          name: user.display_name,
          provider: user.provider
        }
      end

      def serialize_worksheet(worksheet)
        {
          id: worksheet.id,
          name: worksheet.name,
          interval: worksheet.interval,
          week_use: worksheet.week_use,
          week: worksheet.week
        }
      end
    end
  end
end
