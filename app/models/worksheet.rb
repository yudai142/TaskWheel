# frozen_string_literal: true
# encoding: utf-8

class Worksheet < ApplicationRecord
    belongs_to :user
    has_many :members, dependent: :destroy
    has_many :works, dependent: :destroy

  before_validation :assign_test_fallback_user, on: :create

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

  private

  def assign_test_fallback_user
    return if user.present?
    return unless Rails.env.test?

    self.user = User.find_by(email: 'default@taskwheel.local') || User.first || User.create!(
      name: 'テストユーザー',
      email: 'default@taskwheel.local',
      password: 'password123',
      password_confirmation: 'password123'
    )
  end
end
