# frozen_string_literal: true

class OffWork < ApplicationRecord
  belongs_to :work

  validates :date, presence: true
  validates :work_id, uniqueness: { scope: :date }

  scope :by_work, ->(work_id) { where(work_id: work_id) }
  scope :future, -> { where(date: Time.zone.today..) }
  scope :past, -> { where(date: ...Time.zone.today) }
end
