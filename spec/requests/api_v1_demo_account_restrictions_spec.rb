require 'rails_helper'

RSpec.describe 'API V1: Demo Account Restrictions', type: :request do
  # デモアカウントを before(:all) で一度だけ作成
  before(:all) do
    User.where(email: 'test@example.com').destroy_all
    @demo_user = User.create!(
      email: 'test@example.com',
      password: 'password123',
      password_confirmation: 'password123',
      name: 'デモユーザー'
    )
  end

  after(:all) do
    User.where(email: 'test@example.com').destroy_all
  end

  let(:demo_worksheet) do
    @demo_user.worksheets.create!(
      name: 'デモワークシート',
      interval: 1,
      week_use: false,
      week: 0
    )
  end

  let!(:demo_member) { create(:member, worksheet: demo_worksheet) }
  let!(:demo_work) { create(:work, worksheet: demo_worksheet) }

  before do
    post '/api/v1/auth/login', params: {
      email: 'test@example.com',
      password: 'password123'
    }
  end

  describe 'デモアカウント操作制限' do
    context 'メンバー操作の制限' do
      it 'メンバー作成が 403 Forbidden を返す' do
        post '/api/v1/members', params: {
          member: {
            name: 'テスト ユーザー',
            kana: 'てすとゆーざー'
          }
        }

        expect(response).to have_http_status(:forbidden)
        expect(response.parsed_body['error']).to eq('デモアカウントではデータの変更はできません')
      end

      it 'メンバー更新が 403 Forbidden を返す' do
        patch "/api/v1/members/#{demo_member.id}", params: {
          member: {
            name: 'テスト 更新',
            kana: 'てすとこうしん'
          }
        }

        expect(response).to have_http_status(:forbidden)
        expect(response.parsed_body['error']).to eq('デモアカウントではデータの変更はできません')
      end

      it 'メンバー削除が 403 Forbidden を返す' do
        delete "/api/v1/members/#{demo_member.id}"

        expect(response).to have_http_status(:forbidden)
        expect(response.parsed_body['error']).to eq('デモアカウントではデータの変更はできません')
      end
    end

    context '当番操作の制限' do
      it '当番作成が 403 Forbidden を返す' do
        post '/api/v1/works', params: {
          worksheet_id: demo_worksheet.id,
          name: '新当番'
        }

        expect(response).to have_http_status(:forbidden)
        expect(response.parsed_body['error']).to eq('デモアカウントではデータの変更はできません')
      end

      it '当番更新が 403 Forbidden を返す' do
        patch "/api/v1/works/#{demo_work.id}", params: {
          name: '当番更新'
        }

        expect(response).to have_http_status(:forbidden)
        expect(response.parsed_body['error']).to eq('デモアカウントではデータの変更はできません')
      end

      it '当番削除が 403 Forbidden を返す' do
        delete "/api/v1/works/#{demo_work.id}"

        expect(response).to have_http_status(:forbidden)
        expect(response.parsed_body['error']).to eq('デモアカウントではデータの変更はできません')
      end
    end

    context 'ワークシート操作の制限' do
      it 'ワークシート作成が 403 Forbidden を返す' do
        post '/api/v1/worksheets', params: {
          worksheet: { name: 'New Worksheet', interval: 2, week: 0 }
        }

        expect(response).to have_http_status(:forbidden)
        expect(response.parsed_body['error']).to eq('デモアカウントではデータの変更はできません')
      end

      it 'ワークシート更新が 403 Forbidden を返す' do
        patch "/api/v1/worksheets/#{demo_worksheet.id}", params: {
          worksheet: { name: 'Updated Worksheet' }
        }

        expect(response).to have_http_status(:forbidden)
        expect(response.parsed_body['error']).to eq('デモアカウントではデータの変更はできません')
      end

      it 'ワークシート削除が 403 Forbidden を返す' do
        delete "/api/v1/worksheets/#{demo_worksheet.id}"

        expect(response).to have_http_status(:forbidden)
        expect(response.parsed_body['error']).to eq('デモアカウントではデータの変更はできません')
      end
    end

    context '参照操作は制限なし' do
      it 'メンバー一覧取得は成功' do
        get '/api/v1/members'

        expect(response).to have_http_status(:ok)
      end

      it 'ワークシート一覧取得は成功' do
        get '/api/v1/worksheets'

        expect(response).to have_http_status(:ok)
      end

      it 'ダッシュボード選択状態取得は成功' do
        get '/api/v1/dashboard/member_selection_state'

        expect(response).to have_http_status(:ok)
      end
    end
  end
end
