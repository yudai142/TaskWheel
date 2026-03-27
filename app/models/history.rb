# frozen_string_literal: true
# encoding: utf-8

class History < ApplicationRecord
  belongs_to :work, optional: true
  belongs_to :member

  validates :member_id, :date, presence: true
  validates :member_id, uniqueness: { scope: :date }

  scope :by_date, ->(date) { where(date: date) }
  scope :by_month, ->(year, month) { where("EXTRACT(YEAR FROM date) = ? AND EXTRACT(MONTH FROM date) = ?", year, month) }
  scope :recent, -> { order(date: :desc) }
end
