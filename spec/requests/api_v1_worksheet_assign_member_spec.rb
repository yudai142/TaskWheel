# frozen_string_literal: true

require 'rails_helper'

describe 'Api::V1::Worksheets - Assign Member', type: :request do
  let(:user) { create(:user, email: 'assign-test@example.com', password: 'password123', password_confirmation: 'password123') }
  let!(:worksheet) { create(:worksheet, user:) }
  let!(:member) { create(:member, worksheet:) }
  let!(:work1) { create(:work, worksheet:) }
  let!(:work2) { create(:work, worksheet:) }
  let(:today) { Date.today }

  before do
    post '/api/v1/auth/login', params: {
      email: user.email,
      password: 'password123'
    }
  end

  describe 'POST /api/v1/worksheets/:id/assign_member' do
    context 'when assigning an unassigned member to a work' do
      it 'creates a new history record' do
        expect {
          post "/api/v1/worksheets/#{worksheet.id}/assign_member", params: {
            member_id: member.id,
            work_id: work1.id,
          }
        }.to change(History, :count).by(1)

        expect(response).to have_http_status(:ok)
      end

      it 'returns member_id and work_id in response' do
        post "/api/v1/worksheets/#{worksheet.id}/assign_member", params: {
          member_id: member.id,
          work_id: work1.id,
        }

        json = JSON.parse(response.body)
        expect(json['member_id'].to_i).to eq(member.id)
        expect(json['work_id'].to_i).to eq(work1.id)
      end
    end

    context 'when changing assignment of an already assigned member' do
      let!(:existing_history) do
        create(:history, member:, work: work1, date: today, worksheet:)
      end

      it 'updates the existing history record without creating a new one' do
        expect {
          post "/api/v1/worksheets/#{worksheet.id}/assign_member", params: {
            member_id: member.id,
            work_id: work2.id,
          }
        }.not_to change(History, :count)

        expect(response).to have_http_status(:ok)
        expect(existing_history.reload.work_id).to eq(work2.id)
      end
    end

    context 'when member_id is not found' do
      it 'returns not found error' do
        post "/api/v1/worksheets/#{worksheet.id}/assign_member", params: {
          member_id: 99_999,
          work_id: work1.id,
        }

        expect(response).to have_http_status(:not_found)
        expect(JSON.parse(response.body)['error']).to include('見つかりません')
      end
    end

    context 'when work_id is not found' do
      it 'returns not found error' do
        post "/api/v1/worksheets/#{worksheet.id}/assign_member", params: {
          member_id: member.id,
          work_id: 99_999,
        }

        expect(response).to have_http_status(:not_found)
        expect(JSON.parse(response.body)['error']).to include('見つかりません')
      end
    end

    context 'when user is demo account' do
      before do
        post '/api/v1/auth/login', params: {
          email: 'test@example.com',
          password: 'password123'
        }
      end

      it 'returns forbidden error' do
        demo_user = User.find_by(email: 'test@example.com') || create(:user, email: 'test@example.com', password: 'password123', password_confirmation: 'password123')
        demo_worksheet = create(:worksheet, user: demo_user)
        demo_member = create(:member, worksheet: demo_worksheet)
        demo_work = create(:work, worksheet: demo_worksheet)

        post "/api/v1/worksheets/#{demo_worksheet.id}/assign_member", params: {
          member_id: demo_member.id,
          work_id: demo_work.id,
        }

        expect(response).to have_http_status(:forbidden)
        expect(JSON.parse(response.body)['error']).to include('デモアカウント')
      end
    end
  end
end
