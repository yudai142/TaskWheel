FactoryBot.define do
  factory :work do
    sequence(:name) { |n| "Work #{n}: #{Faker::Lorem.word}" }
    archive { false }

    trait :excluded do
      # このtraitはシャッフル除外をテストする時に使用
    end
  end
end
