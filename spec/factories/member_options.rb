# frozen_string_literal: true
# encoding: utf-8

FactoryBot.define do
  factory :member_option do
    association :work
    association :member
    status { 1 } # 1 = 参加可能（デフォルト）

    trait :unavailable do
      status { 0 } # 0 = 参加不可
    end
  end
end
