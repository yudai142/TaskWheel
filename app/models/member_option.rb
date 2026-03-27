# frozen_string_literal: true
# encoding: utf-8

class MemberOption < ApplicationRecord
  belongs_to :work
  belongs_to :member

  validates :work_id, :member_id, :status, presence: true
  validates :work_id, uniqueness: { scope: :member_id }
  validates :status, inclusion: { in: [0, 1] }
end
