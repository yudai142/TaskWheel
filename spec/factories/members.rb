FactoryBot.define do
  factory :member do
    # 既存ワークシートを優先的に再利用し、Factory 生成の非決定性を排除
    worksheet { Worksheet.order(:id).first || association(:worksheet) }
    name { "#{Faker::Name.last_name}#{Faker::Name.first_name}" }
    kana { 'テストメンバー' }
    archive { false }

    trait :archived do
      archive { true }
    end
  end
end
