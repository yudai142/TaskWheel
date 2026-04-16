require 'rails_helper'

describe 'API V1 OffWorks - シャッフル除外タスク管理 Issue #40', type: :request do
  let!(:user) { User.find_by(email: 'default@taskwheel.local') || create(:user, email: 'default@taskwheel.local') }
  let!(:worksheet) { user.worksheets.first || create(:worksheet, user:) }
  let!(:work1) { create(:work, worksheet:, name: '掃除') }
  let!(:work2) { create(:work, worksheet:, name: 'ゴミ捨て') }
  let!(:off_work1) { create(:off_work, work: work1, date: '2026-04-16') }
  let!(:off_work2) { create(:off_work, work: work2, date: '2026-04-17') }

  describe 'GET /api/v1/off_works' do
    context '除外タスク一覧を取得' do
      it 'すべての除外タスクを取得' do
        get '/api/v1/off_works'

        expect(response).to have_http_status(:ok)
        expect(json_response.length).to eq(2)
      end

      it '指定日付の除外タスクをフィルタリング' do
        get '/api/v1/off_works', params: { date: '2026-04-16' }

        expect(response).to have_http_status(:ok)
        expect(json_response.length).to eq(1)
        expect(json_response[0]['work_id']).to eq(work1.id)
        expect(json_response[0]['date']).to eq('2026-04-16')
      end

      it '存在しない日付でフィルタリング' do
        get '/api/v1/off_works', params: { date: '2030-01-01' }

        expect(response).to have_http_status(:ok)
        expect(json_response).to be_empty
      end
    end
  end

  describe 'POST /api/v1/off_works' do
    context '除外タスクを登録' do
      it '新しい除外タスクを作成' do
        post '/api/v1/off_works',
             params: { off_work: { work_id: work1.id, date: '2026-04-18' } }

        expect(response).to have_http_status(:created)
        expect(json_response['work_id']).to eq(work1.id)
        expect(json_response['date']).to eq('2026-04-18')
        expect(OffWork.exists?(work_id: work1.id, date: '2026-04-18')).to be true
      end

      it 'work_id なしで作成失敗' do
        expect {
          post '/api/v1/off_works',
               params: { off_work: { date: '2026-04-18' } }
        }.to raise_error(ActiveRecord::RecordInvalid)
      end

      it 'date なしで作成失敗' do
        expect {
          post '/api/v1/off_works',
               params: { off_work: { work_id: work1.id } }
        }.to raise_error(ActiveRecord::RecordInvalid)
      end

      it '同じタスク・日付の重複登録は失敗' do
        expect {
          post '/api/v1/off_works',
               params: { off_work: { work_id: work1.id, date: '2026-04-16' } }
        }.to raise_error(ActiveRecord::RecordInvalid)
      end
    end
  end

  describe 'DELETE /api/v1/off_works/:id' do
    context '除外タスクを削除' do
      it '除外タスクを削除' do
        delete "/api/v1/off_works/#{off_work1.id}"

        expect(response).to have_http_status(:no_content)
        expect(OffWork.exists?(off_work1.id)).to be false
      end

      it '存在しない OffWork を削除失敗' do
        expect {
          delete '/api/v1/off_works/99999'
        }.to raise_error(ActiveRecord::RecordNotFound)
      end
    end
  end
end
