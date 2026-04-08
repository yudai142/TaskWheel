# frozen_string_literal: true

class MemberSerializer < ActiveModel::Serializer
  attributes :id, :family_name, :given_name, :kana_name, :archive, :created_at, :updated_at

  def full_name
    "#{object.family_name}#{object.given_name}"
  end
end
