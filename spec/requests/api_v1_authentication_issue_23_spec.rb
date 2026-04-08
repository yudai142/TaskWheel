require 'rails_helper'

RSpec.describe 'API V1 Authentication (Issue #23)', type: :request do
  describe 'POST /api/v1/auth/register' do
    it '新規登録が成功し、デフォルトワークシートが作成される' do
      expect do
        post '/api/v1/auth/register', params: {
          name: 'テストユーザー',
          email: 'register@example.com',
          password: 'password123',
          password_confirmation: 'password123'
        }
      end.to change(User, :count).by(1)
                                 .and change(Worksheet, :count).by(1)

      expect(response).to have_http_status(:created)
      expect(response.parsed_body['authenticated']).to be(true)
      expect(response.parsed_body.dig('user', 'email')).to eq('register@example.com')
    end
  end

  describe 'POST /api/v1/auth/login' do
    let!(:user) { create(:user, email: 'login@example.com', password: 'password123', password_confirmation: 'password123') }
    let!(:worksheet) { create(:worksheet, user: user) }

    it 'ログイン成功時にauthenticated=trueを返す' do
      post '/api/v1/auth/login', params: {
        email: 'login@example.com',
        password: 'password123'
      }

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body['authenticated']).to be(true)
      expect(response.parsed_body.dig('user', 'id')).to eq(user.id)
      expect(response.parsed_body.dig('current_worksheet', 'id')).to eq(worksheet.id)
    end

    it '認証失敗時は401を返す' do
      post '/api/v1/auth/login', params: {
        email: 'login@example.com',
        password: 'wrong-password'
      }

      expect(response).to have_http_status(:unauthorized)
    end
  end

  describe 'GET /api/v1/auth/me' do
    let!(:user) { create(:user, email: 'me@example.com', password: 'password123', password_confirmation: 'password123') }
    let!(:worksheet) { create(:worksheet, user: user) }

    it '未ログイン時はauthenticated=falseを返す' do
      get '/api/v1/auth/me'

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body['authenticated']).to be(false)
    end

    it 'ログイン後はユーザー情報を返す' do
      post '/api/v1/auth/login', params: {
        email: 'me@example.com',
        password: 'password123'
      }

      get '/api/v1/auth/me'

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body['authenticated']).to be(true)
      expect(response.parsed_body.dig('user', 'email')).to eq('me@example.com')
      expect(response.parsed_body.dig('current_worksheet', 'id')).to eq(worksheet.id)
    end
  end

  describe 'POST /api/v1/auth/logout' do
    let!(:user) { create(:user, email: 'logout@example.com', password: 'password123', password_confirmation: 'password123') }
    let!(:worksheet) { create(:worksheet, user: user) }

    it 'ログアウト後はauthenticated=falseになる' do
      post '/api/v1/auth/login', params: {
        email: 'logout@example.com',
        password: 'password123'
      }

      post '/api/v1/auth/logout'
      get '/api/v1/auth/me'

      expect(response.parsed_body['authenticated']).to be(false)
    end
  end

  describe 'POST /api/v1/auth/password/forgot' do
    let!(:user) { create(:user, email: 'forgot@example.com') }

    before do
      ActionMailer::Base.deliveries.clear
    end

    it '存在するメールアドレスに再設定メールを送信する' do
      post '/api/v1/auth/password/forgot', params: { email: 'forgot@example.com' }

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body['success']).to be(true)
      expect(ActionMailer::Base.deliveries.size).to eq(1)
      expect(ActionMailer::Base.deliveries.last.to).to include('forgot@example.com')
      mail = ActionMailer::Base.deliveries.last
      decoded_body = [mail.text_part&.decoded, mail.html_part&.decoded, mail.body.decoded].compact.join("\n")
      expect(decoded_body).to include('/password-reset?token=')
    end

    it '存在しないメールアドレスは404を返す' do
      post '/api/v1/auth/password/forgot', params: { email: 'unknown@example.com' }

      expect(response).to have_http_status(:not_found)
      expect(response.parsed_body['success']).to be(false)
      expect(response.parsed_body['message']).to eq('登録済みのメールアドレスが見つかりません')
      expect(ActionMailer::Base.deliveries.size).to eq(0)
    end

    it 'メールアドレス未入力は422を返す' do
      post '/api/v1/auth/password/forgot', params: { email: '' }

      expect(response).to have_http_status(:unprocessable_content)
      expect(response.parsed_body['success']).to be(false)
      expect(response.parsed_body['message']).to eq('メールアドレスを入力してください')
      expect(ActionMailer::Base.deliveries.size).to eq(0)
    end
  end

  describe 'POST /api/v1/auth/password/reset' do
    let!(:user) do
      create(:user, email: 'reset@example.com', password: 'oldpassword123', password_confirmation: 'oldpassword123')
    end

    it '有効なトークンでパスワードを再設定できる' do
      raw_token = user.send_reset_password_instructions

      post '/api/v1/auth/password/reset', params: {
        token: raw_token,
        password: 'newpassword123',
        password_confirmation: 'newpassword123'
      }

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body['success']).to be(true)

      post '/api/v1/auth/login', params: {
        email: 'reset@example.com',
        password: 'newpassword123'
      }

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body['authenticated']).to be(true)
    end

    it '無効なトークンの場合はエラーを返す' do
      post '/api/v1/auth/password/reset', params: {
        token: 'invalid-token',
        password: 'newpassword123',
        password_confirmation: 'newpassword123'
      }

      expect(response).to have_http_status(:unprocessable_content)
      expect(response.parsed_body['success']).to be(false)
      expect(response.parsed_body['errors']).to be_present
    end
  end

  describe 'POST /api/v1/auth/password/validate_token' do
    let!(:user) do
      create(:user, email: 'validate@example.com', password: 'oldpassword123', password_confirmation: 'oldpassword123')
    end

    it '有効なトークンの場合はsuccess=trueを返す' do
      raw_token = user.send_reset_password_instructions

      post '/api/v1/auth/password/validate_token', params: { token: raw_token }

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body['success']).to be(true)
    end

    it '無効なトークンの場合は422を返す' do
      post '/api/v1/auth/password/validate_token', params: { token: 'invalid-token' }

      expect(response).to have_http_status(:unprocessable_content)
      expect(response.parsed_body['success']).to be(false)
      expect(response.parsed_body['message']).to include('再設定トークン')
    end

    it 'トークン未入力の場合は422を返す' do
      post '/api/v1/auth/password/validate_token', params: { token: '' }

      expect(response).to have_http_status(:unprocessable_content)
      expect(response.parsed_body['success']).to be(false)
      expect(response.parsed_body['message']).to include('再設定トークン')
    end
  end
end
