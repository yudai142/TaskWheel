# frozen_string_literal: true

class OffWorkSerializer < ActiveModel::Serializer
  attributes :id, :work_id, :date, :created_at, :updated_at
end
