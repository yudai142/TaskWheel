require 'rails_helper'

describe 'API V1 Members - name カラム統合' do
  let(:user) { create(:user) }
  let(:worksheet) { create(:worksheet, user:) }
  let(:member) { create(:member, worksheet:, family_name: '山田', given_name: '太郎', kana_name: 'ヤマダ') }
  let(:headers) { { 'COOKIE' => "user_id=#{user.id}" } }

  describe 'PATCH /api/v1/members/:id' do
    context '名前を更新できる' do
      it 'フルネーム形式で名前を更新' do
        patch "/api/v1/members/#{member.id}", 
              params: { member: { name: '佐藤 次郎' } },
              headers:

        expect(response).to have_http_status(:ok)
        expect(json_response['name']).to eq('佐藤 次郎')
      end

      it 'かな名を更新' do
        patch "/api/v1/members/#{member.id}", 
              params: { member: { kana: 'サトウ ジロウ' } },
              headers:

        expect(response).to have_http_status(:ok)
        expect(json_response['kana']).to eq('サトウ ジロウ')
      end
    end

    context 'アーカイブ状態を更新' do
      it 'アーカイブにできる' do
        patch "/api/v1/members/#{member.id}", 
              params: { member: { archive: true } },
              headers:

        expect(response).to have_http_status(:ok)
        member.reload
        expect(member.archive).to be(true)
      end
    end
  end

  describe 'POST /api/v1/members/bulk_create' do
    context '複数メンバーを一括登録' do
      it '改行区切りでメンバーを一括登録' do
        members_data = [
          { name: '鈴木 花子', kana: 'スズキ ハナコ' },
          { name: '伊藤 次郎', kana: 'イトウ ジロウ' },
        ]

        post '/api/v1/members/bulk_create',
             params: { members: members_data, worksheet_id: worksheet.id },
             headers:

        expect(response).to have_http_status(:created)
        expect(json_response['created_count']).to eq(2)
        expect(worksheet.members.count).to eq(3) # member + 2 new
      end

      it '無効な名前の場合はスキップ' do
        members_data = [
          { name: '', kana: 'テスト' },
          { name: '太郎', kana: 'タロウ' },
        ]

        post '/api/v1/members/bulk_create',
             params: { members: members_data, worksheet_id: worksheet.id },
             headers:

        expect(response).to have_http_status(:created)
        expect(json_response['created_count']).to eq(1)
        expect(json_response['failed_count']).to eq(1)
      end
    end
  end

  describe 'GET /api/v1/members' do
    let!(:archived_member) { create(:member, worksheet:, family_name: '新田', given_name: '葉男', archive: true) }

    context 'アーカイブフィルタリング' do
      it '有効なメンバーのみを取得' do
        get '/api/v1/members', 
            params: { filter: 'active' },
            headers:

        expect(response).to have_http_status(:ok)
        expect(json_response.length).to eq(1)
        expect(json_response[0]['id']).to eq(member.id)
      end

      it 'すべてのメンバーを取得' do
        get '/api/v1/members', 
            params: { filter: 'all' },
            headers:

        expect(response).to have_http_status(:ok)
        expect(json_response.length).to eq(2)
      end

      it 'アーカイブのみを取得' do
        get '/api/v1/members', 
            params: { filter: 'archived' },
            headers:

        expect(response).to have_http_status(:ok)
        expect(json_response.length).to eq(1)
        expect(json_response[0]['id']).to eq(archived_member.id)
      end
    end
  end
end
