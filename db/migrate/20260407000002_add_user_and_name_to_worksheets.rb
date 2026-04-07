# frozen_string_literal: true

class AddUserAndNameToWorksheets < ActiveRecord::Migration[7.1]
  def change
    add_column :worksheets, :name, :string
    add_column :worksheets, :user_id, :bigint

    add_index :worksheets, :user_id
    add_foreign_key :worksheets, :users
  end
end
