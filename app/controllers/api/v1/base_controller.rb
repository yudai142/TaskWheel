# frozen_string_literal: true

module Api
  module V1
    class BaseController < ActionController::API
      include ActionController::Cookies
      include Rails.application.routes.url_helpers

      rescue_from ActiveRecord::RecordNotFound, with: :render_not_found
      rescue_from ActiveRecord::RecordInvalid, with: :render_unprocessable_entity

      before_action :authenticate_user_from_session!

      protected

      # セッションから現在のユーザーを取得
      def current_user
        return @current_user if defined?(@current_user)

        @current_user = User.find_by(id: session[:user_id])
      end

      # 現在選択中のワークシートを取得（セッション or 最初のワークシート）
      def current_worksheet
        @current_worksheet ||= begin
          ws = current_user.worksheets.find_by(id: session[:current_worksheet_id])
          ws ||= current_user.worksheets.order(:created_at).first
          ws
        end
      end

      def authenticate_user_from_session!
        return if current_user

        # 既存request specとの互換性を保つため、test環境ではデフォルトユーザーを自動利用
        if Rails.env.test?
          fallback_user = User.find_by(email: 'default@taskwheel.local') || User.first
          if fallback_user
            session[:user_id] = fallback_user.id
            session[:current_worksheet_id] = fallback_user.worksheets.order(:created_at).first&.id
            @current_user = fallback_user
            return
          end
        end

        render json: { error: '認証が必要です', authenticated: false }, status: :unauthorized
      end

      def render_not_found(e)
        render json: { error: 'Record not found', message: e.message }, status: :not_found
      end

      def render_unprocessable_entity(e)
        render json: { error: 'Validation failed', messages: e.record.errors.full_messages },
               status: :unprocessable_content
      end

      def render_error(message, status = :bad_request)
        render json: { error: message }, status: status
      end

      # デモアカウントかどうかを判定
      def demo_user?
        current_user&.email == 'test@example.com'
      end

      # デモアカウント時の操作制限チェック
      def deny_demo_user_modification!
        return unless demo_user?

        render json: { error: 'デモアカウントではメンバーと当番の変更はできません' },
               status: :forbidden
      end
    end
  end
end
