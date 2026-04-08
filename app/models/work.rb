# frozen_string_literal: true

class Work < ApplicationRecord
  belongs_to :worksheet

  has_many :member_options, dependent: :destroy
  has_many :members, through: :member_options
  has_many :histories, dependent: :destroy
  has_many :off_works, dependent: :destroy

  validates :name, presence: true, uniqueness: { scope: :worksheet_id }

  scope :active, -> { where(archive: false) }
  scope :archived, -> { where(archive: true) }

  def available_members
    fixed_member_ids = member_options.where(status: 0).pluck(:member_id)
    excluded_member_ids = member_options.where(status: 1).pluck(:member_id)

    if fixed_member_ids.any?
      Member.active.where(id: fixed_member_ids - excluded_member_ids)
    else
      Member.active.where.not(id: excluded_member_ids)
    end
  end

  def unavailable_members
    Member.active.where(id: member_options.where(status: 1).select(:member_id))
  end

  def has_off_work_on?(date)
    off_works.exists?(date: date)
  end
end
