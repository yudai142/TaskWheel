# frozen_string_literal: true

require 'rails_helper'

describe 'Api::V1::Members/Works - Import from Other Worksheets', type: :request do
  let(:user) { create(:user) }
  let(:other_user) { create(:user, email: 'other@example.com') }
  let(:source_worksheet) { create(:worksheet, user: user, name: 'ソースワークシート') }
  let(:target_worksheet) { create(:worksheet, user: user, name: 'ターゲットワークシート') }
  let(:other_user_worksheet) { create(:worksheet, user: other_user, name: 'Other User Worksheet') }

  before do
    post '/api/v1/auth/login', params: { email: user.email, password: 'password123' }
    @auth_headers = {
      'Content-Type' => 'application/json'
    }
  end

  describe 'POST /api/v1/members/import' do
    context 'when importing members from another worksheet of the same user' do
      it 'imports selected members to the target worksheet' do
        # ソースワークシートにメンバーを作成
        member1 = create(:member, worksheet: source_worksheet, name: 'メンバー1')
        member2 = create(:member, worksheet: source_worksheet, name: 'メンバー2')

        # ターゲットワークシートにインポート
        post '/api/v1/members/import', params: {
          source_worksheet_id: source_worksheet.id,
          target_worksheet_id: target_worksheet.id,
          member_ids: [member1.id, member2.id]
        }, headers: @auth_headers

        expect(response).to have_http_status(:created)

        # ターゲットワークシートに2人のメンバーが追加されたことを確認
        response_data = JSON.parse(response.body)
        expect(response_data.length).to eq(2)
        expect(response_data.map { |m| m['name'] }).to contain_exactly('メンバー1', 'メンバー2')
      end

      it 'creates copies of members, not moving them' do
        member = create(:member, worksheet: source_worksheet, name: 'テストメンバー')

        post '/api/v1/members/import', params: {
          source_worksheet_id: source_worksheet.id,
          target_worksheet_id: target_worksheet.id,
          member_ids: [member.id]
        }, headers: @auth_headers

        expect(response).to have_http_status(:created)

        # 元のメンバーはソースワークシートに残っている
        expect(source_worksheet.members.count).to eq(1)
        # 新しいメンバーがターゲットワークシートに追加されている
        expect(target_worksheet.members.count).to eq(1)
        # ID が異なることを確認
        expect(source_worksheet.members.first.id).not_to eq(target_worksheet.members.first.id)
      end
    end

    context 'when attempting to import from other user\'s worksheet' do
      it 'rejects the import' do
        member = create(:member, worksheet: other_user_worksheet, name: 'Other User Member')

        post '/api/v1/members/import', params: {
          source_worksheet_id: other_user_worksheet.id,
          target_worksheet_id: target_worksheet.id,
          member_ids: [member.id]
        }, headers: @auth_headers

        expect(response).to have_http_status(:not_found)
      end
    end

    context 'when importing to other user\'s worksheet' do
      it 'rejects the import' do
        member = create(:member, worksheet: source_worksheet, name: 'メンバー')

        post '/api/v1/members/import', params: {
          source_worksheet_id: source_worksheet.id,
          target_worksheet_id: other_user_worksheet.id,
          member_ids: [member.id]
        }, headers: @auth_headers

        expect(response).to have_http_status(:not_found)
      end
    end
  end

  describe 'POST /api/v1/works/import' do
    context 'when importing works from another worksheet of the same user' do
      it 'imports selected works to the target worksheet' do
        # ソースワークシートにタスクを作成
        work1 = create(:work, worksheet: source_worksheet, name: 'タスク1')
        work2 = create(:work, worksheet: source_worksheet, name: 'タスク2')

        # ターゲットワークシートにインポート
        post '/api/v1/works/import', params: {
          source_worksheet_id: source_worksheet.id,
          target_worksheet_id: target_worksheet.id,
          work_ids: [work1.id, work2.id]
        }, headers: @auth_headers

        expect(response).to have_http_status(:created)

        # ターゲットワークシートに2つのタスクが追加されたことを確認
        response_data = JSON.parse(response.body)
        expect(response_data.length).to eq(2)
        expect(response_data.map { |w| w['name'] }).to contain_exactly('タスク1', 'タスク2')
      end

      it 'creates copies of works, not moving them' do
        work = create(:work, worksheet: source_worksheet, name: 'テストタスク')

        post '/api/v1/works/import', params: {
          source_worksheet_id: source_worksheet.id,
          target_worksheet_id: target_worksheet.id,
          work_ids: [work.id]
        }, headers: @auth_headers

        expect(response).to have_http_status(:created)

        # 元のタスクはソースワークシートに残っている
        expect(source_worksheet.works.count).to eq(1)
        # 新しいタスクがターゲットワークシートに追加されている
        expect(target_worksheet.works.count).to eq(1)
        # ID が異なることを確認
        expect(source_worksheet.works.first.id).not_to eq(target_worksheet.works.first.id)
      end
    end

    context 'when attempting to import from other user\'s worksheet' do
      it 'rejects the import' do
        work = create(:work, worksheet: other_user_worksheet, name: 'Other User Work')

        post '/api/v1/works/import', params: {
          source_worksheet_id: other_user_worksheet.id,
          target_worksheet_id: target_worksheet.id,
          work_ids: [work.id]
        }, headers: @auth_headers

        expect(response).to have_http_status(:not_found)
      end
    end

    context 'when importing to other user\'s worksheet' do
      it 'rejects the import' do
        work = create(:work, worksheet: source_worksheet, name: 'タスク')

        post '/api/v1/works/import', params: {
          source_worksheet_id: source_worksheet.id,
          target_worksheet_id: other_user_worksheet.id,
          work_ids: [work.id]
        }, headers: @auth_headers

        expect(response).to have_http_status(:not_found)
      end
    end
  end

  describe 'GET /api/v1/worksheets/importable' do
    context 'when getting importable worksheets' do
      it 'returns list of other worksheets for the same user' do
        get '/api/v1/worksheets/importable', headers: @auth_headers

        expect(response).to have_http_status(:ok)

        response_data = JSON.parse(response.body)
        worksheet_ids = response_data.map { |ws| ws['id'] }

        # 他のユーザーのワークシートは含まれない
        expect(worksheet_ids).not_to include(other_user_worksheet.id)
        # 現在のユーザーのワークシートは含まれる
        expect(worksheet_ids).to include(source_worksheet.id, target_worksheet.id)
      end

      it 'returns current worksheet as excluded' do
        post '/api/v1/worksheets/set_current', params: { worksheet_id: source_worksheet.id }

        get '/api/v1/worksheets/importable', headers: @auth_headers

        expect(response).to have_http_status(:ok)

        response_data = JSON.parse(response.body)

        # 現在選択中のワークシートの ID は含まれない
        worksheet_ids = response_data.map { |ws| ws['id'] }
        expect(worksheet_ids).not_to include(source_worksheet.id)
        # 他のワークシートは含まれる
        expect(worksheet_ids).to include(target_worksheet.id)
      end
    end
  end
end
