# frozen_string_literal: true

class MemberOption < ApplicationRecord
  belongs_to :work
  belongs_to :member

  validates :status, presence: true
  validates :work_id, uniqueness: { scope: :member_id, message: '同じ当番にはすでに設定済みです' }
  validates :status, inclusion: { in: [0, 1] }
  validate :fixed_setting_must_be_single_per_member

  private

  def fixed_setting_must_be_single_per_member
    return unless status.to_i.zero?

    existing_fixed = MemberOption.where(member_id: member_id, status: 0)
    existing_fixed = existing_fixed.where.not(id: id) if persisted?

    return unless existing_fixed.exists?

    errors.add(:member_id, '固定設定はメンバーごとに1件までです')
  end
end
