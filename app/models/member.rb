# frozen_string_literal: true

class Member < ApplicationRecord
  belongs_to :worksheet

  has_many :member_options, dependent: :destroy
  has_many :works, through: :member_options
  has_many :histories, dependent: :destroy

  validates :name, :kana, presence: true
  validates :name, length: { maximum: 255 }

  scope :active, -> { where(archive: false) }
  scope :archived, -> { where(archive: true) }

  # 過去の互換性のためのメソッド
  def full_name
    name
  end

  def full_name_kana
    kana
  end
end
