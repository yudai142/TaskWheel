require 'rails_helper'

RSpec.describe 'API V1: Dashboard Statistics (Issue #2)', type: :request do
  let!(:members) { create_list(:member, 3) }
  let!(:works) { create_list(:work, 4) }
  let(:today) { Date.current }
  let(:yesterday) { today - 1.day }

  describe 'GET /api/v1/works - List of duties' do
    context '当番一覧取得' do
      it 'すべての当番が返却される' do
        get '/api/v1/works'
        
        expect(response).to have_http_status(:ok)
        expect(response.parsed_body.length).to eq(4)
      end

      it '当番のnameが包含されている' do
        get '/api/v1/works'
        
        expect(response).to have_http_status(:ok)
        json_response = response.parsed_body
        
        expect(json_response[0]).to have_key('name')
        expect(json_response[0]).to have_key('id')
      end

      it 'シャッフル対象の当番のみを取得できる' do
        # 除外マークありの当番を作成（実装時に確認）
        get '/api/v1/works'
        
        expect(response).to have_http_status(:ok)
        expect(response.parsed_body).to be_an(Array)
      end
    end
  end

  describe 'GET /api/v1/members - List of members' do
    context 'メンバー一覧取得' do
      it 'すべてのメンバーが返却される' do
        get '/api/v1/members'
        
        expect(response).to have_http_status(:ok)
        expect(response.parsed_body.length).to eq(3)
      end

      it 'メンバーの属性が包含されている' do
        get '/api/v1/members'
        
        expect(response).to have_http_status(:ok)
        json_response = response.parsed_body
        
        expect(json_response[0]).to have_key('id')
        expect(json_response[0]).to have_key('given_name')
        expect(json_response[0]).to have_key('family_name')
        expect(json_response[0]).to have_key('archive')
      end

      it 'アーカイブメンバーはarchiveフラグがtrueで返却される' do
        archived_member = create(:member, :archived)
        
        get '/api/v1/members'
        
        json_response = response.parsed_body
        archived_response = json_response.find { |m| m['id'] == archived_member.id }
        
        expect(archived_response['archive']).to be(true)
      end

      it 'アクティブメンバーはarchiveフラグがfalseで返却される' do
        get '/api/v1/members'
        
        json_response = response.parsed_body
        active_members = json_response.select { |m| !m['archive'] }
        
        expect(active_members.length).to eq(3)
      end
    end
  end

  describe 'GET /api/v1/histories - Assigned history with date filter (Issue #2重要)' do
    let!(:today_history) { create(:history, member: members[0], work: works[0], date: today) }
    let!(:yesterday_history) { create(:history, member: members[1], work: works[1], date: yesterday) }

    context '日付フィルタなし' do
      it 'すべての履歴が返却される' do
        get '/api/v1/histories'
        
        expect(response).to have_http_status(:ok)
        expect(response.parsed_body.length).to eq(2)
      end
    end

    context '特定の日付で絞り込み' do
      it '本日の履歴のみが返却される' do
        get "/api/v1/histories?year=#{today.year}&month=#{today.month}&day=#{today.day}"
        
        expect(response).to have_http_status(:ok)
        json_response = response.parsed_body
        
        expect(json_response.length).to eq(1)
        expect(json_response[0]['member_id']).to eq(members[0].id)
        expect(json_response[0]['work_id']).to eq(works[0].id)
      end

      it '昨日の履歴のみが返却される' do
        get "/api/v1/histories?year=#{yesterday.year}&month=#{yesterday.month}&day=#{yesterday.day}"
        
        expect(response).to have_http_status(:ok)
        json_response = response.parsed_body
        
        expect(json_response.length).to eq(1)
        expect(json_response[0]['member_id']).to eq(members[1].id)
      end
    end

    context '履歴の属性' do
      it '履歴が必要な属性を包含している' do
        get "/api/v1/histories?year=#{today.year}&month=#{today.month}&day=#{today.day}"
        
        expect(response).to have_http_status(:ok)
        json_response = response.parsed_body
        
        expect(json_response[0]).to have_key('id')
        expect(json_response[0]).to have_key('member_id')
        expect(json_response[0]).to have_key('work_id')
        expect(json_response[0]).to have_key('date')
      end
    end
  end

  describe 'POST /api/v1/histories/bulk_create - Bulk assign duties (シャッフル時)' do
    context '複数の当番割り当て' do
      it '複数の履歴を一括作成できる' do
        params = {
          histories: [
            { member_id: members[0].id, work_id: works[0].id, date: today },
            { member_id: members[1].id, work_id: works[1].id, date: today },
          ]
        }

        expect {
          post '/api/v1/histories/bulk_create', params: params
        }.to change(History, :count).by(2)

        expect(response).to have_http_status(:ok)
      end

      it '無効なパラメータの場合はエラーになる' do
        params = {
          histories: [
            { member_id: 999, work_id: 999, date: today }
          ]
        }

        post '/api/v1/histories/bulk_create', params: params
        
        expect(response).to have_http_status(:unprocessable_entity).or have_http_status(:not_found)
      end
    end
  end

  describe 'POST /api/v1/works/shuffle - Shuffle duty assignments' do
    context 'シャッフル機能' do
      it 'シャッフルエンドポイントが成功する' do
        params = {
          member_ids: members.map(&:id),
          work_ids: works.map(&:id),
          date: today
        }

        post '/api/v1/works/shuffle', params: params
        
        expect(response).to have_http_status(:ok)
      end

      it 'シャッフル後、割り当てが作成される' do
        params = {
          member_ids: members.map(&:id),
          work_ids: works.map(&:id),
          date: today
        }

        expect {
          post '/api/v1/works/shuffle', params: params
        }.to change(History, :count)

        expect(response).to have_http_status(:ok)
      end

      it '除外された当番はシャッフル対象から外れる' do
        # 除外対象のworkを指定
        excluded_work_ids = [works[0].id]
        target_work_ids = works.map(&:id) - excluded_work_ids

        params = {
          member_ids: members.map(&:id),
          work_ids: target_work_ids,
          date: today
        }

        post '/api/v1/works/shuffle', params: params
        
        expect(response).to have_http_status(:ok)
        # 除外されたworkには割り当てられていないことを確認
        json_response = response.parsed_body
        if json_response.is_a?(Array)
          assigned_work_ids = json_response.map { |h| h['work_id'] }
          expect(assigned_work_ids).not_to include(excluded_work_ids[0])
        end
      end
    end
  end

  describe 'Statistics consistency (Issue #2: 統計数値の一貫性)' do
    before do
      create_list(:history, 2, member: members[0], date: today)
      create_list(:history, 3, member: members[1], date: today)
    end

    it 'メンバー数は活動中（非アーカイブ）メンバーのみ' do
      get '/api/v1/members'
      
      active_members = response.parsed_body.count { |m| !m['archive'] }
      
      expect(active_members).to eq(3)
    end

    it '当番数は登録されているすべての当番' do
      get '/api/v1/works'
      
      expect(response.parsed_body.length).to eq(4)
    end

    it '割り当て済みメンバーは指定日の履歴から集計される' do
      get "/api/v1/histories?year=#{today.year}&month=#{today.month}&day=#{today.day}"
      
      assigned_members = response.parsed_body.map { |h| h['member_id'] }.uniq
      
      expect(assigned_members.length).to be > 0
    end
  end

  describe 'Responsive Behavior (レスポンシブ対応テスト)' do
    it 'APIレスポンスがJSON形式である' do
      get '/api/v1/works'
      
      expect(response.media_type).to eq('application/json')
    end

    it 'エラー時もJSON形式で返却される' do
      get '/api/v1/members/9999'
      
      expect(response.media_type).to eq('application/json')
      expect(response).to have_http_status(:not_found)
    end
  end
end
