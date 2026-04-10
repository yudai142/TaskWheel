# frozen_string_literal: true

require 'rails_helper'

describe 'Api::V1::Worksheets - Worksheet Selection and Isolation', type: :request do
  let(:user) { create(:user) }
  let(:worksheet1) { create(:worksheet, user: user, name: 'ワークシート1') }
  let(:worksheet2) { create(:worksheet, user: user, name: 'ワークシート2') }

  context 'when switching worksheets' do
    before do
      post '/api/v1/auth/login', params: { email: user.email, password: 'password123' }
      @auth_headers = {
        'Content-Type' => 'application/json'
      }
    end

    describe 'GET /api/v1/members' do
      it 'returns members from the current worksheet' do
        # ワークシート1にメンバーを作成
        member1_ws1 = create(:member, worksheet: worksheet1, name: 'メンバー1-WS1')
        _member2_ws2 = create(:member, worksheet: worksheet2, name: 'メンバー1-WS2')

        # ワークシート1をセッションで選択
        post '/api/v1/worksheets/set_current', params: { worksheet_id: worksheet1.id }

        get '/api/v1/members', headers: @auth_headers
        expect(response).to have_http_status(:ok)
        
        members = JSON.parse(response.body)
        expect(members.length).to eq(1)
        expect(members.first['name']).to eq('メンバー1-WS1')
      end

      it 'returns members from worksheet2 when switched' do
        member1_ws1 = create(:member, worksheet: worksheet1, name: 'メンバー1-WS1')
        member1_ws2 = create(:member, worksheet: worksheet2, name: 'メンバー1-WS2')

        # ワークシート2をセッションで選択
        post '/api/v1/worksheets/set_current', params: { worksheet_id: worksheet2.id }

        get '/api/v1/members', headers: @auth_headers
        expect(response).to have_http_status(:ok)
        
        members = JSON.parse(response.body)
        expect(members.length).to eq(1)
        expect(members.first['name']).to eq('メンバー1-WS2')
      end

      it 'accepts worksheet_id parameter to override current worksheet' do
        member1_ws1 = create(:member, worksheet: worksheet1, name: 'メンバー1-WS1')
        member1_ws2 = create(:member, worksheet: worksheet2, name: 'メンバー1-WS2')

        # セッションではワークシート1を選択
        post '/api/v1/worksheets/set_current', params: { worksheet_id: worksheet1.id }

        # クエリパラメータでワークシート2を指定
        get '/api/v1/members', params: { worksheet_id: worksheet2.id }, headers: @auth_headers
        expect(response).to have_http_status(:ok)
        
        members = JSON.parse(response.body)
        expect(members.length).to eq(1)
        expect(members.first['name']).to eq('メンバー1-WS2')
      end
    end

    describe 'GET /api/v1/works' do
      it 'returns works from the current worksheet' do
        work1_ws1 = create(:work, worksheet: worksheet1, name: 'Work1-WS1')
        _work1_ws2 = create(:work, worksheet: worksheet2, name: 'Work1-WS2')

        post '/api/v1/worksheets/set_current', params: { worksheet_id: worksheet1.id }

        get '/api/v1/works', headers: @auth_headers
        expect(response).to have_http_status(:ok)
        
        works = JSON.parse(response.body)
        expect(works.length).to eq(1)
        expect(works.first['name']).to eq('Work1-WS1')
      end

      it 'returns works from worksheet2 when switched' do
        work1_ws1 = create(:work, worksheet: worksheet1, name: 'Work1-WS1')
        work1_ws2 = create(:work, worksheet: worksheet2, name: 'Work1-WS2')

        post '/api/v1/worksheets/set_current', params: { worksheet_id: worksheet2.id }

        get '/api/v1/works', headers: @auth_headers
        expect(response).to have_http_status(:ok)
        
        works = JSON.parse(response.body)
        expect(works.length).to eq(1)
        expect(works.first['name']).to eq('Work1-WS2')
      end
    end

    describe 'GET /api/v1/histories' do
      it 'returns histories from the current worksheet' do
        member1_ws1 = create(:member, worksheet: worksheet1)
        member1_ws2 = create(:member, worksheet: worksheet2)
        
        history1_ws1 = create(:history, member: member1_ws1, date: Date.current)
        history1_ws2 = create(:history, member: member1_ws2, date: Date.current)

        post '/api/v1/worksheets/set_current', params: { worksheet_id: worksheet1.id }

        year = Date.current.year
        month = Date.current.month
        day = Date.current.day

        get '/api/v1/histories', params: { year: year, month: month, day: day }, headers: @auth_headers
        expect(response).to have_http_status(:ok)
        
        histories = JSON.parse(response.body)
        expect(histories.length).to eq(1)
        expect(histories.first['member_id']).to eq(member1_ws1.id)
      end

      it 'returns histories from worksheet2 when switched' do
        member1_ws1 = create(:member, worksheet: worksheet1)
        member1_ws2 = create(:member, worksheet: worksheet2)
        
        history1_ws1 = create(:history, member: member1_ws1, date: Date.current)
        history1_ws2 = create(:history, member: member1_ws2, date: Date.current)

        post '/api/v1/worksheets/set_current', params: { worksheet_id: worksheet2.id }

        year = Date.current.year
        month = Date.current.month
        day = Date.current.day

        get '/api/v1/histories', params: { year: year, month: month, day: day }, headers: @auth_headers
        expect(response).to have_http_status(:ok)
        
        histories = JSON.parse(response.body)
        expect(histories.length).to eq(1)
        expect(histories.first['member_id']).to eq(member1_ws2.id)
      end
    end

    describe 'POST /api/v1/worksheets/set_current' do
      it 'sets the current worksheet in the session' do
        post '/api/v1/worksheets/set_current', params: { worksheet_id: worksheet1.id }
        expect(response).to have_http_status(:ok)

        response_data = JSON.parse(response.body)
        expect(response_data['current_worksheet']['id']).to eq(worksheet1.id)
      end

      it 'rejects if worksheet_id does not belong to the user' do
        other_user = create(:user, email: 'other@example.com')
        other_worksheet = create(:worksheet, user: other_user)

        post '/api/v1/worksheets/set_current', params: { worksheet_id: other_worksheet.id }
        expect(response).to have_http_status(:forbidden)
      end

      it 'requires authentication' do
        # ログアウト
        post '/api/v1/auth/logout'

        post '/api/v1/worksheets/set_current', params: { worksheet_id: worksheet1.id }
        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  context 'when worksheet_id is passed as query parameter' do
    before do
      post '/api/v1/auth/login', params: { email: user.email, password: 'password123' }
      @auth_headers = {
        'Content-Type' => 'application/json'
      }
    end

    it 'prioritizes worksheet_id parameter over current worksheet' do
      member1_ws1 = create(:member, worksheet: worksheet1, name: 'メンバー1-WS1')
      member1_ws2 = create(:member, worksheet: worksheet2, name: 'メンバー1-WS2')

      # セッションではワークシート1を選択
      post '/api/v1/worksheets/set_current', params: { worksheet_id: worksheet1.id }

      # パラメータでワークシート2を指定
      get '/api/v1/members', params: { worksheet_id: worksheet2.id }, headers: @auth_headers
      
      members = JSON.parse(response.body)
      expect(members.first['name']).to eq('メンバー1-WS2')
    end

    it 'works for works endpoint too' do
      work1_ws1 = create(:work, worksheet: worksheet1, name: 'Work1-WS1')
      work1_ws2 = create(:work, worksheet: worksheet2, name: 'Work1-WS2')

      post '/api/v1/worksheets/set_current', params: { worksheet_id: worksheet1.id }

      get '/api/v1/works', params: { worksheet_id: worksheet2.id }, headers: @auth_headers
      
      works = JSON.parse(response.body)
      expect(works.first['name']).to eq('Work1-WS2')
    end
  end
end
