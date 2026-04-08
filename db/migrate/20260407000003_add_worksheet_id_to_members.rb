# frozen_string_literal: true

class AddWorksheetIdToMembers < ActiveRecord::Migration[7.1]
  def change
    add_column :members, :worksheet_id, :bigint
    add_index :members, :worksheet_id
    add_foreign_key :members, :worksheets
  end
end
