# frozen_string_literal: true

module Api
  module V1
    class PasswordsController < ActionController::API
      # POST /api/v1/auth/password/validate_token
      # 再設定トークンの有効性を検証
      def validate_token
        token = params[:token].to_s
        if token.blank?
          return render json: { success: false, message: '再設定トークンが無効です。再度メールを送信してください。' },
                        status: :unprocessable_content
        end

        digested_token = Devise.token_generator.digest(User, :reset_password_token, token)
        user = User.find_by(reset_password_token: digested_token)

        if user&.reset_password_period_valid?
          render json: { success: true }
        else
          render json: { success: false, message: '再設定トークンが古いため無効です。再度メールを送信してください。' }, status: :unprocessable_content
        end
      end

      # POST /api/v1/auth/password/forgot
      # メールアドレスを受け取り、パスワード再設定メールを送信
      def forgot
        email = params[:email].to_s.strip.downcase

        if email.blank?
          return render json: { success: false, message: 'メールアドレスを入力してください' }, status: :unprocessable_content
        end

        user = User.find_by(email: email)
        return render json: { success: false, message: '登録済みのメールアドレスが見つかりません' }, status: :not_found unless user

        user.send_reset_password_instructions

        render json: { success: true, message: '再設定メールを送信しました' }
      end

      # POST /api/v1/auth/password/reset
      # トークン経由でパスワードを再設定
      def reset
        user = User.reset_password_by_token(
          reset_password_token: params[:token],
          password: params[:password],
          password_confirmation: params[:password_confirmation]
        )

        if user.errors.empty?
          render json: { success: true, message: 'パスワードを再設定しました' }
        else
          render json: { success: false, errors: user.errors.full_messages }, status: :unprocessable_content
        end
      end
    end
  end
end
