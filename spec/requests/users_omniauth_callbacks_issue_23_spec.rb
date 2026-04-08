require 'rails_helper'

RSpec.describe 'Users::OmniauthCallbacks (Issue #23)', type: :request do
  before do
    OmniAuth.config.test_mode = true
    OmniAuth.config.mock_auth[:google_oauth2] = OmniAuth::AuthHash.new(
      provider: 'google_oauth2',
      uid: '1234567890',
      info: {
        email: 'google-user@example.com',
        name: 'Google User'
      }
    )
  end

  after do
    OmniAuth.config.test_mode = false
    OmniAuth.config.mock_auth[:google_oauth2] = nil
  end

  it 'Google認証成功時にユーザー作成してトップにリダイレクトする' do
    expect do
      get '/users/auth/google_oauth2/callback'
    end.to change(User, :count).by(1)
                               .and change(Worksheet, :count).by(1)

    expect(response).to redirect_to('/?auth=success')
    expect(User.last.email).to eq('google-user@example.com')
  end
end
