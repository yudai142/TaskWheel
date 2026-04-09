require 'rails_helper'

RSpec.describe 'API V1 Demo Seed (Issue #30)', type: :request do
  describe 'POST /api/v1/auth/login' do
    context 'ユーザーが登録されていない場合' do
      before do
        # デモシード spec はユーザーなし状態をテストするため、config.before(:suite) で作成されたデフォルトユーザーをクリア
        User.destroy_all
        Worksheet.destroy_all
      end

      it 'デモアカウントを自動生成しログインできる' do
        # 事前: ユーザーなし状態
        expect(User.count).to eq(0)

        # デモログイン実行
        post '/api/v1/auth/login', params: {
          email: 'test@example.com',
          password: 'password123'
        }

        # レスポンス確認
        expect(response).to have_http_status(:ok)
        expect(response.parsed_body['authenticated']).to be(true)

        # ユーザー自動生成確認
        expect(User.count).to eq(1)
        user = User.first
        expect(user.email).to eq('test@example.com')
        expect(user.name).to eq('デモユーザー')
      end

      it 'デモワークシート自動生成確認' do
        expect(Worksheet.count).to eq(0)

        post '/api/v1/auth/login', params: {
          email: 'test@example.com',
          password: 'password123'
        }

        user = User.first
        expect(user.worksheets.count).to eq(1)
        worksheet = user.worksheets.first
        expect(worksheet.name).to eq('デモワークシート')
        expect(worksheet.interval).to eq(1)
        expect(worksheet.week_use).to be(false)
        expect(worksheet.week).to eq(0)
      end

      it 'デモメンバーデータ自動生成確認' do
        post '/api/v1/auth/login', params: {
          email: 'test@example.com',
          password: 'password123'
        }

        user = User.first
        worksheet = user.worksheets.first
        expect(worksheet.members.count).to eq(27)

        # 最初のメンバーデータ確認
        first_member = worksheet.members.first
        expect(first_member.name).to eq('テスト 太郎')
        expect(first_member.kana).to eq('てすとたろう')
        expect(first_member.archive).to be(false)
      end

      it 'デモ当番データ自動生成確認' do
        post '/api/v1/auth/login', params: {
          email: 'test@example.com',
          password: 'password123'
        }

        user = User.first
        worksheet = user.worksheets.first
        expect(worksheet.works.count).to eq(11)

        # 最初の当番確認
        first_work = worksheet.works.first
        expect(first_work.name).to eq('リーダー')
        expect(first_work.multiple).to eq(0)
        expect(first_work.archive).to be(false)
        expect(first_work.is_above).to be(false)

        # アーカイブ当番確認
        archived_work = worksheet.works.find_by(name: '掃除機')
        expect(archived_work.archive).to be(true)
      end
    end

    context '既存ユーザーがいる場合' do
      before do
        # デフォルトユーザーをクリアしてから、既存ユーザーのみが存在する状態を作成
        User.destroy_all
        Worksheet.destroy_all
      end

      let!(:existing_user) { create(:user, email: 'existing@example.com') }

      it '既存ユーザーでログインできる' do
        expect(User.count).to eq(1)

        post '/api/v1/auth/login', params: {
          email: 'existing@example.com',
          password: existing_user.password
        }

        # 既存ユーザーでログイン成功
        expect(response).to have_http_status(:ok)
        expect(response.parsed_body['authenticated']).to be(true)
        expect(User.count).to eq(1)
      end

      it 'デモアカウントが存在しない場合、デモログインで自動生成＆ログインできる' do
        expect(User.count).to eq(1)

        post '/api/v1/auth/login', params: {
          email: 'test@example.com',
          password: 'password123'
        }

        # デモアカウントが新規生成される
        expect(response).to have_http_status(:ok)
        expect(response.parsed_body['authenticated']).to be(true)
        expect(User.count).to eq(2)

        demo_user = User.find_by(email: 'test@example.com')
        expect(demo_user).not_to be_nil
        expect(demo_user.name).to eq('デモユーザー')
      end
    end

    context '通常のログイン' do
      let!(:user) { create(:user, email: 'normal@example.com', password: 'password123', password_confirmation: 'password123') }
      let!(:worksheet) { create(:worksheet, user: user) }

      it '既存ユーザーでログインできる' do
        post '/api/v1/auth/login', params: {
          email: 'normal@example.com',
          password: 'password123'
        }

        expect(response).to have_http_status(:ok)
        expect(response.parsed_body['authenticated']).to be(true)
        expect(response.parsed_body.dig('user', 'id')).to eq(user.id)
      end
    end
  end
end
