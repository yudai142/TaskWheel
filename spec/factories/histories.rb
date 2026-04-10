FactoryBot.define do
  factory :history do
    transient do
      worksheet { nil }
    end

    member { association :member, worksheet: (worksheet || Worksheet.order(:id).first || association(:worksheet)) }
    work { association :work, worksheet: member.worksheet }
    worksheet_id { member.worksheet_id }
    date { Date.current }

    trait :past do
      date { Date.current - 7.days }
    end

    trait :future do
      date { Date.current + 7.days }
    end
  end
end
