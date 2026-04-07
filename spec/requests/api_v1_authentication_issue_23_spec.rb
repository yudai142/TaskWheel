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
      expect(response.parsed_body['authenticated']).to eq(true)
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
      expect(response.parsed_body['authenticated']).to eq(true)
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
      expect(response.parsed_body['authenticated']).to eq(false)
    end

    it 'ログイン後はユーザー情報を返す' do
      post '/api/v1/auth/login', params: {
        email: 'me@example.com',
        password: 'password123'
      }

      get '/api/v1/auth/me'

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body['authenticated']).to eq(true)
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

      expect(response.parsed_body['authenticated']).to eq(false)
    end
  end
end
