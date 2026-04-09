require 'rails_helper'

RSpec.describe 'API V1: Member Selection & Shuffle (Issue #1)', type: :request do
  let!(:members) { create_list(:member, 5) }
  let!(:works) { create_list(:work, 3) }
  let(:today) { Date.current }

  describe 'GET /api/v1/members - List of all members' do
    context 'メンバー一覧取得' do
      it 'すべてのメンバーが返却される' do
        get '/api/v1/members'

        expect(response).to have_http_status(:ok)
        json_response = response.parsed_body
        expect(json_response.length).to eq(5)
      end

      it 'メンバーの属性が含まれている' do
        get '/api/v1/members'

        expect(response).to have_http_status(:ok)
        json_response = response.parsed_body

        expect(json_response[0]).to have_key('id')
        expect(json_response[0]).to have_key('name')
        expect(json_response[0]).to have_key('kana')
        expect(json_response[0]).to have_key('archive')
      end

      it 'メンバーの ID を選択可能である' do
        get '/api/v1/members'

        expect(response).to have_http_status(:ok)
        json_response = response.parsed_body

        member_ids = json_response.pluck('id')
        expect(member_ids).not_to be_empty
        expect(member_ids.first).to be_a(Integer)
      end
    end
  end

  describe 'POST /api/v1/works/shuffle_with_selected_members - 参加者のみでシャッフル' do
    context '参加メンバーに対してシャッフルを実行' do
      before do
        works.each do |work|
          members.each do |member|
            create(:member_option, work: work, member: member, status: 1)
          end
        end
      end

      it '選択したメンバーのみでシャッフルが実行される' do
        selected_member_ids = [members[0].id, members[1].id, members[2].id]
        params = {
          member_ids: selected_member_ids,
          work_ids: works.map(&:id),
          date: today
        }

        post '/api/v1/works/shuffle_with_selected_members', params: params

        expect(response).to have_http_status(:ok)
        json_response = response.parsed_body

        # シャッフル結果が返される
        expect(json_response).to be_an(Array)

        # 返却された割り当てが選択メンバーのみである
        assigned_member_ids = json_response.pluck('member_id').uniq
        selected_ids_set = Set.new(selected_member_ids)
        assigned_ids_set = Set.new(assigned_member_ids)

        expect(assigned_ids_set).to be_subset(selected_ids_set)
      end

      it '重複せず各メンバーに異なる当番が割り当てられる' do
        selected_member_ids = [members[0].id, members[1].id, members[2].id]
        params = {
          member_ids: selected_member_ids,
          work_ids: works.map(&:id),
          date: today
        }

        post '/api/v1/works/shuffle_with_selected_members', params: params

        expect(response).to have_http_status(:ok)
        json_response = response.parsed_body

        # 同じメンバーが複数の当番に割り当てられていないことを確認
        member_assignments = json_response.group_by { |h| h['member_id'] }
        member_assignments.each_value do |assignments|
          work_ids = assignments.map { |a| a['work_id'] }
          expect(work_ids.uniq.length).to eq(work_ids.length)
        end
      end

      it '非参加メンバーは割り当てられない' do
        # メンバー 0, 1, 2 のみ参加
        selected_member_ids = [members[0].id, members[1].id, members[2].id]
        excluded_member_ids = [members[3].id, members[4].id]

        params = {
          member_ids: selected_member_ids,
          work_ids: works.map(&:id),
          date: today
        }

        post '/api/v1/works/shuffle_with_selected_members', params: params

        expect(response).to have_http_status(:ok)
        json_response = response.parsed_body

        # 割り当てられたメンバーが除外リストに含まれていないことを確認
        assigned_member_ids = json_response.pluck('member_id').uniq
        excluded_set = Set.new(excluded_member_ids)
        assigned_set = Set.new(assigned_member_ids)

        expect(assigned_set & excluded_set).to be_empty
      end

      it '当番が十分でない場合もシャッフルが実行される' do
        selected_member_ids = [members[0].id, members[1].id, members[2].id, members[3].id]
        params = {
          member_ids: selected_member_ids,
          work_ids: [works[0].id], # 当番が不足
          date: today
        }

        post '/api/v1/works/shuffle_with_selected_members', params: params

        # 当番が足りなくても、各メンバーに一度は割り当てられる
        # または適切なエラーが返される
        expect(response.status).to be_in([200, 422, 400])
      end
    end
  end

  describe 'POST /api/v1/member_options/update_selected - メンバーの参加選択を保存' do
    context 'メンバーの参加/不参加を更新' do
      it '参加メンバーを選択できる' do
        params = {
          work_id: works[0].id,
          member_options: [
            { member_id: members[0].id, status: 1 }, # 参加
            { member_id: members[1].id, status: 1 }, # 参加
            { member_id: members[2].id, status: 0 } # 不参加
          ]
        }

        post '/api/v1/member_options/update_selected', params: params

        expect(response).to have_http_status(:ok)
      end

      it '参加メンバーの数が返される' do
        params = {
          work_id: works[0].id,
          member_options: [
            { member_id: members[0].id, status: 1 },
            { member_id: members[1].id, status: 1 }
          ]
        }

        post '/api/v1/member_options/update_selected', params: params

        expect(response).to have_http_status(:ok)
        json_response = response.parsed_body

        expect(json_response).to have_key('selected_count')
        expect(json_response['selected_count']).to eq(2)
      end
    end
  end

  describe 'GET /api/v1/dashboard/member_selection_state - 参加メンバーの選択状態' do
    context 'ダッシュボードの参加メンバー選択状態を取得' do
      it '選択状態が返される' do
        get '/api/v1/dashboard/member_selection_state'

        expect(response).to have_http_status(:ok)
        json_response = response.parsed_body

        # 返却される配列にはメンバー情報と選択状態が含まれる
        expect(json_response).to be_an(Array)
      end

      it 'メンバーごとに選択状態が含まれている' do
        get '/api/v1/dashboard/member_selection_state'

        expect(response).to have_http_status(:ok)
        json_response = response.parsed_body

        if json_response.present?
          expect(json_response[0]).to have_key('id')
          expect(json_response[0]).to have_key('member_id')
          expect(json_response[0]).to have_key('status') # 0 = 不参加, 1 = 参加
        end
      end
    end
  end

  describe 'User Flow - ユーザーの操作フロー' do
    context '参加メンバーを選択してシャッフルを実行' do
      it 'ダッシュボードで参加メンバーを選択し、シャッフルを実行できる' do
        works.each do |work|
          members.each do |member|
            create(:member_option, work: work, member: member, status: 1)
          end
        end

        # Step 1: メンバー一覧を取得
        get '/api/v1/members'
        expect(response).to have_http_status(:ok)
        all_members = response.parsed_body

        # Step 2: 参加メンバーを選択
        selected_ids = [all_members[0]['id'], all_members[1]['id']]

        # Step 3: 選択を保存（未実装）
        post '/api/v1/member_options/update_selected', params: {
          work_id: works[0].id,
          member_options: selected_ids.map { |id| { member_id: id, status: 1 } }
        }
        expect(response).to have_http_status(:ok)

        # Step 4: 選択メンバーのみでシャッフル（未実装）
        post '/api/v1/works/shuffle_with_selected_members', params: {
          member_ids: selected_ids,
          work_ids: works.map(&:id),
          date: today
        }

        expect(response).to have_http_status(:ok)
        json_response = response.parsed_body
        expect(json_response.pluck('member_id').uniq).to match_array(selected_ids)
      end
    end
  end
end
