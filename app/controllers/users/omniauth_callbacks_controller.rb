# frozen_string_literal: true
# encoding: utf-8

# Google OmniAuthコールバックを処理するコントローラー
class Users::OmniauthCallbacksController < Devise::OmniauthCallbacksController
  skip_before_action :verify_authenticity_token

  # GET /users/auth/google_oauth2/callback
  def google_oauth2
    @user = User.from_omniauth(request.env["omniauth.auth"])

    if @user.persisted?
      # ワークシートがなければ作成する
      if @user.worksheets.empty?
        worksheet = @user.worksheets.create!(
          name: "マイワークシート",
          interval: 1,
          week_use: false,
          week: 0
        )
        session[:current_worksheet_id] = worksheet.id
      end

      session[:user_id] = @user.id
      # React SPAに認証成功としてリダイレクト
      redirect_to "/?auth=success", allow_other_host: false
    else
      # 認証失敗時
      redirect_to "/?auth=failure", allow_other_host: false
    end
  end

  def failure
    redirect_to "/?auth=failure", allow_other_host: false
  end
end
