require 'rails_helper'

RSpec.describe 'API V1: Member Management Modal (Issue #18)', type: :request do
  let!(:member) { create(:member) }
  let!(:archived_member) { create(:member, :archived) }
  let!(:work_a) { create(:work, multiple: 1, is_above: true, archive: false) }
  let!(:work_b) { create(:work, multiple: 1, is_above: true, archive: false) }
  let(:today) { Date.current }

  describe 'GET /api/v1/members' do
    it 'include_archived と include_settings 指定で設定一覧を返す' do
      create(:member_option, member: member, work: work_a, status: 0)

      get '/api/v1/members', params: { include_archived: true, include_settings: true }

      expect(response).to have_http_status(:ok)
      json_response = response.parsed_body
      expect(json_response.map { |item| item['id'] }).to include(member.id, archived_member.id)

      target_member = json_response.find { |item| item['id'] == member.id }
      expect(target_member['member_options'].length).to eq(1)
      expect(target_member['member_options'][0]['status_label']).to eq('固定')
      expect(target_member['member_options'][0]['work_name']).to eq(work_a.name)
    end
  end

  describe 'PATCH /api/v1/members/:id' do
    it 'archive を切り替えられる' do
      patch "/api/v1/members/#{member.id}", params: { member: { archive: true } }

      expect(response).to have_http_status(:ok)
      expect(member.reload.archive).to eq(true)
    end
  end

  describe 'POST /api/v1/member_options' do
    it '固定/除外設定を保存できる' do
      post '/api/v1/member_options', params: {
        member_option: {
          member_id: member.id,
          work_id: work_a.id,
          status: 1
        }
      }

      expect(response).to have_http_status(:ok)
      expect(MemberOption.find_by(member_id: member.id, work_id: work_a.id)&.status).to eq(1)
      expect(response.parsed_body['status_label']).to eq('除外')
    end

    it '同じ内容を複数登録できない' do
      create(:member_option, member: member, work: work_a, status: 0)

      post '/api/v1/member_options', params: {
        member_option: {
          member_id: member.id,
          work_id: work_a.id,
          status: 0
        }
      }

      expect(response).to have_http_status(:unprocessable_entity)
      expect(MemberOption.where(member_id: member.id, work_id: work_a.id).count).to eq(1)
      expect(MemberOption.find_by(member_id: member.id, work_id: work_a.id)&.status).to eq(0)
    end

    it '同じ当番で固定と除外を両方登録できない' do
      create(:member_option, member: member, work: work_a, status: 0)

      post '/api/v1/member_options', params: {
        member_option: {
          member_id: member.id,
          work_id: work_a.id,
          status: 1
        }
      }

      expect(response).to have_http_status(:unprocessable_entity)
      expect(MemberOption.where(member_id: member.id, work_id: work_a.id).count).to eq(1)
      expect(MemberOption.find_by(member_id: member.id, work_id: work_a.id)&.status).to eq(0)
    end

    it '固定設定はメンバー1人につき1件まで' do
      create(:member_option, member: member, work: work_a, status: 0)

      post '/api/v1/member_options', params: {
        member_option: {
          member_id: member.id,
          work_id: work_b.id,
          status: 0
        }
      }

      expect(response).to have_http_status(:unprocessable_entity)
      expect(MemberOption.where(member_id: member.id, status: 0).count).to eq(1)
    end
  end

  describe 'DELETE /api/v1/member_options/:id' do
    it '設定を解除できる' do
      member_option = create(:member_option, member: member, work: work_a, status: 0)

      expect do
        delete "/api/v1/member_options/#{member_option.id}"
      end.to change(MemberOption, :count).by(-1)

      expect(response).to have_http_status(:no_content)
    end
  end

  describe 'POST /api/v1/works/shuffle' do
    it '単体シャッフルで固定設定メンバーを優先する' do
      target_member = create(:member)
      other_member = create(:member)

      create(:history, member: target_member, work: nil, date: today)
      create(:history, member: other_member, work: nil, date: today)
      create(:member_option, member: target_member, work: work_a, status: 0)

      post '/api/v1/works/shuffle', params: {
        work_id: work_a.id,
        participant_member_ids: [target_member.id, other_member.id],
        year: today.year,
        month: today.month,
        day: today.day
      }

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body['member']['id']).to eq(target_member.id)
    end

    it '固定設定を優先して日付シャッフルに反映する' do
      create(:member_option, member: member, work: work_b, status: 0)
      create(:history, member: member, work: nil, date: today)

      post '/api/v1/works/shuffle', params: {
        year: today.year,
        month: today.month,
        day: today.day
      }

      expect(response).to have_http_status(:ok)
      expect(History.find_by(member_id: member.id, date: today)&.work_id).to eq(work_b.id)
    end

    it '除外設定された当番を避けて割り当てる' do
      create(:member_option, member: member, work: work_a, status: 1)
      create(:history, member: member, work: nil, date: today)

      post '/api/v1/works/shuffle', params: {
        year: today.year,
        month: today.month,
        day: today.day
      }

      expect(response).to have_http_status(:ok)
      expect(History.find_by(member_id: member.id, date: today)&.work_id).to eq(work_b.id)
    end
  end
end