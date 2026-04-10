FactoryBot.define do
  factory :history do
    transient do
      worksheet { create(:worksheet) }
    end

    member { association :member, worksheet: worksheet }
    work { association :work, worksheet: worksheet }
    worksheet_id { worksheet.id }
    date { Date.current }

    trait :past do
      date { Date.current - 7.days }
    end

    trait :future do
      date { Date.current + 7.days }
    end
  end
end
