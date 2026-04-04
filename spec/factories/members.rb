FactoryBot.define do
  factory :member do
    first_name { Faker::Name.first_name }
    last_name { Faker::Name.last_name }
    kana_first_name { 'テスト' }
    kana_last_name { 'メンバー' }
    archive { false }

    trait :archived do
      archive { true }
    end
  end
end
