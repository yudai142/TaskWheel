FactoryBot.define do
  factory :work do
    name { Faker::Lorem.word }
    archive { false }

    trait :excluded do
      # このtraitはシャッフル除外をテストする時に使用
    end
  end
end
