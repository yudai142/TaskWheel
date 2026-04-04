FactoryBot.define do
  factory :history do
    member { association :member }
    work { association :work }
    date { Date.current }

    trait :past do
      date { Date.current - 7.days }
    end

    trait :future do
      date { Date.current + 7.days }
    end
  end
end
