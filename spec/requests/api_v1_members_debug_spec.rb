require 'rails_helper'

describe 'API V1 Members - Setup Debug', type: :request do
  let!(:user) { User.find_by(email: 'default@taskwheel.local') || create(:user, email: 'default@taskwheel.local') }
  let!(:worksheet) { user.worksheets.first || create(:worksheet, user:) }
  let!(:member) { create(:member, worksheet:, name: 'テスト', kana: 'テスト') }

  it 'member が作成されることを確認' do
    puts "\n=== データ確認 ==="
    puts "User ID: #{user.id}, Email: #{user.email}"
    puts "Worksheet ID: #{worksheet.id}"
    puts "Member ID: #{member.id}, Worksheet ID: #{member.worksheet_id}"
    puts "Factory default Worksheet ID: #{Worksheet.order(:id).first&.id}"
    
    expect(member.id).to be_present
    expect(member.name).to eq('テスト')
    expect(member.kana).to eq('テスト')
  end

  it 'GET /api/v1/members が 200 を返すことを確認' do
    get '/api/v1/members'

    puts "\n=== GET /api/v1/members ===" 
    puts "Response status: #{response.status}"
    if response.status == 200
      puts "Response valid JSON: #{json_response.is_a?(Array)}"
      puts "Members count: #{json_response.length}"
      puts "Member IDs: #{json_response.map { |m| m['id'] }.inspect}" if json_response.is_a?(Array)
    else
      puts "Error: #{response.body[0...300]}"
    end
    expect(response).to have_http_status(:ok)
    expect(json_response.is_a?(Array)).to be(true)
  end

  it 'PATCH で member を更新できることを確認' do
    patch "/api/v1/members/#{member.id}",
          params: { member: { name: '更新後' } }

    puts "\n=== PATCH member ===" 
    puts "Response status: #{response.status}"
    if response.status == 200
      puts "Updated name: #{json_response['name']}"
    else
      puts "Error: #{response.body[0...300]}"
    end
    expect(response).to have_http_status(:ok)
    expect(json_response['name']).to eq('更新後')
  end
end




