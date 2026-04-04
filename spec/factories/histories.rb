FactoryBot.define do
  factory :history do
    member { association :member }
    work { association :work }
    assigned_date { Date.current }

    trait :past do
      assigned_date { Date.current - 7.days }
    end

    trait :future do
      assigned_date { Date.current + 7.days }
    end
  end
end
