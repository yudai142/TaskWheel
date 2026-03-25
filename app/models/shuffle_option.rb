class ShuffleOption < ApplicationRecord
  validates :reset_date, presence: true, uniqueness: true

  def self.current
    order(created_at: :desc).first
  end

  def self.reset_date
    current&.reset_date
  end
end
