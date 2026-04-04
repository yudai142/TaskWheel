# frozen_string_literal: true
# encoding: utf-8

class HistorySerializer < ActiveModel::Serializer
  attributes :id, :member_id, :work_id, :date, :created_at, :updated_at
  belongs_to :member
  belongs_to :work
end
