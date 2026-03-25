class Work < ApplicationRecord
  has_many :member_options, dependent: :destroy
  has_many :members, through: :member_options
  has_many :histories, dependent: :destroy
  has_many :off_works, dependent: :destroy

  validates :name, presence: true, uniqueness: true

  scope :active, -> { where(archive: false) }
  scope :archived, -> { where(archive: true) }

  def available_members
    members.active.where(member_options: { status: 1 })
  end

  def unavailable_members
    members.active.where(member_options: { status: 0 })
  end

  def has_off_work_on?(date)
    off_works.exists?(date: date)
  end
end
