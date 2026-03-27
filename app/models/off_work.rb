# frozen_string_literal: true
# encoding: utf-8

class OffWork < ApplicationRecord
  belongs_to :work

  validates :work_id, :date, presence: true
  validates :work_id, uniqueness: { scope: :date }

  scope :by_work, ->(work_id) { where(work_id: work_id) }
  scope :future, -> { where("date >= ?", Date.today) }
  scope :past, -> { where("date < ?", Date.today) }
end
