require 'rails_helper'

describe 'API V1 Works - 一括登録・編集・フィルタリング', type: :request do
  let!(:user) { User.find_by(email: 'default@taskwheel.local') || create(:user, email: 'default@taskwheel.local') }
  let!(:worksheet) { user.worksheets.first || create(:worksheet, user:) }
  let!(:work) { create(:work, worksheet:, name: '掃除', multiple: 2, is_above: true) }

  describe 'PATCH /api/v1/works/:id' do
    context 'タスクを編集' do
      it 'タスク名を更新' do
        patch "/api/v1/works/#{work.id}", 
              params: { work: { name: 'トイレ掃除' } }

        expect(response).to have_http_status(:ok)
        expect(json_response['name']).to eq('トイレ掃除')
      end

      it '複数割り当て数を更新' do
        patch "/api/v1/works/#{work.id}", 
              params: { work: { multiple: 3 } }

        expect(response).to have_http_status(:ok)
        expect(json_response['multiple']).to eq(3)
      end

      it '以上/以下フラグを更新' do
        patch "/api/v1/works/#{work.id}", 
              params: { work: { is_above: false } }

        expect(response).to have_http_status(:ok)
        expect(json_response['is_above']).to be(false)
      end

      it 'アーカイブ状態を更新' do
        patch "/api/v1/works/#{work.id}", 
              params: { work: { archive: true } }

        expect(response).to have_http_status(:ok)
        work.reload
        expect(work.archive).to be(true)
      end
    end
  end

  describe 'POST /api/v1/works/bulk_create' do
    context '複数タスクを一括登録' do
      it '改行区切りでタスクを一括登録' do
        works_data = [
          { name: 'トイレ掃除', multiple: 1, is_above: true },
          { name: 'ゴミ捨て', multiple: 2, is_above: false },
        ]

        post '/api/v1/works/bulk_create',
             params: { works: works_data, worksheet_id: worksheet.id }

        expect(response).to have_http_status(:created)
        expect(json_response.is_a?(Array)).to be(true)
        expect(json_response.length).to eq(2)
        expect(worksheet.works.count).to eq(3) # work + 2 new
      end

      it '無効な名前の場合はスキップ' do
        works_data = [
          { name: '', multiple: 1, is_above: true },
          { name: '料理', multiple: 2, is_above: false },
        ]

        post '/api/v1/works/bulk_create',
             params: { works: works_data, worksheet_id: worksheet.id }

        expect(response).to have_http_status(422)
      end
    end
  end

  describe 'GET /api/v1/works' do
    let!(:archived_work) { create(:work, worksheet:, name: '除雪', archive: true) }

    context 'アーカイブフィルタリング' do
      it '有効なタスクのみを取得' do
        get '/api/v1/works', 
            params: { filter: 'active' }

        expect(response).to have_http_status(:ok)
        expect(json_response.length).to eq(1)
        expect(json_response[0]['id']).to eq(work.id)
      end

      it 'すべてのタスクを取得' do
        get '/api/v1/works', 
            params: { filter: 'all' }

        expect(response).to have_http_status(:ok)
        expect(json_response.length).to eq(2)
      end

      it 'アーカイブのみを取得' do
        get '/api/v1/works', 
            params: { filter: 'archived' }

        expect(response).to have_http_status(:ok)
        expect(json_response.length).to eq(1)
        expect(json_response[0]['id']).to eq(archived_work.id)
      end
    end
  end
end
