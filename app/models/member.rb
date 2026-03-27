# frozen_string_literal: true
# encoding: utf-8

class Member < ApplicationRecord
  has_many :member_options, dependent: :destroy
  has_many :works, through: :member_options
  has_many :histories, dependent: :destroy

  validates :family_name, :given_name, :kana_name, presence: true
  validates :family_name, :given_name, length: { maximum: 30 }

  scope :active, -> { where(archive: false) }
  scope :archived, -> { where(archive: true) }

  def full_name
    "#{family_name}#{given_name}"
  end

  def full_name_kana
    kana_name
  end
end
