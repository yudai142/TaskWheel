class RemoveWorkIdForeignKeyFromHistories < ActiveRecord::Migration[7.1]
  def change
    remove_foreign_key :histories, :works
  end
end
