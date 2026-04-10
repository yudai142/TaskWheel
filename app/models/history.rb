# frozen_string_literal: true

class History < ApplicationRecord
  belongs_to :work, optional: true
  belongs_to :member
  belongs_to :worksheet

  validates :date, presence: true
  validates :worksheet_id, presence: true
  validates :member_id, uniqueness: { scope: [:worksheet_id, :date] }

  scope :by_date, ->(date) { where(date: date) }
  scope :by_month, lambda { |year, month|
    where('EXTRACT(YEAR FROM date) = ? AND EXTRACT(MONTH FROM date) = ?', year, month)
  }
  scope :recent, -> { order(date: :desc) }
end
