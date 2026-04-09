# frozen_string_literal: true

class MemberSerializer < ActiveModel::Serializer
  attributes :id, :name, :kana, :archive, :created_at, :updated_at
end
