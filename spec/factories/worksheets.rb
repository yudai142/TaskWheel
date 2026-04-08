FactoryBot.define do
  factory :worksheet do
    association :user
    name { 'テストワークシート' }
    interval { 1 }
    week_use { false }
    week { 0 }
  end
end
