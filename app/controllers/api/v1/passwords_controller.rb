# frozen_string_literal: true
# encoding: utf-8

module Api
  module V1
    class PasswordsController < ActionController::API
      # POST /api/v1/auth/password/forgot
      # メールアドレスを受け取り、パスワード再設定メールを送信
      def forgot
        email = params[:email].to_s.strip.downcase

        if email.present?
          user = User.find_by(email: email)
          user&.send_reset_password_instructions
        end

        # メールアドレスの存在有無を漏らさないため常に成功レスポンス
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
          render json: { success: false, errors: user.errors.full_messages }, status: :unprocessable_entity
        end
      end
    end
  end
end
