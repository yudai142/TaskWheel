require 'rails_helper'

describe 'API V1 Works - 一括登録・編集・フィルタリング' do
  let(:user) { create(:user) }
  let(:worksheet) { create(:worksheet, user:) }
  let(:work) { create(:work, worksheet:, name: '掃除', multiple: 2, is_above: true) }
  let(:headers) { { 'COOKIE' => "user_id=#{user.id}" } }

  describe 'PATCH /api/v1/works/:id' do
    context '当番を編集' do
      it '当番名を更新' do
        patch "/api/v1/works/#{work.id}", 
              params: { work: { name: 'トイレ掃除' } },
              headers:

        expect(response).to have_http_status(:ok)
        expect(json_response['name']).to eq('トイレ掃除')
      end

      it '複数割り当て数を更新' do
        patch "/api/v1/works/#{work.id}", 
              params: { work: { multiple: 3 } },
              headers:

        expect(response).to have_http_status(:ok)
        expect(json_response['multiple']).to eq(3)
      end

      it '以上/以下フラグを更新' do
        patch "/api/v1/works/#{work.id}", 
              params: { work: { is_above: false } },
              headers:

        expect(response).to have_http_status(:ok)
        expect(json_response['is_above']).to be(false)
      end

      it 'アーカイブ状態を更新' do
        patch "/api/v1/works/#{work.id}", 
              params: { work: { archive: true } },
              headers:

        expect(response).to have_http_status(:ok)
        work.reload
        expect(work.archive).to be(true)
      end
    end
  end

  describe 'POST /api/v1/works/bulk_create' do
    context '複数当番を一括登録' do
      it '改行区切りで当番を一括登録' do
        works_data = [
          { name: 'トイレ掃除', multiple: 1, is_above: true },
          { name: 'ゴミ捨て', multiple: 2, is_above: false },
        ]

        post '/api/v1/works/bulk_create',
             params: { works: works_data, worksheet_id: worksheet.id },
             headers:

        expect(response).to have_http_status(:created)
        expect(json_response['created_count']).to eq(2)
        expect(worksheet.works.count).to eq(3) # work + 2 new
      end

      it '無効な名前の場合はスキップ' do
        works_data = [
          { name: '', multiple: 1, is_above: true },
          { name: '料理', multiple: 2, is_above: false },
        ]

        post '/api/v1/works/bulk_create',
             params: { works: works_data, worksheet_id: worksheet.id },
             headers:

        expect(response).to have_http_status(:created)
        expect(json_response['created_count']).to eq(1)
        expect(json_response['failed_count']).to eq(1)
      end
    end
  end

  describe 'GET /api/v1/works' do
    let!(:archived_work) { create(:work, worksheet:, name: '除雪', archive: true) }

    context 'アーカイブフィルタリング' do
      it '有効な当番のみを取得' do
        get '/api/v1/works', 
            params: { filter: 'active' },
            headers:

        expect(response).to have_http_status(:ok)
        expect(json_response.length).to eq(1)
        expect(json_response[0]['id']).to eq(work.id)
      end

      it 'すべての当番を取得' do
        get '/api/v1/works', 
            params: { filter: 'all' },
            headers:

        expect(response).to have_http_status(:ok)
        expect(json_response.length).to eq(2)
      end

      it 'アーカイブのみを取得' do
        get '/api/v1/works', 
            params: { filter: 'archived' },
            headers:

        expect(response).to have_http_status(:ok)
        expect(json_response.length).to eq(1)
        expect(json_response[0]['id']).to eq(archived_work.id)
      end
    end
  end
end
