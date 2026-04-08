FactoryBot.define do
  factory :member do
    worksheet { Worksheet.order(:id).first || association(:worksheet) }
    given_name { Faker::Name.first_name }
    family_name { Faker::Name.last_name }
    kana_name { 'テストメンバー' }
    archive { false }

    trait :archived do
      archive { true }
    end
  end
end
