# frozen_string_literal: true

class AddWorksheetIdToWorks < ActiveRecord::Migration[7.1]
  def change
    add_column :works, :worksheet_id, :bigint
    add_index :works, :worksheet_id
    add_foreign_key :works, :worksheets
  end
end
