FactoryBot.define do
  factory :work do
    title { Faker::Lorem.word }
    sequence(:position) { |n| n }

    trait :excluded do
      # このtraitはシャッフル除外をテストする時に使用
    end
  end
end
