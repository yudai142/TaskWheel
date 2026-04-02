# frozen_string_literal: true
# encoding: utf-8

class WorkSerializer < ActiveModel::Serializer
  attributes :id, :name, :multiple, :archive, :is_above, :created_at, :updated_at
  has_many :members
  has_many :off_works
end
