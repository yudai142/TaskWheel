class Worksheet < ApplicationRecord
  validates :interval, presence: true, numericality: { greater_than: 0 }
  validates :week, presence: true, numericality: { greater_than_or_equal_to: 0, less_than: 7 }

  scope :weekly, -> { where(week_use: true) }
  scope :interval_based, -> { where(week_use: false) }

  def self.current
    order(created_at: :desc).first
  end

  def toggle_week_mode!
    update(week_use: !week_use)
  end
end
